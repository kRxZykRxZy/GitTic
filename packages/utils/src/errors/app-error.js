"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
const error_codes_js_1 = require("./error-codes.js");
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
class AppError extends Error {
    /** A machine-readable error code. */
    code;
    /** An HTTP status code associated with this error. */
    statusCode;
    /** Additional context data for debugging. */
    context;
    /** Timestamp when the error was created. */
    timestamp;
    /** Whether this error is operational (expected) vs. programming error. */
    isOperational;
    /**
     * Create a new AppError.
     *
     * @param message - Human-readable error message.
     * @param options - Error configuration options.
     */
    constructor(message, options = {}) {
        super(message, { cause: options.cause });
        this.name = "AppError";
        this.code = options.code ?? error_codes_js_1.ErrorCode.INTERNAL_ERROR;
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
    toJSON(includeStack = false) {
        const result = {
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
    static fromError(error, code) {
        if (error instanceof AppError) {
            return error;
        }
        return new AppError(error.message, {
            code: code ?? error_codes_js_1.ErrorCode.INTERNAL_ERROR,
            cause: error,
            isOperational: false,
        });
    }
    /**
     * Create a Not Found error.
     */
    static notFound(resource, context) {
        return new AppError((0, error_codes_js_1.getErrorMessage)(error_codes_js_1.ErrorCode.NOT_FOUND, resource), {
            code: error_codes_js_1.ErrorCode.NOT_FOUND,
            statusCode: 404,
            context,
        });
    }
    /**
     * Create a Validation error.
     */
    static validation(message, context) {
        return new AppError(message, {
            code: error_codes_js_1.ErrorCode.VALIDATION_ERROR,
            statusCode: 422,
            context,
        });
    }
    /**
     * Create an Unauthorized error.
     */
    static unauthorized(message = "Unauthorized") {
        return new AppError(message, {
            code: error_codes_js_1.ErrorCode.UNAUTHORIZED,
            statusCode: 401,
        });
    }
}
exports.AppError = AppError;
//# sourceMappingURL=app-error.js.map