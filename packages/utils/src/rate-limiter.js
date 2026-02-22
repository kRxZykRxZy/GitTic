"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
class RateLimiter {
    store = new Map();
    windowMs;
    maxRequests;
    constructor(opts) {
        this.windowMs = opts.windowMs;
        this.maxRequests = opts.maxRequests;
    }
    /**
     * Check if a request from this key is allowed.
     * Returns { allowed, remaining, retryAfterMs }.
     */
    check(key) {
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
    reset(key) {
        this.store.delete(key);
    }
    /**
     * Clear all entries (for cleanup).
     */
    clear() {
        this.store.clear();
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rate-limiter.js.map