"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
exports.createLogger = createLogger;
const levels_js_1 = require("./levels.js");
const formatters_js_1 = require("./formatters.js");
const transports_js_1 = require("./transports.js");
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
class Logger {
    _level;
    _prefix;
    _formatter;
    _transports;
    constructor(options = {}) {
        this._level = options.level ?? "info";
        this._prefix = options.prefix;
        this._formatter = options.formatter ?? formatters_js_1.defaultFormatter;
        this._transports = options.transports ?? [(0, transports_js_1.consoleTransport)()];
    }
    /**
     * Log a debug-level message.
     */
    debug(message, data) {
        this._log("debug", message, data);
    }
    /**
     * Log an info-level message.
     */
    info(message, data) {
        this._log("info", message, data);
    }
    /**
     * Log a warning-level message.
     */
    warn(message, data) {
        this._log("warn", message, data);
    }
    /**
     * Log an error-level message.
     */
    error(message, data) {
        this._log("error", message, data);
    }
    /**
     * Log a fatal-level message.
     */
    fatal(message, data) {
        this._log("fatal", message, data);
    }
    /**
     * Create a child logger with an additional prefix.
     */
    child(prefix) {
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
    _log(level, message, data) {
        if (levels_js_1.LOG_LEVEL_VALUES[level] < levels_js_1.LOG_LEVEL_VALUES[this._level]) {
            return;
        }
        const entry = {
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
exports.Logger = Logger;
/**
 * Create a new Logger instance with the given options.
 *
 * @param options - Logger configuration.
 * @returns A new Logger instance.
 */
function createLogger(options) {
    return new Logger(options);
}
//# sourceMappingURL=logger.js.map