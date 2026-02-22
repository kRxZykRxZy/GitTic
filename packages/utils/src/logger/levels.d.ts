/**
 * Log levels ordered from most verbose to most critical.
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
/**
 * Numeric values for each log level, used for comparison.
 * Lower values are more verbose.
 */
export declare const LOG_LEVEL_VALUES: Readonly<Record<LogLevel, number>>;
/**
 * All available log levels as an ordered array (most verbose first).
 */
export declare const LOG_LEVELS: readonly LogLevel[];
/**
 * Check if a given log level meets or exceeds a minimum level threshold.
 *
 * @param level - The level to check.
 * @param minLevel - The minimum level threshold.
 * @returns `true` if `level` is at or above `minLevel`.
 *
 * @example
 * ```ts
 * isLevelEnabled("warn", "info");  // => true
 * isLevelEnabled("debug", "info"); // => false
 * ```
 */
export declare function isLevelEnabled(level: LogLevel, minLevel: LogLevel): boolean;
/**
 * Parse a string into a LogLevel, with validation.
 *
 * @param value - The string to parse.
 * @param fallback - The fallback level if parsing fails. Defaults to "info".
 * @returns The parsed LogLevel.
 *
 * @example
 * ```ts
 * parseLogLevel("debug");    // => "debug"
 * parseLogLevel("WARN");     // => "warn"
 * parseLogLevel("invalid");  // => "info"
 * ```
 */
export declare function parseLogLevel(value: string, fallback?: LogLevel): LogLevel;
/**
 * Get the display label for a log level.
 *
 * @param level - The log level.
 * @returns The uppercase display label.
 */
export declare function getLevelLabel(level: LogLevel): string;
/**
 * Get all log levels that are enabled for a given minimum level.
 *
 * @param minLevel - The minimum level threshold.
 * @returns An array of enabled log levels.
 *
 * @example
 * ```ts
 * getEnabledLevels("warn"); // => ["warn", "error", "fatal"]
 * ```
 */
export declare function getEnabledLevels(minLevel: LogLevel): LogLevel[];
//# sourceMappingURL=levels.d.ts.map