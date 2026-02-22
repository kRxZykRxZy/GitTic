"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlBuilder = void 0;
exports.createUrlBuilder = createUrlBuilder;
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
class UrlBuilder {
    _baseUrl;
    _basePath;
    _pathSegments = [];
    _queryParams = [];
    _fragment = null;
    /**
     * Create a new UrlBuilder.
     *
     * @param config - The URL builder configuration.
     */
    constructor(config) {
        this._baseUrl = config.baseUrl.replace(/\/+$/, "");
        this._basePath = config.basePath
            ? "/" + config.basePath.replace(/^\/+|\/+$/g, "")
            : "";
    }
    /**
     * Append a path segment.
     *
     * @param segment - The path segment to append.
     * @returns This builder instance for chaining.
     */
    path(segment) {
        const cleaned = segment.replace(/^\/+|\/+$/g, "");
        if (cleaned) {
            this._pathSegments.push(encodeURIComponent(cleaned));
        }
        return this;
    }
    /**
     * Add a query parameter.
     *
     * @param key - The parameter key.
     * @param value - The parameter value.
     * @returns This builder instance for chaining.
     */
    query(key, value) {
        this._queryParams.push([key, String(value)]);
        return this;
    }
    /**
     * Add multiple query parameters from an object.
     *
     * @param params - A record of parameter key-value pairs.
     * @returns This builder instance for chaining.
     */
    queryAll(params) {
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined) {
                this.query(key, value);
            }
        }
        return this;
    }
    /**
     * Set the URL fragment (hash).
     *
     * @param fragment - The fragment string (without "#").
     * @returns This builder instance for chaining.
     */
    hash(fragment) {
        this._fragment = fragment;
        return this;
    }
    /**
     * Build the final URL string.
     *
     * @returns The fully constructed URL.
     */
    build() {
        const pathStr = this._pathSegments.length > 0
            ? "/" + this._pathSegments.join("/")
            : "";
        let url = `${this._baseUrl}${this._basePath}${pathStr}`;
        if (this._queryParams.length > 0) {
            const qs = this._queryParams
                .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
                .join("&");
            url += `?${qs}`;
        }
        if (this._fragment !== null) {
            url += `#${encodeURIComponent(this._fragment)}`;
        }
        return url;
    }
    /**
     * Return the built URL as a string.
     */
    toString() {
        return this.build();
    }
}
exports.UrlBuilder = UrlBuilder;
/**
 * Create a URL builder with the given base URL.
 *
 * @param baseUrl - The base URL.
 * @param basePath - Optional base path.
 * @returns A new UrlBuilder instance.
 */
function createUrlBuilder(baseUrl, basePath) {
    return new UrlBuilder({ baseUrl, basePath });
}
//# sourceMappingURL=url-builder.js.map