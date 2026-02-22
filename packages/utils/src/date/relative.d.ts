/**
 * Options for relative time formatting.
 */
export interface RelativeTimeOptions {
    /** The reference date to compare against. Defaults to now. */
    now?: Date;
    /** Whether to include the "ago"/"in" suffix/prefix. Defaults to true. */
    addSuffix?: boolean;
    /** Maximum number of units to display. Defaults to 1. */
    maxUnits?: number;
}
/**
 * Format a date as a human-readable relative time string
 * (e.g., "3 hours ago", "in 2 days").
 *
 * @param date - The date to format.
 * @param options - Optional configuration.
 * @returns A human-readable relative time string.
 *
 * @example
 * ```ts
 * const past = new Date(Date.now() - 3600000);
 * relativeTime(past); // => "1 hour ago"
 *
 * const future = new Date(Date.now() + 86400000 * 3);
 * relativeTime(future); // => "in 3 days"
 * ```
 */
export declare function relativeTime(date: Date, options?: RelativeTimeOptions): string;
/**
 * Get the time difference between two dates as a structured object.
 *
 * @param from - The start date.
 * @param to - The end date.
 * @returns An object with the difference broken into units.
 */
export declare function dateDiff(from: Date, to: Date): {
    years: number;
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
};
//# sourceMappingURL=relative.d.ts.map