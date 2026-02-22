/**
 * In-memory sliding-window rate limiter.
 */
export interface RateLimiterOptions {
    windowMs: number;
    maxRequests: number;
}
export declare class RateLimiter {
    private store;
    private readonly windowMs;
    private readonly maxRequests;
    constructor(opts: RateLimiterOptions);
    /**
     * Check if a request from this key is allowed.
     * Returns { allowed, remaining, retryAfterMs }.
     */
    check(key: string): {
        allowed: boolean;
        remaining: number;
        retryAfterMs: number;
    };
    /**
     * Reset rate limit for a key.
     */
    reset(key: string): void;
    /**
     * Clear all entries (for cleanup).
     */
    clear(): void;
}
//# sourceMappingURL=rate-limiter.d.ts.map