/**
 * Node drain management for graceful shutdown and maintenance.
 * Manages the process of draining jobs from nodes before
 * taking them offline, with support for graceful and forced draining.
 * @module
 */

import { EventEmitter } from "node:events";

/** Drain status for a node */
export enum DrainStatus {
  /** Node is active and accepting jobs */
  Active = "active",
  /** Node is draining - no new jobs, waiting for existing ones */
  Draining = "draining",
  /** Drain forced - remaining jobs will be terminated */
  ForceDraining = "force-draining",
  /** All jobs drained, node is ready for shutdown */
  Drained = "drained",
}

/** Drain entry for a node */
export interface DrainEntry {
  /** Node identifier */
  nodeId: string;
  /** Current drain status */
  status: DrainStatus;
  /** When the drain was initiated */
  initiatedAt: number;
  /** When the drain completed (or null if still draining) */
  completedAt: number | null;
  /** Number of jobs still running */
  remainingJobs: number;
  /** Initial number of jobs when drain started */
  initialJobs: number;
  /** Reason for draining */
  reason: string;
  /** Who initiated the drain */
  initiatedBy: string;
  /** Maximum time to wait before force drain (ms) */
  timeoutMs: number;
}

/** Drain completion callback */
export type DrainCallback = (nodeId: string, forced: boolean) => void;

/**
 * Manages graceful draining of cluster nodes.
 * Ensures running jobs complete before a node is taken offline,
 * with timeout-based force drain as a safety net.
 */
export class DrainManager extends EventEmitter {
  private readonly drains = new Map<string, DrainEntry>();
  private readonly drainTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly defaultTimeoutMs: number;

  /**
   * @param defaultTimeoutMs - Default drain timeout in ms (default: 10 minutes)
   */
  constructor(defaultTimeoutMs: number = 600_000) {
    super();
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  /**
   * Initiate a graceful drain on a node.
   * The node will stop accepting new jobs and wait for existing ones to complete.
   * @param nodeId - Node identifier
   * @param currentJobs - Number of currently running jobs
   * @param reason - Reason for draining
   * @param initiatedBy - Who initiated the drain
   * @param timeoutMs - Optional timeout override
   * @returns The drain entry, or null if already draining
   */
  startDrain(
    nodeId: string,
    currentJobs: number,
    reason: string,
    initiatedBy: string,
    timeoutMs?: number
  ): DrainEntry | null {
    if (this.drains.has(nodeId)) return null;

    const timeout = timeoutMs ?? this.defaultTimeoutMs;
    const entry: DrainEntry = {
      nodeId,
      status: currentJobs === 0 ? DrainStatus.Drained : DrainStatus.Draining,
      initiatedAt: Date.now(),
      completedAt: currentJobs === 0 ? Date.now() : null,
      remainingJobs: currentJobs,
      initialJobs: currentJobs,
      reason,
      initiatedBy,
      timeoutMs: timeout,
    };

    this.drains.set(nodeId, entry);
    this.emit("drain:started", entry);

    if (entry.status === DrainStatus.Drained) {
      this.emit("drain:completed", { nodeId, forced: false });
    } else {
      // Set force-drain timeout
      const timer = setTimeout(() => {
        this.forceDrain(nodeId);
      }, timeout);

      this.drainTimers.set(nodeId, timer);
    }

    return entry;
  }

  /**
   * Notify that a job has completed on a draining node.
   * Checks if all jobs are done and completes the drain.
   * @param nodeId - Node identifier
   * @param remainingJobs - Updated number of remaining jobs
   */
  jobCompleted(nodeId: string, remainingJobs: number): void {
    const entry = this.drains.get(nodeId);
    if (!entry) return;

    entry.remainingJobs = Math.max(0, remainingJobs);
    this.emit("drain:progress", entry);

    if (entry.remainingJobs === 0 && entry.status === DrainStatus.Draining) {
      this.completeDrain(nodeId, false);
    }
  }

  /**
   * Force drain a node, terminating remaining jobs.
   * @param nodeId - Node identifier
   * @returns True if the force drain was initiated
   */
  forceDrain(nodeId: string): boolean {
    const entry = this.drains.get(nodeId);
    if (!entry) return false;
    if (entry.status === DrainStatus.Drained) return false;

    entry.status = DrainStatus.ForceDraining;
    this.emit("drain:force", entry);
    this.completeDrain(nodeId, true);

    return true;
  }

  /**
   * Complete a drain operation.
   */
  private completeDrain(nodeId: string, forced: boolean): void {
    const entry = this.drains.get(nodeId);
    if (!entry) return;

    entry.status = DrainStatus.Drained;
    entry.completedAt = Date.now();

    const timer = this.drainTimers.get(nodeId);
    if (timer) {
      clearTimeout(timer);
      this.drainTimers.delete(nodeId);
    }

    this.emit("drain:completed", { nodeId, forced });
  }

  /**
   * Cancel a drain and re-enable the node for jobs.
   * @param nodeId - Node identifier
   * @returns True if the drain was cancelled
   */
  cancelDrain(nodeId: string): boolean {
    const entry = this.drains.get(nodeId);
    if (!entry) return false;

    const timer = this.drainTimers.get(nodeId);
    if (timer) {
      clearTimeout(timer);
      this.drainTimers.delete(nodeId);
    }

    this.drains.delete(nodeId);
    this.emit("drain:cancelled", nodeId);
    return true;
  }

  /**
   * Check if a node is currently draining.
   * @param nodeId - Node identifier
   */
  isDraining(nodeId: string): boolean {
    const entry = this.drains.get(nodeId);
    return entry !== undefined && entry.status !== DrainStatus.Active;
  }

  /**
   * Get the drain status for a node.
   * @param nodeId - Node identifier
   */
  getDrainStatus(nodeId: string): DrainEntry | undefined {
    return this.drains.get(nodeId);
  }

  /**
   * Get all currently draining nodes.
   */
  getDrainingNodes(): DrainEntry[] {
    return Array.from(this.drains.values()).filter(
      (e) => e.status === DrainStatus.Draining || e.status === DrainStatus.ForceDraining
    );
  }

  /**
   * Get all nodes that have completed draining.
   */
  getDrainedNodes(): DrainEntry[] {
    return Array.from(this.drains.values()).filter(
      (e) => e.status === DrainStatus.Drained
    );
  }

  /**
   * Re-enable a drained node for accepting jobs.
   * @param nodeId - Node identifier
   * @returns True if the node was re-enabled
   */
  reEnable(nodeId: string): boolean {
    const entry = this.drains.get(nodeId);
    if (!entry || entry.status !== DrainStatus.Drained) return false;

    this.drains.delete(nodeId);
    this.emit("drain:re-enabled", nodeId);
    return true;
  }

  /**
   * Get the progress of a drain as a percentage.
   * @param nodeId - Node identifier
   * @returns Progress percentage (0-100)
   */
  getDrainProgress(nodeId: string): number {
    const entry = this.drains.get(nodeId);
    if (!entry) return 0;
    if (entry.initialJobs === 0) return 100;
    return Math.round(
      ((entry.initialJobs - entry.remainingJobs) / entry.initialJobs) * 100
    );
  }

  /**
   * Clean up completed drain entries.
   * @returns Number of entries cleaned up
   */
  cleanup(): number {
    let count = 0;
    for (const [nodeId, entry] of this.drains) {
      if (entry.status === DrainStatus.Drained) {
        this.drains.delete(nodeId);
        count++;
      }
    }
    return count;
  }
}
