/**
 * Idle node management for cost optimization.
 * Detects idle nodes, automatically sleeps them after a timeout,
 * wakes them on demand, and tracks idle cost savings.
 * @module
 */

import { EventEmitter } from "node:events";

/** Idle state for a node */
export enum IdleState {
  /** Node is actively handling work */
  Active = "active",
  /** Node is idle (no current work) */
  Idle = "idle",
  /** Node has been put to sleep */
  Sleeping = "sleeping",
  /** Node is waking up */
  Waking = "waking",
}

/** Idle tracking entry for a node */
export interface IdleNodeEntry {
  /** Node identifier */
  nodeId: string;
  /** Current idle state */
  state: IdleState;
  /** When the node became idle */
  idleSince: number | null;
  /** When the node was put to sleep */
  sleepingSince: number | null;
  /** Total time spent sleeping in ms */
  totalSleepTimeMs: number;
  /** Cost per hour for this node (in cents) */
  costPerHourCents: number;
  /** Estimated savings from sleep time (in cents) */
  estimatedSavingsCents: number;
  /** Whether auto-sleep is enabled */
  autoSleepEnabled: boolean;
}

/** Configuration for idle management */
export interface IdleManagerConfig {
  /** Time in ms before an idle node is put to sleep */
  idleTimeoutMs: number;
  /** Minimum time to stay asleep before wake-up (ms) */
  minSleepDurationMs: number;
  /** Default cost per node-hour in cents */
  defaultCostPerHourCents: number;
  /** Time in ms for a node to wake up */
  wakeUpTimeMs: number;
}

/** Default configuration */
const DEFAULT_CONFIG: IdleManagerConfig = {
  idleTimeoutMs: 300_000,
  minSleepDurationMs: 60_000,
  defaultCostPerHourCents: 5,
  wakeUpTimeMs: 30_000,
};

/**
 * Manages idle detection and sleep/wake cycles for cluster nodes.
 * Tracks cost savings from sleeping idle nodes.
 */
export class IdleManager extends EventEmitter {
  private readonly config: IdleManagerConfig;
  private readonly nodes = new Map<string, IdleNodeEntry>();
  private checkTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * @param config - Partial idle manager configuration
   */
  constructor(config: Partial<IdleManagerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register a node for idle tracking.
   * @param nodeId - Node identifier
   * @param costPerHourCents - Cost per hour for this node
   * @param autoSleep - Whether to auto-sleep this node
   */
  registerNode(
    nodeId: string,
    costPerHourCents?: number,
    autoSleep: boolean = true
  ): IdleNodeEntry {
    const entry: IdleNodeEntry = {
      nodeId,
      state: IdleState.Active,
      idleSince: null,
      sleepingSince: null,
      totalSleepTimeMs: 0,
      costPerHourCents: costPerHourCents ?? this.config.defaultCostPerHourCents,
      estimatedSavingsCents: 0,
      autoSleepEnabled: autoSleep,
    };

    this.nodes.set(nodeId, entry);
    return entry;
  }

  /**
   * Mark a node as idle (no active work).
   * @param nodeId - Node identifier
   */
  markIdle(nodeId: string): boolean {
    const entry = this.nodes.get(nodeId);
    if (!entry || entry.state !== IdleState.Active) return false;

    entry.state = IdleState.Idle;
    entry.idleSince = Date.now();
    this.emit("node:idle", nodeId);
    return true;
  }

  /**
   * Mark a node as active (handling work).
   * @param nodeId - Node identifier
   */
  markActive(nodeId: string): boolean {
    const entry = this.nodes.get(nodeId);
    if (!entry) return false;

    if (entry.state === IdleState.Sleeping) {
      this.accumulateSleepTime(entry);
    }

    entry.state = IdleState.Active;
    entry.idleSince = null;
    entry.sleepingSince = null;
    this.emit("node:active", nodeId);
    return true;
  }

  /**
   * Put a node to sleep.
   * @param nodeId - Node identifier
   * @returns True if the node was put to sleep
   */
  sleep(nodeId: string): boolean {
    const entry = this.nodes.get(nodeId);
    if (!entry) return false;
    if (entry.state !== IdleState.Idle) return false;

    entry.state = IdleState.Sleeping;
    entry.sleepingSince = Date.now();
    this.emit("node:sleeping", nodeId);
    return true;
  }

  /**
   * Wake a sleeping node on demand.
   * @param nodeId - Node identifier
   * @returns True if wake-up was initiated
   */
  wake(nodeId: string): boolean {
    const entry = this.nodes.get(nodeId);
    if (!entry || entry.state !== IdleState.Sleeping) return false;

    const sleepDuration = entry.sleepingSince
      ? Date.now() - entry.sleepingSince
      : 0;

    if (sleepDuration < this.config.minSleepDurationMs) {
      return false;
    }

    this.accumulateSleepTime(entry);
    entry.state = IdleState.Waking;
    this.emit("node:waking", nodeId);

    // Simulate wake-up delay
    setTimeout(() => {
      if (entry.state === IdleState.Waking) {
        entry.state = IdleState.Active;
        entry.sleepingSince = null;
        entry.idleSince = null;
        this.emit("node:awake", nodeId);
      }
    }, this.config.wakeUpTimeMs);

    return true;
  }

  /**
   * Start periodic idle checking.
   * Puts nodes to sleep that have been idle beyond the timeout.
   * @param intervalMs - Check interval (default: 30s)
   */
  startIdleCheck(intervalMs: number = 30_000): void {
    if (this.checkTimer) return;

    this.checkTimer = setInterval(() => {
      this.checkIdleNodes();
    }, intervalMs);
  }

  /**
   * Stop idle checking.
   */
  stopIdleCheck(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /**
   * Check all idle nodes and sleep those past the timeout.
   * @returns Array of node IDs that were put to sleep
   */
  checkIdleNodes(): string[] {
    const now = Date.now();
    const sleptNodes: string[] = [];

    for (const entry of this.nodes.values()) {
      if (
        entry.state === IdleState.Idle &&
        entry.autoSleepEnabled &&
        entry.idleSince !== null &&
        now - entry.idleSince >= this.config.idleTimeoutMs
      ) {
        if (this.sleep(entry.nodeId)) {
          sleptNodes.push(entry.nodeId);
        }
      }
    }

    return sleptNodes;
  }

  /**
   * Calculate and accumulate sleep time savings.
   */
  private accumulateSleepTime(entry: IdleNodeEntry): void {
    if (entry.sleepingSince) {
      const sleepDuration = Date.now() - entry.sleepingSince;
      entry.totalSleepTimeMs += sleepDuration;
      const hoursSlept = sleepDuration / 3_600_000;
      entry.estimatedSavingsCents += Math.round(hoursSlept * entry.costPerHourCents);
    }
  }

  /**
   * Get the idle tracking entry for a node.
   * @param nodeId - Node identifier
   */
  getNodeState(nodeId: string): IdleNodeEntry | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Get all sleeping nodes.
   */
  getSleepingNodes(): IdleNodeEntry[] {
    return Array.from(this.nodes.values()).filter(
      (e) => e.state === IdleState.Sleeping
    );
  }

  /**
   * Get total estimated cost savings across all nodes.
   */
  getTotalSavings(): number {
    let total = 0;
    for (const entry of this.nodes.values()) {
      total += entry.estimatedSavingsCents;
      // Add current ongoing sleep if applicable
      if (entry.state === IdleState.Sleeping && entry.sleepingSince) {
        const currentSleep = Date.now() - entry.sleepingSince;
        total += Math.round((currentSleep / 3_600_000) * entry.costPerHourCents);
      }
    }
    return total;
  }

  /**
   * Remove a node from idle tracking.
   * @param nodeId - Node identifier
   */
  unregisterNode(nodeId: string): boolean {
    return this.nodes.delete(nodeId);
  }

  /**
   * Get all tracked nodes.
   */
  getAllNodes(): IdleNodeEntry[] {
    return Array.from(this.nodes.values());
  }
}
