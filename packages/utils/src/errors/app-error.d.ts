import { ErrorCode } from "./error-codes.js";
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
export declare class AppError extends Error {
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
    constructor(message: string, options?: {
        code?: ErrorCode;
        statusCode?: number;
        context?: Record<string, unknown>;
        isOperational?: boolean;
        cause?: Error;
    });
    /**
     * Convert the error to a JSON-serializable object.
     *
     * @param includeStack - Whether to include the stack trace. Defaults to false.
     * @returns A plain object representation of the error.
     */
    toJSON(includeStack?: boolean): Record<string, unknown>;
    /**
     * Create an AppError from a standard Error.
     *
     * @param error - The source error.
     * @param code - Optional error code.
     * @returns A new AppError wrapping the original error.
     */
    static fromError(error: Error, code?: ErrorCode): AppError;
    /**
     * Create a Not Found error.
     */
    static notFound(resource: string, context?: Record<string, unknown>): AppError;
    /**
     * Create a Validation error.
     */
    static validation(message: string, context?: Record<string, unknown>): AppError;
    /**
     * Create an Unauthorized error.
     */
    static unauthorized(message?: string): AppError;
}
//# sourceMappingURL=app-error.d.ts.map