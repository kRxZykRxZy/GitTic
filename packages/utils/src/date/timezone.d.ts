/**
 * Get the UTC offset in minutes for a named timezone abbreviation.
 *
 * @param timezone - The timezone abbreviation (e.g., "EST", "PST").
 * @returns The offset in minutes from UTC, or undefined if not found.
 *
 * @example
 * ```ts
 * getTimezoneOffset("EST"); // => -300
 * getTimezoneOffset("JST"); // => 540
 * ```
 */
export declare function getTimezoneOffset(timezone: string): number | undefined;
/**
 * Convert a Date to a different timezone by applying the specified offset.
 * Returns a new Date object adjusted to the target timezone.
 *
 * @param date - The source date.
 * @param targetTimezone - The target timezone abbreviation.
 * @returns A new Date adjusted to the target timezone, or the
 *   original date if the timezone is not recognized.
 */
export declare function convertTimezone(date: Date, targetTimezone: string): Date;
/**
 * Format a UTC offset in minutes as a "+HH:MM" or "-HH:MM" string.
 *
 * @param offsetMinutes - The offset in minutes from UTC.
 * @returns The formatted offset string.
 *
 * @example
 * ```ts
 * formatOffset(-300); // => "-05:00"
 * formatOffset(330);  // => "+05:30"
 * ```
 */
export declare function formatOffset(offsetMinutes: number): string;
/**
 * Get all known timezone abbreviations.
 *
 * @returns An array of timezone abbreviation strings.
 */
export declare function getKnownTimezones(): string[];
/**
 * Check if a timezone abbreviation is known/supported.
 *
 * @param timezone - The timezone abbreviation to check.
 * @returns `true` if the timezone is recognized.
 */
export declare function isKnownTimezone(timezone: string): boolean;
/**
 * Get the current UTC date and time.
 *
 * @returns A Date object representing the current UTC time.
 */
export declare function nowUTC(): Date;
//# sourceMappingURL=timezone.d.ts.map