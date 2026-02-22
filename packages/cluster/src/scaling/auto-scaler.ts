/**
 * Auto-scaling for cluster node pools.
 * Scales up or down based on queue depth, CPU load,
 * and response time with configurable min/max limits and cooldown.
 * @module
 */

import { EventEmitter } from "node:events";

/** Metrics used for scaling decisions */
export interface ScalingMetrics {
  /** Current queue depth (pending jobs) */
  queueDepth: number;
  /** Average CPU usage across nodes (0-100) */
  avgCpuPercent: number;
  /** Average response time in milliseconds */
  avgResponseTimeMs: number;
  /** Current number of active nodes */
  currentNodes: number;
  /** Timestamp of metrics */
  timestamp: number;
}

/** Auto-scaling configuration */
export interface AutoScalerConfig {
  /** Minimum number of nodes */
  minNodes: number;
  /** Maximum number of nodes */
  maxNodes: number;
  /** Queue depth threshold to trigger scale-up */
  scaleUpQueueDepth: number;
  /** CPU percentage threshold to trigger scale-up */
  scaleUpCpuPercent: number;
  /** Response time threshold to trigger scale-up (ms) */
  scaleUpResponseTimeMs: number;
  /** Queue depth threshold to trigger scale-down */
  scaleDownQueueDepth: number;
  /** CPU percentage threshold to trigger scale-down */
  scaleDownCpuPercent: number;
  /** Cooldown period after scale-up (ms) */
  scaleUpCooldownMs: number;
  /** Cooldown period after scale-down (ms) */
  scaleDownCooldownMs: number;
  /** Number of nodes to add per scale-up event */
  scaleUpStep: number;
  /** Number of nodes to remove per scale-down event */
  scaleDownStep: number;
  /** Number of metric evaluations before acting */
  evaluationPeriods: number;
}

/** Scaling action */
export type ScalingAction = "scale-up" | "scale-down" | "none";

/** Scaling decision record */
export interface ScalingDecision {
  /** Action decided */
  action: ScalingAction;
  /** Reason for the decision */
  reason: string;
  /** Current node count */
  currentNodes: number;
  /** Desired node count after action */
  desiredNodes: number;
  /** Metrics that triggered the decision */
  metrics: ScalingMetrics;
  /** When the decision was made */
  timestamp: number;
}

/** Default auto-scaler configuration */
const DEFAULT_CONFIG: AutoScalerConfig = {
  minNodes: 1,
  maxNodes: 20,
  scaleUpQueueDepth: 10,
  scaleUpCpuPercent: 80,
  scaleUpResponseTimeMs: 5000,
  scaleDownQueueDepth: 2,
  scaleDownCpuPercent: 30,
  scaleUpCooldownMs: 300_000,
  scaleDownCooldownMs: 600_000,
  scaleUpStep: 1,
  scaleDownStep: 1,
  evaluationPeriods: 3,
};

/**
 * Auto-scaler that adjusts node count based on demand metrics.
 * Evaluates queue depth, CPU load, and response time to make
 * scaling decisions with cooldown protection.
 */
export class AutoScaler extends EventEmitter {
  private readonly config: AutoScalerConfig;
  private lastScaleUpAt: number = 0;
  private lastScaleDownAt: number = 0;
  private readonly metricsBuffer: ScalingMetrics[] = [];
  private readonly decisionHistory: ScalingDecision[] = [];
  private readonly maxHistory: number;
  private evaluateTimer: ReturnType<typeof setInterval> | null = null;
  private currentDesiredNodes: number;

  /**
   * @param config - Partial auto-scaler configuration
   * @param initialNodes - Initial number of nodes
   * @param maxHistory - Maximum decision history entries (default: 500)
   */
  constructor(
    config: Partial<AutoScalerConfig> = {},
    initialNodes: number = 1,
    maxHistory: number = 500
  ) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentDesiredNodes = Math.max(this.config.minNodes, initialNodes);
    this.maxHistory = maxHistory;
  }

  /**
   * Submit current metrics for evaluation.
   * @param metrics - Current cluster metrics
   * @returns Scaling decision
   */
  evaluate(metrics: ScalingMetrics): ScalingDecision {
    this.metricsBuffer.push(metrics);

    if (this.metricsBuffer.length > this.config.evaluationPeriods * 2) {
      this.metricsBuffer.splice(
        0,
        this.metricsBuffer.length - this.config.evaluationPeriods * 2
      );
    }

    // Need enough data points before deciding
    if (this.metricsBuffer.length < this.config.evaluationPeriods) {
      return this.createDecision("none", "Insufficient data", metrics);
    }

    const recentMetrics = this.metricsBuffer.slice(-this.config.evaluationPeriods);

    // Check scale-up conditions
    const scaleUpDecision = this.checkScaleUp(recentMetrics, metrics);
    if (scaleUpDecision) return scaleUpDecision;

    // Check scale-down conditions
    const scaleDownDecision = this.checkScaleDown(recentMetrics, metrics);
    if (scaleDownDecision) return scaleDownDecision;

    return this.createDecision("none", "Within normal thresholds", metrics);
  }

  /**
   * Check if scale-up conditions are met.
   */
  private checkScaleUp(
    recentMetrics: ScalingMetrics[],
    currentMetrics: ScalingMetrics
  ): ScalingDecision | null {
    const now = Date.now();

    if (now - this.lastScaleUpAt < this.config.scaleUpCooldownMs) {
      return null;
    }

    if (this.currentDesiredNodes >= this.config.maxNodes) {
      return null;
    }

    const avgQueue = recentMetrics.reduce((s, m) => s + m.queueDepth, 0) / recentMetrics.length;
    const avgCpu = recentMetrics.reduce((s, m) => s + m.avgCpuPercent, 0) / recentMetrics.length;
    const avgResponse = recentMetrics.reduce(
      (s, m) => s + m.avgResponseTimeMs, 0
    ) / recentMetrics.length;

    const reasons: string[] = [];

    if (avgQueue >= this.config.scaleUpQueueDepth) {
      reasons.push(`queue depth ${avgQueue.toFixed(0)} >= ${this.config.scaleUpQueueDepth}`);
    }
    if (avgCpu >= this.config.scaleUpCpuPercent) {
      reasons.push(`CPU ${avgCpu.toFixed(0)}% >= ${this.config.scaleUpCpuPercent}%`);
    }
    if (avgResponse >= this.config.scaleUpResponseTimeMs) {
      reasons.push(`response time ${avgResponse.toFixed(0)}ms >= ${this.config.scaleUpResponseTimeMs}ms`);
    }

    if (reasons.length > 0) {
      this.currentDesiredNodes = Math.min(
        this.config.maxNodes,
        this.currentDesiredNodes + this.config.scaleUpStep
      );
      this.lastScaleUpAt = now;

      const decision = this.createDecision(
        "scale-up",
        reasons.join(", "),
        currentMetrics
      );
      return decision;
    }

    return null;
  }

  /**
   * Check if scale-down conditions are met.
   */
  private checkScaleDown(
    recentMetrics: ScalingMetrics[],
    currentMetrics: ScalingMetrics
  ): ScalingDecision | null {
    const now = Date.now();

    if (now - this.lastScaleDownAt < this.config.scaleDownCooldownMs) {
      return null;
    }

    if (this.currentDesiredNodes <= this.config.minNodes) {
      return null;
    }

    const allLowQueue = recentMetrics.every(
      (m) => m.queueDepth <= this.config.scaleDownQueueDepth
    );
    const allLowCpu = recentMetrics.every(
      (m) => m.avgCpuPercent <= this.config.scaleDownCpuPercent
    );

    if (allLowQueue && allLowCpu) {
      this.currentDesiredNodes = Math.max(
        this.config.minNodes,
        this.currentDesiredNodes - this.config.scaleDownStep
      );
      this.lastScaleDownAt = now;

      return this.createDecision(
        "scale-down",
        "Low queue depth and CPU usage",
        currentMetrics
      );
    }

    return null;
  }

  /**
   * Create and record a scaling decision.
   */
  private createDecision(
    action: ScalingAction,
    reason: string,
    metrics: ScalingMetrics
  ): ScalingDecision {
    const decision: ScalingDecision = {
      action,
      reason,
      currentNodes: metrics.currentNodes,
      desiredNodes: this.currentDesiredNodes,
      metrics,
      timestamp: Date.now(),
    };

    this.decisionHistory.push(decision);
    if (this.decisionHistory.length > this.maxHistory) {
      this.decisionHistory.splice(0, this.decisionHistory.length - this.maxHistory);
    }

    if (action !== "none") {
      this.emit("scaling:decision", decision);
    }

    return decision;
  }

  /**
   * Get the current desired node count.
   */
  getDesiredNodes(): number {
    return this.currentDesiredNodes;
  }

  /**
   * Get scaling decision history.
   * @param limit - Maximum entries to return
   */
  getHistory(limit?: number): ScalingDecision[] {
    if (limit && limit < this.decisionHistory.length) {
      return this.decisionHistory.slice(-limit);
    }
    return [...this.decisionHistory];
  }

  /**
   * Get the current configuration.
   */
  getConfig(): AutoScalerConfig {
    return { ...this.config };
  }

  /**
   * Override the desired node count manually.
   * @param count - Desired node count (clamped to min/max)
   */
  setDesiredNodes(count: number): void {
    this.currentDesiredNodes = Math.max(
      this.config.minNodes,
      Math.min(this.config.maxNodes, count)
    );
  }
}
