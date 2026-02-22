"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = exports.TimeoutError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.NotFoundError = void 0;
const app_error_js_1 = require("./app-error.js");
const error_codes_js_1 = require("./error-codes.js");
/**
 * Error thrown when a requested resource is not found.
 *
 * @example
 * ```ts
 * throw new NotFoundError("User", { id: "123" });
 * ```
 */
class NotFoundError extends app_error_js_1.AppError {
    constructor(resource, context) {
        super(`${resource} not found`, {
            code: error_codes_js_1.ErrorCode.NOT_FOUND,
            statusCode: 404,
            context: { resource, ...context },
        });
        this.name = "NotFoundError";
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Error thrown when input validation fails.
 *
 * @example
 * ```ts
 * throw new ValidationError("Invalid email format", { field: "email" });
 * ```
 */
class ValidationError extends app_error_js_1.AppError {
    /** The fields that failed validation. */
    fields;
    constructor(message, context, fields = []) {
        super(message, {
            code: error_codes_js_1.ErrorCode.VALIDATION_ERROR,
            statusCode: 422,
            context: { ...context, fields },
        });
        this.name = "ValidationError";
        this.fields = fields;
    }
}
exports.ValidationError = ValidationError;
/**
 * Error thrown when authentication fails.
 */
class UnauthorizedError extends app_error_js_1.AppError {
    constructor(message = "Authentication required") {
        super(message, {
            code: error_codes_js_1.ErrorCode.UNAUTHORIZED,
            statusCode: 401,
        });
        this.name = "UnauthorizedError";
    }
}
exports.UnauthorizedError = UnauthorizedError;
/**
 * Error thrown when authorization fails (user is authenticated but
 * lacks permission).
 */
class ForbiddenError extends app_error_js_1.AppError {
    constructor(message = "Permission denied") {
        super(message, {
            code: error_codes_js_1.ErrorCode.FORBIDDEN,
            statusCode: 403,
        });
        this.name = "ForbiddenError";
    }
}
exports.ForbiddenError = ForbiddenError;
/**
 * Error thrown when a resource already exists.
 */
class ConflictError extends app_error_js_1.AppError {
    constructor(resource, context) {
        super(`${resource} already exists`, {
            code: error_codes_js_1.ErrorCode.ALREADY_EXISTS,
            statusCode: 409,
            context: { resource, ...context },
        });
        this.name = "ConflictError";
    }
}
exports.ConflictError = ConflictError;
/**
 * Error thrown when an operation times out.
 */
class TimeoutError extends app_error_js_1.AppError {
    /** The timeout duration in milliseconds. */
    timeoutMs;
    constructor(operation, timeoutMs) {
        super(`Operation "${operation}" timed out after ${timeoutMs}ms`, {
            code: error_codes_js_1.ErrorCode.TIMEOUT,
            statusCode: 408,
            context: { operation, timeoutMs },
        });
        this.name = "TimeoutError";
        this.timeoutMs = timeoutMs;
    }
}
exports.TimeoutError = TimeoutError;
/**
 * Error thrown when rate limiting is triggered.
 */
class RateLimitError extends app_error_js_1.AppError {
    /** The number of seconds until the rate limit resets. */
    retryAfterSeconds;
    constructor(retryAfterSeconds) {
        super(`Rate limit exceeded. Retry after ${retryAfterSeconds} seconds.`, {
            code: error_codes_js_1.ErrorCode.RATE_LIMITED,
            statusCode: 429,
            context: { retryAfterSeconds },
        });
        this.name = "RateLimitError";
        this.retryAfterSeconds = retryAfterSeconds;
    }
}
exports.RateLimitError = RateLimitError;
//# sourceMappingURL=error-types.js.map