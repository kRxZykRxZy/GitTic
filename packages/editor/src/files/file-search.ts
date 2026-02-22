/**
 * File search utilities for the editor.
 * Provides glob-style matching, fuzzy file search, and recently-opened ranking.
 */

/**
 * Result of a file search operation.
 */
export interface FileSearchResult {
  /** File path that matched the query. */
  filePath: string;
  /** File name extracted from the path. */
  fileName: string;
  /** Score indicating match quality (higher is better). */
  score: number;
  /** Ranges within the filename that matched (for highlighting). */
  matchRanges: Array<{ start: number; end: number }>;
}

/**
 * Configuration for the file search engine.
 */
export interface FileSearchConfig {
  /** Maximum number of results to return. */
  maxResults: number;
  /** Whether to use fuzzy matching (allows character gaps). */
  fuzzyMatch: boolean;
  /** Boost factor applied to recently opened files. */
  recentBoost: number;
  /** Whether the search is case-sensitive. */
  caseSensitive: boolean;
}

/** Default search configuration. */
export const DEFAULT_FILE_SEARCH_CONFIG: FileSearchConfig = {
  maxResults: 50,
  fuzzyMatch: true,
  recentBoost: 2.0,
  caseSensitive: false,
};

/**
 * File search engine with glob matching, fuzzy search, and recency ranking.
 */
export class FileSearchEngine {
  private config: FileSearchConfig;
  private recentFiles: Map<string, number> = new Map();

  constructor(config: Partial<FileSearchConfig> = {}) {
    this.config = { ...DEFAULT_FILE_SEARCH_CONFIG, ...config };
  }

  /**
   * Search a list of file paths using the given query string.
   * Returns scored and sorted results up to maxResults.
   */
  search(query: string, filePaths: string[]): FileSearchResult[] {
    if (query.length === 0) {
      return this.getRecentlyOpened(filePaths);
    }

    const results: FileSearchResult[] = [];
    const normalizedQuery = this.config.caseSensitive ? query : query.toLowerCase();

    for (const filePath of filePaths) {
      const fileName = this.extractFileName(filePath);
      const target = this.config.caseSensitive ? fileName : fileName.toLowerCase();
      const match = this.config.fuzzyMatch
        ? this.fuzzyMatch(normalizedQuery, target)
        : this.substringMatch(normalizedQuery, target);

      if (match) {
        const recentBoost = this.getRecentBoost(filePath);
        results.push({
          filePath,
          fileName,
          score: match.score * recentBoost,
          matchRanges: match.ranges,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, this.config.maxResults);
  }

  /**
   * Record a file as recently opened (updates its recency score).
   */
  markRecentlyOpened(filePath: string): void {
    this.recentFiles.set(filePath, Date.now());
  }

  /**
   * Remove a file from the recently opened list.
   */
  removeFromRecent(filePath: string): boolean {
    return this.recentFiles.delete(filePath);
  }

  /**
   * Clear the recently opened file history.
   */
  clearRecent(): void {
    this.recentFiles.clear();
  }

  /**
   * Get recently opened files sorted by recency.
   */
  getRecentlyOpened(availableFiles?: string[]): FileSearchResult[] {
    const entries = Array.from(this.recentFiles.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, this.config.maxResults);

    const results: FileSearchResult[] = [];
    for (const [filePath, timestamp] of entries) {
      if (availableFiles && !availableFiles.includes(filePath)) continue;
      results.push({
        filePath,
        fileName: this.extractFileName(filePath),
        score: timestamp,
        matchRanges: [],
      });
    }
    return results;
  }

  /**
   * Check if a file path matches a simplified glob pattern.
   */
  matchesGlob(filePath: string, pattern: string): boolean {
    const regex = this.globToRegex(pattern);
    return regex.test(filePath);
  }

  /**
   * Perform a fuzzy match of query characters against a target string.
   * Returns a score and the matched character ranges, or null on no match.
   */
  private fuzzyMatch(
    query: string,
    target: string
  ): { score: number; ranges: Array<{ start: number; end: number }> } | null {
    if (query.length === 0) return { score: 1, ranges: [] };
    if (query.length > target.length) return null;

    let queryIdx = 0;
    let score = 0;
    const ranges: Array<{ start: number; end: number }> = [];
    let currentRange: { start: number; end: number } | null = null;
    let lastMatchIdx = -2;

    for (let i = 0; i < target.length && queryIdx < query.length; i++) {
      if (target[i] === query[queryIdx]) {
        score += 1;
        // Bonus for consecutive matches
        if (i === lastMatchIdx + 1) {
          score += 2;
        }
        // Bonus for matching at start of target or after a separator
        if (i === 0 || target[i - 1] === "/" || target[i - 1] === "." || target[i - 1] === "-" || target[i - 1] === "_") {
          score += 3;
        }

        if (currentRange && currentRange.end === i) {
          currentRange.end = i + 1;
        } else {
          currentRange = { start: i, end: i + 1 };
          ranges.push(currentRange);
        }

        lastMatchIdx = i;
        queryIdx++;
      }
    }

    if (queryIdx < query.length) return null;
    return { score, ranges };
  }

  /**
   * Perform a simple substring match.
   */
  private substringMatch(
    query: string,
    target: string
  ): { score: number; ranges: Array<{ start: number; end: number }> } | null {
    const idx = target.indexOf(query);
    if (idx === -1) return null;

    let score = 10;
    if (idx === 0) score += 5;
    return { score, ranges: [{ start: idx, end: idx + query.length }] };
  }

  /**
   * Get the recency boost multiplier for a file.
   */
  private getRecentBoost(filePath: string): number {
    if (!this.recentFiles.has(filePath)) return 1.0;
    return this.config.recentBoost;
  }

  /**
   * Extract the filename from a full file path.
   */
  private extractFileName(filePath: string): string {
    const parts = filePath.split("/");
    return parts[parts.length - 1] || filePath;
  }

  /**
   * Convert a simplified glob pattern to a regular expression.
   */
  private globToRegex(pattern: string): RegExp {
    let regexStr = "";
    for (let i = 0; i < pattern.length; i++) {
      const char = pattern[i];
      switch (char) {
        case "*":
          if (pattern[i + 1] === "*") {
            regexStr += ".*";
            i++;
            if (pattern[i + 1] === "/") i++;
          } else {
            regexStr += "[^/]*";
          }
          break;
        case "?":
          regexStr += "[^/]";
          break;
        case ".":
        case "(":
        case ")":
        case "[":
        case "]":
        case "{":
        case "}":
        case "+":
        case "^":
        case "$":
        case "|":
        case "\\":
          regexStr += "\\" + char;
          break;
        default:
          regexStr += char;
      }
    }
    return new RegExp(`^${regexStr}$`, this.config.caseSensitive ? "" : "i");
  }
}
