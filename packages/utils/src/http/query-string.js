"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseQueryString = parseQueryString;
exports.buildQueryString = buildQueryString;
exports.mergeQueryStrings = mergeQueryStrings;
/**
 * Parse a URL query string into a key-value record.
 * Handles repeated keys by storing them as arrays.
 *
 * @param queryString - The query string (with or without leading "?").
 * @returns A record mapping parameter names to values or arrays of values.
 *
 * @example
 * ```ts
 * parseQueryString("?page=1&sort=name&tag=a&tag=b");
 * // => { page: "1", sort: "name", tag: ["a", "b"] }
 * ```
 */
function parseQueryString(queryString) {
    const result = {};
    const cleaned = queryString.startsWith("?")
        ? queryString.slice(1)
        : queryString;
    if (!cleaned) {
        return result;
    }
    const pairs = cleaned.split("&");
    for (const pair of pairs) {
        const eqIndex = pair.indexOf("=");
        const key = eqIndex === -1
            ? decodeURIComponent(pair)
            : decodeURIComponent(pair.slice(0, eqIndex));
        const value = eqIndex === -1 ? "" : decodeURIComponent(pair.slice(eqIndex + 1));
        const existing = result[key];
        if (existing === undefined) {
            result[key] = value;
        }
        else if (Array.isArray(existing)) {
            existing.push(value);
        }
        else {
            result[key] = [existing, value];
        }
    }
    return result;
}
/**
 * Build a URL query string from a key-value record.
 *
 * @param params - The parameters to encode.
 * @param options - Optional configuration.
 * @returns The encoded query string (without leading "?").
 *
 * @example
 * ```ts
 * buildQueryString({ page: "1", sort: "name", tags: ["a", "b"] });
 * // => "page=1&sort=name&tags=a&tags=b"
 * ```
 */
function buildQueryString(params, options = {}) {
    const { skipNullish = true } = options;
    const parts = [];
    for (const [key, value] of Object.entries(params)) {
        if (skipNullish && value === undefined) {
            continue;
        }
        if (Array.isArray(value)) {
            for (const v of value) {
                parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
            }
        }
        else {
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }
    }
    return parts.join("&");
}
/**
 * Merge additional query parameters into an existing query string.
 *
 * @param existing - The existing query string.
 * @param additional - Additional parameters to merge.
 * @returns The merged query string.
 */
function mergeQueryStrings(existing, additional) {
    const parsed = parseQueryString(existing);
    for (const [key, value] of Object.entries(additional)) {
        parsed[key] = value;
    }
    const parts = [];
    for (const [key, value] of Object.entries(parsed)) {
        if (Array.isArray(value)) {
            for (const v of value) {
                parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
            }
        }
        else {
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        }
    }
    return parts.join("&");
}
//# sourceMappingURL=query-string.js.map