/**
 * Error response types for consistent error handling across the platform.
 * @module types/error-response
 */

/**
 * Standard error response returned by all API endpoints on failure.
 */
export interface ErrorResponse {
  /** Always false for error responses. */
  success: false;
  /** Machine-readable error code. */
  code: ErrorCode;
  /** Human-readable error message. */
  message: string;
  /** Detailed information about the error. */
  details?: ErrorDetail[];
  /** Unique request identifier for tracing. */
  requestId: string;
  /** ISO-8601 timestamp of when the error occurred. */
  timestamp: string;
  /** HTTP status code. */
  statusCode: number;
}

/**
 * Detailed information about a specific error or validation failure.
 */
export interface ErrorDetail {
  /** The field or parameter that caused the error. */
  field?: string;
  /** Machine-readable code for this specific detail. */
  code: string;
  /** Human-readable description of the issue. */
  message: string;
  /** The value that caused the error, if safe to expose. */
  rejectedValue?: unknown;
}

/**
 * Standardised error codes used throughout the platform.
 */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMIT_EXCEEDED"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "BAD_REQUEST"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "UNPROCESSABLE_ENTITY"
  | "GATEWAY_TIMEOUT"
  | "METHOD_NOT_ALLOWED";

/**
 * Validation error response with field-level error details.
 */
export interface ValidationErrorResponse extends ErrorResponse {
  /** Always VALIDATION_ERROR for validation failures. */
  code: "VALIDATION_ERROR";
  /** List of field-level validation errors. */
  details: ValidationErrorDetail[];
}

/**
 * Detail entry for a single validation error.
 */
export interface ValidationErrorDetail extends ErrorDetail {
  /** The field that failed validation. */
  field: string;
  /** The validation rule that was violated. */
  rule: ValidationRule;
}

/**
 * Known validation rule identifiers.
 */
export type ValidationRule =
  | "required"
  | "min_length"
  | "max_length"
  | "pattern"
  | "email"
  | "url"
  | "uuid"
  | "enum"
  | "min"
  | "max"
  | "unique"
  | "custom";

/**
 * Rate limit error response with retry information.
 */
export interface RateLimitErrorResponse extends ErrorResponse {
  /** Always RATE_LIMIT_EXCEEDED for rate limit errors. */
  code: "RATE_LIMIT_EXCEEDED";
  /** Number of seconds until the rate limit resets. */
  retryAfter: number;
  /** Maximum requests allowed in the current window. */
  limit: number;
  /** Number of remaining requests in the current window. */
  remaining: number;
  /** ISO-8601 timestamp when the rate limit resets. */
  resetAt: string;
}
