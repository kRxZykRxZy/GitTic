"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeHtml = sanitizeHtml;
exports.sanitizeShellArg = sanitizeShellArg;
exports.stripControlChars = stripControlChars;
/**
 * Sanitize user input to prevent XSS attacks.
 * Escapes HTML special characters.
 */
function sanitizeHtml(input) {
    const map = {
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
function sanitizeShellArg(input) {
    return input.replace(/[^a-zA-Z0-9._\-/]/g, "");
}
/**
 * Strip null bytes and control characters from input.
 */
function stripControlChars(input) {
    // eslint-disable-next-line no-control-regex
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}
//# sourceMappingURL=sanitize.js.map