"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryCache = void 0;
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
class MemoryCache {
    _store = new Map();
    _maxSize;
    constructor(options = {}) {
        this._maxSize = options.maxSize ?? 1000;
    }
    /**
     * Get a value from the cache.
     *
     * @param key - The cache key.
     * @returns The cached value, or undefined if not found.
     */
    get(key) {
        return this._store.get(key);
    }
    /**
     * Set a value in the cache.
     *
     * @param key - The cache key.
     * @param value - The value to cache.
     * @returns This cache instance for chaining.
     */
    set(key, value) {
        if (this._store.size >= this._maxSize && !this._store.has(key)) {
            // Evict the oldest entry (first inserted)
            const firstKey = this._store.keys().next().value;
            if (firstKey !== undefined) {
                this._store.delete(firstKey);
            }
        }
        this._store.set(key, value);
        return this;
    }
    /**
     * Check if a key exists in the cache.
     *
     * @param key - The cache key.
     * @returns `true` if the key exists.
     */
    has(key) {
        return this._store.has(key);
    }
    /**
     * Delete a key from the cache.
     *
     * @param key - The cache key.
     * @returns `true` if the key was found and deleted.
     */
    delete(key) {
        return this._store.delete(key);
    }
    /**
     * Clear all entries from the cache.
     */
    clear() {
        this._store.clear();
    }
    /**
     * Get the current number of entries in the cache.
     */
    get size() {
        return this._store.size;
    }
    /**
     * Get all keys currently in the cache.
     */
    keys() {
        return Array.from(this._store.keys());
    }
    /**
     * Get all values currently in the cache.
     */
    values() {
        return Array.from(this._store.values());
    }
    /**
     * Get all entries as key-value pairs.
     */
    entries() {
        return Array.from(this._store.entries());
    }
    /**
     * Get or compute a value. If the key is not in the cache, the factory
     * function is called and the result is cached.
     *
     * @param key - The cache key.
     * @param factory - A function that produces the value if not cached.
     * @returns The cached or computed value.
     */
    getOrSet(key, factory) {
        const existing = this._store.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const value = factory();
        this.set(key, value);
        return value;
    }
}
exports.MemoryCache = MemoryCache;
//# sourceMappingURL=memory-cache.js.map