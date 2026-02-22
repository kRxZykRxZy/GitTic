/**
 * HTTP method constants and related types.
 * @module constants/http-methods
 */

/**
 * Standard HTTP methods used by the platform API.
 */
export const HTTP_METHODS = {
  /** Retrieve a resource. */
  GET: "GET",
  /** Create a new resource. */
  POST: "POST",
  /** Replace an entire resource. */
  PUT: "PUT",
  /** Partially update a resource. */
  PATCH: "PATCH",
  /** Delete a resource. */
  DELETE: "DELETE",
  /** Retrieve headers only. */
  HEAD: "HEAD",
  /** Retrieve available methods for a resource. */
  OPTIONS: "OPTIONS",
} as const;

/**
 * Type representing any valid HTTP method string.
 */
export type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];

/**
 * HTTP methods considered safe (no side effects).
 */
export const SAFE_HTTP_METHODS: readonly HttpMethod[] = [
  HTTP_METHODS.GET,
  HTTP_METHODS.HEAD,
  HTTP_METHODS.OPTIONS,
] as const;

/**
 * HTTP methods that are idempotent.
 */
export const IDEMPOTENT_HTTP_METHODS: readonly HttpMethod[] = [
  HTTP_METHODS.GET,
  HTTP_METHODS.PUT,
  HTTP_METHODS.DELETE,
  HTTP_METHODS.HEAD,
  HTTP_METHODS.OPTIONS,
] as const;

/**
 * Standard HTTP status code constants used across the platform.
 */
export const HTTP_STATUS = {
  /** Request succeeded. */
  OK: 200,
  /** Resource created successfully. */
  CREATED: 201,
  /** Request accepted for processing. */
  ACCEPTED: 202,
  /** Successful request with no body. */
  NO_CONTENT: 204,
  /** Bad request syntax or invalid parameters. */
  BAD_REQUEST: 400,
  /** Authentication is required. */
  UNAUTHORIZED: 401,
  /** Authenticated but insufficient permissions. */
  FORBIDDEN: 403,
  /** Resource not found. */
  NOT_FOUND: 404,
  /** HTTP method not allowed. */
  METHOD_NOT_ALLOWED: 405,
  /** Resource conflict (e.g., duplicate). */
  CONFLICT: 409,
  /** Request entity too large. */
  PAYLOAD_TOO_LARGE: 413,
  /** Validation failed. */
  UNPROCESSABLE_ENTITY: 422,
  /** Rate limit exceeded. */
  TOO_MANY_REQUESTS: 429,
  /** Unexpected server error. */
  INTERNAL_SERVER_ERROR: 500,
  /** Service temporarily unavailable. */
  SERVICE_UNAVAILABLE: 503,
  /** Upstream service timeout. */
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Type representing any known HTTP status code.
 */
export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
