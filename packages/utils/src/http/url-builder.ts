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
export class UrlBuilder {
  private readonly _baseUrl: string;
  private readonly _basePath: string;
  private readonly _pathSegments: string[] = [];
  private readonly _queryParams: Array<[string, string]> = [];
  private _fragment: string | null = null;

  /**
   * Create a new UrlBuilder.
   *
   * @param config - The URL builder configuration.
   */
  constructor(config: UrlBuilderConfig) {
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
  path(segment: string): this {
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
  query(key: string, value: string | number | boolean): this {
    this._queryParams.push([key, String(value)]);
    return this;
  }

  /**
   * Add multiple query parameters from an object.
   *
   * @param params - A record of parameter key-value pairs.
   * @returns This builder instance for chaining.
   */
  queryAll(params: Record<string, string | number | boolean | undefined>): this {
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
  hash(fragment: string): this {
    this._fragment = fragment;
    return this;
  }

  /**
   * Build the final URL string.
   *
   * @returns The fully constructed URL.
   */
  build(): string {
    const pathStr = this._pathSegments.length > 0
      ? "/" + this._pathSegments.join("/")
      : "";

    let url = `${this._baseUrl}${this._basePath}${pathStr}`;

    if (this._queryParams.length > 0) {
      const qs = this._queryParams
        .map(
          ([k, v]) =>
            `${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
        )
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
  toString(): string {
    return this.build();
  }
}

/**
 * Create a URL builder with the given base URL.
 *
 * @param baseUrl - The base URL.
 * @param basePath - Optional base path.
 * @returns A new UrlBuilder instance.
 */
export function createUrlBuilder(
  baseUrl: string,
  basePath?: string,
): UrlBuilder {
  return new UrlBuilder({ baseUrl, basePath });
}
