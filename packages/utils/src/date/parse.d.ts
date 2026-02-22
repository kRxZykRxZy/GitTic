/**
 * Result of a date parsing operation.
 */
export interface ParsedDate {
    /** The parsed Date object. */
    date: Date;
    /** Whether the parsing was successful and the date is valid. */
    valid: boolean;
    /** The original input string. */
    input: string;
}
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
export declare function parseDate(input: string): ParsedDate;
/**
 * Parse a date string in "YYYY-MM-DD" format.
 *
 * @param input - The date string (e.g., "2024-01-15").
 * @returns A ParsedDate result.
 */
export declare function parseDateOnly(input: string): ParsedDate;
/**
 * Parse a date string in "MM/DD/YYYY" format (US format).
 *
 * @param input - The date string (e.g., "01/15/2024").
 * @returns A ParsedDate result.
 */
export declare function parseUSDate(input: string): ParsedDate;
/**
 * Parse a Unix timestamp (seconds) into a Date object.
 *
 * @param timestamp - The Unix timestamp in seconds.
 * @returns A Date object.
 */
export declare function parseUnixTimestamp(timestamp: number): Date;
/**
 * Try to parse a date from multiple formats, returning the first
 * valid result.
 *
 * @param input - The date string to parse.
 * @returns A ParsedDate result from the first successful parser,
 *   or an invalid result if none matched.
 */
export declare function parseFlexible(input: string): ParsedDate;
/**
 * Check if a string is a valid ISO 8601 date.
 *
 * @param input - The string to check.
 * @returns `true` if the string is a valid ISO date.
 */
export declare function isValidISODate(input: string): boolean;
//# sourceMappingURL=parse.d.ts.map