/**
 * CSRF protection middleware using the double-submit cookie pattern.
 * Generates CSRF tokens, validates them against cookies, and provides
 * middleware for protecting state-changing requests.
 * @module middleware/csrf-middleware
 */

import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";

/**
 * CSRF protection configuration.
 */
export interface CsrfConfig {
  /** Secret for signing CSRF tokens */
  secret: string;
  /** Name of the CSRF cookie (default: "_csrf") */
  cookieName?: string;
  /** Name of the header or form field (default: "x-csrf-token") */
  headerName?: string;
  /** Token lifetime in milliseconds (default: 1 hour) */
  tokenLifetimeMs?: number;
  /** HTTP methods to protect (default: POST, PUT, PATCH, DELETE) */
  protectedMethods?: string[];
  /** Paths to exclude from CSRF protection */
  excludePaths?: string[];
  /** Whether the cookie should be Secure (HTTPS only) */
  secureCookie?: boolean;
  /** SameSite cookie attribute (default: "Strict") */
  sameSite?: "Strict" | "Lax" | "None";
}

/**
 * CSRF token with metadata.
 */
export interface CsrfToken {
  /** The token string */
  token: string;
  /** When the token was created */
  createdAt: number;
  /** When the token expires */
  expiresAt: number;
}

/**
 * Simplified request interface for CSRF middleware.
 */
export interface CsrfRequest {
  method: string;
  path?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string>;
  body?: Record<string, unknown>;
}

/**
 * Simplified response interface for CSRF middleware.
 */
export interface CsrfResponse {
  status(code: number): CsrfResponse;
  json(body: unknown): void;
  cookie?(
    name: string,
    value: string,
    options: Record<string, unknown>
  ): CsrfResponse;
  set?(header: string, value: string): CsrfResponse;
}

/**
 * Next function type.
 */
export type CsrfNextFunction = (error?: Error) => void;

/**
 * Default CSRF configuration values.
 */
const CSRF_DEFAULTS = {
  cookieName: "_csrf",
  headerName: "x-csrf-token",
  tokenLifetimeMs: 60 * 60 * 1000,
  protectedMethods: ["POST", "PUT", "PATCH", "DELETE"],
  secureCookie: true,
  sameSite: "Strict" as const,
} as const;

/**
 * Generate a new CSRF token signed with HMAC.
 * @param secret - Signing secret
 * @param lifetimeMs - Token lifetime in milliseconds
 * @returns CSRF token object
 */
export function generateCsrfToken(
  secret: string,
  lifetimeMs: number = CSRF_DEFAULTS.tokenLifetimeMs
): CsrfToken {
  const nonce = randomBytes(32).toString("hex");
  const createdAt = Date.now();
  const expiresAt = createdAt + lifetimeMs;
  const payload = `${nonce}.${createdAt}`;
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  const token = `${payload}.${signature}`;

  return { token, createdAt, expiresAt };
}

/**
 * Validate a CSRF token's signature and expiry.
 * @param token - Token string to validate
 * @param secret - Signing secret
 * @param lifetimeMs - Maximum token age in milliseconds
 * @returns True if the token is valid
 */
export function validateCsrfToken(
  token: string,
  secret: string,
  lifetimeMs: number = CSRF_DEFAULTS.tokenLifetimeMs
): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  const [nonce, timestampStr, providedSignature] = parts;
  const timestamp = parseInt(timestampStr, 10);

  if (isNaN(timestamp)) {
    return false;
  }

  // Check expiry
  if (Date.now() - timestamp > lifetimeMs) {
    return false;
  }

  // Verify signature
  const payload = `${nonce}.${timestampStr}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // Constant-time comparison
  try {
    const providedBuffer = Buffer.from(providedSignature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }
    return timingSafeEqual(providedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Extract the CSRF token from a request.
 * Checks header, body field, and query parameter.
 * @param req - Request object
 * @param headerName - Header name to check
 * @returns Token string or null
 */
export function extractCsrfTokenFromRequest(
  req: CsrfRequest,
  headerName: string = CSRF_DEFAULTS.headerName
): string | null {
  // Check header
  const headerValue = req.headers[headerName];
  if (typeof headerValue === "string") {
    return headerValue;
  }

  // Check body
  if (req.body && typeof req.body._csrf === "string") {
    return req.body._csrf;
  }

  return null;
}

/**
 * Check if a request path should be excluded from CSRF protection.
 * @param requestPath - The request path
 * @param excludePaths - Array of paths to exclude
 * @returns True if the path should be excluded
 */
export function isPathExcluded(
  requestPath: string,
  excludePaths: string[]
): boolean {
  return excludePaths.some((excluded) => {
    if (excluded.endsWith("*")) {
      return requestPath.startsWith(excluded.slice(0, -1));
    }
    return requestPath === excluded;
  });
}

/**
 * Create a CSRF protection middleware.
 * Uses the double-submit cookie pattern: a signed token is set in a cookie
 * and must be submitted in a header/body field on protected requests.
 * @param config - CSRF configuration
 * @returns Middleware function
 */
export function createCsrfMiddleware(
  config: CsrfConfig
): (req: CsrfRequest, res: CsrfResponse, next: CsrfNextFunction) => void {
  const cookieName = config.cookieName ?? CSRF_DEFAULTS.cookieName;
  const headerName = config.headerName ?? CSRF_DEFAULTS.headerName;
  const lifetimeMs =
    config.tokenLifetimeMs ?? CSRF_DEFAULTS.tokenLifetimeMs;
  const protectedMethods =
    config.protectedMethods ?? CSRF_DEFAULTS.protectedMethods;
  const excludePaths = config.excludePaths ?? [];

  return (
    req: CsrfRequest,
    res: CsrfResponse,
    next: CsrfNextFunction
  ): void => {
    // Skip non-protected methods (GET, HEAD, OPTIONS)
    if (!(protectedMethods as readonly string[]).includes(req.method.toUpperCase())) {
      // Set a new CSRF token cookie for GET requests
      const csrfToken = generateCsrfToken(config.secret, lifetimeMs);
      if (res.cookie) {
        res.cookie(cookieName, csrfToken.token, {
          httpOnly: false, // Must be readable by JavaScript
          secure: config.secureCookie ?? CSRF_DEFAULTS.secureCookie,
          sameSite: config.sameSite ?? CSRF_DEFAULTS.sameSite,
          maxAge: lifetimeMs,
          path: "/",
        });
      }
      next();
      return;
    }

    // Check if path is excluded
    const requestPath = req.path ?? req.url ?? "/";
    if (isPathExcluded(requestPath, excludePaths)) {
      next();
      return;
    }

    // Extract token from request
    const requestToken = extractCsrfTokenFromRequest(req, headerName);
    if (!requestToken) {
      res.status(403).json({
        error: "CSRF token missing",
        message: "A CSRF token is required for this request",
      });
      return;
    }

    // Extract token from cookie
    const cookieToken = req.cookies?.[cookieName];
    if (!cookieToken) {
      res.status(403).json({
        error: "CSRF cookie missing",
        message: "CSRF cookie is not present",
      });
      return;
    }

    // Validate the token from the request header/body
    if (!validateCsrfToken(requestToken, config.secret, lifetimeMs)) {
      res.status(403).json({
        error: "Invalid CSRF token",
        message: "The CSRF token is invalid or expired",
      });
      return;
    }

    // Compare request token with cookie token
    if (requestToken !== cookieToken) {
      res.status(403).json({
        error: "CSRF token mismatch",
        message: "The CSRF token does not match the cookie",
      });
      return;
    }

    next();
  };
}
