import { LogLevel, LOG_LEVEL_VALUES } from "./levels.js";
import { type LogFormatter, defaultFormatter } from "./formatters.js";
import { type LogTransport, consoleTransport } from "./transports.js";

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
export class Logger {
  private readonly _level: LogLevel;
  private readonly _prefix?: string;
  private readonly _formatter: LogFormatter;
  private readonly _transports: LogTransport[];

  constructor(options: LoggerOptions = {}) {
    this._level = options.level ?? "info";
    this._prefix = options.prefix;
    this._formatter = options.formatter ?? defaultFormatter;
    this._transports = options.transports ?? [consoleTransport()];
  }

  /**
   * Log a debug-level message.
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this._log("debug", message, data);
  }

  /**
   * Log an info-level message.
   */
  info(message: string, data?: Record<string, unknown>): void {
    this._log("info", message, data);
  }

  /**
   * Log a warning-level message.
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this._log("warn", message, data);
  }

  /**
   * Log an error-level message.
   */
  error(message: string, data?: Record<string, unknown>): void {
    this._log("error", message, data);
  }

  /**
   * Log a fatal-level message.
   */
  fatal(message: string, data?: Record<string, unknown>): void {
    this._log("fatal", message, data);
  }

  /**
   * Create a child logger with an additional prefix.
   */
  child(prefix: string): Logger {
    const fullPrefix = this._prefix ? `${this._prefix}:${prefix}` : prefix;
    return new Logger({
      level: this._level,
      prefix: fullPrefix,
      formatter: this._formatter,
      transports: this._transports,
    });
  }

  /**
   * Internal log method that checks level and dispatches to transports.
   */
  private _log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    if (LOG_LEVEL_VALUES[level] < LOG_LEVEL_VALUES[this._level]) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      data,
      prefix: this._prefix,
    };

    const formatted = this._formatter(entry);
    for (const transport of this._transports) {
      transport.write(formatted, entry);
    }
  }
}

/**
 * Create a new Logger instance with the given options.
 *
 * @param options - Logger configuration.
 * @returns A new Logger instance.
 */
export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options);
}
