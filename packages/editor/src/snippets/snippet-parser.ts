/**
 * Snippet body parser for the editor snippet system.
 * Parses tab stops ($1, $2), placeholders (${1:default}),
 * variables (${TM_FILENAME}), and nested placeholders.
 */

/**
 * Types of tokens found in a snippet body.
 */
export type SnippetTokenType = "text" | "tabstop" | "placeholder" | "variable" | "choice";

/**
 * A parsed token from a snippet body string.
 */
export interface SnippetToken {
  /** Type of this token. */
  type: SnippetTokenType;
  /** Raw text of the token as it appeared in the snippet body. */
  raw: string;
  /** Resolved text value (placeholder default, variable name, etc.). */
  value: string;
  /** Tab stop index for tabstop/placeholder tokens. */
  index?: number;
  /** Variable name for variable tokens. */
  variableName?: string;
  /** Start position in the original snippet body. */
  start: number;
  /** End position in the original snippet body. */
  end: number;
}

/**
 * A parsed variable reference in a snippet.
 */
export interface SnippetVariable {
  /** Variable name (e.g., "TM_FILENAME"). */
  name: string;
  /** Default value if the variable is not set. */
  defaultValue: string;
  /** Raw text to replace in the snippet body. */
  raw: string;
}

/**
 * Complete result of parsing a snippet body.
 */
export interface SnippetParseResult {
  /** The full snippet text with unresolved markers. */
  text: string;
  /** Ordered list of parsed tokens. */
  tokens: SnippetToken[];
  /** Tab stop indices found in the snippet. */
  tabStopIndices: number[];
  /** Variable references found in the snippet. */
  variables: SnippetVariable[];
  /** Whether the snippet has a final cursor marker ($0). */
  hasFinalCursor: boolean;
}

/**
 * Parse a snippet body string into structured tokens.
 * Handles the following syntax:
 *   $1, $2, ...      — simple tab stops
 *   ${1:default}     — tab stops with default placeholders
 *   ${TM_FILENAME}   — variable references
 *   ${1|one,two|}    — choice tab stops
 *   $0               — final cursor position
 */
export function parseSnippet(body: string): SnippetParseResult {
  const tokens: SnippetToken[] = [];
  const variables: SnippetVariable[] = [];
  const tabStopIndices = new Set<number>();
  let hasFinalCursor = false;

  let pos = 0;
  let textStart = 0;

  while (pos < body.length) {
    if (body[pos] === "$") {
      // Capture preceding text
      if (pos > textStart) {
        tokens.push({
          type: "text",
          raw: body.substring(textStart, pos),
          value: body.substring(textStart, pos),
          start: textStart,
          end: pos,
        });
      }

      if (pos + 1 < body.length && body[pos + 1] === "{") {
        const result = parseBraceExpression(body, pos);
        tokens.push(result.token);

        if (result.token.type === "variable" && result.token.variableName) {
          variables.push({
            name: result.token.variableName,
            defaultValue: result.token.value,
            raw: result.token.raw,
          });
        }

        if (result.token.index !== undefined) {
          if (result.token.index === 0) {
            hasFinalCursor = true;
          } else {
            tabStopIndices.add(result.token.index);
          }
        }

        pos = result.end;
        textStart = pos;
      } else if (pos + 1 < body.length && isDigit(body[pos + 1])) {
        const result = parseSimpleTabStop(body, pos);
        tokens.push(result.token);

        if (result.token.index === 0) {
          hasFinalCursor = true;
        } else if (result.token.index !== undefined) {
          tabStopIndices.add(result.token.index);
        }

        pos = result.end;
        textStart = pos;
      } else {
        pos++;
      }
    } else if (body[pos] === "\\" && pos + 1 < body.length) {
      // Escaped character
      pos += 2;
    } else {
      pos++;
    }
  }

  // Capture trailing text
  if (pos > textStart) {
    tokens.push({
      type: "text",
      raw: body.substring(textStart, pos),
      value: body.substring(textStart, pos),
      start: textStart,
      end: pos,
    });
  }

  return {
    text: body,
    tokens,
    tabStopIndices: Array.from(tabStopIndices).sort((a, b) => a - b),
    variables,
    hasFinalCursor,
  };
}

/**
 * Parse a simple tab stop like $1, $2, $0.
 */
function parseSimpleTabStop(body: string, start: number): { token: SnippetToken; end: number } {
  let pos = start + 1; // skip $
  let numStr = "";

  while (pos < body.length && isDigit(body[pos])) {
    numStr += body[pos];
    pos++;
  }

  const index = parseInt(numStr, 10);
  return {
    token: {
      type: "tabstop",
      raw: body.substring(start, pos),
      value: "",
      index,
      start,
      end: pos,
    },
    end: pos,
  };
}

/**
 * Parse a brace expression like ${1:default}, ${TM_FILENAME}, or ${1|a,b,c|}.
 */
function parseBraceExpression(body: string, start: number): { token: SnippetToken; end: number } {
  let pos = start + 2; // skip ${
  let content = "";
  let depth = 1;

  while (pos < body.length && depth > 0) {
    if (body[pos] === "{") depth++;
    else if (body[pos] === "}") depth--;

    if (depth > 0) {
      content += body[pos];
    }
    pos++;
  }

  const raw = body.substring(start, pos);

  // Check if it's a variable (starts with letter or underscore)
  if (content.length > 0 && (isLetter(content[0]) || content[0] === "_")) {
    const colonIdx = content.indexOf(":");
    if (colonIdx !== -1) {
      const varName = content.substring(0, colonIdx);
      const defaultVal = content.substring(colonIdx + 1);
      return {
        token: {
          type: "variable",
          raw,
          value: defaultVal,
          variableName: varName,
          start,
          end: pos,
        },
        end: pos,
      };
    }
    return {
      token: {
        type: "variable",
        raw,
        value: "",
        variableName: content,
        start,
        end: pos,
      },
      end: pos,
    };
  }

  // Check for choice syntax: ${1|one,two,three|}
  const pipeIdx = content.indexOf("|");
  if (pipeIdx !== -1) {
    const indexStr = content.substring(0, pipeIdx);
    const choicesStr = content.substring(pipeIdx + 1, content.lastIndexOf("|"));
    const index = parseInt(indexStr, 10);
    return {
      token: {
        type: "choice",
        raw,
        value: choicesStr,
        index: isNaN(index) ? undefined : index,
        start,
        end: pos,
      },
      end: pos,
    };
  }

  // Tab stop with placeholder: ${1:default}
  const colonIdx = content.indexOf(":");
  if (colonIdx !== -1) {
    const indexStr = content.substring(0, colonIdx);
    const placeholder = content.substring(colonIdx + 1);
    const index = parseInt(indexStr, 10);
    return {
      token: {
        type: "placeholder",
        raw,
        value: placeholder,
        index: isNaN(index) ? undefined : index,
        start,
        end: pos,
      },
      end: pos,
    };
  }

  // Simple numbered tab stop: ${1}
  const index = parseInt(content, 10);
  return {
    token: {
      type: "tabstop",
      raw,
      value: "",
      index: isNaN(index) ? undefined : index,
      start,
      end: pos,
    },
    end: pos,
  };
}

/**
 * Check if a character is a digit.
 */
function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

/**
 * Check if a character is a letter.
 */
function isLetter(ch: string): boolean {
  return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z");
}

/**
 * Validate that a snippet body is syntactically correct.
 */
export function validateSnippet(body: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  let braceDepth = 0;
  for (let i = 0; i < body.length; i++) {
    if (body[i] === "$" && i + 1 < body.length && body[i + 1] === "{") {
      braceDepth++;
      i++;
    } else if (body[i] === "}" && braceDepth > 0) {
      braceDepth--;
    }
  }

  if (braceDepth !== 0) {
    errors.push("Unmatched braces in snippet body");
  }

  const parsed = parseSnippet(body);
  if (parsed.tabStopIndices.length > 0) {
    const max = Math.max(...parsed.tabStopIndices);
    for (let i = 1; i <= max; i++) {
      if (!parsed.tabStopIndices.includes(i)) {
        errors.push(`Missing tab stop $${i} (tab stops should be sequential)`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
