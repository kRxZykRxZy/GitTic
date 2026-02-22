/**
 * Common HTTP headers as typed constants.
 */
export const CommonHeaders = {
  CONTENT_TYPE: "Content-Type",
  CONTENT_LENGTH: "Content-Length",
  AUTHORIZATION: "Authorization",
  ACCEPT: "Accept",
  CACHE_CONTROL: "Cache-Control",
  ETAG: "ETag",
  IF_NONE_MATCH: "If-None-Match",
  IF_MODIFIED_SINCE: "If-Modified-Since",
  LAST_MODIFIED: "Last-Modified",
  LOCATION: "Location",
  SET_COOKIE: "Set-Cookie",
  COOKIE: "Cookie",
  USER_AGENT: "User-Agent",
  X_REQUEST_ID: "X-Request-Id",
  X_FORWARDED_FOR: "X-Forwarded-For",
  X_FORWARDED_PROTO: "X-Forwarded-Proto",
  ACCESS_CONTROL_ALLOW_ORIGIN: "Access-Control-Allow-Origin",
  ACCESS_CONTROL_ALLOW_METHODS: "Access-Control-Allow-Methods",
  ACCESS_CONTROL_ALLOW_HEADERS: "Access-Control-Allow-Headers",
  CONTENT_DISPOSITION: "Content-Disposition",
} as const;

/**
 * A case-insensitive header map.
 */
export type HeaderMap = Record<string, string | string[]>;

/**
 * Create a standard set of JSON response headers.
 *
 * @returns A header object suitable for JSON API responses.
 */
export function jsonHeaders(): Record<string, string> {
  return {
    [CommonHeaders.CONTENT_TYPE]: "application/json; charset=utf-8",
    [CommonHeaders.CACHE_CONTROL]: "no-cache, no-store, must-revalidate",
  };
}

/**
 * Create CORS headers for the given origin.
 *
 * @param origin - The allowed origin. Defaults to "*".
 * @param methods - Allowed methods. Defaults to common REST methods.
 * @returns A header object with CORS headers.
 */
export function corsHeaders(
  origin: string = "*",
  methods: string[] = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
): Record<string, string> {
  return {
    [CommonHeaders.ACCESS_CONTROL_ALLOW_ORIGIN]: origin,
    [CommonHeaders.ACCESS_CONTROL_ALLOW_METHODS]: methods.join(", "),
    [CommonHeaders.ACCESS_CONTROL_ALLOW_HEADERS]:
      "Content-Type, Authorization, X-Request-Id",
  };
}

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
export function parseAuthorizationHeader(
  headerValue: string,
): { scheme: string; credentials: string } | null {
  const spaceIndex = headerValue.indexOf(" ");
  if (spaceIndex === -1) {
    return null;
  }

  const scheme = headerValue.slice(0, spaceIndex);
  const credentials = headerValue.slice(spaceIndex + 1).trim();

  if (!scheme || !credentials) {
    return null;
  }

  return { scheme, credentials };
}

/**
 * Build a Basic Authorization header value.
 *
 * @param username - The username.
 * @param password - The password.
 * @returns The header value (e.g., "Basic dXNlcjpwYXNz").
 */
export function basicAuthHeader(username: string, password: string): string {
  const encoded = Buffer.from(`${username}:${password}`).toString("base64");
  return `Basic ${encoded}`;
}

/**
 * Build a Bearer Authorization header value.
 *
 * @param token - The bearer token.
 * @returns The header value (e.g., "Bearer abc123").
 */
export function bearerAuthHeader(token: string): string {
  return `Bearer ${token}`;
}
