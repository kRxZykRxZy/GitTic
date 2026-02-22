/**
 * Get the MIME type for a given file extension.
 *
 * @param extension - The file extension (with or without leading dot).
 * @returns The MIME type string, or "application/octet-stream" if unknown.
 *
 * @example
 * ```ts
 * getMimeType("json");  // => "application/json"
 * getMimeType(".html"); // => "text/html"
 * ```
 */
export declare function getMimeType(extension: string): string;
/**
 * Get the file extension for a given MIME type.
 *
 * @param mimeType - The MIME type string.
 * @returns The file extension (without dot), or undefined if not found.
 */
export declare function getExtension(mimeType: string): string | undefined;
/**
 * Parse a Content-Type header into its MIME type and parameters.
 *
 * @param header - The Content-Type header value.
 * @returns An object with `type` and `params`.
 *
 * @example
 * ```ts
 * parseContentType("text/html; charset=utf-8");
 * // => { type: "text/html", params: { charset: "utf-8" } }
 * ```
 */
export declare function parseContentType(header: string): {
    type: string;
    params: Record<string, string>;
};
/**
 * Check if a MIME type represents text content.
 *
 * @param mimeType - The MIME type to check.
 * @returns `true` if the MIME type is textual.
 */
export declare function isTextMimeType(mimeType: string): boolean;
/**
 * Build a Content-Type header value from a MIME type and optional charset.
 *
 * @param mimeType - The MIME type.
 * @param charset - The character encoding. Defaults to "utf-8" for text types.
 * @returns The Content-Type header value.
 */
export declare function buildContentType(mimeType: string, charset?: string): string;
//# sourceMappingURL=content-type.d.ts.map