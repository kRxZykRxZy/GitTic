/**
 * Configuration for the URL builder.
 */
export interface UrlBuilderConfig {
    /** The base URL (e.g., "https://api.example.com"). */
    baseUrl: string;
    /** Default path prefix (e.g., "/v1"). */
    basePath?: string;
}
/**
 * A fluent URL builder for constructing URLs with paths,
 * query parameters, and fragments.
 *
 * @example
 * ```ts
 * const url = new UrlBuilder({ baseUrl: "https://api.example.com", basePath: "/v1" })
 *   .path("users")
 *   .path("123")
 *   .query("include", "profile")
 *   .build();
 * // => "https://api.example.com/v1/users/123?include=profile"
 * ```
 */
export declare class UrlBuilder {
    private readonly _baseUrl;
    private readonly _basePath;
    private readonly _pathSegments;
    private readonly _queryParams;
    private _fragment;
    /**
     * Create a new UrlBuilder.
     *
     * @param config - The URL builder configuration.
     */
    constructor(config: UrlBuilderConfig);
    /**
     * Append a path segment.
     *
     * @param segment - The path segment to append.
     * @returns This builder instance for chaining.
     */
    path(segment: string): this;
    /**
     * Add a query parameter.
     *
     * @param key - The parameter key.
     * @param value - The parameter value.
     * @returns This builder instance for chaining.
     */
    query(key: string, value: string | number | boolean): this;
    /**
     * Add multiple query parameters from an object.
     *
     * @param params - A record of parameter key-value pairs.
     * @returns This builder instance for chaining.
     */
    queryAll(params: Record<string, string | number | boolean | undefined>): this;
    /**
     * Set the URL fragment (hash).
     *
     * @param fragment - The fragment string (without "#").
     * @returns This builder instance for chaining.
     */
    hash(fragment: string): this;
    /**
     * Build the final URL string.
     *
     * @returns The fully constructed URL.
     */
    build(): string;
    /**
     * Return the built URL as a string.
     */
    toString(): string;
}
/**
 * Create a URL builder with the given base URL.
 *
 * @param baseUrl - The base URL.
 * @param basePath - Optional base path.
 * @returns A new UrlBuilder instance.
 */
export declare function createUrlBuilder(baseUrl: string, basePath?: string): UrlBuilder;
//# sourceMappingURL=url-builder.d.ts.map