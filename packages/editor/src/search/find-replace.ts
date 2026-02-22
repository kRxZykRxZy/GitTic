/**
 * Find and replace within a single file.
 * Supports regex, case sensitivity, whole word, preserve case, and match navigation.
 */

/**
 * A single find result within a document.
 */
export interface FindMatch {
  /** Zero-based line index. */
  line: number;
  /** Zero-based starting column. */
  startColumn: number;
  /** Zero-based ending column. */
  endColumn: number;
  /** The matched text. */
  text: string;
}

/**
 * Options for find/replace operations.
 */
export interface FindReplaceOptions {
  /** Whether the search is case-sensitive. */
  caseSensitive: boolean;
  /** Whether to use regex matching. */
  useRegex: boolean;
  /** Whether to match whole words only. */
  wholeWord: boolean;
  /** Whether to preserve the case pattern when replacing. */
  preserveCase: boolean;
  /** Whether search should wrap around the document. */
  wrapAround: boolean;
}

/** Default find/replace options. */
export const DEFAULT_FIND_REPLACE_OPTIONS: FindReplaceOptions = {
  caseSensitive: false,
  useRegex: false,
  wholeWord: false,
  preserveCase: false,
  wrapAround: true,
};

/**
 * Result of a replace operation.
 */
export interface ReplaceResult {
  /** Number of replacements made. */
  replacementCount: number;
  /** The modified text content. */
  newContent: string;
}

/**
 * Find and replace engine for a single document.
 */
export class FindReplace {
  private content: string = "";
  private matches: FindMatch[] = [];
  private currentIndex: number = -1;
  private options: FindReplaceOptions;
  private _query: string = "";

  constructor(options: Partial<FindReplaceOptions> = {}) {
    this.options = { ...DEFAULT_FIND_REPLACE_OPTIONS, ...options };
  }

  /**
   * Set the document content to search within.
   */
  setContent(content: string): void {
    this.content = content;
    if (this._query) {
      this.findAll(this._query);
    }
  }

  /**
   * Find all matches of a query string in the current content.
   * Returns the total number of matches found.
   */
  findAll(query: string): number {
    this._query = query;
    this.matches = [];
    this.currentIndex = -1;

    if (!query) return 0;

    const regex = this.buildRegex(query);
    if (!regex) return 0;

    const lines = this.content.split("\n");
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const lineRegex = new RegExp(regex.source, regex.flags);
      let match: RegExpExecArray | null;

      while ((match = lineRegex.exec(line)) !== null) {
        this.matches.push({
          line: lineIdx,
          startColumn: match.index,
          endColumn: match.index + match[0].length,
          text: match[0],
        });

        if (match[0].length === 0) lineRegex.lastIndex++;
      }
    }

    if (this.matches.length > 0) {
      this.currentIndex = 0;
    }

    return this.matches.length;
  }

  /**
   * Navigate to the next match relative to the current position.
   */
  findNext(): FindMatch | null {
    if (this.matches.length === 0) return null;

    if (this.options.wrapAround) {
      this.currentIndex = (this.currentIndex + 1) % this.matches.length;
    } else {
      if (this.currentIndex < this.matches.length - 1) {
        this.currentIndex++;
      } else {
        return null;
      }
    }

    return this.matches[this.currentIndex];
  }

  /**
   * Navigate to the previous match relative to the current position.
   */
  findPrevious(): FindMatch | null {
    if (this.matches.length === 0) return null;

    if (this.options.wrapAround) {
      this.currentIndex = (this.currentIndex - 1 + this.matches.length) % this.matches.length;
    } else {
      if (this.currentIndex > 0) {
        this.currentIndex--;
      } else {
        return null;
      }
    }

    return this.matches[this.currentIndex];
  }

  /**
   * Replace the current match with the replacement string.
   * Returns the updated content.
   */
  replaceCurrent(replacement: string): ReplaceResult | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.matches.length) {
      return null;
    }

    const match = this.matches[this.currentIndex];
    const lines = this.content.split("\n");
    const line = lines[match.line];

    const actualReplacement = this.options.preserveCase
      ? this.matchCase(match.text, replacement)
      : replacement;

    lines[match.line] =
      line.substring(0, match.startColumn) +
      actualReplacement +
      line.substring(match.endColumn);

    this.content = lines.join("\n");
    this.findAll(this._query); // re-index matches

    return { replacementCount: 1, newContent: this.content };
  }

  /**
   * Replace all matches with the replacement string.
   */
  replaceAll(replacement: string): ReplaceResult {
    if (this.matches.length === 0) {
      return { replacementCount: 0, newContent: this.content };
    }

    const lines = this.content.split("\n");
    let replacementCount = 0;

    // Process matches in reverse order to preserve positions
    const sortedMatches = [...this.matches].sort((a, b) => {
      if (a.line !== b.line) return b.line - a.line;
      return b.startColumn - a.startColumn;
    });

    for (const match of sortedMatches) {
      const line = lines[match.line];
      const actualReplacement = this.options.preserveCase
        ? this.matchCase(match.text, replacement)
        : replacement;

      lines[match.line] =
        line.substring(0, match.startColumn) +
        actualReplacement +
        line.substring(match.endColumn);

      replacementCount++;
    }

    this.content = lines.join("\n");
    this.matches = [];
    this.currentIndex = -1;

    return { replacementCount, newContent: this.content };
  }

  /**
   * Get the current match, or null if none.
   */
  getCurrentMatch(): FindMatch | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.matches.length) return null;
    return this.matches[this.currentIndex];
  }

  /**
   * Get all current matches.
   */
  getMatches(): readonly FindMatch[] {
    return this.matches;
  }

  /**
   * Get the current match index (1-based for display) and total count.
   */
  getMatchStatus(): { current: number; total: number } {
    return {
      current: this.matches.length > 0 ? this.currentIndex + 1 : 0,
      total: this.matches.length,
    };
  }

  /**
   * Get the current document content.
   */
  getContent(): string {
    return this.content;
  }

  /**
   * Update find/replace options.
   */
  setOptions(options: Partial<FindReplaceOptions>): void {
    Object.assign(this.options, options);
    if (this._query) {
      this.findAll(this._query);
    }
  }

  /**
   * Build a regular expression from the query and current options.
   */
  private buildRegex(query: string): RegExp | null {
    let pattern: string;
    if (this.options.useRegex) {
      try {
        new RegExp(query);
        pattern = query;
      } catch {
        return null;
      }
    } else {
      pattern = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
   * Attempt to preserve the case pattern of the original text in the replacement.
   */
  private matchCase(original: string, replacement: string): string {
    if (original === original.toUpperCase()) {
      return replacement.toUpperCase();
    }
    if (original === original.toLowerCase()) {
      return replacement.toLowerCase();
    }
    if (original[0] === original[0].toUpperCase()) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1).toLowerCase();
    }
    return replacement;
  }
}
