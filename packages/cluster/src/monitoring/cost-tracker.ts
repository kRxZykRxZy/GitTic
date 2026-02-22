/**
 * Cost tracking for cluster operations.
 * Tracks compute costs per node-hour, per job, and per user
 * with budget alerts and historical reporting.
 * @module
 */

import { EventEmitter } from "node:events";

/** Cost entry for a node */
export interface NodeCostEntry {
  /** Node identifier */
  nodeId: string;
  /** Node tier/size affecting hourly cost */
  tier: string;
  /** Cost per hour in cents */
  costPerHourCents: number;
  /** When the node started incurring costs */
  startedAt: number;
  /** When the node stopped (null = still running) */
  stoppedAt: number | null;
  /** Total cost accumulated in cents */
  totalCostCents: number;
}

/** Cost entry for a job */
export interface JobCostEntry {
  /** Job identifier */
  jobId: string;
  /** User who triggered the job */
  userId: string;
  /** Node that ran the job */
  nodeId: string;
  /** Duration in milliseconds */
  durationMs: number;
  /** CPU cost in cents */
  cpuCostCents: number;
  /** Memory cost in cents */
  memoryCostCents: number;
  /** Storage cost in cents */
  storageCostCents: number;
  /** Total cost in cents */
  totalCostCents: number;
  /** When the job completed */
  completedAt: number;
}

/** Budget configuration */
export interface Budget {
  /** Budget identifier */
  id: string;
  /** Entity the budget applies to (user, org, or cluster) */
  entityId: string;
  /** Budget period in ms (e.g., 30 days) */
  periodMs: number;
  /** Maximum spend in cents */
  limitCents: number;
  /** Warning threshold percentage (0-100) */
  warningPercent: number;
  /** When the current period started */
  periodStartedAt: number;
  /** Current spend in cents */
  currentSpendCents: number;
}

/** Cost report for a time period */
export interface CostReport {
  /** Report period start */
  periodStart: number;
  /** Report period end */
  periodEnd: number;
  /** Total node-hour costs */
  nodeHourCostCents: number;
  /** Total job costs */
  jobCostCents: number;
  /** Total cost */
  totalCostCents: number;
  /** Cost breakdown by user */
  costByUser: Record<string, number>;
  /** Cost breakdown by node */
  costByNode: Record<string, number>;
  /** Number of jobs */
  totalJobs: number;
}

/** Node tier pricing */
export interface TierPricing {
  /** Tier name */
  tier: string;
  /** Cost per hour in cents */
  costPerHourCents: number;
  /** Cost per CPU-minute in cents */
  cpuMinuteCents: number;
  /** Cost per GB-hour of memory in cents */
  memoryGbHourCents: number;
}

/** Default tier pricing */
const DEFAULT_TIERS: TierPricing[] = [
  { tier: "small", costPerHourCents: 3, cpuMinuteCents: 0.5, memoryGbHourCents: 0.5 },
  { tier: "medium", costPerHourCents: 8, cpuMinuteCents: 1.0, memoryGbHourCents: 1.0 },
  { tier: "large", costPerHourCents: 20, cpuMinuteCents: 2.0, memoryGbHourCents: 2.0 },
  { tier: "gpu", costPerHourCents: 50, cpuMinuteCents: 3.0, memoryGbHourCents: 3.0 },
];

/**
 * Tracks and reports costs for cluster infrastructure and jobs.
 * Supports budget alerts and per-user/per-node cost breakdowns.
 */
export class CostTracker extends EventEmitter {
  private readonly nodeCosts = new Map<string, NodeCostEntry>();
  private readonly jobCosts: JobCostEntry[] = [];
  private readonly budgets = new Map<string, Budget>();
  private readonly tiers: TierPricing[];
  private readonly maxJobHistory: number;

  /**
   * @param tiers - Custom tier pricing (uses defaults if not provided)
   * @param maxJobHistory - Maximum job cost entries to retain (default: 50000)
   */
  constructor(tiers?: TierPricing[], maxJobHistory: number = 50_000) {
    super();
    this.tiers = tiers ?? [...DEFAULT_TIERS];
    this.maxJobHistory = maxJobHistory;
  }

  /**
   * Start tracking costs for a node.
   * @param nodeId - Node identifier
   * @param tier - Node tier (e.g., "small", "medium", "large")
   */
  trackNode(nodeId: string, tier: string): NodeCostEntry {
    const pricing = this.tiers.find((t) => t.tier === tier);
    const costPerHour = pricing?.costPerHourCents ?? 5;

    const entry: NodeCostEntry = {
      nodeId,
      tier,
      costPerHourCents: costPerHour,
      startedAt: Date.now(),
      stoppedAt: null,
      totalCostCents: 0,
    };

    this.nodeCosts.set(nodeId, entry);
    return entry;
  }

  /**
   * Stop tracking costs for a node.
   * @param nodeId - Node identifier
   */
  stopTrackingNode(nodeId: string): void {
    const entry = this.nodeCosts.get(nodeId);
    if (!entry) return;

    entry.stoppedAt = Date.now();
    entry.totalCostCents = this.calculateNodeCost(entry);
  }

  /**
   * Record the cost of a completed job.
   * @param jobId - Job identifier
   * @param userId - User who ran the job
   * @param nodeId - Node that ran the job
   * @param durationMs - Job duration in ms
   * @param memoryMb - Memory used in MB
   * @param storageMb - Storage used in MB
   */
  recordJobCost(
    jobId: string,
    userId: string,
    nodeId: string,
    durationMs: number,
    memoryMb: number = 0,
    storageMb: number = 0
  ): JobCostEntry {
    const nodeEntry = this.nodeCosts.get(nodeId);
    const tier = nodeEntry?.tier ?? "small";
    const pricing = this.tiers.find((t) => t.tier === tier) ?? this.tiers[0];

    const cpuMinutes = durationMs / 60_000;
    const cpuCost = Math.round(cpuMinutes * pricing.cpuMinuteCents);
    const memoryHours = (memoryMb / 1024) * (durationMs / 3_600_000);
    const memoryCost = Math.round(memoryHours * pricing.memoryGbHourCents);
    const storageCost = Math.round((storageMb / 1024) * 0.1);

    const entry: JobCostEntry = {
      jobId,
      userId,
      nodeId,
      durationMs,
      cpuCostCents: cpuCost,
      memoryCostCents: memoryCost,
      storageCostCents: storageCost,
      totalCostCents: cpuCost + memoryCost + storageCost,
      completedAt: Date.now(),
    };

    this.jobCosts.push(entry);
    if (this.jobCosts.length > this.maxJobHistory) {
      this.jobCosts.splice(0, this.jobCosts.length - this.maxJobHistory);
    }

    // Update budgets
    this.updateBudgets(userId, entry.totalCostCents);

    return entry;
  }

  /**
   * Set a budget for an entity.
   * @param budget - Budget configuration
   */
  setBudget(budget: Budget): void {
    this.budgets.set(budget.id, budget);
  }

  /**
   * Update budgets after a cost is incurred.
   */
  private updateBudgets(userId: string, costCents: number): void {
    for (const budget of this.budgets.values()) {
      if (budget.entityId === userId || budget.entityId === "cluster") {
        budget.currentSpendCents += costCents;
        const usagePercent = (budget.currentSpendCents / budget.limitCents) * 100;

        if (usagePercent >= 100) {
          this.emit("budget:exceeded", budget);
        } else if (usagePercent >= budget.warningPercent) {
          this.emit("budget:warning", budget);
        }
      }
    }
  }

  /**
   * Calculate the total cost for a node based on its runtime.
   */
  private calculateNodeCost(entry: NodeCostEntry): number {
    const endTime = entry.stoppedAt ?? Date.now();
    const hoursRunning = (endTime - entry.startedAt) / 3_600_000;
    return Math.round(hoursRunning * entry.costPerHourCents);
  }

  /**
   * Generate a cost report for a time period.
   * @param periodStart - Start of the period
   * @param periodEnd - End of the period
   */
  generateReport(periodStart: number, periodEnd: number): CostReport {
    const periodJobs = this.jobCosts.filter(
      (j) => j.completedAt >= periodStart && j.completedAt <= periodEnd
    );

    const costByUser: Record<string, number> = {};
    const costByNode: Record<string, number> = {};
    let jobCostTotal = 0;

    for (const job of periodJobs) {
      costByUser[job.userId] = (costByUser[job.userId] ?? 0) + job.totalCostCents;
      costByNode[job.nodeId] = (costByNode[job.nodeId] ?? 0) + job.totalCostCents;
      jobCostTotal += job.totalCostCents;
    }

    let nodeHourCost = 0;
    for (const entry of this.nodeCosts.values()) {
      if (entry.startedAt <= periodEnd) {
        const start = Math.max(entry.startedAt, periodStart);
        const end = Math.min(entry.stoppedAt ?? Date.now(), periodEnd);
        const hours = Math.max(0, (end - start) / 3_600_000);
        nodeHourCost += Math.round(hours * entry.costPerHourCents);
      }
    }

    return {
      periodStart,
      periodEnd,
      nodeHourCostCents: nodeHourCost,
      jobCostCents: jobCostTotal,
      totalCostCents: nodeHourCost + jobCostTotal,
      costByUser,
      costByNode,
      totalJobs: periodJobs.length,
    };
  }

  /**
   * Get cost for a specific user in the current period.
   * @param userId - User identifier
   */
  getUserCost(userId: string): number {
    return this.jobCosts
      .filter((j) => j.userId === userId)
      .reduce((sum, j) => sum + j.totalCostCents, 0);
  }

  /**
   * Get all budgets.
   */
  getBudgets(): Budget[] {
    return Array.from(this.budgets.values());
  }

  /**
   * Get tier pricing information.
   */
  getTiers(): TierPricing[] {
    return [...this.tiers];
  }
}
