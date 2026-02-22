/**
 * Advanced load balancer for distributing work across cluster nodes.
 * Supports weighted round-robin, connection-aware distribution,
 * session affinity, and health-weighted selection strategies.
 * @module
 */

import { createHash } from "node:crypto";

/** Node information for load balancing decisions */
export interface BalancerNode {
  /** Unique node identifier */
  id: string;
  /** Current active connections/jobs */
  activeConnections: number;
  /** Maximum connections/jobs */
  maxConnections: number;
  /** Node weight (higher = more traffic) */
  weight: number;
  /** Whether the node is healthy */
  healthy: boolean;
  /** CPU usage 0-100 */
  cpuUsage: number;
  /** Memory usage 0-100 */
  memoryUsage: number;
  /** Geographic region */
  region: string;
}

/** Load balancing strategy */
export type BalancerStrategy =
  | "weighted-round-robin"
  | "least-connections"
  | "session-affinity"
  | "health-weighted";

/** Configuration for the load balancer */
export interface LoadBalancerConfig {
  /** Primary strategy */
  strategy: BalancerStrategy;
  /** Sticky session cookie/header name for session affinity */
  sessionKey: string;
  /** Health weight factor (0-1): how much health influences selection */
  healthFactor: number;
}

/** Default configuration */
const DEFAULT_CONFIG: LoadBalancerConfig = {
  strategy: "weighted-round-robin",
  sessionKey: "x-session-id",
  healthFactor: 0.5,
};

/**
 * Advanced load balancer that distributes work across cluster nodes
 * using multiple strategies with health awareness.
 */
export class LoadBalancer {
  private config: LoadBalancerConfig;
  private nodes: BalancerNode[] = [];
  private roundRobinIndex = 0;
  private weightedQueue: string[] = [];
  private weightedIndex = 0;
  private readonly sessionMap = new Map<string, string>();

  /**
   * @param config - Partial configuration (merged with defaults)
   */
  constructor(config: Partial<LoadBalancerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Update the pool of available nodes.
   * Rebuilds the weighted queue when nodes change.
   * @param nodes - Current node list
   */
  updateNodes(nodes: BalancerNode[]): void {
    this.nodes = nodes;
    this.rebuildWeightedQueue();
    this.cleanSessionMap();
  }

  /**
   * Select the best node for a request.
   * @param sessionId - Optional session identifier for affinity
   * @returns Selected node or null if none available
   */
  selectNode(sessionId?: string): BalancerNode | null {
    const healthy = this.nodes.filter(
      (n) => n.healthy && n.activeConnections < n.maxConnections
    );

    if (healthy.length === 0) return null;

    switch (this.config.strategy) {
      case "weighted-round-robin":
        return this.weightedRoundRobin(healthy);
      case "least-connections":
        return this.leastConnections(healthy);
      case "session-affinity":
        return this.sessionAffinity(healthy, sessionId);
      case "health-weighted":
        return this.healthWeighted(healthy);
      default:
        return healthy[0];
    }
  }

  /**
   * Weighted round-robin: nodes with higher weight get more requests.
   * @param nodes - Available healthy nodes
   */
  private weightedRoundRobin(nodes: BalancerNode[]): BalancerNode {
    if (this.weightedQueue.length === 0) {
      return nodes[0];
    }

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    let attempts = 0;

    while (attempts < this.weightedQueue.length) {
      this.weightedIndex = this.weightedIndex % this.weightedQueue.length;
      const nodeId = this.weightedQueue[this.weightedIndex];
      this.weightedIndex++;
      attempts++;

      const node = nodeMap.get(nodeId);
      if (node) return node;
    }

    return nodes[0];
  }

  /**
   * Least connections: route to the node with fewest active connections.
   * @param nodes - Available healthy nodes
   */
  private leastConnections(nodes: BalancerNode[]): BalancerNode {
    return nodes.reduce((best, node) => {
      const bestRatio = best.activeConnections / best.maxConnections;
      const nodeRatio = node.activeConnections / node.maxConnections;
      return nodeRatio < bestRatio ? node : best;
    });
  }

  /**
   * Session affinity: return the same node for the same session ID.
   * Falls back to least-connections for new sessions.
   * @param nodes - Available healthy nodes
   * @param sessionId - Session identifier
   */
  private sessionAffinity(
    nodes: BalancerNode[],
    sessionId?: string
  ): BalancerNode {
    if (sessionId) {
      const existingNodeId = this.sessionMap.get(sessionId);
      if (existingNodeId) {
        const existingNode = nodes.find((n) => n.id === existingNodeId);
        if (existingNode) return existingNode;
      }

      // Hash-based assignment for new sessions
      const hash = createHash("sha256").update(sessionId).digest("hex");
      const index = parseInt(hash.substring(0, 8), 16) % nodes.length;
      const selected = nodes[index];
      this.sessionMap.set(sessionId, selected.id);
      return selected;
    }

    return this.leastConnections(nodes);
  }

  /**
   * Health-weighted selection: score nodes based on CPU, memory, and connection load.
   * Lower score = better candidate.
   * @param nodes - Available healthy nodes
   */
  private healthWeighted(nodes: BalancerNode[]): BalancerNode {
    const factor = this.config.healthFactor;

    return nodes.reduce((best, node) => {
      const bestScore = this.computeHealthScore(best, factor);
      const nodeScore = this.computeHealthScore(node, factor);
      return nodeScore < bestScore ? node : best;
    });
  }

  /**
   * Compute a composite health score for a node.
   * Lower values indicate a healthier, less loaded node.
   * @param node - Node to score
   * @param factor - Health weight factor
   */
  private computeHealthScore(node: BalancerNode, factor: number): number {
    const connectionLoad = node.activeConnections / node.maxConnections;
    const cpuLoad = node.cpuUsage / 100;
    const memLoad = node.memoryUsage / 100;

    const healthScore = (cpuLoad * 0.4 + memLoad * 0.3 + connectionLoad * 0.3) * factor;
    const weightBonus = (1 - node.weight / 10) * (1 - factor);

    return healthScore + weightBonus;
  }

  /**
   * Rebuild the weighted queue based on node weights.
   */
  private rebuildWeightedQueue(): void {
    this.weightedQueue = [];
    for (const node of this.nodes) {
      if (!node.healthy) continue;
      const slots = Math.max(1, Math.round(node.weight));
      for (let i = 0; i < slots; i++) {
        this.weightedQueue.push(node.id);
      }
    }
    this.weightedIndex = 0;
  }

  /**
   * Remove stale sessions for nodes that no longer exist.
   */
  private cleanSessionMap(): void {
    const nodeIds = new Set(this.nodes.map((n) => n.id));
    for (const [sessionId, nodeId] of this.sessionMap) {
      if (!nodeIds.has(nodeId)) {
        this.sessionMap.delete(sessionId);
      }
    }
  }

  /**
   * Get the current strategy.
   */
  getStrategy(): BalancerStrategy {
    return this.config.strategy;
  }

  /**
   * Set the load balancing strategy.
   * @param strategy - New strategy to use
   */
  setStrategy(strategy: BalancerStrategy): void {
    this.config.strategy = strategy;
  }

  /**
   * Get the current number of tracked sessions.
   */
  getSessionCount(): number {
    return this.sessionMap.size;
  }

  /**
   * Clear all session affinity mappings.
   */
  clearSessions(): void {
    this.sessionMap.clear();
  }
}
