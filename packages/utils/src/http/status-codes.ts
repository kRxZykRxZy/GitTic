/**
 * HTTP status code categories.
 */
export type StatusCategory =
  | "informational"
  | "success"
  | "redirection"
  | "client_error"
  | "server_error";

/**
 * A map of common HTTP status codes to their standard reason phrases.
 */
const STATUS_CODES: Readonly<Record<number, string>> = {
  100: "Continue",
  101: "Switching Protocols",
  200: "OK",
  201: "Created",
  202: "Accepted",
  204: "No Content",
  301: "Moved Permanently",
  302: "Found",
  304: "Not Modified",
  307: "Temporary Redirect",
  308: "Permanent Redirect",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  413: "Payload Too Large",
  415: "Unsupported Media Type",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
};

/**
 * Get the standard reason phrase for an HTTP status code.
 *
 * @param code - The HTTP status code.
 * @returns The reason phrase, or "Unknown Status" if not recognized.
 *
 * @example
 * ```ts
 * getStatusText(200); // => "OK"
 * getStatusText(404); // => "Not Found"
 * ```
 */
export function getStatusText(code: number): string {
  return STATUS_CODES[code] ?? "Unknown Status";
}

/**
 * Get the category of an HTTP status code.
 *
 * @param code - The HTTP status code.
 * @returns The status category.
 */
export function getStatusCategory(code: number): StatusCategory {
  if (code >= 100 && code < 200) return "informational";
  if (code >= 200 && code < 300) return "success";
  if (code >= 300 && code < 400) return "redirection";
  if (code >= 400 && code < 500) return "client_error";
  return "server_error";
}

/**
 * Check if an HTTP status code indicates success (2xx).
 *
 * @param code - The HTTP status code.
 * @returns `true` if the code is in the 2xx range.
 */
export function isSuccess(code: number): boolean {
  return code >= 200 && code < 300;
}

/**
 * Check if an HTTP status code indicates a client error (4xx).
 *
 * @param code - The HTTP status code.
 * @returns `true` if the code is in the 4xx range.
 */
export function isClientError(code: number): boolean {
  return code >= 400 && code < 500;
}

/**
 * Check if an HTTP status code indicates a server error (5xx).
 *
 * @param code - The HTTP status code.
 * @returns `true` if the code is in the 5xx range.
 */
export function isServerError(code: number): boolean {
  return code >= 500 && code < 600;
}

/**
 * Check if an HTTP status code indicates a redirect (3xx).
 *
 * @param code - The HTTP status code.
 * @returns `true` if the code is in the 3xx range.
 */
export function isRedirect(code: number): boolean {
  return code >= 300 && code < 400;
}

/**
 * Check if an HTTP status code indicates a retryable error.
 * Retryable codes: 408 (Request Timeout), 429 (Too Many Requests),
 * 500, 502, 503, 504.
 *
 * @param code - The HTTP status code.
 * @returns `true` if the request might succeed on retry.
 */
export function isRetryable(code: number): boolean {
  return [408, 429, 500, 502, 503, 504].includes(code);
}
