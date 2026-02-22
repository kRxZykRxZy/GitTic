/**
 * Options for the memory cache.
 */
export interface MemoryCacheOptions {
    /** Maximum number of entries. Defaults to 1000. */
    maxSize?: number;
}
/**
 * A simple in-memory key-value cache with optional size limits.
 *
 * @example
 * ```ts
 * const cache = new MemoryCache<string>({ maxSize: 100 });
 * cache.set("key", "value");
 * cache.get("key"); // => "value"
 * ```
 */
export declare class MemoryCache<T> {
    private readonly _store;
    private readonly _maxSize;
    constructor(options?: MemoryCacheOptions);
    /**
     * Get a value from the cache.
     *
     * @param key - The cache key.
     * @returns The cached value, or undefined if not found.
     */
    get(key: string): T | undefined;
    /**
     * Set a value in the cache.
     *
     * @param key - The cache key.
     * @param value - The value to cache.
     * @returns This cache instance for chaining.
     */
    set(key: string, value: T): this;
    /**
     * Check if a key exists in the cache.
     *
     * @param key - The cache key.
     * @returns `true` if the key exists.
     */
    has(key: string): boolean;
    /**
     * Delete a key from the cache.
     *
     * @param key - The cache key.
     * @returns `true` if the key was found and deleted.
     */
    delete(key: string): boolean;
    /**
     * Clear all entries from the cache.
     */
    clear(): void;
    /**
     * Get the current number of entries in the cache.
     */
    get size(): number;
    /**
     * Get all keys currently in the cache.
     */
    keys(): string[];
    /**
     * Get all values currently in the cache.
     */
    values(): T[];
    /**
     * Get all entries as key-value pairs.
     */
    entries(): Array<[string, T]>;
    /**
     * Get or compute a value. If the key is not in the cache, the factory
     * function is called and the result is cached.
     *
     * @param key - The cache key.
     * @param factory - A function that produces the value if not cached.
     * @returns The cached or computed value.
     */
    getOrSet(key: string, factory: () => T): T;
}
//# sourceMappingURL=memory-cache.d.ts.map