/**
 * Snippet manager for the editor.
 * Registers, retrieves, and inserts code snippets with tab stop support.
 */

import type { SnippetParseResult } from "./snippet-parser.js";
import { parseSnippet } from "./snippet-parser.js";

/**
 * A registered code snippet.
 */
export interface Snippet {
  /** Unique snippet identifier. */
  id: string;
  /** Trigger prefix (what the user types to activate). */
  prefix: string;
  /** Human-readable snippet name. */
  name: string;
  /** Description of the snippet. */
  description: string;
  /** Language(s) this snippet applies to. */
  languages: string[];
  /** The raw snippet body with tab stops and placeholders. */
  body: string;
  /** Whether this is a built-in snippet. */
  isBuiltIn: boolean;
}

/**
 * The result of inserting a snippet into the editor.
 */
export interface SnippetInsertionResult {
  /** The expanded text to insert. */
  text: string;
  /** Tab stop positions for navigation. */
  tabStops: Array<{ index: number; line: number; column: number; placeholder: string }>;
  /** Final cursor position after all tab stops are visited. */
  finalCursorLine: number;
  /** Final cursor column. */
  finalCursorColumn: number;
}

/**
 * Variables available during snippet expansion.
 */
export interface SnippetVariables {
  /** Current file name. */
  TM_FILENAME: string;
  /** Current file name without extension. */
  TM_FILENAME_BASE: string;
  /** Current file path. */
  TM_FILEPATH: string;
  /** Directory of the current file. */
  TM_DIRECTORY: string;
  /** Current line text. */
  TM_CURRENT_LINE: string;
  /** Currently selected text. */
  TM_SELECTED_TEXT: string;
  /** Current line number (1-based). */
  TM_LINE_NUMBER: string;
  /** Current year. */
  CURRENT_YEAR: string;
  /** Current month (2-digit). */
  CURRENT_MONTH: string;
  /** Current day (2-digit). */
  CURRENT_DATE: string;
  /** Clipboard content. */
  CLIPBOARD: string;
  [key: string]: string;
}

/**
 * Built-in snippets for common languages.
 */
const BUILT_IN_SNIPPETS: Snippet[] = [
  {
    id: "ts-function",
    prefix: "fn",
    name: "Function Declaration",
    description: "Insert a typed function declaration",
    languages: ["typescript", "javascript"],
    body: "function ${1:name}(${2:params}): ${3:void} {\n\t$0\n}",
    isBuiltIn: true,
  },
  {
    id: "ts-arrow",
    prefix: "af",
    name: "Arrow Function",
    description: "Insert an arrow function expression",
    languages: ["typescript", "javascript"],
    body: "const ${1:name} = (${2:params})${3: => ${4:void}} => {\n\t$0\n};",
    isBuiltIn: true,
  },
  {
    id: "ts-interface",
    prefix: "int",
    name: "Interface",
    description: "Insert a TypeScript interface",
    languages: ["typescript"],
    body: "interface ${1:Name} {\n\t${2:property}: ${3:type};\n\t$0\n}",
    isBuiltIn: true,
  },
  {
    id: "ts-class",
    prefix: "cls",
    name: "Class",
    description: "Insert a TypeScript class",
    languages: ["typescript"],
    body: "class ${1:Name} {\n\tconstructor(${2:params}) {\n\t\t$0\n\t}\n}",
    isBuiltIn: true,
  },
  {
    id: "ts-trycatch",
    prefix: "try",
    name: "Try-Catch",
    description: "Insert a try-catch block",
    languages: ["typescript", "javascript"],
    body: "try {\n\t${1:// code}\n} catch (${2:error}) {\n\t${3:console.error($2);}\n\t$0\n}",
    isBuiltIn: true,
  },
  {
    id: "ts-import",
    prefix: "imp",
    name: "Import Statement",
    description: "Insert an ES module import",
    languages: ["typescript", "javascript"],
    body: "import { ${2:module} } from \"${1:package}\";$0",
    isBuiltIn: true,
  },
];

/**
 * Manages code snippets: registration, lookup, and expansion.
 */
export class SnippetManager {
  private snippets = new Map<string, Snippet>();

  constructor(loadBuiltIn: boolean = true) {
    if (loadBuiltIn) {
      for (const snippet of BUILT_IN_SNIPPETS) {
        this.snippets.set(snippet.id, snippet);
      }
    }
  }

  /**
   * Register a new snippet.
   */
  register(snippet: Snippet): void {
    this.snippets.set(snippet.id, snippet);
  }

  /**
   * Remove a snippet by its identifier.
   * Built-in snippets cannot be removed.
   */
  remove(snippetId: string): boolean {
    const snippet = this.snippets.get(snippetId);
    if (!snippet || snippet.isBuiltIn) return false;
    return this.snippets.delete(snippetId);
  }

  /**
   * Get a snippet by its identifier.
   */
  get(snippetId: string): Snippet | null {
    return this.snippets.get(snippetId) ?? null;
  }

  /**
   * Get all snippets for a specific language.
   */
  getForLanguage(language: string): Snippet[] {
    return Array.from(this.snippets.values()).filter((s) =>
      s.languages.includes(language)
    );
  }

  /**
   * Find snippets that match a typed prefix.
   */
  matchPrefix(prefix: string, language: string): Snippet[] {
    return this.getForLanguage(language).filter(
      (s) => s.prefix.startsWith(prefix) || prefix.startsWith(s.prefix)
    );
  }

  /**
   * Expand a snippet body using the given variables.
   * Returns the insertion result with expanded text and tab stop positions.
   */
  expandSnippet(snippetId: string, variables: Partial<SnippetVariables> = {}): SnippetInsertionResult | null {
    const snippet = this.snippets.get(snippetId);
    if (!snippet) return null;

    return this.expand(snippet.body, variables);
  }

  /**
   * Expand a raw snippet body string.
   */
  expand(body: string, variables: Partial<SnippetVariables> = {}): SnippetInsertionResult {
    const parsed = parseSnippet(body);
    const text = this.resolveVariables(parsed, variables);
    const tabStops = this.extractTabStops(text);
    const finalPos = this.findFinalPosition(text);

    return {
      text: this.cleanTabStops(text),
      tabStops,
      finalCursorLine: finalPos.line,
      finalCursorColumn: finalPos.column,
    };
  }

  /**
   * Get all registered snippets.
   */
  getAll(): Snippet[] {
    return Array.from(this.snippets.values());
  }

  /**
   * Get the total number of registered snippets.
   */
  get count(): number {
    return this.snippets.size;
  }

  /**
   * Resolve variables in parsed snippet content.
   */
  private resolveVariables(
    parsed: SnippetParseResult,
    variables: Partial<SnippetVariables>
  ): string {
    let result = parsed.text;
    for (const variable of parsed.variables) {
      const value = variables[variable.name] ?? variable.defaultValue ?? "";
      result = result.replace(variable.raw, value);
    }
    return result;
  }

  /**
   * Extract tab stop positions from expanded snippet text.
   */
  private extractTabStops(
    text: string
  ): Array<{ index: number; line: number; column: number; placeholder: string }> {
    const stops: Array<{ index: number; line: number; column: number; placeholder: string }> = [];
    const tabStopRegex = /\$(\d+)|\$\{(\d+)(?::([^}]*))?\}/g;
    const lines = text.split("\n");

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      let match: RegExpExecArray | null;
      const regex = new RegExp(tabStopRegex.source, tabStopRegex.flags);

      while ((match = regex.exec(line)) !== null) {
        const index = parseInt(match[1] ?? match[2], 10);
        if (index === 0) continue; // $0 is final cursor, not a tab stop
        stops.push({
          index,
          line: lineIdx,
          column: match.index,
          placeholder: match[3] ?? "",
        });
      }
    }

    return stops.sort((a, b) => a.index - b.index);
  }

  /**
   * Find the final cursor position ($0) in the snippet text.
   */
  private findFinalPosition(text: string): { line: number; column: number } {
    const lines = text.split("\n");
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const col = lines[lineIdx].indexOf("$0");
      if (col !== -1) {
        return { line: lineIdx, column: col };
      }
    }
    const lastLine = lines.length - 1;
    return { line: lastLine, column: lines[lastLine].length };
  }

  /**
   * Remove tab stop markers from the final text.
   */
  private cleanTabStops(text: string): string {
    return text
      .replace(/\$\{(\d+)(?::([^}]*))?\}/g, "$2")
      .replace(/\$(\d+)/g, "");
  }
}
