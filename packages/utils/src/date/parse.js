"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDate = parseDate;
exports.parseDateOnly = parseDateOnly;
exports.parseUSDate = parseUSDate;
exports.parseUnixTimestamp = parseUnixTimestamp;
exports.parseFlexible = parseFlexible;
exports.isValidISODate = isValidISODate;
/**
 * Parse a date string into a Date object, returning a structured result.
 *
 * @param input - The date string to parse.
 * @returns A ParsedDate result with the date and validity status.
 *
 * @example
 * ```ts
 * const result = parseDate("2024-01-15");
 * // result.valid === true
 * // result.date => Mon Jan 15 2024
 * ```
 */
function parseDate(input) {
    const date = new Date(input);
    const valid = !isNaN(date.getTime());
    return { date, valid, input };
}
/**
 * Parse a date string in "YYYY-MM-DD" format.
 *
 * @param input - The date string (e.g., "2024-01-15").
 * @returns A ParsedDate result.
 */
function parseDateOnly(input) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
    if (!match) {
        return { date: new Date(NaN), valid: false, input };
    }
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const date = new Date(year, month, day);
    const valid = date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day;
    return { date, valid, input };
}
/**
 * Parse a date string in "MM/DD/YYYY" format (US format).
 *
 * @param input - The date string (e.g., "01/15/2024").
 * @returns A ParsedDate result.
 */
function parseUSDate(input) {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(input);
    if (!match) {
        return { date: new Date(NaN), valid: false, input };
    }
    const month = parseInt(match[1], 10) - 1;
    const day = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    const date = new Date(year, month, day);
    const valid = date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day;
    return { date, valid, input };
}
/**
 * Parse a Unix timestamp (seconds) into a Date object.
 *
 * @param timestamp - The Unix timestamp in seconds.
 * @returns A Date object.
 */
function parseUnixTimestamp(timestamp) {
    return new Date(timestamp * 1000);
}
/**
 * Try to parse a date from multiple formats, returning the first
 * valid result.
 *
 * @param input - The date string to parse.
 * @returns A ParsedDate result from the first successful parser,
 *   or an invalid result if none matched.
 */
function parseFlexible(input) {
    const parsers = [parseDateOnly, parseUSDate, parseDate];
    for (const parser of parsers) {
        const result = parser(input);
        if (result.valid) {
            return result;
        }
    }
    return { date: new Date(NaN), valid: false, input };
}
/**
 * Check if a string is a valid ISO 8601 date.
 *
 * @param input - The string to check.
 * @returns `true` if the string is a valid ISO date.
 */
function isValidISODate(input) {
    const isoPattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?Z?)?$/;
    if (!isoPattern.test(input)) {
        return false;
    }
    const date = new Date(input);
    return !isNaN(date.getTime());
}
//# sourceMappingURL=parse.js.map