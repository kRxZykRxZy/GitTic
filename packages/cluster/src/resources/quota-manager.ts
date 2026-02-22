/**
 * Quota enforcement for cluster resource usage.
 * Enforces per-user and per-organization resource limits
 * with support for soft/hard limits and warning thresholds.
 * @module
 */

import { EventEmitter } from "node:events";

/** Quota definition for a plan or entity */
export interface QuotaDefinition {
  /** Quota identifier */
  id: string;
  /** Entity this quota applies to (user or org ID) */
  entityId: string;
  /** Entity type */
  entityType: "user" | "org" | "plan";
  /** Maximum CPU minutes per billing period */
  maxCpuMinutes: number;
  /** Maximum RAM in MB */
  maxRamMb: number;
  /** Maximum storage in MB */
  maxStorageMb: number;
  /** Maximum concurrent jobs */
  maxConcurrentJobs: number;
  /** Maximum builds per day */
  maxBuildsPerDay: number;
  /** Warning threshold percentage (0-100) */
  warningThresholdPercent: number;
  /** Whether exceeding is a hard stop or just a warning */
  hardLimit: boolean;
}

/** Quota check result */
export interface QuotaCheckResult {
  /** Whether the action is allowed */
  allowed: boolean;
  /** Quota that was checked */
  quotaId: string;
  /** Resource type that was checked */
  resourceType: string;
  /** Current usage */
  currentUsage: number;
  /** Maximum allowed */
  limit: number;
  /** Usage percentage */
  usagePercent: number;
  /** Whether a warning should be shown */
  warning: boolean;
  /** Human-readable message */
  message: string;
}

/** Quota usage snapshot */
export interface QuotaUsageSnapshot {
  /** Entity identifier */
  entityId: string;
  /** CPU minutes used */
  cpuMinutesUsed: number;
  /** RAM currently in use (MB) */
  ramMbUsed: number;
  /** Storage used (MB) */
  storageMbUsed: number;
  /** Current concurrent jobs */
  concurrentJobs: number;
  /** Builds today */
  buildsToday: number;
  /** Date of the daily counter reset */
  dailyResetDate: string;
}

/**
 * Manages and enforces resource quotas for users and organizations.
 * Supports multiple quota tiers with soft and hard limits.
 */
export class QuotaManager extends EventEmitter {
  private readonly quotas = new Map<string, QuotaDefinition>();
  private readonly usage = new Map<string, QuotaUsageSnapshot>();

  /**
   * Register a quota definition for an entity.
   * @param quota - Quota definition
   */
  setQuota(quota: QuotaDefinition): void {
    this.quotas.set(quota.entityId, quota);
  }

  /**
   * Remove a quota definition.
   * @param entityId - Entity identifier
   */
  removeQuota(entityId: string): boolean {
    return this.quotas.delete(entityId);
  }

  /**
   * Get the quota definition for an entity.
   * @param entityId - Entity identifier
   */
  getQuota(entityId: string): QuotaDefinition | undefined {
    return this.quotas.get(entityId);
  }

  /**
   * Update current usage for an entity.
   * @param snapshot - Current usage snapshot
   */
  updateUsage(snapshot: QuotaUsageSnapshot): void {
    const existing = this.usage.get(snapshot.entityId);

    // Reset daily counters if the date changed
    if (existing && existing.dailyResetDate !== snapshot.dailyResetDate) {
      snapshot.buildsToday = 0;
    }

    this.usage.set(snapshot.entityId, snapshot);
    this.checkWarnings(snapshot.entityId);
  }

  /**
   * Check if a specific resource action is allowed within quota.
   * @param entityId - Entity identifier
   * @param resourceType - Type of resource to check
   * @param additionalUsage - How much additional resource is needed
   * @returns Quota check result
   */
  checkQuota(
    entityId: string,
    resourceType: "cpu" | "ram" | "storage" | "concurrent-jobs" | "builds",
    additionalUsage: number = 0
  ): QuotaCheckResult {
    const quota = this.quotas.get(entityId);
    const usage = this.usage.get(entityId);

    if (!quota) {
      return {
        allowed: true,
        quotaId: "none",
        resourceType,
        currentUsage: 0,
        limit: Infinity,
        usagePercent: 0,
        warning: false,
        message: "No quota defined",
      };
    }

    const currentUsage = this.getCurrentUsage(usage, resourceType);
    const limit = this.getLimit(quota, resourceType);
    const projectedUsage = currentUsage + additionalUsage;
    const usagePercent = limit > 0 ? Math.round((projectedUsage / limit) * 100) : 0;
    const warning = usagePercent >= quota.warningThresholdPercent;
    const exceeded = projectedUsage > limit;
    const allowed = !exceeded || !quota.hardLimit;

    let message = `${resourceType}: ${projectedUsage}/${limit}`;
    if (exceeded && quota.hardLimit) {
      message = `Hard quota exceeded for ${resourceType}: ${projectedUsage}/${limit}`;
    } else if (exceeded) {
      message = `Soft quota exceeded for ${resourceType}: ${projectedUsage}/${limit}`;
    } else if (warning) {
      message = `Approaching quota for ${resourceType}: ${usagePercent}%`;
    }

    return {
      allowed,
      quotaId: quota.id,
      resourceType,
      currentUsage: projectedUsage,
      limit,
      usagePercent,
      warning,
      message,
    };
  }

  /**
   * Increment the daily build counter.
   * @param entityId - Entity identifier
   * @returns Updated build count
   */
  incrementBuilds(entityId: string): number {
    const usage = this.usage.get(entityId);
    if (!usage) return 0;

    const today = new Date().toISOString().split("T")[0];
    if (usage.dailyResetDate !== today) {
      usage.buildsToday = 0;
      usage.dailyResetDate = today;
    }

    usage.buildsToday++;
    return usage.buildsToday;
  }

  /**
   * Get the current usage value for a resource type.
   */
  private getCurrentUsage(
    usage: QuotaUsageSnapshot | undefined,
    resourceType: string
  ): number {
    if (!usage) return 0;

    switch (resourceType) {
      case "cpu":
        return usage.cpuMinutesUsed;
      case "ram":
        return usage.ramMbUsed;
      case "storage":
        return usage.storageMbUsed;
      case "concurrent-jobs":
        return usage.concurrentJobs;
      case "builds":
        return usage.buildsToday;
      default:
        return 0;
    }
  }

  /**
   * Get the limit for a resource type from a quota definition.
   */
  private getLimit(quota: QuotaDefinition, resourceType: string): number {
    switch (resourceType) {
      case "cpu":
        return quota.maxCpuMinutes;
      case "ram":
        return quota.maxRamMb;
      case "storage":
        return quota.maxStorageMb;
      case "concurrent-jobs":
        return quota.maxConcurrentJobs;
      case "builds":
        return quota.maxBuildsPerDay;
      default:
        return Infinity;
    }
  }

  /**
   * Check all resource types for warnings and emit events.
   */
  private checkWarnings(entityId: string): void {
    const resourceTypes = ["cpu", "ram", "storage", "concurrent-jobs", "builds"] as const;

    for (const type of resourceTypes) {
      const result = this.checkQuota(entityId, type);
      if (result.warning) {
        this.emit("quota:warning", result);
      }
      if (!result.allowed) {
        this.emit("quota:exceeded", result);
      }
    }
  }

  /**
   * Get all quota definitions.
   */
  listQuotas(): QuotaDefinition[] {
    return Array.from(this.quotas.values());
  }

  /**
   * Get usage snapshots for all tracked entities.
   */
  listUsage(): QuotaUsageSnapshot[] {
    return Array.from(this.usage.values());
  }

  /**
   * Get the usage snapshot for an entity.
   */
  getUsage(entityId: string): QuotaUsageSnapshot | undefined {
    return this.usage.get(entityId);
  }
}
