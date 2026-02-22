/**
 * Sanitize user input to prevent XSS attacks.
 * Escapes HTML special characters.
 */
export function sanitizeHtml(input: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  return input.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Sanitize a string for safe inclusion in shell commands.
 * Only allows alphanumeric, dash, underscore, dot.
 */
export function sanitizeShellArg(input: string): string {
  return input.replace(/[^a-zA-Z0-9._\-/]/g, "");
}

/**
 * Strip null bytes and control characters from input.
 */
export function stripControlChars(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}
