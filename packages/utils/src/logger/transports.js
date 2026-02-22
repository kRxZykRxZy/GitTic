"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consoleTransport = consoleTransport;
exports.bufferTransport = bufferTransport;
exports.filterTransport = filterTransport;
exports.multiTransport = multiTransport;
/**
 * Create a console transport that writes to stdout/stderr.
 * Error and fatal messages go to stderr; all others go to stdout.
 *
 * @returns A LogTransport that writes to the console.
 */
function consoleTransport() {
    return {
        write(formatted, entry) {
            if (entry.level === "error" || entry.level === "fatal") {
                process.stderr.write(formatted + "\n");
            }
            else {
                process.stdout.write(formatted + "\n");
            }
        },
    };
}
/**
 * Create a transport that collects log messages into an array buffer.
 * Useful for testing or deferred processing.
 *
 * @returns An object containing the transport and the buffer of messages.
 *
 * @example
 * ```ts
 * const { transport, messages } = bufferTransport();
 * const logger = new Logger({ transports: [transport] });
 * logger.info("test");
 * console.log(messages); // => [{ formatted: "...", entry: { ... } }]
 * ```
 */
function bufferTransport() {
    const messages = [];
    return {
        transport: {
            write(formatted, entry) {
                messages.push({ formatted, entry });
            },
        },
        messages,
    };
}
/**
 * Create a transport that filters entries before passing them to
 * another transport.
 *
 * @param inner - The underlying transport to delegate to.
 * @param predicate - A function that returns true for entries to keep.
 * @returns A filtered LogTransport.
 *
 * @example
 * ```ts
 * const filtered = filterTransport(
 *   consoleTransport(),
 *   (entry) => entry.prefix === "http",
 * );
 * ```
 */
function filterTransport(inner, predicate) {
    return {
        write(formatted, entry) {
            if (predicate(entry)) {
                inner.write(formatted, entry);
            }
        },
    };
}
/**
 * Create a transport that writes to multiple other transports (fan-out).
 *
 * @param transports - The list of transports to write to.
 * @returns A LogTransport that dispatches to all inner transports.
 */
function multiTransport(transports) {
    return {
        write(formatted, entry) {
            for (const t of transports) {
                t.write(formatted, entry);
            }
        },
    };
}
//# sourceMappingURL=transports.js.map