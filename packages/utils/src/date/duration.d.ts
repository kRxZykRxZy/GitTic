/**
 * A structured representation of a time duration.
 */
export interface Duration {
    /** Number of days. */
    days: number;
    /** Number of hours (0-23). */
    hours: number;
    /** Number of minutes (0-59). */
    minutes: number;
    /** Number of seconds (0-59). */
    seconds: number;
    /** Number of milliseconds (0-999). */
    milliseconds: number;
}
/**
 * Parse a duration in milliseconds into a structured Duration object.
 *
 * @param ms - The total duration in milliseconds.
 * @returns A Duration object with days, hours, minutes, seconds, and milliseconds.
 *
 * @example
 * ```ts
 * parseDuration(90061000);
 * // => { days: 1, hours: 1, minutes: 1, seconds: 1, milliseconds: 0 }
 * ```
 */
export declare function parseDuration(ms: number): Duration;
/**
 * Convert a Duration object to total milliseconds.
 *
 * @param duration - The duration to convert.
 * @returns The total duration in milliseconds.
 */
export declare function toMilliseconds(duration: Partial<Duration>): number;
/**
 * Format a duration in milliseconds as a human-readable string.
 *
 * @param ms - The total duration in milliseconds.
 * @param verbose - Whether to use verbose labels (e.g., "hours" vs "h").
 *   Defaults to false.
 * @returns A formatted duration string.
 *
 * @example
 * ```ts
 * formatDuration(3661000);       // => "1h 1m 1s"
 * formatDuration(3661000, true); // => "1 hour 1 minute 1 second"
 * ```
 */
export declare function formatDuration(ms: number, verbose?: boolean): string;
/**
 * Parse a shorthand duration string like "1d 2h 30m" into milliseconds.
 *
 * @param input - The shorthand duration string.
 * @returns The total duration in milliseconds.
 * @throws If the input format is invalid.
 *
 * @example
 * ```ts
 * parseShortDuration("2h 30m"); // => 9000000
 * parseShortDuration("1d");     // => 86400000
 * ```
 */
export declare function parseShortDuration(input: string): number;
//# sourceMappingURL=duration.d.ts.map