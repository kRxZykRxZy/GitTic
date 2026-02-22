import { LogLevel } from "./levels.js";
import { type LogFormatter } from "./formatters.js";
import { type LogTransport } from "./transports.js";
/**
 * Configuration options for the Logger.
 */
export interface LoggerOptions {
    /** The minimum log level to output. Defaults to "info". */
    level?: LogLevel;
    /** A prefix to prepend to all log messages. */
    prefix?: string;
    /** The formatter to use for log entries. */
    formatter?: LogFormatter;
    /** The transports to write log entries to. */
    transports?: LogTransport[];
}
/**
 * A structured log entry.
 */
export interface LogEntry {
    /** The log level. */
    level: LogLevel;
    /** The log message. */
    message: string;
    /** Timestamp of the log entry. */
    timestamp: Date;
    /** Optional structured data. */
    data?: Record<string, unknown>;
    /** Optional prefix. */
    prefix?: string;
}
/**
 * A simple structured logger with support for levels, formatters,
 * and transports.
 *
 * @example
 * ```ts
 * const logger = new Logger({ level: "debug", prefix: "app" });
 * logger.info("Server started", { port: 3000 });
 * logger.error("Failed to connect", { error: "timeout" });
 * ```
 */
export declare class Logger {
    private readonly _level;
    private readonly _prefix?;
    private readonly _formatter;
    private readonly _transports;
    constructor(options?: LoggerOptions);
    /**
     * Log a debug-level message.
     */
    debug(message: string, data?: Record<string, unknown>): void;
    /**
     * Log an info-level message.
     */
    info(message: string, data?: Record<string, unknown>): void;
    /**
     * Log a warning-level message.
     */
    warn(message: string, data?: Record<string, unknown>): void;
    /**
     * Log an error-level message.
     */
    error(message: string, data?: Record<string, unknown>): void;
    /**
     * Log a fatal-level message.
     */
    fatal(message: string, data?: Record<string, unknown>): void;
    /**
     * Create a child logger with an additional prefix.
     */
    child(prefix: string): Logger;
    /**
     * Internal log method that checks level and dispatches to transports.
     */
    private _log;
}
/**
 * Create a new Logger instance with the given options.
 *
 * @param options - Logger configuration.
 * @returns A new Logger instance.
 */
export declare function createLogger(options?: LoggerOptions): Logger;
//# sourceMappingURL=logger.d.ts.map