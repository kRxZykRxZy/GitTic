/**
 * Parse a URL query string into a key-value record.
 * Handles repeated keys by storing them as arrays.
 *
 * @param queryString - The query string (with or without leading "?").
 * @returns A record mapping parameter names to values or arrays of values.
 *
 * @example
 * ```ts
 * parseQueryString("?page=1&sort=name&tag=a&tag=b");
 * // => { page: "1", sort: "name", tag: ["a", "b"] }
 * ```
 */
export declare function parseQueryString(queryString: string): Record<string, string | string[]>;
/**
 * Build a URL query string from a key-value record.
 *
 * @param params - The parameters to encode.
 * @param options - Optional configuration.
 * @returns The encoded query string (without leading "?").
 *
 * @example
 * ```ts
 * buildQueryString({ page: "1", sort: "name", tags: ["a", "b"] });
 * // => "page=1&sort=name&tags=a&tags=b"
 * ```
 */
export declare function buildQueryString(params: Record<string, string | string[] | number | boolean | undefined>, options?: {
    skipNullish?: boolean;
}): string;
/**
 * Merge additional query parameters into an existing query string.
 *
 * @param existing - The existing query string.
 * @param additional - Additional parameters to merge.
 * @returns The merged query string.
 */
export declare function mergeQueryStrings(existing: string, additional: Record<string, string | string[]>): string;
//# sourceMappingURL=query-string.d.ts.map