/**
 * Machine-readable error codes for the application.
 */
export enum ErrorCode {
  // General errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  NOT_IMPLEMENTED = "NOT_IMPLEMENTED",

  // Authentication & Authorization
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  INVALID_TOKEN = "INVALID_TOKEN",

  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_FIELD = "MISSING_FIELD",
  INVALID_FORMAT = "INVALID_FORMAT",

  // Resource
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  CONFLICT = "CONFLICT",

  // Rate limiting
  RATE_LIMITED = "RATE_LIMITED",

  // Network & I/O
  TIMEOUT = "TIMEOUT",
  NETWORK_ERROR = "NETWORK_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",

  // Database
  DATABASE_ERROR = "DATABASE_ERROR",
  QUERY_FAILED = "QUERY_FAILED",
  CONNECTION_FAILED = "CONNECTION_FAILED",
}

/**
 * A map of error codes to default human-readable messages.
 */
const ERROR_MESSAGES: Readonly<Record<ErrorCode, string>> = {
  [ErrorCode.INTERNAL_ERROR]: "An internal server error occurred",
  [ErrorCode.UNKNOWN_ERROR]: "An unknown error occurred",
  [ErrorCode.NOT_IMPLEMENTED]: "This feature is not yet implemented",
  [ErrorCode.UNAUTHORIZED]: "Authentication is required",
  [ErrorCode.FORBIDDEN]: "You do not have permission to perform this action",
  [ErrorCode.TOKEN_EXPIRED]: "The authentication token has expired",
  [ErrorCode.INVALID_TOKEN]: "The authentication token is invalid",
  [ErrorCode.VALIDATION_ERROR]: "The provided data is invalid",
  [ErrorCode.INVALID_INPUT]: "The input is invalid",
  [ErrorCode.MISSING_FIELD]: "A required field is missing",
  [ErrorCode.INVALID_FORMAT]: "The data format is invalid",
  [ErrorCode.NOT_FOUND]: "The requested resource was not found",
  [ErrorCode.ALREADY_EXISTS]: "The resource already exists",
  [ErrorCode.CONFLICT]: "A conflict occurred with the current state",
  [ErrorCode.RATE_LIMITED]: "Too many requests, please try again later",
  [ErrorCode.TIMEOUT]: "The operation timed out",
  [ErrorCode.NETWORK_ERROR]: "A network error occurred",
  [ErrorCode.SERVICE_UNAVAILABLE]: "The service is temporarily unavailable",
  [ErrorCode.DATABASE_ERROR]: "A database error occurred",
  [ErrorCode.QUERY_FAILED]: "The database query failed",
  [ErrorCode.CONNECTION_FAILED]: "Failed to connect to the database",
};

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
export function getErrorMessage(code: ErrorCode, detail?: string): string {
  const base = ERROR_MESSAGES[code] ?? "An error occurred";
  return detail ? `${base}: ${detail}` : base;
}

/**
 * Get the HTTP status code typically associated with an error code.
 *
 * @param code - The error code.
 * @returns The HTTP status code.
 */
export function getHttpStatus(code: ErrorCode): number {
  const statusMap: Partial<Record<ErrorCode, number>> = {
    [ErrorCode.UNAUTHORIZED]: 401,
    [ErrorCode.FORBIDDEN]: 403,
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.ALREADY_EXISTS]: 409,
    [ErrorCode.CONFLICT]: 409,
    [ErrorCode.VALIDATION_ERROR]: 422,
    [ErrorCode.INVALID_INPUT]: 422,
    [ErrorCode.MISSING_FIELD]: 422,
    [ErrorCode.INVALID_FORMAT]: 422,
    [ErrorCode.RATE_LIMITED]: 429,
    [ErrorCode.TIMEOUT]: 408,
    [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  };

  return statusMap[code] ?? 500;
}
