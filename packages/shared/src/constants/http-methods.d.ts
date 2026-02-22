/**
 * HTTP method constants and related types.
 * @module constants/http-methods
 */
/**
 * Standard HTTP methods used by the platform API.
 */
export declare const HTTP_METHODS: {
    /** Retrieve a resource. */
    readonly GET: "GET";
    /** Create a new resource. */
    readonly POST: "POST";
    /** Replace an entire resource. */
    readonly PUT: "PUT";
    /** Partially update a resource. */
    readonly PATCH: "PATCH";
    /** Delete a resource. */
    readonly DELETE: "DELETE";
    /** Retrieve headers only. */
    readonly HEAD: "HEAD";
    /** Retrieve available methods for a resource. */
    readonly OPTIONS: "OPTIONS";
};
/**
 * Type representing any valid HTTP method string.
 */
export type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];
/**
 * HTTP methods considered safe (no side effects).
 */
export declare const SAFE_HTTP_METHODS: readonly HttpMethod[];
/**
 * HTTP methods that are idempotent.
 */
export declare const IDEMPOTENT_HTTP_METHODS: readonly HttpMethod[];
/**
 * Standard HTTP status code constants used across the platform.
 */
export declare const HTTP_STATUS: {
    /** Request succeeded. */
    readonly OK: 200;
    /** Resource created successfully. */
    readonly CREATED: 201;
    /** Request accepted for processing. */
    readonly ACCEPTED: 202;
    /** Successful request with no body. */
    readonly NO_CONTENT: 204;
    /** Bad request syntax or invalid parameters. */
    readonly BAD_REQUEST: 400;
    /** Authentication is required. */
    readonly UNAUTHORIZED: 401;
    /** Authenticated but insufficient permissions. */
    readonly FORBIDDEN: 403;
    /** Resource not found. */
    readonly NOT_FOUND: 404;
    /** HTTP method not allowed. */
    readonly METHOD_NOT_ALLOWED: 405;
    /** Resource conflict (e.g., duplicate). */
    readonly CONFLICT: 409;
    /** Request entity too large. */
    readonly PAYLOAD_TOO_LARGE: 413;
    /** Validation failed. */
    readonly UNPROCESSABLE_ENTITY: 422;
    /** Rate limit exceeded. */
    readonly TOO_MANY_REQUESTS: 429;
    /** Unexpected server error. */
    readonly INTERNAL_SERVER_ERROR: 500;
    /** Service temporarily unavailable. */
    readonly SERVICE_UNAVAILABLE: 503;
    /** Upstream service timeout. */
    readonly GATEWAY_TIMEOUT: 504;
};
/**
 * Type representing any known HTTP status code.
 */
export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
//# sourceMappingURL=http-methods.d.ts.map