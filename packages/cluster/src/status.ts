/**
 * Node status management for the cluster.
 * Tracks node status transitions, emits events,
 * and maintains uptime information.
 * @module
 */

import { EventEmitter } from "node:events";

/** Possible node statuses */
export type NodeStatus = "online" | "offline" | "draining" | "maintenance";

/** Allowed status transitions */
const VALID_TRANSITIONS: Record<NodeStatus, NodeStatus[]> = {
  online: ["offline", "draining", "maintenance"],
  offline: ["online", "maintenance"],
  draining: ["offline", "online"],
  maintenance: ["online", "offline"],
};

/** Record of a status transition */
export interface StatusTransition {
  /** Node identifier */
  nodeId: string;
  /** Previous status */
  from: NodeStatus;
  /** New status */
  to: NodeStatus;
  /** Reason for the transition */
  reason: string;
  /** When the transition occurred */
  timestamp: number;
}

/** Tracked state for a single node */
export interface NodeStatusEntry {
  /** Node identifier */
  nodeId: string;
  /** Current status */
  status: NodeStatus;
  /** When the node first came online */
  firstOnlineAt: number | null;
  /** When the current status was set */
  statusChangedAt: number;
  /** Total uptime in milliseconds (accumulated while online) */
  totalUptimeMs: number;
  /** When the node went online most recently */
  lastOnlineAt: number | null;
  /** Transition history */
  history: StatusTransition[];
}

/** Events emitted by StatusManager */
export interface StatusManagerEvents {
  "status:changed": (transition: StatusTransition) => void;
  "status:online": (nodeId: string) => void;
  "status:offline": (nodeId: string) => void;
  "status:draining": (nodeId: string) => void;
  "status:maintenance": (nodeId: string) => void;
}

/**
 * Manages status transitions and uptime tracking for cluster nodes.
 * Enforces valid transition paths and emits events on status changes.
 */
export class StatusManager extends EventEmitter {
  private readonly entries = new Map<string, NodeStatusEntry>();
  private readonly maxHistoryLength: number;

  /**
   * @param maxHistoryLength - Maximum transition history entries per node
   */
  constructor(maxHistoryLength: number = 100) {
    super();
    this.maxHistoryLength = maxHistoryLength;
  }

  /**
   * Initialize tracking for a node with an initial status.
   * @param nodeId - Node identifier
   * @param initialStatus - Starting status (default: "online")
   * @returns The created status entry
   */
  initNode(nodeId: string, initialStatus: NodeStatus = "online"): NodeStatusEntry {
    const now = Date.now();
    const entry: NodeStatusEntry = {
      nodeId,
      status: initialStatus,
      firstOnlineAt: initialStatus === "online" ? now : null,
      statusChangedAt: now,
      totalUptimeMs: 0,
      lastOnlineAt: initialStatus === "online" ? now : null,
      history: [],
    };

    this.entries.set(nodeId, entry);
    this.emit(`status:${initialStatus}`, nodeId);
    return entry;
  }

  /**
   * Transition a node to a new status.
   * Validates the transition path and updates uptime tracking.
   * @param nodeId - Node identifier
   * @param newStatus - Target status
   * @param reason - Reason for the transition
   * @returns The transition record, or null if invalid
   */
  transition(nodeId: string, newStatus: NodeStatus, reason: string = ""): StatusTransition | null {
    const entry = this.entries.get(nodeId);
    if (!entry) return null;

    const allowed = VALID_TRANSITIONS[entry.status];
    if (!allowed.includes(newStatus)) {
      return null;
    }

    const now = Date.now();
    const oldStatus = entry.status;

    // Accumulate uptime if transitioning away from online
    if (oldStatus === "online" && entry.lastOnlineAt !== null) {
      entry.totalUptimeMs += now - entry.lastOnlineAt;
    }

    const transition: StatusTransition = {
      nodeId,
      from: oldStatus,
      to: newStatus,
      reason,
      timestamp: now,
    };

    entry.status = newStatus;
    entry.statusChangedAt = now;

    if (newStatus === "online") {
      entry.lastOnlineAt = now;
      if (entry.firstOnlineAt === null) {
        entry.firstOnlineAt = now;
      }
    }

    entry.history.push(transition);
    if (entry.history.length > this.maxHistoryLength) {
      entry.history.splice(0, entry.history.length - this.maxHistoryLength);
    }

    this.emit("status:changed", transition);
    this.emit(`status:${newStatus}`, nodeId);

    return transition;
  }

  /**
   * Get the current status of a node.
   * @param nodeId - Node identifier
   * @returns Current status or undefined if not tracked
   */
  getStatus(nodeId: string): NodeStatus | undefined {
    return this.entries.get(nodeId)?.status;
  }

  /**
   * Get the full status entry for a node.
   * @param nodeId - Node identifier
   * @returns Status entry or undefined
   */
  getEntry(nodeId: string): NodeStatusEntry | undefined {
    return this.entries.get(nodeId);
  }

  /**
   * Compute the current uptime for a node in milliseconds.
   * Includes accumulated time plus current online session.
   * @param nodeId - Node identifier
   * @returns Uptime in milliseconds, or 0 if not tracked
   */
  getUptime(nodeId: string): number {
    const entry = this.entries.get(nodeId);
    if (!entry) return 0;

    let uptime = entry.totalUptimeMs;
    if (entry.status === "online" && entry.lastOnlineAt !== null) {
      uptime += Date.now() - entry.lastOnlineAt;
    }
    return uptime;
  }

  /**
   * Get transition history for a node.
   * @param nodeId - Node identifier
   * @param limit - Maximum entries to return
   * @returns Array of transitions, most recent last
   */
  getHistory(nodeId: string, limit?: number): StatusTransition[] {
    const entry = this.entries.get(nodeId);
    if (!entry) return [];
    const history = entry.history;
    if (limit && limit < history.length) {
      return history.slice(-limit);
    }
    return [...history];
  }

  /**
   * List all nodes with a specific status.
   * @param status - Status to filter by
   * @returns Array of node IDs
   */
  getNodesByStatus(status: NodeStatus): string[] {
    const result: string[] = [];
    for (const [nodeId, entry] of this.entries) {
      if (entry.status === status) {
        result.push(nodeId);
      }
    }
    return result;
  }

  /**
   * Remove a node from status tracking.
   * @param nodeId - Node identifier
   */
  removeNode(nodeId: string): boolean {
    return this.entries.delete(nodeId);
  }

  /**
   * Get all tracked node IDs.
   */
  getTrackedNodes(): string[] {
    return Array.from(this.entries.keys());
  }
}
