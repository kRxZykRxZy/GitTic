import { AppError } from "./app-error.js";
/**
 * Error thrown when a requested resource is not found.
 *
 * @example
 * ```ts
 * throw new NotFoundError("User", { id: "123" });
 * ```
 */
export declare class NotFoundError extends AppError {
    constructor(resource: string, context?: Record<string, unknown>);
}
/**
 * Error thrown when input validation fails.
 *
 * @example
 * ```ts
 * throw new ValidationError("Invalid email format", { field: "email" });
 * ```
 */
export declare class ValidationError extends AppError {
    /** The fields that failed validation. */
    readonly fields: string[];
    constructor(message: string, context?: Record<string, unknown>, fields?: string[]);
}
/**
 * Error thrown when authentication fails.
 */
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
/**
 * Error thrown when authorization fails (user is authenticated but
 * lacks permission).
 */
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
/**
 * Error thrown when a resource already exists.
 */
export declare class ConflictError extends AppError {
    constructor(resource: string, context?: Record<string, unknown>);
}
/**
 * Error thrown when an operation times out.
 */
export declare class TimeoutError extends AppError {
    /** The timeout duration in milliseconds. */
    readonly timeoutMs: number;
    constructor(operation: string, timeoutMs: number);
}
/**
 * Error thrown when rate limiting is triggered.
 */
export declare class RateLimitError extends AppError {
    /** The number of seconds until the rate limit resets. */
    readonly retryAfterSeconds: number;
    constructor(retryAfterSeconds: number);
}
//# sourceMappingURL=error-types.d.ts.map