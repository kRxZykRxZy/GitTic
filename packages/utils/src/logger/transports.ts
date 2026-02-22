import type { LogEntry } from "./logger.js";

/**
 * A transport is responsible for writing formatted log messages to a
 * destination (console, file, etc.).
 */
export interface LogTransport {
  /** Write a formatted log string, with access to the raw entry. */
  write(formatted: string, entry: LogEntry): void;
}

/**
 * Create a console transport that writes to stdout/stderr.
 * Error and fatal messages go to stderr; all others go to stdout.
 *
 * @returns A LogTransport that writes to the console.
 */
export function consoleTransport(): LogTransport {
  return {
    write(formatted: string, entry: LogEntry): void {
      if (entry.level === "error" || entry.level === "fatal") {
        process.stderr.write(formatted + "\n");
      } else {
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
export function bufferTransport(): {
  transport: LogTransport;
  messages: Array<{ formatted: string; entry: LogEntry }>;
} {
  const messages: Array<{ formatted: string; entry: LogEntry }> = [];

  return {
    transport: {
      write(formatted: string, entry: LogEntry): void {
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
export function filterTransport(
  inner: LogTransport,
  predicate: (entry: LogEntry) => boolean,
): LogTransport {
  return {
    write(formatted: string, entry: LogEntry): void {
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
export function multiTransport(transports: LogTransport[]): LogTransport {
  return {
    write(formatted: string, entry: LogEntry): void {
      for (const t of transports) {
        t.write(formatted, entry);
      }
    },
  };
}
