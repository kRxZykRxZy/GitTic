/**
 * A cache entry with an expiration time.
 */
interface TTLEntry<T> {
  value: T;
  expiresAt: number;
}

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
export class TTLCache<T> {
  private readonly _store: Map<string, TTLEntry<T>> = new Map();
  private readonly _defaultTTLMs: number;
  private readonly _maxSize: number;
  private _cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: TTLCacheOptions = {}) {
    this._defaultTTLMs = options.defaultTTLMs ?? 60_000;
    this._maxSize = options.maxSize ?? 1000;

    if (options.cleanupIntervalMs && options.cleanupIntervalMs > 0) {
      this._cleanupTimer = setInterval(
        () => this._cleanup(),
        options.cleanupIntervalMs,
      );
      // Allow the process to exit even if the timer is active
      if (this._cleanupTimer && "unref" in this._cleanupTimer) {
        (this._cleanupTimer as NodeJS.Timeout).unref();
      }
    }
  }

  /**
   * Get a value from the cache. Returns undefined if expired or not found.
   *
   * @param key - The cache key.
   * @returns The cached value or undefined.
   */
  get(key: string): T | undefined {
    const entry = this._store.get(key);
    if (!entry) {
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this._store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /**
   * Set a value with an optional per-entry TTL.
   *
   * @param key - The cache key.
   * @param value - The value to cache.
   * @param ttlMs - Optional TTL override in milliseconds.
   * @returns This cache instance for chaining.
   */
  set(key: string, value: T, ttlMs?: number): this {
    if (this._store.size >= this._maxSize && !this._store.has(key)) {
      this._cleanup();
      // If still full after cleanup, evict oldest
      if (this._store.size >= this._maxSize) {
        const firstKey = this._store.keys().next().value;
        if (firstKey !== undefined) {
          this._store.delete(firstKey);
        }
      }
    }

    const expiresAt = Date.now() + (ttlMs ?? this._defaultTTLMs);
    this._store.set(key, { value, expiresAt });
    return this;
  }

  /**
   * Check if a key exists and is not expired.
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete a key from the cache.
   */
  delete(key: string): boolean {
    return this._store.delete(key);
  }

  /**
   * Clear all entries.
   */
  clear(): void {
    this._store.clear();
  }

  /**
   * Get the number of entries (including potentially expired ones).
   */
  get size(): number {
    return this._store.size;
  }

  /**
   * Stop the automatic cleanup timer.
   */
  dispose(): void {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
      this._cleanupTimer = null;
    }
  }

  /**
   * Get or compute a value with caching.
   *
   * @param key - The cache key.
   * @param factory - A function that produces the value if not cached.
   * @param ttlMs - Optional TTL override.
   * @returns The cached or computed value.
   */
  getOrSet(key: string, factory: () => T, ttlMs?: number): T {
    const existing = this.get(key);
    if (existing !== undefined) {
      return existing;
    }
    const value = factory();
    this.set(key, value, ttlMs);
    return value;
  }

  /**
   * Remove all expired entries from the store.
   */
  private _cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this._store) {
      if (now > entry.expiresAt) {
        this._store.delete(key);
      }
    }
  }
}
