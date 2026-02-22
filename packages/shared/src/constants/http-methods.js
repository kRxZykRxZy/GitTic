"use strict";
/**
 * HTTP method constants and related types.
 * @module constants/http-methods
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_STATUS = exports.IDEMPOTENT_HTTP_METHODS = exports.SAFE_HTTP_METHODS = exports.HTTP_METHODS = void 0;
/**
 * Standard HTTP methods used by the platform API.
 */
exports.HTTP_METHODS = {
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
};
/**
 * HTTP methods considered safe (no side effects).
 */
exports.SAFE_HTTP_METHODS = [
    exports.HTTP_METHODS.GET,
    exports.HTTP_METHODS.HEAD,
    exports.HTTP_METHODS.OPTIONS,
];
/**
 * HTTP methods that are idempotent.
 */
exports.IDEMPOTENT_HTTP_METHODS = [
    exports.HTTP_METHODS.GET,
    exports.HTTP_METHODS.PUT,
    exports.HTTP_METHODS.DELETE,
    exports.HTTP_METHODS.HEAD,
    exports.HTTP_METHODS.OPTIONS,
];
/**
 * Standard HTTP status code constants used across the platform.
 */
exports.HTTP_STATUS = {
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
};
//# sourceMappingURL=http-methods.js.map