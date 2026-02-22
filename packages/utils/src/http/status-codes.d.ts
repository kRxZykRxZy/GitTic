/**
 * HTTP status code categories.
 */
export type StatusCategory = "informational" | "success" | "redirection" | "client_error" | "server_error";
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
export declare function getStatusText(code: number): string;
/**
 * Get the category of an HTTP status code.
 *
 * @param code - The HTTP status code.
 * @returns The status category.
 */
export declare function getStatusCategory(code: number): StatusCategory;
/**
 * Check if an HTTP status code indicates success (2xx).
 *
 * @param code - The HTTP status code.
 * @returns `true` if the code is in the 2xx range.
 */
export declare function isSuccess(code: number): boolean;
/**
 * Check if an HTTP status code indicates a client error (4xx).
 *
 * @param code - The HTTP status code.
 * @returns `true` if the code is in the 4xx range.
 */
export declare function isClientError(code: number): boolean;
/**
 * Check if an HTTP status code indicates a server error (5xx).
 *
 * @param code - The HTTP status code.
 * @returns `true` if the code is in the 5xx range.
 */
export declare function isServerError(code: number): boolean;
/**
 * Check if an HTTP status code indicates a redirect (3xx).
 *
 * @param code - The HTTP status code.
 * @returns `true` if the code is in the 3xx range.
 */
export declare function isRedirect(code: number): boolean;
/**
 * Check if an HTTP status code indicates a retryable error.
 * Retryable codes: 408 (Request Timeout), 429 (Too Many Requests),
 * 500, 502, 503, 504.
 *
 * @param code - The HTTP status code.
 * @returns `true` if the request might succeed on retry.
 */
export declare function isRetryable(code: number): boolean;
//# sourceMappingURL=status-codes.d.ts.map