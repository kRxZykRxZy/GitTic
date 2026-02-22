import type { LogEntry } from "./logger.js";
/**
 * A log formatter takes a LogEntry and returns a formatted string.
 */
export type LogFormatter = (entry: LogEntry) => string;
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
export declare const defaultFormatter: LogFormatter;
/**
 * A JSON log formatter that outputs each entry as a JSON string.
 * Useful for structured log aggregation systems.
 *
 * @param entry - The log entry to format.
 * @returns A JSON string representation.
 */
export declare const jsonFormatter: LogFormatter;
/**
 * A compact log formatter that outputs minimal information.
 *
 * @param entry - The log entry to format.
 * @returns A compact log string.
 */
export declare const compactFormatter: LogFormatter;
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
export declare function createTemplateFormatter(template: string): LogFormatter;
//# sourceMappingURL=formatters.d.ts.map