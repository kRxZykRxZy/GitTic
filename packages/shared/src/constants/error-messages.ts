/**
 * Standardised error message constants for consistent user-facing messages.
 * @module constants/error-messages
 */

/**
 * Authentication-related error messages.
 */
export const AUTH_ERRORS = {
  /** Invalid credentials provided. */
  INVALID_CREDENTIALS: "The email or password you entered is incorrect.",
  /** Session has expired. */
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  /** Account is locked. */
  ACCOUNT_LOCKED: "Your account has been temporarily locked due to too many failed login attempts.",
  /** Email not verified. */
  EMAIL_NOT_VERIFIED: "Please verify your email address before signing in.",
  /** Token expired. */
  TOKEN_EXPIRED: "The token has expired. Please request a new one.",
  /** Invalid token. */
  INVALID_TOKEN: "The token is invalid or has already been used.",
  /** MFA required. */
  MFA_REQUIRED: "Two-factor authentication is required for this action.",
  /** MFA code invalid. */
  MFA_INVALID: "The two-factor authentication code is incorrect.",
  /** Insufficient permissions. */
  INSUFFICIENT_PERMISSIONS: "You do not have permission to perform this action.",
  /** API key invalid. */
  INVALID_API_KEY: "The API key is invalid or has been revoked.",
} as const;

/**
 * Validation-related error messages.
 */
export const VALIDATION_ERRORS = {
  /** Required field missing. */
  REQUIRED_FIELD: "This field is required.",
  /** Invalid email format. */
  INVALID_EMAIL: "Please enter a valid email address.",
  /** Invalid URL format. */
  INVALID_URL: "Please enter a valid URL.",
  /** String too short. */
  TOO_SHORT: "This field must be at least {min} characters long.",
  /** String too long. */
  TOO_LONG: "This field must not exceed {max} characters.",
  /** Invalid username format. */
  INVALID_USERNAME: "Username must be 3-39 characters and contain only letters, numbers, and hyphens.",
  /** Password too weak. */
  WEAK_PASSWORD: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
  /** Passwords do not match. */
  PASSWORD_MISMATCH: "Passwords do not match.",
  /** Duplicate entry. */
  DUPLICATE: "A resource with this value already exists.",
  /** Invalid slug format. */
  INVALID_SLUG: "Slug must contain only lowercase letters, numbers, and hyphens.",
  /** Invalid date format. */
  INVALID_DATE: "Please enter a valid date in ISO 8601 format.",
  /** Value out of range. */
  OUT_OF_RANGE: "Value must be between {min} and {max}.",
} as const;

/**
 * Resource-related error messages.
 */
export const RESOURCE_ERRORS = {
  /** Resource not found. */
  NOT_FOUND: "The requested resource was not found.",
  /** Resource already exists. */
  ALREADY_EXISTS: "A resource with this identifier already exists.",
  /** Resource conflict. */
  CONFLICT: "The resource has been modified by another request. Please refresh and try again.",
  /** Resource archived. */
  ARCHIVED: "This resource has been archived and cannot be modified.",
  /** Quota exceeded. */
  QUOTA_EXCEEDED: "You have reached the maximum number of {resource} allowed on your plan.",
  /** Rate limit exceeded. */
  RATE_LIMITED: "Too many requests. Please try again in {seconds} seconds.",
} as const;

/**
 * Server-related error messages.
 */
export const SERVER_ERRORS = {
  /** Generic internal error. */
  INTERNAL: "An unexpected error occurred. Please try again later.",
  /** Service unavailable. */
  SERVICE_UNAVAILABLE: "The service is temporarily unavailable. Please try again later.",
  /** Gateway timeout. */
  GATEWAY_TIMEOUT: "The request timed out. Please try again.",
  /** Maintenance mode. */
  MAINTENANCE: "The platform is currently undergoing maintenance. Please check back soon.",
} as const;

/**
 * All error message collections combined.
 */
export const ERROR_MESSAGES = {
  AUTH: AUTH_ERRORS,
  VALIDATION: VALIDATION_ERRORS,
  RESOURCE: RESOURCE_ERRORS,
  SERVER: SERVER_ERRORS,
} as const;
