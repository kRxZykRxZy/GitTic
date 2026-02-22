/**
 * HTTP request forwarding for cluster nodes.
 * Proxies requests to target nodes with error fallback,
 * retry logic, and timeout handling.
 * @module
 */

/** Options for forwarding a request */
export interface ForwardOptions {
  /** Target node URL (base URL) */
  targetUrl: string;
  /** Request path (appended to target URL) */
  path: string;
  /** HTTP method */
  method: string;
  /** Request headers */
  headers: Record<string, string>;
  /** Request body (string or buffer) */
  body?: string;
  /** Request timeout in milliseconds */
  timeoutMs: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Base delay between retries in milliseconds */
  retryDelayMs: number;
}

/** Result of a forwarded request */
export interface ForwardResult {
  /** HTTP status code */
  statusCode: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Response body */
  body: string;
  /** Target URL that handled the request */
  targetUrl: string;
  /** Number of attempts made */
  attempts: number;
  /** Total duration in milliseconds */
  durationMs: number;
}

/** Fallback node configuration */
export interface FallbackNode {
  /** Node URL */
  url: string;
  /** Node priority (lower = preferred) */
  priority: number;
}

/** Default forward options */
const DEFAULT_OPTIONS: Partial<ForwardOptions> = {
  method: "GET",
  timeoutMs: 30_000,
  maxRetries: 3,
  retryDelayMs: 1000,
};

/**
 * Forward HTTP requests to target cluster nodes with retry and fallback support.
 * Uses exponential backoff for retries and supports fallback to alternative nodes.
 */
export class RequestForwarder {
  private readonly defaultTimeoutMs: number;
  private readonly defaultMaxRetries: number;
  private readonly defaultRetryDelayMs: number;

  /**
   * @param defaultTimeoutMs - Default request timeout (default: 30s)
   * @param defaultMaxRetries - Default max retries (default: 3)
   * @param defaultRetryDelayMs - Default retry delay (default: 1s)
   */
  constructor(
    defaultTimeoutMs: number = 30_000,
    defaultMaxRetries: number = 3,
    defaultRetryDelayMs: number = 1000
  ) {
    this.defaultTimeoutMs = defaultTimeoutMs;
    this.defaultMaxRetries = defaultMaxRetries;
    this.defaultRetryDelayMs = defaultRetryDelayMs;
  }

  /**
   * Forward a request to a target node with retry logic.
   * Implements exponential backoff between retries.
   * @param options - Forward options
   * @returns Forward result
   * @throws Error if all attempts fail
   */
  async forward(options: Partial<ForwardOptions> & { targetUrl: string; path: string }): Promise<ForwardResult> {
    const opts: ForwardOptions = {
      method: options.method ?? "GET",
      headers: options.headers ?? {},
      body: options.body,
      targetUrl: options.targetUrl,
      path: options.path,
      timeoutMs: options.timeoutMs ?? this.defaultTimeoutMs,
      maxRetries: options.maxRetries ?? this.defaultMaxRetries,
      retryDelayMs: options.retryDelayMs ?? this.defaultRetryDelayMs,
    };

    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
      try {
        const result = await this.attemptForward(opts, attempt, startTime);
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt < opts.maxRetries) {
          const delay = this.calculateBackoff(attempt, opts.retryDelayMs);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `Request forwarding failed after ${opts.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Forward a request with fallback to alternative nodes.
   * Tries nodes in priority order until one succeeds.
   * @param path - Request path
   * @param fallbackNodes - Ordered list of fallback nodes
   * @param options - Additional request options
   * @returns Forward result from first successful node
   */
  async forwardWithFallback(
    path: string,
    fallbackNodes: FallbackNode[],
    options: Partial<ForwardOptions> = {}
  ): Promise<ForwardResult> {
    const sorted = [...fallbackNodes].sort((a, b) => a.priority - b.priority);
    const errors: Array<{ url: string; error: string }> = [];

    for (const node of sorted) {
      try {
        return await this.forward({
          ...options,
          targetUrl: node.url,
          path,
          maxRetries: 1,
        });
      } catch (err) {
        errors.push({
          url: node.url,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    throw new Error(
      `All fallback nodes failed: ${errors.map((e) => `${e.url}: ${e.error}`).join("; ")}`
    );
  }

  /**
   * Attempt a single forward request using the fetch API.
   * @param opts - Forward options
   * @param attempt - Current attempt number
   * @param startTime - When the overall operation started
   */
  private async attemptForward(
    opts: ForwardOptions,
    attempt: number,
    startTime: number
  ): Promise<ForwardResult> {
    const url = `${opts.targetUrl.replace(/\/+$/, "")}/${opts.path.replace(/^\/+/, "")}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs);

    try {
      const fetchOpts: RequestInit = {
        method: opts.method,
        headers: {
          ...opts.headers,
          "X-Forwarded-For": "cluster-proxy",
          "X-Forward-Attempt": String(attempt),
        },
        signal: controller.signal,
      };

      if (opts.body && opts.method !== "GET" && opts.method !== "HEAD") {
        fetchOpts.body = opts.body;
      }

      const response = await fetch(url, fetchOpts);
      const body = await response.text();

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        statusCode: response.status,
        headers: responseHeaders,
        body,
        targetUrl: opts.targetUrl,
        attempts: attempt,
        durationMs: Date.now() - startTime,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Calculate exponential backoff delay with jitter.
   * @param attempt - Current attempt number
   * @param baseDelay - Base delay in milliseconds
   * @returns Delay in milliseconds
   */
  private calculateBackoff(attempt: number, baseDelay: number): number {
    const exponential = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * baseDelay * 0.5;
    return Math.min(exponential + jitter, 30_000);
  }

  /**
   * Sleep for the given duration.
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if a status code indicates a retryable error.
   * @param statusCode - HTTP status code
   * @returns True if the request should be retried
   */
  static isRetryable(statusCode: number): boolean {
    return statusCode === 429 || statusCode === 502 || statusCode === 503 || statusCode === 504;
  }
}
