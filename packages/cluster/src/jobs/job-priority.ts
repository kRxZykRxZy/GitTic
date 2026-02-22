/**
 * Job priority management.
 * Handles priority tiers, escalation of long-waiting jobs,
 * starvation prevention, and fair scheduling across users.
 * @module
 */

/** Priority tier definition */
export interface PriorityTier {
  /** Tier level (lower = higher priority) */
  level: number;
  /** Display name */
  name: string;
  /** Maximum queue time before escalation (in ms) */
  maxWaitMs: number;
  /** Weight for fair scheduling (higher = more slots) */
  weight: number;
  /** Maximum concurrent jobs at this tier */
  maxConcurrent: number;
}

/** Job entry for priority management */
export interface PriorityJobEntry {
  /** Job identifier */
  jobId: string;
  /** Current priority level */
  currentLevel: number;
  /** Original priority level */
  originalLevel: number;
  /** User ID who submitted the job */
  userId: string;
  /** When the job was enqueued */
  enqueuedAt: number;
  /** Number of times the job was escalated */
  escalationCount: number;
  /** Whether the job has been escalated */
  escalated: boolean;
}

/** Statistics about priority distribution */
export interface PriorityStats {
  /** Jobs per tier */
  jobsPerTier: Record<number, number>;
  /** Escalated jobs count */
  escalatedJobs: number;
  /** Average wait time in ms per tier */
  avgWaitPerTier: Record<number, number>;
  /** Jobs per user */
  jobsPerUser: Record<string, number>;
}

/** Default priority tiers */
const DEFAULT_TIERS: PriorityTier[] = [
  { level: 0, name: "critical", maxWaitMs: 30_000, weight: 8, maxConcurrent: 10 },
  { level: 1, name: "high", maxWaitMs: 60_000, weight: 4, maxConcurrent: 8 },
  { level: 2, name: "normal", maxWaitMs: 120_000, weight: 2, maxConcurrent: 6 },
  { level: 3, name: "low", maxWaitMs: 300_000, weight: 1, maxConcurrent: 4 },
  { level: 4, name: "background", maxWaitMs: 600_000, weight: 1, maxConcurrent: 2 },
];

/**
 * Manages job priorities with escalation and starvation prevention.
 * Ensures fair scheduling across users and priority levels.
 */
export class PriorityManager {
  private readonly tiers: PriorityTier[];
  private readonly jobs = new Map<string, PriorityJobEntry>();
  private readonly maxJobsPerUser: number;
  private escalationTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * @param tiers - Custom priority tier definitions
   * @param maxJobsPerUser - Maximum concurrent jobs per user (default: 10)
   */
  constructor(tiers?: PriorityTier[], maxJobsPerUser: number = 10) {
    this.tiers = tiers ?? [...DEFAULT_TIERS];
    this.tiers.sort((a, b) => a.level - b.level);
    this.maxJobsPerUser = maxJobsPerUser;
  }

  /**
   * Register a job for priority management.
   * @param jobId - Job identifier
   * @param level - Initial priority level
   * @param userId - Submitting user
   * @returns The priority entry, or null if user quota exceeded
   */
  addJob(jobId: string, level: number, userId: string): PriorityJobEntry | null {
    const userJobCount = this.getJobCountForUser(userId);
    if (userJobCount >= this.maxJobsPerUser) {
      return null;
    }

    const effectiveLevel = Math.min(level, this.tiers.length - 1);
    const entry: PriorityJobEntry = {
      jobId,
      currentLevel: effectiveLevel,
      originalLevel: effectiveLevel,
      userId,
      enqueuedAt: Date.now(),
      escalationCount: 0,
      escalated: false,
    };

    this.jobs.set(jobId, entry);
    return entry;
  }

  /**
   * Remove a job from priority management.
   * @param jobId - Job identifier
   */
  removeJob(jobId: string): boolean {
    return this.jobs.delete(jobId);
  }

  /**
   * Get the current effective priority for a job.
   * @param jobId - Job identifier
   */
  getEffectivePriority(jobId: string): number | undefined {
    return this.jobs.get(jobId)?.currentLevel;
  }

  /**
   * Check all jobs for starvation and escalate those that have waited too long.
   * Jobs are escalated by one tier level when their wait exceeds the tier threshold.
   * @returns Array of job IDs that were escalated
   */
  escalateStarving(): string[] {
    const now = Date.now();
    const escalated: string[] = [];

    for (const [jobId, entry] of this.jobs) {
      const tier = this.tiers[entry.currentLevel];
      if (!tier) continue;

      const waitTime = now - entry.enqueuedAt;
      if (waitTime > tier.maxWaitMs && entry.currentLevel > 0) {
        entry.currentLevel = Math.max(0, entry.currentLevel - 1);
        entry.escalationCount++;
        entry.escalated = true;
        escalated.push(jobId);
      }
    }

    return escalated;
  }

  /**
   * Start automatic escalation checking.
   * @param intervalMs - Check interval (default: 10s)
   */
  startEscalation(intervalMs: number = 10_000): void {
    if (this.escalationTimer) return;

    this.escalationTimer = setInterval(() => {
      this.escalateStarving();
    }, intervalMs);
  }

  /**
   * Stop automatic escalation checking.
   */
  stopEscalation(): void {
    if (this.escalationTimer) {
      clearInterval(this.escalationTimer);
      this.escalationTimer = null;
    }
  }

  /**
   * Select the next job to run based on weighted fair scheduling.
   * Considers tier weights, per-user fairness, and concurrency limits.
   * @param currentConcurrency - Map of tier level to current concurrent jobs
   * @returns Job ID to run, or null if none eligible
   */
  selectNext(currentConcurrency: Map<number, number> = new Map()): string | null {
    // Build weighted tier order
    const tierWeights: Array<{ level: number; weight: number }> = [];
    for (const tier of this.tiers) {
      const current = currentConcurrency.get(tier.level) ?? 0;
      if (current < tier.maxConcurrent) {
        tierWeights.push({ level: tier.level, weight: tier.weight });
      }
    }

    // Select from weighted tiers, preferring higher-priority tiers
    for (const tw of tierWeights) {
      const candidates = this.getJobsByTier(tw.level);
      if (candidates.length > 0) {
        // Pick the job from the user with fewest jobs (fairness)
        const userCounts = new Map<string, number>();
        for (const job of candidates) {
          userCounts.set(job.userId, (userCounts.get(job.userId) ?? 0) + 1);
        }

        candidates.sort((a, b) => {
          const aCount = userCounts.get(a.userId) ?? 0;
          const bCount = userCounts.get(b.userId) ?? 0;
          if (aCount !== bCount) return aCount - bCount;
          return a.enqueuedAt - b.enqueuedAt;
        });

        return candidates[0].jobId;
      }
    }

    return null;
  }

  /**
   * Get all jobs at a specific tier level.
   */
  private getJobsByTier(level: number): PriorityJobEntry[] {
    return Array.from(this.jobs.values()).filter((j) => j.currentLevel === level);
  }

  /**
   * Get the number of jobs for a user.
   */
  private getJobCountForUser(userId: string): number {
    let count = 0;
    for (const entry of this.jobs.values()) {
      if (entry.userId === userId) count++;
    }
    return count;
  }

  /**
   * Get priority statistics.
   */
  getStats(): PriorityStats {
    const jobsPerTier: Record<number, number> = {};
    const waitSumsPerTier: Record<number, number> = {};
    const waitCountsPerTier: Record<number, number> = {};
    const jobsPerUser: Record<string, number> = {};
    let escalatedCount = 0;
    const now = Date.now();

    for (const entry of this.jobs.values()) {
      jobsPerTier[entry.currentLevel] = (jobsPerTier[entry.currentLevel] ?? 0) + 1;
      waitSumsPerTier[entry.currentLevel] =
        (waitSumsPerTier[entry.currentLevel] ?? 0) + (now - entry.enqueuedAt);
      waitCountsPerTier[entry.currentLevel] =
        (waitCountsPerTier[entry.currentLevel] ?? 0) + 1;
      jobsPerUser[entry.userId] = (jobsPerUser[entry.userId] ?? 0) + 1;
      if (entry.escalated) escalatedCount++;
    }

    const avgWaitPerTier: Record<number, number> = {};
    for (const level of Object.keys(waitSumsPerTier)) {
      const l = Number(level);
      avgWaitPerTier[l] = Math.round(waitSumsPerTier[l] / waitCountsPerTier[l]);
    }

    return {
      jobsPerTier,
      escalatedJobs: escalatedCount,
      avgWaitPerTier,
      jobsPerUser,
    };
  }

  /**
   * Get the tier definitions.
   */
  getTiers(): PriorityTier[] {
    return [...this.tiers];
  }

  /**
   * Get all tracked job entries.
   */
  getAllJobs(): PriorityJobEntry[] {
    return Array.from(this.jobs.values());
  }
}
