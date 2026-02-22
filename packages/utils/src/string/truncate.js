"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.truncate = truncate;
exports.truncateMiddle = truncateMiddle;
exports.truncatePath = truncatePath;
/**
 * Truncate a string to a maximum length, appending a suffix if truncated.
 *
 * @param input - The string to truncate.
 * @param options - Optional truncation configuration.
 * @returns The truncated string, or the original string if it is already
 *   within the maximum length.
 *
 * @example
 * ```ts
 * truncate("Hello, this is a long sentence.", { maxLength: 20 });
 * // => "Hello, this is a…"
 * ```
 */
function truncate(input, options = {}) {
    const { maxLength = 100, suffix = "…", wordBoundary = true } = options;
    if (input.length <= maxLength) {
        return input;
    }
    const cutoff = maxLength - suffix.length;
    if (cutoff <= 0) {
        return suffix.slice(0, maxLength);
    }
    let truncated = input.slice(0, cutoff);
    if (wordBoundary) {
        const lastSpace = truncated.lastIndexOf(" ");
        if (lastSpace > 0) {
            truncated = truncated.slice(0, lastSpace);
        }
    }
    return truncated.trimEnd() + suffix;
}
/**
 * Truncate a string from the middle, preserving the start and end.
 *
 * @param input - The string to truncate.
 * @param maxLength - Maximum total length. Defaults to 50.
 * @param separator - The string to insert in the middle. Defaults to "…".
 * @returns The truncated string.
 *
 * @example
 * ```ts
 * truncateMiddle("abcdefghij", 7);
 * // => "abc…hij"
 * ```
 */
function truncateMiddle(input, maxLength = 50, separator = "…") {
    if (input.length <= maxLength) {
        return input;
    }
    const available = maxLength - separator.length;
    if (available <= 0) {
        return separator.slice(0, maxLength);
    }
    const startLen = Math.ceil(available / 2);
    const endLen = Math.floor(available / 2);
    return input.slice(0, startLen) + separator + input.slice(input.length - endLen);
}
/**
 * Truncate a file path, preserving the filename and collapsing
 * intermediate directories.
 *
 * @param filePath - The path to truncate.
 * @param maxLength - Maximum length. Defaults to 40.
 * @returns The truncated path.
 *
 * @example
 * ```ts
 * truncatePath("/very/long/nested/path/to/file.ts", 25);
 * // => "/very/…/to/file.ts"
 * ```
 */
function truncatePath(filePath, maxLength = 40) {
    if (filePath.length <= maxLength) {
        return filePath;
    }
    const parts = filePath.split("/");
    if (parts.length <= 2) {
        return truncateMiddle(filePath, maxLength);
    }
    const first = parts[0];
    const last = parts[parts.length - 1];
    const base = `${first}/…/${last}`;
    if (base.length >= maxLength) {
        return truncateMiddle(filePath, maxLength);
    }
    return base;
}
//# sourceMappingURL=truncate.js.map