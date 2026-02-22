/**
 * Resource tracking for cluster usage.
 * Tracks per-user and per-organization CPU minutes, RAM usage,
 * storage quotas, and estimated costs.
 * @module
 */

/** Resource usage record for a billing period */
export interface ResourceUsage {
  /** Entity identifier (user or org ID) */
  entityId: string;
  /** Entity type */
  entityType: "user" | "org";
  /** CPU minutes consumed */
  cpuMinutes: number;
  /** Peak RAM usage in megabytes */
  peakRamMb: number;
  /** Storage used in megabytes */
  storageMb: number;
  /** Network egress in megabytes */
  networkEgressMb: number;
  /** Number of jobs executed */
  jobCount: number;
  /** Estimated cost in cents */
  estimatedCostCents: number;
  /** Period start timestamp */
  periodStart: number;
  /** Period end timestamp */
  periodEnd: number;
}

/** Cost rates for resource pricing */
export interface CostRates {
  /** Cost per CPU minute in cents */
  cpuMinuteCents: number;
  /** Cost per GB-hour of RAM in cents */
  ramGbHourCents: number;
  /** Cost per GB of storage per month in cents */
  storageGbMonthCents: number;
  /** Cost per GB of network egress in cents */
  networkEgressGbCents: number;
}

/** Active job resource tracking entry */
interface ActiveJobResource {
  jobId: string;
  entityId: string;
  entityType: "user" | "org";
  startedAt: number;
  cpuCores: number;
  ramMb: number;
}

/** Default cost rates */
const DEFAULT_RATES: CostRates = {
  cpuMinuteCents: 0.8,
  ramGbHourCents: 1.0,
  storageGbMonthCents: 2.3,
  networkEgressGbCents: 9.0,
};

/**
 * Tracks resource consumption per user and organization.
 * Accumulates usage over billing periods and computes estimated costs.
 */
export class ResourceTracker {
  private readonly usage = new Map<string, ResourceUsage>();
  private readonly activeJobs = new Map<string, ActiveJobResource>();
  private readonly rates: CostRates;

  /**
   * @param rates - Custom cost rates (merged with defaults)
   */
  constructor(rates: Partial<CostRates> = {}) {
    this.rates = { ...DEFAULT_RATES, ...rates };
  }

  /**
   * Initialize or reset a usage record for a billing period.
   * @param entityId - User or org ID
   * @param entityType - Entity type
   * @param periodStart - Period start timestamp
   * @param periodEnd - Period end timestamp
   */
  initPeriod(
    entityId: string,
    entityType: "user" | "org",
    periodStart: number,
    periodEnd: number
  ): ResourceUsage {
    const key = this.entityKey(entityId, entityType);
    const usage: ResourceUsage = {
      entityId,
      entityType,
      cpuMinutes: 0,
      peakRamMb: 0,
      storageMb: 0,
      networkEgressMb: 0,
      jobCount: 0,
      estimatedCostCents: 0,
      periodStart,
      periodEnd,
    };

    this.usage.set(key, usage);
    return usage;
  }

  /**
   * Record the start of a job for resource tracking.
   * @param jobId - Job identifier
   * @param entityId - User or org ID
   * @param entityType - Entity type
   * @param cpuCores - Number of CPU cores allocated
   * @param ramMb - RAM allocated in MB
   */
  startJob(
    jobId: string,
    entityId: string,
    entityType: "user" | "org",
    cpuCores: number,
    ramMb: number
  ): void {
    this.activeJobs.set(jobId, {
      jobId,
      entityId,
      entityType,
      startedAt: Date.now(),
      cpuCores,
      ramMb,
    });

    const key = this.entityKey(entityId, entityType);
    const usage = this.usage.get(key);
    if (usage) {
      usage.jobCount++;
    }
  }

  /**
   * Record the end of a job and accumulate resource usage.
   * @param jobId - Job identifier
   * @param networkEgressMb - Network egress during the job
   */
  endJob(jobId: string, networkEgressMb: number = 0): void {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    const durationMs = Date.now() - job.startedAt;
    const cpuMinutes = (durationMs / 60_000) * job.cpuCores;

    const key = this.entityKey(job.entityId, job.entityType);
    const usage = this.usage.get(key);

    if (usage) {
      usage.cpuMinutes += cpuMinutes;
      usage.peakRamMb = Math.max(usage.peakRamMb, job.ramMb);
      usage.networkEgressMb += networkEgressMb;
      usage.estimatedCostCents = this.calculateCost(usage);
    }

    this.activeJobs.delete(jobId);
  }

  /**
   * Record storage usage for an entity.
   * @param entityId - User or org ID
   * @param entityType - Entity type
   * @param storageMb - Current storage usage in MB
   */
  recordStorage(
    entityId: string,
    entityType: "user" | "org",
    storageMb: number
  ): void {
    const key = this.entityKey(entityId, entityType);
    const usage = this.usage.get(key);
    if (usage) {
      usage.storageMb = storageMb;
      usage.estimatedCostCents = this.calculateCost(usage);
    }
  }

  /**
   * Get usage for an entity.
   * @param entityId - User or org ID
   * @param entityType - Entity type
   */
  getUsage(entityId: string, entityType: "user" | "org"): ResourceUsage | undefined {
    return this.usage.get(this.entityKey(entityId, entityType));
  }

  /**
   * Get usage for all tracked entities.
   */
  getAllUsage(): ResourceUsage[] {
    return Array.from(this.usage.values());
  }

  /**
   * Get the number of active jobs for an entity.
   */
  getActiveJobCount(entityId: string): number {
    let count = 0;
    for (const job of this.activeJobs.values()) {
      if (job.entityId === entityId) count++;
    }
    return count;
  }

  /**
   * Calculate the estimated cost for a usage record.
   */
  private calculateCost(usage: ResourceUsage): number {
    const cpuCost = usage.cpuMinutes * this.rates.cpuMinuteCents;
    const ramHours = (usage.peakRamMb / 1024) * ((usage.periodEnd - usage.periodStart) / 3_600_000);
    const ramCost = ramHours * this.rates.ramGbHourCents;
    const storageCost = (usage.storageMb / 1024) * this.rates.storageGbMonthCents;
    const networkCost = (usage.networkEgressMb / 1024) * this.rates.networkEgressGbCents;

    return Math.round(cpuCost + ramCost + storageCost + networkCost);
  }

  /**
   * Create a composite key for entity lookups.
   */
  private entityKey(entityId: string, entityType: "user" | "org"): string {
    return `${entityType}:${entityId}`;
  }

  /**
   * Get the current cost rates.
   */
  getRates(): CostRates {
    return { ...this.rates };
  }

  /**
   * Flush all completed job data and return total cost across all entities.
   */
  getTotalCost(): number {
    let total = 0;
    for (const usage of this.usage.values()) {
      total += usage.estimatedCostCents;
    }
    return total;
  }
}
