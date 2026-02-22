/**
 * Syntax highlighting color definitions for editor themes.
 * Defines token types and their color mappings across different themes.
 */

/**
 * Token types for syntax highlighting.
 */
export type TokenType =
  | "keyword"
  | "string"
  | "number"
  | "comment"
  | "operator"
  | "punctuation"
  | "function"
  | "variable"
  | "type"
  | "class"
  | "interface"
  | "enum"
  | "namespace"
  | "parameter"
  | "property"
  | "decorator"
  | "regexp"
  | "constant"
  | "builtin"
  | "tag"
  | "attribute"
  | "meta"
  | "invalid";

/**
 * Font style modifiers for a token.
 */
export interface TokenStyle {
  /** Whether to render in bold. */
  bold: boolean;
  /** Whether to render in italic. */
  italic: boolean;
  /** Whether to render with underline. */
  underline: boolean;
  /** Whether to render with strikethrough. */
  strikethrough: boolean;
}

/**
 * Complete color and style definition for a single token type.
 */
export interface TokenColorRule {
  /** Token type being styled. */
  tokenType: TokenType;
  /** Foreground color (hex). */
  foreground: string;
  /** Optional background color (hex). */
  background?: string;
  /** Font style modifiers. */
  style: TokenStyle;
}

/**
 * A complete syntax color scheme for a theme.
 */
export interface SyntaxColorScheme {
  /** Theme identifier this scheme belongs to. */
  themeId: string;
  /** Display name. */
  name: string;
  /** All token color rules in this scheme. */
  rules: TokenColorRule[];
}

/** Default font style (no modifiers). */
const PLAIN: TokenStyle = { bold: false, italic: false, underline: false, strikethrough: false };

/** Italic font style. */
const ITALIC: TokenStyle = { bold: false, italic: true, underline: false, strikethrough: false };

/** Bold font style. */
const BOLD: TokenStyle = { bold: true, italic: false, underline: false, strikethrough: false };

/**
 * Dark theme syntax color scheme.
 */
export const DARK_SYNTAX_COLORS: SyntaxColorScheme = {
  themeId: "dark-default",
  name: "Dark Syntax",
  rules: [
    { tokenType: "keyword", foreground: "#569cd6", style: PLAIN },
    { tokenType: "string", foreground: "#ce9178", style: PLAIN },
    { tokenType: "number", foreground: "#b5cea8", style: PLAIN },
    { tokenType: "comment", foreground: "#6a9955", style: ITALIC },
    { tokenType: "operator", foreground: "#d4d4d4", style: PLAIN },
    { tokenType: "punctuation", foreground: "#d4d4d4", style: PLAIN },
    { tokenType: "function", foreground: "#dcdcaa", style: PLAIN },
    { tokenType: "variable", foreground: "#9cdcfe", style: PLAIN },
    { tokenType: "type", foreground: "#4ec9b0", style: PLAIN },
    { tokenType: "class", foreground: "#4ec9b0", style: PLAIN },
    { tokenType: "interface", foreground: "#4ec9b0", style: ITALIC },
    { tokenType: "enum", foreground: "#4ec9b0", style: PLAIN },
    { tokenType: "namespace", foreground: "#4ec9b0", style: PLAIN },
    { tokenType: "parameter", foreground: "#9cdcfe", style: ITALIC },
    { tokenType: "property", foreground: "#9cdcfe", style: PLAIN },
    { tokenType: "decorator", foreground: "#dcdcaa", style: ITALIC },
    { tokenType: "regexp", foreground: "#d16969", style: PLAIN },
    { tokenType: "constant", foreground: "#4fc1ff", style: BOLD },
    { tokenType: "builtin", foreground: "#4ec9b0", style: PLAIN },
    { tokenType: "tag", foreground: "#569cd6", style: PLAIN },
    { tokenType: "attribute", foreground: "#9cdcfe", style: PLAIN },
    { tokenType: "meta", foreground: "#c586c0", style: PLAIN },
    { tokenType: "invalid", foreground: "#f44747", style: { bold: false, italic: false, underline: true, strikethrough: false } },
  ],
};

/**
 * Light theme syntax color scheme.
 */
export const LIGHT_SYNTAX_COLORS: SyntaxColorScheme = {
  themeId: "light-default",
  name: "Light Syntax",
  rules: [
    { tokenType: "keyword", foreground: "#0000ff", style: PLAIN },
    { tokenType: "string", foreground: "#a31515", style: PLAIN },
    { tokenType: "number", foreground: "#098658", style: PLAIN },
    { tokenType: "comment", foreground: "#008000", style: ITALIC },
    { tokenType: "operator", foreground: "#000000", style: PLAIN },
    { tokenType: "punctuation", foreground: "#000000", style: PLAIN },
    { tokenType: "function", foreground: "#795e26", style: PLAIN },
    { tokenType: "variable", foreground: "#001080", style: PLAIN },
    { tokenType: "type", foreground: "#267f99", style: PLAIN },
    { tokenType: "class", foreground: "#267f99", style: PLAIN },
    { tokenType: "interface", foreground: "#267f99", style: ITALIC },
    { tokenType: "enum", foreground: "#267f99", style: PLAIN },
    { tokenType: "namespace", foreground: "#267f99", style: PLAIN },
    { tokenType: "parameter", foreground: "#001080", style: ITALIC },
    { tokenType: "property", foreground: "#001080", style: PLAIN },
    { tokenType: "decorator", foreground: "#795e26", style: ITALIC },
    { tokenType: "regexp", foreground: "#811f3f", style: PLAIN },
    { tokenType: "constant", foreground: "#0070c1", style: BOLD },
    { tokenType: "builtin", foreground: "#267f99", style: PLAIN },
    { tokenType: "tag", foreground: "#800000", style: PLAIN },
    { tokenType: "attribute", foreground: "#ff0000", style: PLAIN },
    { tokenType: "meta", foreground: "#af00db", style: PLAIN },
    { tokenType: "invalid", foreground: "#cd3131", style: { bold: false, italic: false, underline: true, strikethrough: false } },
  ],
};

/**
 * Manages syntax color schemes and provides lookup utilities.
 */
export class SyntaxColorManager {
  private schemes = new Map<string, SyntaxColorScheme>();

  constructor() {
    this.registerScheme(DARK_SYNTAX_COLORS);
    this.registerScheme(LIGHT_SYNTAX_COLORS);
  }

  /**
   * Register a syntax color scheme.
   */
  registerScheme(scheme: SyntaxColorScheme): void {
    this.schemes.set(scheme.themeId, scheme);
  }

  /**
   * Get the color scheme for a specific theme.
   */
  getScheme(themeId: string): SyntaxColorScheme | null {
    return this.schemes.get(themeId) ?? null;
  }

  /**
   * Get the color rule for a specific token type in a theme.
   */
  getTokenColor(themeId: string, tokenType: TokenType): TokenColorRule | null {
    const scheme = this.schemes.get(themeId);
    if (!scheme) return null;
    return scheme.rules.find((r) => r.tokenType === tokenType) ?? null;
  }

  /**
   * Get all token colors for a theme as a lookup map.
   */
  getTokenColorMap(themeId: string): Map<TokenType, TokenColorRule> {
    const map = new Map<TokenType, TokenColorRule>();
    const scheme = this.schemes.get(themeId);
    if (scheme) {
      for (const rule of scheme.rules) {
        map.set(rule.tokenType, rule);
      }
    }
    return map;
  }

  /**
   * List all registered scheme identifiers.
   */
  listSchemeIds(): string[] {
    return Array.from(this.schemes.keys());
  }
}
