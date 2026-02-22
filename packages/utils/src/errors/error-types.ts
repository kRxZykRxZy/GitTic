import { AppError } from "./app-error.js";
import { ErrorCode } from "./error-codes.js";

/**
 * Error thrown when a requested resource is not found.
 *
 * @example
 * ```ts
 * throw new NotFoundError("User", { id: "123" });
 * ```
 */
export class NotFoundError extends AppError {
  constructor(resource: string, context?: Record<string, unknown>) {
    super(`${resource} not found`, {
      code: ErrorCode.NOT_FOUND,
      statusCode: 404,
      context: { resource, ...context },
    });
    this.name = "NotFoundError";
  }
}

/**
 * Error thrown when input validation fails.
 *
 * @example
 * ```ts
 * throw new ValidationError("Invalid email format", { field: "email" });
 * ```
 */
export class ValidationError extends AppError {
  /** The fields that failed validation. */
  readonly fields: string[];

  constructor(
    message: string,
    context?: Record<string, unknown>,
    fields: string[] = [],
  ) {
    super(message, {
      code: ErrorCode.VALIDATION_ERROR,
      statusCode: 422,
      context: { ...context, fields },
    });
    this.name = "ValidationError";
    this.fields = fields;
  }
}

/**
 * Error thrown when authentication fails.
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, {
      code: ErrorCode.UNAUTHORIZED,
      statusCode: 401,
    });
    this.name = "UnauthorizedError";
  }
}

/**
 * Error thrown when authorization fails (user is authenticated but
 * lacks permission).
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "Permission denied") {
    super(message, {
      code: ErrorCode.FORBIDDEN,
      statusCode: 403,
    });
    this.name = "ForbiddenError";
  }
}

/**
 * Error thrown when a resource already exists.
 */
export class ConflictError extends AppError {
  constructor(resource: string, context?: Record<string, unknown>) {
    super(`${resource} already exists`, {
      code: ErrorCode.ALREADY_EXISTS,
      statusCode: 409,
      context: { resource, ...context },
    });
    this.name = "ConflictError";
  }
}

/**
 * Error thrown when an operation times out.
 */
export class TimeoutError extends AppError {
  /** The timeout duration in milliseconds. */
  readonly timeoutMs: number;

  constructor(operation: string, timeoutMs: number) {
    super(`Operation "${operation}" timed out after ${timeoutMs}ms`, {
      code: ErrorCode.TIMEOUT,
      statusCode: 408,
      context: { operation, timeoutMs },
    });
    this.name = "TimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Error thrown when rate limiting is triggered.
 */
export class RateLimitError extends AppError {
  /** The number of seconds until the rate limit resets. */
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super(`Rate limit exceeded. Retry after ${retryAfterSeconds} seconds.`, {
      code: ErrorCode.RATE_LIMITED,
      statusCode: 429,
      context: { retryAfterSeconds },
    });
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
