"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG_LEVELS = exports.LOG_LEVEL_VALUES = void 0;
exports.isLevelEnabled = isLevelEnabled;
exports.parseLogLevel = parseLogLevel;
exports.getLevelLabel = getLevelLabel;
exports.getEnabledLevels = getEnabledLevels;
/**
 * Numeric values for each log level, used for comparison.
 * Lower values are more verbose.
 */
exports.LOG_LEVEL_VALUES = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
};
/**
 * All available log levels as an ordered array (most verbose first).
 */
exports.LOG_LEVELS = [
    "debug",
    "info",
    "warn",
    "error",
    "fatal",
];
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
function isLevelEnabled(level, minLevel) {
    return exports.LOG_LEVEL_VALUES[level] >= exports.LOG_LEVEL_VALUES[minLevel];
}
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
function parseLogLevel(value, fallback = "info") {
    const lower = value.toLowerCase();
    if (lower in exports.LOG_LEVEL_VALUES) {
        return lower;
    }
    return fallback;
}
/**
 * Get the display label for a log level.
 *
 * @param level - The log level.
 * @returns The uppercase display label.
 */
function getLevelLabel(level) {
    return level.toUpperCase();
}
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
function getEnabledLevels(minLevel) {
    return exports.LOG_LEVELS.filter((level) => isLevelEnabled(level, minLevel));
}
//# sourceMappingURL=levels.js.map