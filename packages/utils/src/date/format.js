"use strict";
/**
 * Supported date format tokens:
 * - YYYY: 4-digit year
 * - MM: 2-digit month (01-12)
 * - DD: 2-digit day (01-31)
 * - HH: 2-digit hours (00-23)
 * - mm: 2-digit minutes (00-59)
 * - ss: 2-digit seconds (00-59)
 * - SSS: 3-digit milliseconds (000-999)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = formatDate;
exports.toISOString = toISOString;
exports.formatLocale = formatLocale;
exports.toHttpDate = toHttpDate;
exports.toUnixTimestamp = toUnixTimestamp;
exports.fromUnixTimestamp = fromUnixTimestamp;
/**
 * Pad a number to the specified width with leading zeros.
 *
 * @param value - The number to pad.
 * @param width - The desired string width.
 * @returns The zero-padded string.
 */
function pad(value, width) {
    return value.toString().padStart(width, "0");
}
/**
 * Format a Date object into a string using a simple token-based pattern.
 *
 * @param date - The date to format.
 * @param pattern - The format pattern. Defaults to "YYYY-MM-DD HH:mm:ss".
 * @returns The formatted date string.
 *
 * @example
 * ```ts
 * formatDate(new Date(2024, 0, 15, 9, 30, 0));
 * // => "2024-01-15 09:30:00"
 *
 * formatDate(new Date(2024, 0, 15), "MM/DD/YYYY");
 * // => "01/15/2024"
 * ```
 */
function formatDate(date, pattern = "YYYY-MM-DD HH:mm:ss") {
    const tokens = {
        YYYY: pad(date.getFullYear(), 4),
        MM: pad(date.getMonth() + 1, 2),
        DD: pad(date.getDate(), 2),
        HH: pad(date.getHours(), 2),
        mm: pad(date.getMinutes(), 2),
        ss: pad(date.getSeconds(), 2),
        SSS: pad(date.getMilliseconds(), 3),
    };
    let result = pattern;
    for (const [token, value] of Object.entries(tokens)) {
        result = result.replace(token, value);
    }
    return result;
}
/**
 * Format a date as an ISO 8601 string (UTC).
 *
 * @param date - The date to format.
 * @returns The ISO 8601 string.
 */
function toISOString(date) {
    return date.toISOString();
}
/**
 * Format a date as a human-readable string using the default locale.
 *
 * @param date - The date to format.
 * @param locale - The locale string (e.g., "en-US"). Defaults to "en-US".
 * @param options - Intl.DateTimeFormat options.
 * @returns The formatted date string.
 */
function formatLocale(date, locale = "en-US", options = {
    year: "numeric",
    month: "long",
    day: "numeric",
}) {
    return new Intl.DateTimeFormat(locale, options).format(date);
}
/**
 * Format a date as an HTTP-date header value (RFC 7231).
 *
 * @param date - The date to format.
 * @returns The HTTP-date string (e.g., "Mon, 15 Jan 2024 09:30:00 GMT").
 */
function toHttpDate(date) {
    return date.toUTCString();
}
/**
 * Format a date as a Unix timestamp in seconds.
 *
 * @param date - The date to convert.
 * @returns The Unix timestamp (seconds since epoch).
 */
function toUnixTimestamp(date) {
    return Math.floor(date.getTime() / 1000);
}
/**
 * Create a Date from a Unix timestamp in seconds.
 *
 * @param timestamp - The Unix timestamp in seconds.
 * @returns A Date object.
 */
function fromUnixTimestamp(timestamp) {
    return new Date(timestamp * 1000);
}
//# sourceMappingURL=format.js.map