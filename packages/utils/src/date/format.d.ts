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
export declare function formatDate(date: Date, pattern?: string): string;
/**
 * Format a date as an ISO 8601 string (UTC).
 *
 * @param date - The date to format.
 * @returns The ISO 8601 string.
 */
export declare function toISOString(date: Date): string;
/**
 * Format a date as a human-readable string using the default locale.
 *
 * @param date - The date to format.
 * @param locale - The locale string (e.g., "en-US"). Defaults to "en-US".
 * @param options - Intl.DateTimeFormat options.
 * @returns The formatted date string.
 */
export declare function formatLocale(date: Date, locale?: string, options?: Intl.DateTimeFormatOptions): string;
/**
 * Format a date as an HTTP-date header value (RFC 7231).
 *
 * @param date - The date to format.
 * @returns The HTTP-date string (e.g., "Mon, 15 Jan 2024 09:30:00 GMT").
 */
export declare function toHttpDate(date: Date): string;
/**
 * Format a date as a Unix timestamp in seconds.
 *
 * @param date - The date to convert.
 * @returns The Unix timestamp (seconds since epoch).
 */
export declare function toUnixTimestamp(date: Date): number;
/**
 * Create a Date from a Unix timestamp in seconds.
 *
 * @param timestamp - The Unix timestamp in seconds.
 * @returns A Date object.
 */
export declare function fromUnixTimestamp(timestamp: number): Date;
//# sourceMappingURL=format.d.ts.map