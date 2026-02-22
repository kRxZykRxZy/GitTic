/**
 * Text search across project files.
 * Supports regex, case sensitivity, whole word matching, and result pagination.
 */

/**
 * A single search match within a file.
 */
export interface TextSearchMatch {
  /** Zero-based line number where the match occurs. */
  line: number;
  /** Zero-based column where the match starts. */
  column: number;
  /** Length of the matched text. */
  length: number;
  /** The matched text content. */
  matchText: string;
  /** Full line of text containing the match (for context). */
  lineText: string;
  /** Lines of context before the match. */
  contextBefore: string[];
  /** Lines of context after the match. */
  contextAfter: string[];
}

/**
 * Search results for a single file.
 */
export interface FileSearchResults {
  /** File path that was searched. */
  filePath: string;
  /** All matches found in this file. */
  matches: TextSearchMatch[];
  /** Total number of matches in this file. */
  matchCount: number;
}

/**
 * Complete search results across all files.
 */
export interface TextSearchResults {
  /** Search query used. */
  query: string;
  /** Per-file results. */
  files: FileSearchResults[];
  /** Total matches across all files. */
  totalMatches: number;
  /** Total files with at least one match. */
  totalFiles: number;
  /** Time taken for the search in milliseconds. */
  durationMs: number;
  /** Whether the search was truncated due to hitting limits. */
  truncated: boolean;
}

/**
 * Options for configuring a text search operation.
 */
export interface TextSearchOptions {
  /** Whether the search is case-sensitive. */
  caseSensitive: boolean;
  /** Whether to use regex matching. */
  useRegex: boolean;
  /** Whether to match whole words only. */
  wholeWord: boolean;
  /** Number of context lines before each match. */
  contextLinesBefore: number;
  /** Number of context lines after each match. */
  contextLinesAfter: number;
  /** Maximum number of total matches before stopping. */
  maxMatches: number;
  /** Glob patterns for files to include. */
  includePatterns: string[];
  /** Glob patterns for files to exclude. */
  excludePatterns: string[];
}

/** Default text search options. */
export const DEFAULT_TEXT_SEARCH_OPTIONS: TextSearchOptions = {
  caseSensitive: false,
  useRegex: false,
  wholeWord: false,
  contextLinesBefore: 2,
  contextLinesAfter: 2,
  maxMatches: 10000,
  includePatterns: [],
  excludePatterns: ["node_modules/**", ".git/**", "dist/**"],
};

/**
 * Searches text content across multiple files.
 */
export class TextSearchEngine {
  private options: TextSearchOptions;

  constructor(options: Partial<TextSearchOptions> = {}) {
    this.options = { ...DEFAULT_TEXT_SEARCH_OPTIONS, ...options };
  }

  /**
   * Search for a query across multiple files.
   * Files are provided as an array of { filePath, content } objects.
   */
  search(
    query: string,
    files: Array<{ filePath: string; content: string }>
  ): TextSearchResults {
    const startTime = Date.now();
    const regex = this.buildRegex(query);
    if (!regex) {
      return this.emptyResults(query, Date.now() - startTime);
    }

    const results: FileSearchResults[] = [];
    let totalMatches = 0;
    let truncated = false;

    for (const file of files) {
      if (!this.matchesIncludePatterns(file.filePath)) continue;
      if (this.matchesExcludePatterns(file.filePath)) continue;

      const fileResults = this.searchInFile(file.filePath, file.content, regex);
      if (fileResults.matchCount > 0) {
        results.push(fileResults);
        totalMatches += fileResults.matchCount;

        if (totalMatches >= this.options.maxMatches) {
          truncated = true;
          break;
        }
      }
    }

    return {
      query,
      files: results,
      totalMatches,
      totalFiles: results.length,
      durationMs: Date.now() - startTime,
      truncated,
    };
  }

  /**
   * Search within a single file's content.
   */
  searchInFile(filePath: string, content: string, regex?: RegExp): FileSearchResults {
    const searchRegex = regex ?? this.buildRegex(content);
    if (!searchRegex) {
      return { filePath, matches: [], matchCount: 0 };
    }

    const lines = content.split("\n");
    const matches: TextSearchMatch[] = [];

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const lineRegex = new RegExp(searchRegex.source, searchRegex.flags);

      let match: RegExpExecArray | null;
      while ((match = lineRegex.exec(line)) !== null) {
        matches.push({
          line: lineIdx,
          column: match.index,
          length: match[0].length,
          matchText: match[0],
          lineText: line,
          contextBefore: this.getContext(lines, lineIdx, -this.options.contextLinesBefore),
          contextAfter: this.getContext(lines, lineIdx, this.options.contextLinesAfter),
        });

        if (match[0].length === 0) {
          lineRegex.lastIndex++;
        }

        if (matches.length >= this.options.maxMatches) break;
      }

      if (matches.length >= this.options.maxMatches) break;
    }

    return { filePath, matches, matchCount: matches.length };
  }

  /**
   * Build a regex from the search query and options.
   */
  private buildRegex(query: string): RegExp | null {
    if (query.length === 0) return null;

    let pattern: string;
    if (this.options.useRegex) {
      try {
        new RegExp(query);
        pattern = query;
      } catch {
        return null;
      }
    } else {
      pattern = escapeRegex(query);
    }

    if (this.options.wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }

    const flags = this.options.caseSensitive ? "g" : "gi";
    try {
      return new RegExp(pattern, flags);
    } catch {
      return null;
    }
  }

  /**
   * Get context lines before or after a given line index.
   */
  private getContext(lines: string[], lineIdx: number, count: number): string[] {
    const context: string[] = [];
    if (count > 0) {
      for (let i = lineIdx + 1; i <= Math.min(lineIdx + count, lines.length - 1); i++) {
        context.push(lines[i]);
      }
    } else {
      for (let i = Math.max(0, lineIdx + count); i < lineIdx; i++) {
        context.push(lines[i]);
      }
    }
    return context;
  }

  /**
   * Check if a file path matches include patterns.
   */
  private matchesIncludePatterns(filePath: string): boolean {
    if (this.options.includePatterns.length === 0) return true;
    return this.options.includePatterns.some((p) => this.simpleGlobMatch(filePath, p));
  }

  /**
   * Check if a file path matches exclude patterns.
   */
  private matchesExcludePatterns(filePath: string): boolean {
    return this.options.excludePatterns.some((p) => this.simpleGlobMatch(filePath, p));
  }

  /**
   * Simple glob matching for file paths.
   */
  private simpleGlobMatch(filePath: string, pattern: string): boolean {
    const regexStr = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*/g, "<<GLOBSTAR>>")
      .replace(/\*/g, "[^/]*")
      .replace(/<<GLOBSTAR>>/g, ".*")
      .replace(/\?/g, "[^/]");
    return new RegExp(regexStr).test(filePath);
  }

  /**
   * Return empty results object.
   */
  private emptyResults(query: string, durationMs: number): TextSearchResults {
    return {
      query,
      files: [],
      totalMatches: 0,
      totalFiles: 0,
      durationMs,
      truncated: false,
    };
  }
}

/**
 * Escape special regex characters for literal matching.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
