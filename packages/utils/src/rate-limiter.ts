/**
 * In-memory sliding-window rate limiter.
 */
export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

interface RateLimiterEntry {
  timestamps: number[];
}

export class RateLimiter {
  private store = new Map<string, RateLimiterEntry>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(opts: RateLimiterOptions) {
    this.windowMs = opts.windowMs;
    this.maxRequests = opts.maxRequests;
  }

  /**
   * Check if a request from this key is allowed.
   * Returns { allowed, remaining, retryAfterMs }.
   */
  check(key: string): { allowed: boolean; remaining: number; retryAfterMs: number } {
    const now = Date.now();
    let entry = this.store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.store.set(key, entry);
    }

    // Remove expired timestamps
    entry.timestamps = entry.timestamps.filter((t) => now - t < this.windowMs);

    if (entry.timestamps.length >= this.maxRequests) {
      const oldest = entry.timestamps[0];
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: this.windowMs - (now - oldest),
      };
    }

    entry.timestamps.push(now);
    return {
      allowed: true,
      remaining: this.maxRequests - entry.timestamps.length,
      retryAfterMs: 0,
    };
  }

  /**
   * Reset rate limit for a key.
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all entries (for cleanup).
   */
  clear(): void {
    this.store.clear();
  }
}
