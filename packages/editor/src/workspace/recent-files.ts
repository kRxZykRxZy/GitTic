/**
 * Recently opened files tracker for the editor.
 * Maintains an ordered list of recently accessed files with timestamps
 * and supports serialization for persistence.
 */

/**
 * A single entry in the recent files list.
 */
export interface RecentFileEntry {
  /** Absolute file path. */
  filePath: string;
  /** Display name (file name without directory). */
  displayName: string;
  /** Language identifier (e.g., "typescript"). */
  language: string;
  /** Timestamp of the last access. */
  lastAccessedAt: number;
  /** Number of times the file has been opened. */
  openCount: number;
  /** Whether the file was pinned as a favorite. */
  isFavorite: boolean;
}

/**
 * Serializable snapshot of recent files for persistence.
 */
export interface RecentFilesSnapshot {
  /** Schema version. */
  version: number;
  /** List of recent file entries. */
  entries: RecentFileEntry[];
  /** Timestamp of the snapshot. */
  timestamp: number;
}

/**
 * Configuration for the recent files tracker.
 */
export interface RecentFilesConfig {
  /** Maximum number of entries to keep. */
  maxEntries: number;
  /** Maximum age in milliseconds before an entry expires. */
  maxAgeMs: number;
}

/** Default configuration for recent files tracking. */
export const DEFAULT_RECENT_FILES_CONFIG: RecentFilesConfig = {
  maxEntries: 50,
  maxAgeMs: 30 * 24 * 60 * 60 * 1000, // 30 days
};

/**
 * Tracks recently opened files with timestamps, access counts, and favorites.
 */
export class RecentFilesTracker {
  private entries: Map<string, RecentFileEntry> = new Map();
  private config: RecentFilesConfig;

  constructor(config: Partial<RecentFilesConfig> = {}) {
    this.config = { ...DEFAULT_RECENT_FILES_CONFIG, ...config };
  }

  /**
   * Record that a file has been opened.
   * Updates the access time and increments the open count.
   */
  trackFile(filePath: string, language: string = "plaintext"): RecentFileEntry {
    const existing = this.entries.get(filePath);
    if (existing) {
      existing.lastAccessedAt = Date.now();
      existing.openCount++;
      existing.language = language;
      return existing;
    }

    const entry: RecentFileEntry = {
      filePath,
      displayName: extractFileName(filePath),
      language,
      lastAccessedAt: Date.now(),
      openCount: 1,
      isFavorite: false,
    };

    this.entries.set(filePath, entry);
    this.trimToMaxSize();
    return entry;
  }

  /**
   * Remove a file from the recent list.
   */
  removeFile(filePath: string): boolean {
    return this.entries.delete(filePath);
  }

  /**
   * Toggle the favorite status of a file.
   */
  toggleFavorite(filePath: string): boolean {
    const entry = this.entries.get(filePath);
    if (!entry) return false;
    entry.isFavorite = !entry.isFavorite;
    return entry.isFavorite;
  }

  /**
   * Get all recent files sorted by last accessed time (most recent first).
   */
  getRecent(): RecentFileEntry[] {
    return Array.from(this.entries.values())
      .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);
  }

  /**
   * Get only favorite files sorted by last accessed time.
   */
  getFavorites(): RecentFileEntry[] {
    return this.getRecent().filter((e) => e.isFavorite);
  }

  /**
   * Get the most frequently opened files.
   */
  getMostFrequent(limit: number = 10): RecentFileEntry[] {
    return Array.from(this.entries.values())
      .sort((a, b) => b.openCount - a.openCount)
      .slice(0, limit);
  }

  /**
   * Get a specific entry by file path.
   */
  getEntry(filePath: string): RecentFileEntry | null {
    return this.entries.get(filePath) ?? null;
  }

  /**
   * Get the total number of tracked files.
   */
  get count(): number {
    return this.entries.size;
  }

  /**
   * Clear all recent file entries (preserves favorites if specified).
   */
  clear(preserveFavorites: boolean = false): void {
    if (preserveFavorites) {
      const favorites = new Map<string, RecentFileEntry>();
      for (const [key, entry] of this.entries) {
        if (entry.isFavorite) favorites.set(key, entry);
      }
      this.entries = favorites;
    } else {
      this.entries.clear();
    }
  }

  /**
   * Remove entries older than the configured max age.
   */
  pruneExpired(): number {
    const cutoff = Date.now() - this.config.maxAgeMs;
    let removed = 0;
    for (const [key, entry] of this.entries) {
      if (entry.lastAccessedAt < cutoff && !entry.isFavorite) {
        this.entries.delete(key);
        removed++;
      }
    }
    return removed;
  }

  /**
   * Serialize the recent files list for persistence.
   */
  serialize(): RecentFilesSnapshot {
    return {
      version: 1,
      entries: this.getRecent(),
      timestamp: Date.now(),
    };
  }

  /**
   * Restore recent files from a serialized snapshot.
   */
  restore(snapshot: RecentFilesSnapshot): void {
    if (!snapshot || snapshot.version !== 1) return;
    this.entries.clear();
    for (const entry of snapshot.entries) {
      this.entries.set(entry.filePath, { ...entry });
    }
  }

  /**
   * Convert to JSON string for file storage.
   */
  toJSON(): string {
    return JSON.stringify(this.serialize(), null, 2);
  }

  /**
   * Load from a JSON string.
   */
  fromJSON(json: string): boolean {
    try {
      const snapshot = JSON.parse(json) as RecentFilesSnapshot;
      this.restore(snapshot);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Trim entries to respect the maximum list size.
   * Favorites are always preserved; oldest non-favorites are removed first.
   */
  private trimToMaxSize(): void {
    if (this.entries.size <= this.config.maxEntries) return;

    const sorted = Array.from(this.entries.entries())
      .sort(([, a], [, b]) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return b.lastAccessedAt - a.lastAccessedAt;
      });

    const toKeep = sorted.slice(0, this.config.maxEntries);
    this.entries = new Map(toKeep);
  }
}

/**
 * Extract the file name from a full path.
 */
function extractFileName(filePath: string): string {
  const parts = filePath.split("/");
  return parts[parts.length - 1] || filePath;
}
