/**
 * Cluster-level rate limiting.
 * Provides distributed rate limiting with per-user and per-endpoint
 * limits using a sliding window algorithm.
 * @module
 */

/** Rate limit rule definition */
export interface RateLimitRule {
  /** Unique rule identifier */
  id: string;
  /** Key pattern (e.g., "user:{userId}", "endpoint:{path}") */
  keyPattern: string;
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Whether to apply a hard or soft limit */
  hardLimit: boolean;
}

/** Result of a rate limit check */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Maximum requests per window */
  limit: number;
  /** Milliseconds until the window resets */
  resetMs: number;
  /** Milliseconds to wait before retrying (0 if allowed) */
  retryAfterMs: number;
  /** The rule that was applied */
  ruleId: string;
}

/** Internal bucket for tracking request counts */
interface SlidingWindowBucket {
  /** Timestamps of requests in the current window */
  timestamps: number[];
  /** When this bucket was created */
  createdAt: number;
}

/**
 * Cluster-level rate limiter using a sliding window algorithm.
 * Supports multiple rules, per-key limits, and automatic cleanup.
 */
export class ClusterRateLimiter {
  private readonly rules = new Map<string, RateLimitRule>();
  private readonly buckets = new Map<string, SlidingWindowBucket>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Add a rate limit rule.
   * @param rule - Rule definition
   */
  addRule(rule: RateLimitRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove a rate limit rule.
   * @param ruleId - ID of the rule to remove
   * @returns True if the rule existed and was removed
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Check whether a request is allowed under all applicable rules.
   * Returns the most restrictive result.
   * @param key - The rate limit key (e.g., user ID, endpoint path)
   * @param ruleIds - Optional specific rule IDs to check (checks all if omitted)
   * @returns Rate limit result
   */
  check(key: string, ruleIds?: string[]): RateLimitResult {
    const applicableRules = ruleIds
      ? ruleIds.map((id) => this.rules.get(id)).filter(Boolean) as RateLimitRule[]
      : Array.from(this.rules.values());

    if (applicableRules.length === 0) {
      return {
        allowed: true,
        remaining: Infinity,
        limit: Infinity,
        resetMs: 0,
        retryAfterMs: 0,
        ruleId: "none",
      };
    }

    let mostRestrictive: RateLimitResult | null = null;

    for (const rule of applicableRules) {
      const result = this.checkRule(key, rule);
      if (!mostRestrictive || result.remaining < mostRestrictive.remaining) {
        mostRestrictive = result;
      }
      if (!result.allowed && rule.hardLimit) {
        return result;
      }
    }

    return mostRestrictive!;
  }

  /**
   * Record a request for rate limiting purposes.
   * Should be called after a request is allowed.
   * @param key - The rate limit key
   * @param ruleId - The rule under which to record
   */
  record(key: string, ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (!rule) return;

    const bucketKey = `${ruleId}:${key}`;
    let bucket = this.buckets.get(bucketKey);

    if (!bucket) {
      bucket = { timestamps: [], createdAt: Date.now() };
      this.buckets.set(bucketKey, bucket);
    }

    bucket.timestamps.push(Date.now());
  }

  /**
   * Check and record in one step: checks if allowed, and if so records the request.
   * @param key - The rate limit key
   * @param ruleId - Optional specific rule ID
   * @returns Rate limit result
   */
  consume(key: string, ruleId?: string): RateLimitResult {
    const ruleIds = ruleId ? [ruleId] : undefined;
    const result = this.check(key, ruleIds);

    if (result.allowed) {
      const targetRuleId = ruleId ?? result.ruleId;
      this.record(key, targetRuleId);
    }

    return result;
  }

  /**
   * Check a single rule against a key.
   * Uses a sliding window to count recent requests.
   */
  private checkRule(key: string, rule: RateLimitRule): RateLimitResult {
    const bucketKey = `${rule.id}:${key}`;
    const now = Date.now();
    const windowStart = now - rule.windowMs;

    let bucket = this.buckets.get(bucketKey);
    if (!bucket) {
      return {
        allowed: true,
        remaining: rule.maxRequests,
        limit: rule.maxRequests,
        resetMs: rule.windowMs,
        retryAfterMs: 0,
        ruleId: rule.id,
      };
    }

    // Prune timestamps outside the window
    bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);
    const count = bucket.timestamps.length;
    const remaining = Math.max(0, rule.maxRequests - count);
    const allowed = count < rule.maxRequests;

    let resetMs = rule.windowMs;
    let retryAfterMs = 0;

    if (bucket.timestamps.length > 0) {
      const oldestInWindow = bucket.timestamps[0];
      resetMs = Math.max(0, oldestInWindow + rule.windowMs - now);
    }

    if (!allowed) {
      retryAfterMs = resetMs;
    }

    return {
      allowed,
      remaining,
      limit: rule.maxRequests,
      resetMs,
      retryAfterMs,
      ruleId: rule.id,
    };
  }

  /**
   * Start periodic cleanup of expired buckets.
   * @param intervalMs - Cleanup interval (default: 60s)
   */
  startCleanup(intervalMs: number = 60_000): void {
    if (this.cleanupTimer) return;

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, intervalMs);
  }

  /**
   * Stop periodic cleanup.
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Remove buckets with no recent timestamps.
   * @returns Number of buckets removed
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [bucketKey, bucket] of this.buckets) {
      const ruleId = bucketKey.split(":")[0];
      const rule = this.rules.get(ruleId);
      const windowMs = rule?.windowMs ?? 60_000;

      bucket.timestamps = bucket.timestamps.filter((t) => t > now - windowMs);

      if (bucket.timestamps.length === 0) {
        this.buckets.delete(bucketKey);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get all configured rules.
   */
  getRules(): RateLimitRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Reset rate limit counters for a specific key across all rules.
   * @param key - The rate limit key to reset
   */
  resetKey(key: string): void {
    for (const ruleId of this.rules.keys()) {
      this.buckets.delete(`${ruleId}:${key}`);
    }
  }

  /**
   * Get the total number of tracked buckets.
   */
  getBucketCount(): number {
    return this.buckets.size;
  }
}
