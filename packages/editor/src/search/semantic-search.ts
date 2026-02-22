/**
 * Semantic search engine for code analysis.
 * Searches by code meaning: function calls, variable usage, type references.
 * Uses pattern-based AST-like matching without a full parser.
 */

/**
 * Types of code symbols that can be searched semantically.
 */
export type SymbolKind =
  | "function"
  | "class"
  | "interface"
  | "type"
  | "variable"
  | "import"
  | "export"
  | "method"
  | "property"
  | "enum";

/**
 * A semantic search result representing a code symbol match.
 */
export interface SemanticMatch {
  /** Kind of symbol that was matched. */
  kind: SymbolKind;
  /** Name of the matched symbol. */
  name: string;
  /** File path where the symbol was found. */
  filePath: string;
  /** Zero-based line number. */
  line: number;
  /** Zero-based column number. */
  column: number;
  /** Full text of the line containing the match. */
  lineText: string;
  /** Relevance score. */
  score: number;
  /** Additional context (e.g., parent class name). */
  context: string | null;
}

/**
 * Options for semantic search queries.
 */
export interface SemanticSearchOptions {
  /** Types of symbols to search for. */
  symbolKinds: SymbolKind[];
  /** Whether to include re-exports and indirect references. */
  includeReferences: boolean;
  /** Maximum results to return. */
  maxResults: number;
  /** Languages to search (empty means all). */
  languages: string[];
}

/** Default semantic search options. */
export const DEFAULT_SEMANTIC_SEARCH_OPTIONS: SemanticSearchOptions = {
  symbolKinds: ["function", "class", "interface", "type", "variable", "import", "export"],
  includeReferences: true,
  maxResults: 100,
  languages: [],
};

/**
 * Pattern definitions for matching different symbol kinds.
 * Each pattern is a regex that captures the symbol name.
 */
const SYMBOL_PATTERNS: Record<SymbolKind, RegExp[]> = {
  function: [
    /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g,
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/g,
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=])\s*=>/g,
  ],
  class: [
    /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/g,
  ],
  interface: [
    /(?:export\s+)?interface\s+(\w+)/g,
  ],
  type: [
    /(?:export\s+)?type\s+(\w+)\s*=/g,
  ],
  variable: [
    /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*[=:]/g,
  ],
  import: [
    /import\s+(?:type\s+)?(?:\{[^}]*\}|\*\s+as\s+(\w+)|(\w+))\s+from/g,
    /import\s+(\w+)\s+from/g,
  ],
  export: [
    /export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type|enum)\s+(\w+)/g,
    /export\s+\{([^}]+)\}/g,
  ],
  method: [
    /(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w[^{]*)?\s*\{/g,
    /(?:get|set)\s+(\w+)\s*\(/g,
  ],
  property: [
    /(?:readonly\s+)?(\w+)\s*[?!]?\s*:/g,
  ],
  enum: [
    /(?:export\s+)?(?:const\s+)?enum\s+(\w+)/g,
  ],
};

/**
 * Semantic search engine that finds code symbols by pattern matching.
 */
export class SemanticSearchEngine {
  private options: SemanticSearchOptions;

  constructor(options: Partial<SemanticSearchOptions> = {}) {
    this.options = { ...DEFAULT_SEMANTIC_SEARCH_OPTIONS, ...options };
  }

  /**
   * Search for symbols matching the query across multiple files.
   */
  search(
    query: string,
    files: Array<{ filePath: string; content: string; language?: string }>
  ): SemanticMatch[] {
    const results: SemanticMatch[] = [];
    const queryLower = query.toLowerCase();

    for (const file of files) {
      if (this.options.languages.length > 0 && file.language) {
        if (!this.options.languages.includes(file.language)) continue;
      }

      const fileMatches = this.searchInFile(queryLower, file.filePath, file.content);
      results.push(...fileMatches);

      if (results.length >= this.options.maxResults) break;
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, this.options.maxResults);
  }

  /**
   * Extract all symbols from a single file without filtering by query.
   */
  extractSymbols(filePath: string, content: string): SemanticMatch[] {
    const symbols: SemanticMatch[] = [];
    const lines = content.split("\n");

    for (const kind of this.options.symbolKinds) {
      const patterns = SYMBOL_PATTERNS[kind];
      if (!patterns) continue;

      for (const pattern of patterns) {
        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
          const line = lines[lineIdx];
          const regex = new RegExp(pattern.source, pattern.flags);
          let match: RegExpExecArray | null;

          while ((match = regex.exec(line)) !== null) {
            const name = this.extractName(match);
            if (name && name.length > 1) {
              symbols.push({
                kind,
                name,
                filePath,
                line: lineIdx,
                column: match.index,
                lineText: line.trim(),
                score: 1.0,
                context: null,
              });
            }
            if (match[0].length === 0) regex.lastIndex++;
          }
        }
      }
    }

    return this.deduplicateMatches(symbols);
  }

  /**
   * Find all usages (references) of a symbol name in the given files.
   */
  findReferences(
    symbolName: string,
    files: Array<{ filePath: string; content: string }>
  ): SemanticMatch[] {
    const results: SemanticMatch[] = [];
    const regex = new RegExp(`\\b${escapeRegex(symbolName)}\\b`, "g");

    for (const file of files) {
      const lines = file.content.split("\n");
      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        let match: RegExpExecArray | null;
        regex.lastIndex = 0;

        while ((match = regex.exec(line)) !== null) {
          results.push({
            kind: "variable",
            name: symbolName,
            filePath: file.filePath,
            line: lineIdx,
            column: match.index,
            lineText: line.trim(),
            score: 0.5,
            context: null,
          });
        }
      }
    }

    return results.slice(0, this.options.maxResults);
  }

  /**
   * Search for symbols in a single file matching the query.
   */
  private searchInFile(queryLower: string, filePath: string, content: string): SemanticMatch[] {
    const symbols = this.extractSymbols(filePath, content);
    return symbols
      .filter((s) => s.name.toLowerCase().includes(queryLower))
      .map((s) => ({
        ...s,
        score: this.calculateScore(queryLower, s.name.toLowerCase()),
      }));
  }

  /**
   * Calculate relevance score for a symbol name match.
   */
  private calculateScore(query: string, name: string): number {
    if (name === query) return 10;
    if (name.startsWith(query)) return 8;
    if (name.endsWith(query)) return 6;
    if (name.includes(query)) return 4;
    return 1;
  }

  /**
   * Extract the symbol name from a regex match (first non-null capture group).
   */
  private extractName(match: RegExpExecArray): string | null {
    for (let i = 1; i < match.length; i++) {
      if (match[i]) return match[i].trim();
    }
    return null;
  }

  /**
   * Remove duplicate matches at the same location.
   */
  private deduplicateMatches(matches: SemanticMatch[]): SemanticMatch[] {
    const seen = new Set<string>();
    return matches.filter((m) => {
      const key = `${m.filePath}:${m.line}:${m.column}:${m.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

/**
 * Escape regex special characters for literal matching.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
