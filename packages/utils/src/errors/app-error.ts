import { ErrorCode, getErrorMessage } from "./error-codes.js";

/**
 * Base application error class with structured error information.
 * Extends the built-in Error with a code, status, and optional context.
 *
 * @example
 * ```ts
 * throw new AppError("User not found", {
 *   code: ErrorCode.NOT_FOUND,
 *   statusCode: 404,
 *   context: { userId: "123" },
 * });
 * ```
 */
export class AppError extends Error {
  /** A machine-readable error code. */
  readonly code: ErrorCode;

  /** An HTTP status code associated with this error. */
  readonly statusCode: number;

  /** Additional context data for debugging. */
  readonly context: Record<string, unknown>;

  /** Timestamp when the error was created. */
  readonly timestamp: Date;

  /** Whether this error is operational (expected) vs. programming error. */
  readonly isOperational: boolean;

  /**
   * Create a new AppError.
   *
   * @param message - Human-readable error message.
   * @param options - Error configuration options.
   */
  constructor(
    message: string,
    options: {
      code?: ErrorCode;
      statusCode?: number;
      context?: Record<string, unknown>;
      isOperational?: boolean;
      cause?: Error;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = options.code ?? ErrorCode.INTERNAL_ERROR;
    this.statusCode = options.statusCode ?? 500;
    this.context = options.context ?? {};
    this.timestamp = new Date();
    this.isOperational = options.isOperational ?? true;

    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Convert the error to a JSON-serializable object.
   *
   * @param includeStack - Whether to include the stack trace. Defaults to false.
   * @returns A plain object representation of the error.
   */
  toJSON(includeStack: boolean = false): Record<string, unknown> {
    const result: Record<string, unknown> = {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
    };

    if (Object.keys(this.context).length > 0) {
      result.context = this.context;
    }

    if (includeStack && this.stack) {
      result.stack = this.stack;
    }

    return result;
  }

  /**
   * Create an AppError from a standard Error.
   *
   * @param error - The source error.
   * @param code - Optional error code.
   * @returns A new AppError wrapping the original error.
   */
  static fromError(error: Error, code?: ErrorCode): AppError {
    if (error instanceof AppError) {
      return error;
    }

    return new AppError(error.message, {
      code: code ?? ErrorCode.INTERNAL_ERROR,
      cause: error,
      isOperational: false,
    });
  }

  /**
   * Create a Not Found error.
   */
  static notFound(
    resource: string,
    context?: Record<string, unknown>,
  ): AppError {
    return new AppError(getErrorMessage(ErrorCode.NOT_FOUND, resource), {
      code: ErrorCode.NOT_FOUND,
      statusCode: 404,
      context,
    });
  }

  /**
   * Create a Validation error.
   */
  static validation(
    message: string,
    context?: Record<string, unknown>,
  ): AppError {
    return new AppError(message, {
      code: ErrorCode.VALIDATION_ERROR,
      statusCode: 422,
      context,
    });
  }

  /**
   * Create an Unauthorized error.
   */
  static unauthorized(message: string = "Unauthorized"): AppError {
    return new AppError(message, {
      code: ErrorCode.UNAUTHORIZED,
      statusCode: 401,
    });
  }
}
