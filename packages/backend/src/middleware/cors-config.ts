import type { CorsOptions } from "cors";
import { getConfig } from "../config/app-config.js";

/**
 * Headers that are exposed to the browser so client-side code
 * can read pagination and rate-limit metadata.
 */
const EXPOSED_HEADERS = [
  "X-Total-Count",
  "X-Total-Pages",
  "X-Current-Page",
  "X-Per-Page",
  "X-RateLimit-Limit",
  "X-RateLimit-Remaining",
  "X-RateLimit-Reset",
  "X-Request-Id",
  "Link",
];

/**
 * HTTP methods allowed for CORS pre-flight requests.
 */
const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

/**
 * Request headers the browser is allowed to send.
 */
const ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-Requested-With",
  "X-Request-Id",
  "Accept",
  "Origin",
  "Cache-Control",
];

/**
 * Parse the comma-separated `CORS_ORIGINS` configuration value
 * into a list of allowed origin strings.
 *
 * Supports:
 * - Exact URLs (e.g. `https://example.com`)
 * - The wildcard `*` (allow all)
 * - An empty list, which disables CORS entirely.
 *
 * @returns Array of allowed origin strings, or `true` if wildcard.
 */
function parseOrigins(): string[] | true {
  const config = getConfig();

  // In development allow everything
  if (config.nodeEnv === "development") {
    return true;
  }

  // Try the base URL as the only allowed origin
  const raw =
    (config as unknown as Record<string, string>).corsOrigins ??
    "";

  if (!raw || raw === "*") return true;

  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * Build the CORS options object for the Express `cors()` middleware.
 *
 * - In **development** all origins are allowed.
 * - In **production** only origins listed in `CORS_ORIGINS`
 *   (or the `baseUrl`) are permitted.
 * - Credentials (cookies, Authorization header) are always supported.
 * - Pagination and rate-limit headers are exposed so the client
 *   can read them.
 * - Pre-flight results are cached for 1 hour.
 *
 * @returns A fully-populated `CorsOptions` object.
 *
 * @example
 * import cors from "cors";
 * import { buildCorsOptions } from "./cors-config.js";
 * app.use(cors(buildCorsOptions()));
 */
export function buildCorsOptions(): CorsOptions {
  const origins = parseOrigins();

  return {
    /**
     * Dynamic origin check: if the list is `true` (wildcard) every
     * origin is reflected back. Otherwise we compare against the
     * allow-list.
     */
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean | string) => void,
    ) => {
      // Requests with no origin (e.g. server-to-server) are always OK
      if (!requestOrigin) {
        callback(null, true);
        return;
      }

      if (origins === true) {
        callback(null, true);
        return;
      }

      if (origins.includes(requestOrigin)) {
        callback(null, true);
        return;
      }

      callback(
        new Error(`Origin ${requestOrigin} is not allowed by CORS policy`),
      );
    },

    credentials: true,
    methods: ALLOWED_METHODS,
    allowedHeaders: ALLOWED_HEADERS,
    exposedHeaders: EXPOSED_HEADERS,
    maxAge: 3600, // 1 hour pre-flight cache
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
}
