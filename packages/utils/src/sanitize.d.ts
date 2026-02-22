/**
 * Sanitize user input to prevent XSS attacks.
 * Escapes HTML special characters.
 */
export declare function sanitizeHtml(input: string): string;
/**
 * Sanitize a string for safe inclusion in shell commands.
 * Only allows alphanumeric, dash, underscore, dot.
 */
export declare function sanitizeShellArg(input: string): string;
/**
 * Strip null bytes and control characters from input.
 */
export declare function stripControlChars(input: string): string;
//# sourceMappingURL=sanitize.d.ts.map