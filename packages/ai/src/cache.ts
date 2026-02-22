/**
 * Response cache module.
 *
 * Provides a TTL-based cache for AI responses, keyed by prompt hash.
 * Tracks hit/miss statistics and enforces maximum cache size.
 *
 * @module cache
 */

import { createHash } from "node:crypto";

/**
 * A cached AI response entry.
 */
export interface CacheEntry<T = string> {
  /** The cached value. */
  readonly value: T;
  /** Timestamp when the entry was created (ms since epoch). */
  readonly createdAt: number;
  /** Timestamp when the entry expires (ms since epoch). */
  readonly expiresAt: number;
  /** Hash key used to store the entry. */
  readonly key: string;
  /** Size estimate of the cached value in characters. */
  readonly sizeChars: number;
}

/**
 * Cache configuration options.
 */
export interface CacheConfig {
  /** Time-to-live for cache entries in milliseconds. */
  readonly ttlMs: number;
  /** Maximum number of entries in the cache. */
  readonly maxEntries: number;
  /** Whether to track hit/miss statistics. */
  readonly trackStats: boolean;
}

/**
 * Cache hit/miss statistics.
 */
export interface CacheStats {
  /** Total cache hits. */
  readonly hits: number;
  /** Total cache misses. */
  readonly misses: number;
  /** Hit rate as a ratio (0-1). */
  readonly hitRate: number;
  /** Current number of cached entries. */
  readonly size: number;
  /** Number of evictions due to max size. */
  readonly evictions: number;
  /** Number of entries expired on access. */
  readonly expirations: number;
  /** Total estimated size in characters. */
  readonly totalSizeChars: number;
}

/**
 * Default cache configuration.
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttlMs: 300_000,
  maxEntries: 1000,
  trackStats: true,
} as const;

/**
 * Generates a SHA-256 hash key from a prompt string.
 * Optionally includes model and temperature to differentiate responses.
 *
 * @param prompt - The prompt text.
 * @param model - Optional model identifier.
 * @param temperature - Optional temperature value.
 * @returns A hex-encoded SHA-256 hash.
 */
export function generateCacheKey(
  prompt: string,
  model?: string,
  temperature?: number
): string {
  const parts = [prompt];
  if (model !== undefined) {
    parts.push(`model:${model}`);
  }
  if (temperature !== undefined) {
    parts.push(`temp:${temperature}`);
  }
  const combined = parts.join("|");
  return createHash("sha256").update(combined).digest("hex");
}

/**
 * TTL-based response cache with size limits and statistics.
 */
export class ResponseCache<T = string> {
  private readonly cache: Map<string, CacheEntry<T>> = new Map();
  private readonly config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    expirations: 0,
  };

  /**
   * Creates a new ResponseCache.
   *
   * @param config - Optional cache configuration overrides.
   */
  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
  }

  /**
   * Stores a value in the cache with the given key.
   *
   * @param key - Cache key (typically a hash of the prompt).
   * @param value - The value to cache.
   * @param ttlMs - Optional override for the TTL.
   */
  set(key: string, value: T, ttlMs?: number): void {
    this.evictIfNeeded();

    const now = Date.now();
    const effectiveTtl = ttlMs ?? this.config.ttlMs;
    const sizeChars =
      typeof value === "string" ? value.length : JSON.stringify(value).length;

    const entry: CacheEntry<T> = {
      value,
      createdAt: now,
      expiresAt: now + effectiveTtl,
      key,
      sizeChars,
    };

    this.cache.set(key, entry);
  }

  /**
   * Retrieves a cached value by key.
   * Returns undefined if the key is not found or the entry has expired.
   *
   * @param key - Cache key to look up.
   * @returns The cached value, or undefined.
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      if (this.config.trackStats) {
        this.stats.misses++;
      }
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      if (this.config.trackStats) {
        this.stats.expirations++;
        this.stats.misses++;
      }
      return undefined;
    }

    if (this.config.trackStats) {
      this.stats.hits++;
    }
    return entry.value;
  }

  /**
   * Checks if a key exists and is not expired.
   *
   * @param key - Cache key to check.
   * @returns True if the key exists and is valid.
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Removes an entry from the cache.
   *
   * @param key - Cache key to remove.
   * @returns True if the entry was found and removed.
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clears all entries from the cache and resets statistics.
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, expirations: 0 };
  }

  /**
   * Returns the current cache statistics.
   *
   * @returns Cache hit/miss statistics snapshot.
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    let totalSizeChars = 0;
    for (const entry of this.cache.values()) {
      totalSizeChars += entry.sizeChars;
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      size: this.cache.size,
      evictions: this.stats.evictions,
      expirations: this.stats.expirations,
      totalSizeChars,
    };
  }

  /**
   * Returns the current number of entries in the cache.
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Removes all expired entries from the cache.
   *
   * @returns Number of entries purged.
   */
  purgeExpired(): number {
    const now = Date.now();
    let purged = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        purged++;
      }
    }

    if (this.config.trackStats) {
      this.stats.expirations += purged;
    }

    return purged;
  }

  /**
   * Returns all non-expired cache keys.
   *
   * @returns Array of valid cache keys.
   */
  keys(): string[] {
    const now = Date.now();
    const validKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now <= entry.expiresAt) {
        validKeys.push(key);
      }
    }

    return validKeys;
  }

  /**
   * Evicts the oldest entry if the cache is at capacity.
   */
  private evictIfNeeded(): void {
    while (this.cache.size >= this.config.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
        if (this.config.trackStats) {
          this.stats.evictions++;
        }
      } else {
        break;
      }
    }
  }
}
