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
export class MemoryCache<T> {
  private readonly _store: Map<string, T> = new Map();
  private readonly _maxSize: number;

  constructor(options: MemoryCacheOptions = {}) {
    this._maxSize = options.maxSize ?? 1000;
  }

  /**
   * Get a value from the cache.
   *
   * @param key - The cache key.
   * @returns The cached value, or undefined if not found.
   */
  get(key: string): T | undefined {
    return this._store.get(key);
  }

  /**
   * Set a value in the cache.
   *
   * @param key - The cache key.
   * @param value - The value to cache.
   * @returns This cache instance for chaining.
   */
  set(key: string, value: T): this {
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
  has(key: string): boolean {
    return this._store.has(key);
  }

  /**
   * Delete a key from the cache.
   *
   * @param key - The cache key.
   * @returns `true` if the key was found and deleted.
   */
  delete(key: string): boolean {
    return this._store.delete(key);
  }

  /**
   * Clear all entries from the cache.
   */
  clear(): void {
    this._store.clear();
  }

  /**
   * Get the current number of entries in the cache.
   */
  get size(): number {
    return this._store.size;
  }

  /**
   * Get all keys currently in the cache.
   */
  keys(): string[] {
    return Array.from(this._store.keys());
  }

  /**
   * Get all values currently in the cache.
   */
  values(): T[] {
    return Array.from(this._store.values());
  }

  /**
   * Get all entries as key-value pairs.
   */
  entries(): Array<[string, T]> {
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
  getOrSet(key: string, factory: () => T): T {
    const existing = this._store.get(key);
    if (existing !== undefined) {
      return existing;
    }
    const value = factory();
    this.set(key, value);
    return value;
  }
}
