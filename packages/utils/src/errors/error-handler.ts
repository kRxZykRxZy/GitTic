import { AppError } from "./app-error.js";
import { ErrorCode } from "./error-codes.js";

/**
 * Options for the error handler.
 */
export interface ErrorHandlerOptions {
  /** Whether to log errors to stderr. Defaults to true. */
  logErrors?: boolean;
  /** Whether to include stack traces in error responses. Defaults to false. */
  includeStack?: boolean;
  /** A callback invoked for non-operational (unexpected) errors. */
  onUnexpectedError?: (error: Error) => void;
}

/**
 * A structured error response suitable for API responses.
 */
export interface ErrorResponse {
  /** Whether the request was successful (always false). */
  success: false;
  /** The error details. */
  error: {
    code: string;
    message: string;
    statusCode: number;
    context?: Record<string, unknown>;
    stack?: string;
  };
}

/**
 * Create an error handler function that converts errors into
 * structured error responses.
 *
 * @param options - Optional handler configuration.
 * @returns A function that processes errors and returns structured responses.
 *
 * @example
 * ```ts
 * const handleError = createErrorHandler({ logErrors: true });
 * try {
 *   throw AppError.notFound("User");
 * } catch (err) {
 *   const response = handleError(err as Error);
 *   // response.error.code === "NOT_FOUND"
 * }
 * ```
 */
export function createErrorHandler(
  options: ErrorHandlerOptions = {},
): (error: Error) => ErrorResponse {
  const {
    logErrors = true,
    includeStack = false,
    onUnexpectedError,
  } = options;

  return (error: Error): ErrorResponse => {
    const appError =
      error instanceof AppError
        ? error
        : AppError.fromError(error, ErrorCode.INTERNAL_ERROR);

    if (logErrors) {
      const logMessage = `[${appError.code}] ${appError.message}`;
      if (appError.isOperational) {
        process.stderr.write(`WARN: ${logMessage}\n`);
      } else {
        process.stderr.write(`ERROR: ${logMessage}\n`);
        if (appError.stack) {
          process.stderr.write(`${appError.stack}\n`);
        }
      }
    }

    if (!appError.isOperational && onUnexpectedError) {
      onUnexpectedError(error);
    }

    const response: ErrorResponse = {
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        statusCode: appError.statusCode,
      },
    };

    if (Object.keys(appError.context).length > 0) {
      response.error.context = appError.context;
    }

    if (includeStack && appError.stack) {
      response.error.stack = appError.stack;
    }

    return response;
  };
}

/**
 * Wrap an async function with error handling, converting thrown
 * errors into structured ErrorResponse objects.
 *
 * @param fn - The async function to wrap.
 * @param handler - The error handler to use.
 * @returns A function that returns either the result or an ErrorResponse.
 */
export function withErrorHandling<T, A extends unknown[]>(
  fn: (...args: A) => Promise<T>,
  handler: (error: Error) => ErrorResponse,
): (...args: A) => Promise<T | ErrorResponse> {
  return async (...args: A): Promise<T | ErrorResponse> => {
    try {
      return await fn(...args);
    } catch (error) {
      return handler(error instanceof Error ? error : new Error(String(error)));
    }
  };
}
