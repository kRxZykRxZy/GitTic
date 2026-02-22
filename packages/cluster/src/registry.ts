/**
 * Node registry for tracking active cluster nodes.
 * Manages node registration, deregistration, last-seen tracking,
 * and periodic cleanup of stale nodes.
 * @module
 */

import { EventEmitter } from "node:events";

/** Information stored about a registered node */
export interface RegisteredNode {
  /** Unique node identifier */
  nodeId: string;
  /** Display name */
  name: string;
  /** Node URL for communication */
  url: string;
  /** Node capabilities */
  capabilities: string[];
  /** Geographic region */
  region: string;
  /** Timestamp when the node registered */
  registeredAt: number;
  /** Timestamp of last heartbeat or activity */
  lastSeenAt: number;
  /** Current status */
  status: "online" | "offline" | "draining" | "maintenance";
  /** Additional metadata */
  metadata: Record<string, unknown>;
}

/** Events emitted by the NodeRegistry */
export interface RegistryEvents {
  "node:registered": (node: RegisteredNode) => void;
  "node:deregistered": (nodeId: string) => void;
  "node:stale": (nodeId: string) => void;
  "node:updated": (node: RegisteredNode) => void;
}

/**
 * Registry for managing cluster node membership.
 * Handles registration, heartbeat tracking, and stale node cleanup.
 */
export class NodeRegistry extends EventEmitter {
  private readonly nodes = new Map<string, RegisteredNode>();
  private readonly staleThresholdMs: number;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * @param staleThresholdMs - Time in ms after which a node is considered stale (default: 60s)
   */
  constructor(staleThresholdMs: number = 60_000) {
    super();
    this.staleThresholdMs = staleThresholdMs;
  }

  /**
   * Register a new node or update an existing registration.
   * @param node - Node information to register
   */
  register(node: Omit<RegisteredNode, "registeredAt" | "lastSeenAt" | "status">): RegisteredNode {
    const existing = this.nodes.get(node.nodeId);
    const now = Date.now();

    const registered: RegisteredNode = {
      ...node,
      registeredAt: existing?.registeredAt ?? now,
      lastSeenAt: now,
      status: "online",
    };

    this.nodes.set(node.nodeId, registered);

    if (existing) {
      this.emit("node:updated", registered);
    } else {
      this.emit("node:registered", registered);
    }

    return registered;
  }

  /**
   * Remove a node from the registry.
   * @param nodeId - ID of the node to deregister
   * @returns True if the node was found and removed
   */
  deregister(nodeId: string): boolean {
    const existed = this.nodes.delete(nodeId);
    if (existed) {
      this.emit("node:deregistered", nodeId);
    }
    return existed;
  }

  /**
   * Update the last-seen timestamp for a node (heartbeat).
   * @param nodeId - ID of the node
   * @returns True if the node was found and updated
   */
  heartbeat(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    node.lastSeenAt = Date.now();
    if (node.status === "offline") {
      node.status = "online";
    }
    this.emit("node:updated", node);
    return true;
  }

  /**
   * Get a node by its ID.
   * @param nodeId - Node identifier
   * @returns The registered node or undefined
   */
  getNode(nodeId: string): RegisteredNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * List all registered nodes, optionally filtered by status.
   * @param status - Optional status filter
   * @returns Array of matching nodes
   */
  listNodes(status?: RegisteredNode["status"]): RegisteredNode[] {
    const all = Array.from(this.nodes.values());
    if (!status) return all;
    return all.filter((n) => n.status === status);
  }

  /**
   * List nodes by region.
   * @param region - Region identifier
   * @returns Array of nodes in the specified region
   */
  listNodesByRegion(region: string): RegisteredNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.region === region);
  }

  /**
   * Get the total number of registered nodes.
   */
  get size(): number {
    return this.nodes.size;
  }

  /**
   * Start periodic stale node cleanup.
   * @param intervalMs - How often to check for stale nodes (default: 30s)
   */
  startCleanup(intervalMs: number = 30_000): void {
    if (this.cleanupTimer) return;

    this.cleanupTimer = setInterval(() => {
      this.cleanupStaleNodes();
    }, intervalMs);
  }

  /**
   * Stop the periodic cleanup timer.
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Identify and mark stale nodes. A node is stale if its lastSeenAt
   * exceeds the configured threshold.
   * @returns Array of node IDs that were marked stale
   */
  cleanupStaleNodes(): string[] {
    const now = Date.now();
    const staleIds: string[] = [];

    for (const [nodeId, node] of this.nodes) {
      if (
        node.status === "online" &&
        now - node.lastSeenAt > this.staleThresholdMs
      ) {
        node.status = "offline";
        staleIds.push(nodeId);
        this.emit("node:stale", nodeId);
      }
    }

    return staleIds;
  }

  /**
   * Update the status of a specific node.
   * @param nodeId - Node identifier
   * @param status - New status
   * @returns True if the node was found and updated
   */
  setNodeStatus(nodeId: string, status: RegisteredNode["status"]): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    node.status = status;
    this.emit("node:updated", node);
    return true;
  }

  /**
   * Clear all nodes from the registry.
   */
  clear(): void {
    this.nodes.clear();
  }
}
