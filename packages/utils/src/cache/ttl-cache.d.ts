/**
 * Options for the TTL cache.
 */
export interface TTLCacheOptions {
    /** Default time-to-live in milliseconds. Defaults to 60000 (1 minute). */
    defaultTTLMs?: number;
    /** Maximum number of entries. Defaults to 1000. */
    maxSize?: number;
    /** Interval in ms for automatic cleanup of expired entries. 0 to disable. Defaults to 0. */
    cleanupIntervalMs?: number;
}
/**
 * A cache where entries automatically expire after a configurable
 * time-to-live (TTL).
 *
 * @example
 * ```ts
 * const cache = new TTLCache<string>({ defaultTTLMs: 5000 });
 * cache.set("session", "abc123");
 * // After 5 seconds, cache.get("session") returns undefined
 * ```
 */
export declare class TTLCache<T> {
    private readonly _store;
    private readonly _defaultTTLMs;
    private readonly _maxSize;
    private _cleanupTimer;
    constructor(options?: TTLCacheOptions);
    /**
     * Get a value from the cache. Returns undefined if expired or not found.
     *
     * @param key - The cache key.
     * @returns The cached value or undefined.
     */
    get(key: string): T | undefined;
    /**
     * Set a value with an optional per-entry TTL.
     *
     * @param key - The cache key.
     * @param value - The value to cache.
     * @param ttlMs - Optional TTL override in milliseconds.
     * @returns This cache instance for chaining.
     */
    set(key: string, value: T, ttlMs?: number): this;
    /**
     * Check if a key exists and is not expired.
     */
    has(key: string): boolean;
    /**
     * Delete a key from the cache.
     */
    delete(key: string): boolean;
    /**
     * Clear all entries.
     */
    clear(): void;
    /**
     * Get the number of entries (including potentially expired ones).
     */
    get size(): number;
    /**
     * Stop the automatic cleanup timer.
     */
    dispose(): void;
    /**
     * Get or compute a value with caching.
     *
     * @param key - The cache key.
     * @param factory - A function that produces the value if not cached.
     * @param ttlMs - Optional TTL override.
     * @returns The cached or computed value.
     */
    getOrSet(key: string, factory: () => T, ttlMs?: number): T;
    /**
     * Remove all expired entries from the store.
     */
    private _cleanup;
}
//# sourceMappingURL=ttl-cache.d.ts.map