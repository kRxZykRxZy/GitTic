/**
 * Machine-readable error codes for the application.
 */
export declare enum ErrorCode {
    INTERNAL_ERROR = "INTERNAL_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
    NOT_IMPLEMENTED = "NOT_IMPLEMENTED",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    INVALID_TOKEN = "INVALID_TOKEN",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INVALID_INPUT = "INVALID_INPUT",
    MISSING_FIELD = "MISSING_FIELD",
    INVALID_FORMAT = "INVALID_FORMAT",
    NOT_FOUND = "NOT_FOUND",
    ALREADY_EXISTS = "ALREADY_EXISTS",
    CONFLICT = "CONFLICT",
    RATE_LIMITED = "RATE_LIMITED",
    TIMEOUT = "TIMEOUT",
    NETWORK_ERROR = "NETWORK_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    DATABASE_ERROR = "DATABASE_ERROR",
    QUERY_FAILED = "QUERY_FAILED",
    CONNECTION_FAILED = "CONNECTION_FAILED"
}
/**
 * Get the default human-readable message for an error code.
 *
 * @param code - The error code.
 * @param detail - Optional additional detail to append.
 * @returns The error message string.
 *
 * @example
 * ```ts
 * getErrorMessage(ErrorCode.NOT_FOUND);
 * // => "The requested resource was not found"
 *
 * getErrorMessage(ErrorCode.NOT_FOUND, "User");
 * // => "The requested resource was not found: User"
 * ```
 */
export declare function getErrorMessage(code: ErrorCode, detail?: string): string;
/**
 * Get the HTTP status code typically associated with an error code.
 *
 * @param code - The error code.
 * @returns The HTTP status code.
 */
export declare function getHttpStatus(code: ErrorCode): number;
//# sourceMappingURL=error-codes.d.ts.map