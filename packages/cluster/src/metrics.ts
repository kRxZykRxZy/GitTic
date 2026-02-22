/**
 * Metrics collection for cluster nodes.
 * Collects per-node system and job metrics and provides
 * aggregated cluster-wide metric summaries.
 * @module
 */

import os from "node:os";

/** Snapshot of system metrics for a single node */
export interface NodeMetrics {
  /** Node identifier */
  nodeId: string;
  /** CPU usage percentage (0-100) */
  cpuUsage: number;
  /** Memory usage percentage (0-100) */
  memoryUsage: number;
  /** Memory used in bytes */
  memoryUsedBytes: number;
  /** Total memory in bytes */
  memoryTotalBytes: number;
  /** System load averages (1, 5, 15 minutes) */
  loadAverage: [number, number, number];
  /** Number of active jobs */
  activeJobs: number;
  /** Total jobs completed since startup */
  completedJobs: number;
  /** Total jobs failed since startup */
  failedJobs: number;
  /** Uptime in seconds */
  uptimeSeconds: number;
  /** Timestamp of collection */
  collectedAt: number;
}

/** Aggregated metrics across all cluster nodes */
export interface ClusterMetrics {
  /** Total number of nodes reporting */
  totalNodes: number;
  /** Average CPU usage across nodes */
  avgCpuUsage: number;
  /** Maximum CPU usage among nodes */
  maxCpuUsage: number;
  /** Average memory usage across nodes */
  avgMemoryUsage: number;
  /** Total active jobs across all nodes */
  totalActiveJobs: number;
  /** Total completed jobs across all nodes */
  totalCompletedJobs: number;
  /** Total failed jobs across all nodes */
  totalFailedJobs: number;
  /** Aggregation timestamp */
  aggregatedAt: number;
}

/**
 * Collector for per-node and cluster-wide metrics.
 * Maintains rolling metric history and computes aggregates.
 */
export class MetricsCollector {
  private readonly nodeMetrics = new Map<string, NodeMetrics[]>();
  private readonly maxHistoryPerNode: number;
  private localCompletedJobs = 0;
  private localFailedJobs = 0;
  private localActiveJobs = 0;

  /**
   * @param maxHistoryPerNode - Maximum number of metric snapshots to retain per node
   */
  constructor(maxHistoryPerNode: number = 360) {
    this.maxHistoryPerNode = maxHistoryPerNode;
  }

  /**
   * Collect current system metrics for the local node.
   * @param nodeId - Identifier for this node
   * @returns The collected metrics snapshot
   */
  collectLocal(nodeId: string): NodeMetrics {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      const { user, nice, sys, idle, irq } = cpu.times;
      totalTick += user + nice + sys + idle + irq;
      totalIdle += idle;
    }

    const cpuUsage = totalTick > 0
      ? Math.round(((totalTick - totalIdle) / totalTick) * 100)
      : 0;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = Math.round((usedMem / totalMem) * 100);
    const loadAvg = os.loadavg() as [number, number, number];

    const metrics: NodeMetrics = {
      nodeId,
      cpuUsage,
      memoryUsage,
      memoryUsedBytes: usedMem,
      memoryTotalBytes: totalMem,
      loadAverage: [
        Math.round(loadAvg[0] * 100) / 100,
        Math.round(loadAvg[1] * 100) / 100,
        Math.round(loadAvg[2] * 100) / 100,
      ],
      activeJobs: this.localActiveJobs,
      completedJobs: this.localCompletedJobs,
      failedJobs: this.localFailedJobs,
      uptimeSeconds: os.uptime(),
      collectedAt: Date.now(),
    };

    this.recordMetrics(nodeId, metrics);
    return metrics;
  }

  /**
   * Record metrics received from a remote node.
   * @param nodeId - Node identifier
   * @param metrics - Metrics snapshot
   */
  recordMetrics(nodeId: string, metrics: NodeMetrics): void {
    let history = this.nodeMetrics.get(nodeId);
    if (!history) {
      history = [];
      this.nodeMetrics.set(nodeId, history);
    }

    history.push(metrics);

    if (history.length > this.maxHistoryPerNode) {
      history.splice(0, history.length - this.maxHistoryPerNode);
    }
  }

  /**
   * Get the latest metrics for a specific node.
   * @param nodeId - Node identifier
   * @returns Latest metrics or undefined if no data available
   */
  getLatestMetrics(nodeId: string): NodeMetrics | undefined {
    const history = this.nodeMetrics.get(nodeId);
    if (!history || history.length === 0) return undefined;
    return history[history.length - 1];
  }

  /**
   * Get the full metric history for a node.
   * @param nodeId - Node identifier
   * @param limit - Maximum number of entries to return
   * @returns Array of metric snapshots, most recent last
   */
  getHistory(nodeId: string, limit?: number): NodeMetrics[] {
    const history = this.nodeMetrics.get(nodeId) ?? [];
    if (limit && limit < history.length) {
      return history.slice(-limit);
    }
    return [...history];
  }

  /**
   * Compute aggregated metrics across all nodes.
   * @returns Cluster-wide metric summary
   */
  aggregateClusterMetrics(): ClusterMetrics {
    const latestByNode: NodeMetrics[] = [];

    for (const [, history] of this.nodeMetrics) {
      if (history.length > 0) {
        latestByNode.push(history[history.length - 1]);
      }
    }

    if (latestByNode.length === 0) {
      return {
        totalNodes: 0,
        avgCpuUsage: 0,
        maxCpuUsage: 0,
        avgMemoryUsage: 0,
        totalActiveJobs: 0,
        totalCompletedJobs: 0,
        totalFailedJobs: 0,
        aggregatedAt: Date.now(),
      };
    }

    const totalCpu = latestByNode.reduce((sum, m) => sum + m.cpuUsage, 0);
    const maxCpu = latestByNode.reduce((max, m) => Math.max(max, m.cpuUsage), 0);
    const totalMem = latestByNode.reduce((sum, m) => sum + m.memoryUsage, 0);

    return {
      totalNodes: latestByNode.length,
      avgCpuUsage: Math.round(totalCpu / latestByNode.length),
      maxCpuUsage: maxCpu,
      avgMemoryUsage: Math.round(totalMem / latestByNode.length),
      totalActiveJobs: latestByNode.reduce((sum, m) => sum + m.activeJobs, 0),
      totalCompletedJobs: latestByNode.reduce((sum, m) => sum + m.completedJobs, 0),
      totalFailedJobs: latestByNode.reduce((sum, m) => sum + m.failedJobs, 0),
      aggregatedAt: Date.now(),
    };
  }

  /**
   * Record a completed job for local metrics tracking.
   * @param success - Whether the job succeeded
   */
  recordJobCompletion(success: boolean): void {
    if (success) {
      this.localCompletedJobs++;
    } else {
      this.localFailedJobs++;
    }
  }

  /**
   * Update the local active job count.
   * @param count - Number of active jobs
   */
  setActiveJobs(count: number): void {
    this.localActiveJobs = Math.max(0, count);
  }

  /**
   * Remove all stored metrics for a node.
   * @param nodeId - Node identifier
   */
  clearNodeMetrics(nodeId: string): void {
    this.nodeMetrics.delete(nodeId);
  }

  /**
   * Get the list of node IDs that have reported metrics.
   */
  getTrackedNodes(): string[] {
    return Array.from(this.nodeMetrics.keys());
  }
}
