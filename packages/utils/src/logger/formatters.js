"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compactFormatter = exports.jsonFormatter = exports.defaultFormatter = void 0;
exports.createTemplateFormatter = createTemplateFormatter;
/**
 * Pad a number with a leading zero if needed.
 */
function pad2(n) {
    return n.toString().padStart(2, "0");
}
/**
 * Format a timestamp as "YYYY-MM-DD HH:mm:ss.SSS".
 */
function formatTimestamp(date) {
    const y = date.getFullYear();
    const mo = pad2(date.getMonth() + 1);
    const d = pad2(date.getDate());
    const h = pad2(date.getHours());
    const mi = pad2(date.getMinutes());
    const s = pad2(date.getSeconds());
    const ms = date.getMilliseconds().toString().padStart(3, "0");
    return `${y}-${mo}-${d} ${h}:${mi}:${s}.${ms}`;
}
/**
 * The default log formatter.
 * Outputs: "[TIMESTAMP] LEVEL [prefix] message {data}"
 *
 * @param entry - The log entry to format.
 * @returns The formatted log string.
 *
 * @example
 * ```
 * [2024-01-15 09:30:00.123] INFO [app] Server started {"port":3000}
 * ```
 */
const defaultFormatter = (entry) => {
    const ts = formatTimestamp(entry.timestamp);
    const level = entry.level.toUpperCase().padEnd(5);
    const prefix = entry.prefix ? ` [${entry.prefix}]` : "";
    const data = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
    return `[${ts}] ${level}${prefix} ${entry.message}${data}`;
};
exports.defaultFormatter = defaultFormatter;
/**
 * A JSON log formatter that outputs each entry as a JSON string.
 * Useful for structured log aggregation systems.
 *
 * @param entry - The log entry to format.
 * @returns A JSON string representation.
 */
const jsonFormatter = (entry) => {
    return JSON.stringify({
        timestamp: entry.timestamp.toISOString(),
        level: entry.level,
        prefix: entry.prefix,
        message: entry.message,
        data: entry.data,
    });
};
exports.jsonFormatter = jsonFormatter;
/**
 * A compact log formatter that outputs minimal information.
 *
 * @param entry - The log entry to format.
 * @returns A compact log string.
 */
const compactFormatter = (entry) => {
    const level = entry.level.charAt(0).toUpperCase();
    const prefix = entry.prefix ? `${entry.prefix}: ` : "";
    return `${level} ${prefix}${entry.message}`;
};
exports.compactFormatter = compactFormatter;
/**
 * Create a custom formatter with a template string.
 * Supported placeholders: {timestamp}, {level}, {prefix}, {message}, {data}.
 *
 * @param template - The format template.
 * @returns A LogFormatter function.
 *
 * @example
 * ```ts
 * const fmt = createTemplateFormatter("{level} - {message}");
 * ```
 */
function createTemplateFormatter(template) {
    return (entry) => {
        return template
            .replace("{timestamp}", formatTimestamp(entry.timestamp))
            .replace("{level}", entry.level.toUpperCase())
            .replace("{prefix}", entry.prefix ?? "")
            .replace("{message}", entry.message)
            .replace("{data}", entry.data ? JSON.stringify(entry.data) : "");
    };
}
//# sourceMappingURL=formatters.js.map