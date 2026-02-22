/**
 * Options for the LRU cache.
 */
export interface LRUCacheOptions {
    /** Maximum number of entries. Defaults to 100. */
    maxSize?: number;
}
/**
 * A Least Recently Used (LRU) cache that evicts the least recently
 * accessed entries when the cache is full.
 *
 * @example
 * ```ts
 * const cache = new LRUCache<number>({ maxSize: 3 });
 * cache.set("a", 1);
 * cache.set("b", 2);
 * cache.set("c", 3);
 * cache.get("a"); // moves "a" to most recent
 * cache.set("d", 4); // evicts "b" (least recently used)
 * cache.has("b"); // => false
 * ```
 */
export declare class LRUCache<T> {
    private readonly _maxSize;
    private readonly _map;
    private _head;
    private _tail;
    constructor(options?: LRUCacheOptions);
    /**
     * Get a value and mark it as recently used.
     *
     * @param key - The cache key.
     * @returns The value or undefined.
     */
    get(key: string): T | undefined;
    /**
     * Set a value in the cache.
     *
     * @param key - The cache key.
     * @param value - The value to cache.
     */
    set(key: string, value: T): void;
    /**
     * Check if a key exists (without affecting recency).
     */
    has(key: string): boolean;
    /**
     * Delete a key from the cache.
     */
    delete(key: string): boolean;
    /**
     * Clear the cache entirely.
     */
    clear(): void;
    /** Current number of entries. */
    get size(): number;
    /** Get all keys in order from most to least recently used. */
    keys(): string[];
    /** Add a node to the head of the list. */
    private _addToHead;
    /** Remove a node from the list. */
    private _removeNode;
    /** Move an existing node to the head. */
    private _moveToHead;
    /** Evict the least recently used (tail) node. */
    private _evict;
}
//# sourceMappingURL=lru-cache.d.ts.map