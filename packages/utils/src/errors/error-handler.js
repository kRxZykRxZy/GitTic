"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorHandler = createErrorHandler;
exports.withErrorHandling = withErrorHandling;
const app_error_js_1 = require("./app-error.js");
const error_codes_js_1 = require("./error-codes.js");
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
function createErrorHandler(options = {}) {
    const { logErrors = true, includeStack = false, onUnexpectedError, } = options;
    return (error) => {
        const appError = error instanceof app_error_js_1.AppError
            ? error
            : app_error_js_1.AppError.fromError(error, error_codes_js_1.ErrorCode.INTERNAL_ERROR);
        if (logErrors) {
            const logMessage = `[${appError.code}] ${appError.message}`;
            if (appError.isOperational) {
                process.stderr.write(`WARN: ${logMessage}\n`);
            }
            else {
                process.stderr.write(`ERROR: ${logMessage}\n`);
                if (appError.stack) {
                    process.stderr.write(`${appError.stack}\n`);
                }
            }
        }
        if (!appError.isOperational && onUnexpectedError) {
            onUnexpectedError(error);
        }
        const response = {
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
function withErrorHandling(fn, handler) {
    return async (...args) => {
        try {
            return await fn(...args);
        }
        catch (error) {
            return handler(error instanceof Error ? error : new Error(String(error)));
        }
    };
}
//# sourceMappingURL=error-handler.js.map