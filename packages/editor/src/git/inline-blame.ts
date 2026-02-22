/**
 * Inline blame display for the editor gutter.
 * Shows per-line git blame information (author, date, commit) with caching.
 */

/**
 * Blame information for a single line.
 */
export interface LineBlameInfo {
  /** Line number (zero-based). */
  line: number;
  /** SHA of the commit that last modified this line. */
  commitSha: string;
  /** Short commit SHA for display (first 7 characters). */
  shortSha: string;
  /** Author name. */
  author: string;
  /** Author email. */
  authorEmail: string;
  /** Commit date as ISO string. */
  date: string;
  /** Commit message (first line only). */
  message: string;
  /** Whether this line was added in the most recent commit. */
  isRecent: boolean;
}

/**
 * Blame data for an entire file.
 */
export interface FileBlameData {
  /** File path. */
  filePath: string;
  /** Per-line blame information. */
  lines: LineBlameInfo[];
  /** Timestamp when the blame was computed. */
  computedAt: number;
  /** Whether the blame data is stale (file has been modified since). */
  isStale: boolean;
}

/**
 * Configuration for inline blame display.
 */
export interface InlineBlameConfig {
  /** Whether inline blame is enabled. */
  enabled: boolean;
  /** Format string for blame display in the gutter. */
  format: string;
  /** Maximum age in milliseconds before blame data is considered stale. */
  cacheMaxAgeMs: number;
  /** Delay before showing blame after cursor moves (ms). */
  showDelayMs: number;
  /** Whether to show blame for the current line only. */
  currentLineOnly: boolean;
}

/** Default inline blame configuration. */
export const DEFAULT_INLINE_BLAME_CONFIG: InlineBlameConfig = {
  enabled: true,
  format: "${author}, ${date} • ${message}",
  cacheMaxAgeMs: 5 * 60 * 1000, // 5 minutes
  showDelayMs: 500,
  currentLineOnly: true,
};

/**
 * Manages inline blame display for editor files.
 * Caches blame data per file and provides formatted gutter text.
 */
export class InlineBlame {
  private cache = new Map<string, FileBlameData>();
  private config: InlineBlameConfig;
  private _isVisible: boolean;

  constructor(config: Partial<InlineBlameConfig> = {}) {
    this.config = { ...DEFAULT_INLINE_BLAME_CONFIG, ...config };
    this._isVisible = this.config.enabled;
  }

  /** Whether blame info is currently visible. */
  get isVisible(): boolean {
    return this._isVisible;
  }

  /**
   * Toggle blame visibility.
   */
  toggleVisibility(): boolean {
    this._isVisible = !this._isVisible;
    return this._isVisible;
  }

  /**
   * Set blame visibility.
   */
  setVisible(visible: boolean): void {
    this._isVisible = visible;
  }

  /**
   * Cache blame data for a file.
   */
  setBlameData(filePath: string, lines: LineBlameInfo[]): void {
    this.cache.set(filePath, {
      filePath,
      lines,
      computedAt: Date.now(),
      isStale: false,
    });
  }

  /**
   * Get cached blame data for a file.
   * Returns null if not cached or cache has expired.
   */
  getBlameData(filePath: string): FileBlameData | null {
    const data = this.cache.get(filePath);
    if (!data) return null;

    const age = Date.now() - data.computedAt;
    if (age > this.config.cacheMaxAgeMs) {
      data.isStale = true;
    }

    return data;
  }

  /**
   * Get blame information for a specific line in a file.
   */
  getLineBlame(filePath: string, line: number): LineBlameInfo | null {
    const data = this.cache.get(filePath);
    if (!data) return null;
    return data.lines.find((l) => l.line === line) ?? null;
  }

  /**
   * Format blame information for display in the gutter.
   */
  formatBlame(blame: LineBlameInfo): string {
    return this.config.format
      .replace("${author}", blame.author)
      .replace("${date}", this.formatDate(blame.date))
      .replace("${message}", this.truncateMessage(blame.message, 50))
      .replace("${sha}", blame.shortSha)
      .replace("${email}", blame.authorEmail);
  }

  /**
   * Mark blame data as stale for a file (e.g., after the file is modified).
   */
  markStale(filePath: string): void {
    const data = this.cache.get(filePath);
    if (data) {
      data.isStale = true;
    }
  }

  /**
   * Remove cached blame data for a file.
   */
  clearFile(filePath: string): boolean {
    return this.cache.delete(filePath);
  }

  /**
   * Clear all cached blame data.
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Check if blame data exists for a file and is not stale.
   */
  hasFreshData(filePath: string): boolean {
    const data = this.cache.get(filePath);
    if (!data) return false;
    return !data.isStale && (Date.now() - data.computedAt) < this.config.cacheMaxAgeMs;
  }

  /**
   * Get all file paths with cached blame data.
   */
  getCachedFiles(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get unique authors from blame data for a file.
   */
  getAuthors(filePath: string): string[] {
    const data = this.cache.get(filePath);
    if (!data) return [];
    const authors = new Set(data.lines.map((l) => l.author));
    return Array.from(authors);
  }

  /**
   * Get the number of lines each author contributed in a file.
   */
  getAuthorStats(filePath: string): Map<string, number> {
    const stats = new Map<string, number>();
    const data = this.cache.get(filePath);
    if (!data) return stats;

    for (const line of data.lines) {
      const count = stats.get(line.author) ?? 0;
      stats.set(line.author, count + 1);
    }
    return stats;
  }

  /**
   * Update configuration at runtime.
   */
  setConfig(update: Partial<InlineBlameConfig>): void {
    Object.assign(this.config, update);
    if (this.config.enabled === false) {
      this._isVisible = false;
    }
  }

  /**
   * Format a date string to a relative time description.
   */
  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  /**
   * Truncate a commit message to the specified max length.
   */
  private truncateMessage(message: string, maxLength: number): string {
    const firstLine = message.split("\n")[0];
    if (firstLine.length <= maxLength) return firstLine;
    return firstLine.substring(0, maxLength - 3) + "...";
  }
}
