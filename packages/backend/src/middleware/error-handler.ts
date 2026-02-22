import type { Request, Response, NextFunction } from "express";
import { getConfig } from "../config/app-config.js";

/**
 * Recognised error code constants.
 * Each maps to an HTTP status and a machine-readable code string.
 */
interface ErrorInfo {
  status: number;
  code: string;
}

/** Map of known error names / messages to HTTP metadata. */
const ERROR_MAP: Record<string, ErrorInfo> = {
  ValidationError: { status: 400, code: "VALIDATION_ERROR" },
  SyntaxError: { status: 400, code: "MALFORMED_INPUT" },
  UnauthorizedError: { status: 401, code: "UNAUTHORIZED" },
  JsonWebTokenError: { status: 401, code: "AUTH_INVALID_TOKEN" },
  TokenExpiredError: { status: 401, code: "AUTH_TOKEN_EXPIRED" },
  ForbiddenError: { status: 403, code: "FORBIDDEN" },
  NotFoundError: { status: 404, code: "NOT_FOUND" },
  ConflictError: { status: 409, code: "CONFLICT" },
  RateLimitError: { status: 429, code: "RATE_LIMIT_EXCEEDED" },
};

/**
 * Derive HTTP status and code from an error object.
 * Falls back to 500 / INTERNAL_ERROR for unknown errors.
 */
function classifyError(err: Error & { status?: number; statusCode?: number; code?: string; details?: unknown }): {
  status: number;
  code: string;
  message: string;
  details?: unknown;
} {
  // Check for an explicit status on the error object
  const explicitStatus = err.status ?? err.statusCode;

  // Try matching by error constructor name
  const info = ERROR_MAP[err.constructor?.name] ?? ERROR_MAP[err.name];

  const status = explicitStatus ?? info?.status ?? 500;
  const code = err.code ?? info?.code ?? "INTERNAL_ERROR";

  return {
    status,
    code,
    message: err.message || "An unexpected error occurred",
    details: err.details,
  };
}

/**
 * Produce a structured log line for an error event.
 * Uses JSON format so log aggregators can parse it easily.
 */
function logError(
  req: Request,
  status: number,
  code: string,
  message: string,
  stack?: string,
): void {
  const entry = {
    level: status >= 500 ? "error" : "warn",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    status,
    code,
    message,
    ip: req.ip ?? req.socket.remoteAddress,
    userId: req.user?.userId,
    ...(status >= 500 && stack ? { stack } : {}),
  };

  if (status >= 500) {
    console.error(JSON.stringify(entry));
  } else {
    console.warn(JSON.stringify(entry));
  }
}

/**
 * Global Express error-handling middleware.
 *
 * Catches **all** errors thrown or passed via `next(err)` from upstream
 * middleware and route handlers. Formats a consistent JSON envelope:
 *
 * ```json
 * {
 *   "error": "Human-readable message",
 *   "code": "MACHINE_CODE",
 *   "details": { ... }   // optional
 * }
 * ```
 *
 * In production mode the message is sanitised to avoid leaking
 * implementation details for 5xx errors.
 *
 * @example
 * // Mount as the LAST middleware
 * app.use(globalErrorHandler);
 */
export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const config = getConfig();
  const classified = classifyError(
    err as Error & { status?: number; statusCode?: number; code?: string; details?: unknown },
  );

  // Log every error (structured JSON)
  if (config.nodeEnv !== "test") {
    logError(req, classified.status, classified.code, classified.message, err.stack);
  }

  // Sanitise 5xx messages in production
  const userMessage =
    classified.status >= 500 && config.nodeEnv === "production"
      ? "Internal server error"
      : classified.message;

  const body: { error: string; code: string; details?: unknown } = {
    error: userMessage,
    code: classified.code,
  };

  if (classified.details !== undefined) {
    body.details = classified.details;
  }

  res.status(classified.status).json(body);
}

/**
 * Middleware that creates a 404 "Not Found" error for any unmatched
 * route. Should be mounted **after** all route handlers but **before**
 * the global error handler.
 */
export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`) as Error & {
    status: number;
    code: string;
  };
  err.status = 404;
  err.code = "NOT_FOUND";
  next(err);
}
