import type { ClusterNode, ClusterJob } from "@platform/shared";

export type LoadBalanceStrategy = "round-robin" | "least-loaded" | "capabilities";

/**
 * Load balancer and job scheduler for cluster nodes.
 */
export class Scheduler {
  private nodes: ClusterNode[] = [];
  private strategy: LoadBalanceStrategy;
  private roundRobinIndex = 0;

  constructor(strategy: LoadBalanceStrategy = "least-loaded") {
    this.strategy = strategy;
  }

  /**
   * Update the list of available cluster nodes.
   */
  updateNodes(nodes: ClusterNode[]): void {
    this.nodes = nodes.filter((n) => n.status === "online");
  }

  /**
   * Select the best node for a job based on the current strategy.
   */
  selectNode(requiredCapabilities?: string[]): ClusterNode | null {
    const available = this.nodes.filter(
      (n) => n.activeJobs < n.maxJobs && n.status === "online"
    );

    if (available.length === 0) return null;

    // Filter by capabilities if required
    const candidates = requiredCapabilities
      ? available.filter((n) =>
          requiredCapabilities.every((cap) => n.capabilities.includes(cap))
        )
      : available;

    if (candidates.length === 0) return null;

    switch (this.strategy) {
      case "round-robin":
        return this.roundRobin(candidates);
      case "least-loaded":
        return this.leastLoaded(candidates);
      case "capabilities":
        return this.capabilitiesBased(candidates, requiredCapabilities);
      default:
        return candidates[0];
    }
  }

  private roundRobin(nodes: ClusterNode[]): ClusterNode {
    this.roundRobinIndex = this.roundRobinIndex % nodes.length;
    const node = nodes[this.roundRobinIndex];
    this.roundRobinIndex++;
    return node;
  }

  private leastLoaded(nodes: ClusterNode[]): ClusterNode {
    return nodes.reduce((best, node) => {
      const bestLoad = best.cpuUsage * 0.5 + best.memoryUsage * 0.3 + (best.activeJobs / best.maxJobs) * 100 * 0.2;
      const nodeLoad = node.cpuUsage * 0.5 + node.memoryUsage * 0.3 + (node.activeJobs / node.maxJobs) * 100 * 0.2;
      return nodeLoad < bestLoad ? node : best;
    });
  }

  private capabilitiesBased(
    nodes: ClusterNode[],
    required?: string[]
  ): ClusterNode {
    if (!required || required.length === 0) {
      return this.leastLoaded(nodes);
    }

    // Prefer nodes with more matching capabilities, then least loaded
    return nodes.reduce((best, node) => {
      const bestCaps = required.filter((c) => best.capabilities.includes(c)).length;
      const nodeCaps = required.filter((c) => node.capabilities.includes(c)).length;
      if (nodeCaps > bestCaps) return node;
      if (nodeCaps === bestCaps) {
        return node.cpuUsage < best.cpuUsage ? node : best;
      }
      return best;
    });
  }

  /**
   * Get node statistics summary.
   */
  getStats(): {
    totalNodes: number;
    onlineNodes: number;
    totalJobs: number;
    avgCpu: number;
    avgMemory: number;
  } {
    const online = this.nodes.filter((n) => n.status === "online");
    return {
      totalNodes: this.nodes.length,
      onlineNodes: online.length,
      totalJobs: online.reduce((sum, n) => sum + n.activeJobs, 0),
      avgCpu: online.length
        ? Math.round(online.reduce((sum, n) => sum + n.cpuUsage, 0) / online.length)
        : 0,
      avgMemory: online.length
        ? Math.round(online.reduce((sum, n) => sum + n.memoryUsage, 0) / online.length)
        : 0,
    };
  }
}
