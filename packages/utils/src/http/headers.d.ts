/**
 * Common HTTP headers as typed constants.
 */
export declare const CommonHeaders: {
    readonly CONTENT_TYPE: "Content-Type";
    readonly CONTENT_LENGTH: "Content-Length";
    readonly AUTHORIZATION: "Authorization";
    readonly ACCEPT: "Accept";
    readonly CACHE_CONTROL: "Cache-Control";
    readonly ETAG: "ETag";
    readonly IF_NONE_MATCH: "If-None-Match";
    readonly IF_MODIFIED_SINCE: "If-Modified-Since";
    readonly LAST_MODIFIED: "Last-Modified";
    readonly LOCATION: "Location";
    readonly SET_COOKIE: "Set-Cookie";
    readonly COOKIE: "Cookie";
    readonly USER_AGENT: "User-Agent";
    readonly X_REQUEST_ID: "X-Request-Id";
    readonly X_FORWARDED_FOR: "X-Forwarded-For";
    readonly X_FORWARDED_PROTO: "X-Forwarded-Proto";
    readonly ACCESS_CONTROL_ALLOW_ORIGIN: "Access-Control-Allow-Origin";
    readonly ACCESS_CONTROL_ALLOW_METHODS: "Access-Control-Allow-Methods";
    readonly ACCESS_CONTROL_ALLOW_HEADERS: "Access-Control-Allow-Headers";
    readonly CONTENT_DISPOSITION: "Content-Disposition";
};
/**
 * A case-insensitive header map.
 */
export type HeaderMap = Record<string, string | string[]>;
/**
 * Create a standard set of JSON response headers.
 *
 * @returns A header object suitable for JSON API responses.
 */
export declare function jsonHeaders(): Record<string, string>;
/**
 * Create CORS headers for the given origin.
 *
 * @param origin - The allowed origin. Defaults to "*".
 * @param methods - Allowed methods. Defaults to common REST methods.
 * @returns A header object with CORS headers.
 */
export declare function corsHeaders(origin?: string, methods?: string[]): Record<string, string>;
/**
 * Parse an Authorization header to extract the scheme and credentials.
 *
 * @param headerValue - The Authorization header value.
 * @returns An object with `scheme` and `credentials`, or null if invalid.
 *
 * @example
 * ```ts
 * parseAuthorizationHeader("Bearer abc123");
 * // => { scheme: "Bearer", credentials: "abc123" }
 * ```
 */
export declare function parseAuthorizationHeader(headerValue: string): {
    scheme: string;
    credentials: string;
} | null;
/**
 * Build a Basic Authorization header value.
 *
 * @param username - The username.
 * @param password - The password.
 * @returns The header value (e.g., "Basic dXNlcjpwYXNz").
 */
export declare function basicAuthHeader(username: string, password: string): string;
/**
 * Build a Bearer Authorization header value.
 *
 * @param token - The bearer token.
 * @returns The header value (e.g., "Bearer abc123").
 */
export declare function bearerAuthHeader(token: string): string;
//# sourceMappingURL=headers.d.ts.map