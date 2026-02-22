import type { Request, Response, NextFunction } from "express";
import { logPageView } from "../db/repositories/analytics-repo.js";

/**
 * Internal state for tracking a single request's timing.
 * Attached to `res.locals` so the finish handler can access it.
 */
interface RequestTimingLocals {
  /** High-resolution start time (ms). */
  _startTime: number;
}

/**
 * Paths that should never be logged (noise reduction).
 * Health-checks and static assets are intentionally excluded.
 */
const IGNORED_PREFIXES = [
  "/health",
  "/favicon.ico",
  "/robots.txt",
];

/**
 * Determine whether a path should be skipped during logging.
 */
function shouldSkip(path: string): boolean {
  return IGNORED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * Build a structured JSON log entry for the completed request.
 */
function buildLogEntry(
  req: Request,
  res: Response,
  durationMs: number,
): Record<string, unknown> {
  return {
    level: "info",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    durationMs: Math.round(durationMs * 100) / 100,
    ip: req.ip ?? req.socket.remoteAddress ?? "unknown",
    userAgent: req.get("user-agent") ?? "unknown",
    contentLength: res.get("content-length") ?? 0,
    userId: req.user?.userId ?? null,
    referrer: req.get("referrer") ?? null,
  };
}

/**
 * Track the page view in the analytics repository.
 * Runs asynchronously so it never blocks the response.
 */
function trackPageView(req: Request): void {
  try {
    // Only track GET requests that look like page navigations
    if (req.method !== "GET") return;

    const path = req.originalUrl.split("?")[0];
    logPageView({
      path,
      userId: req.user?.userId,
      ipAddress: req.ip ?? req.socket.remoteAddress ?? undefined,
      userAgent: req.get("user-agent") ?? undefined,
      referrer: req.get("referrer") ?? undefined,
    });
  } catch {
    // Analytics tracking must never crash the request pipeline
  }
}

/**
 * Express request logging middleware.
 *
 * For every incoming request this middleware:
 *
 * 1. Records a high-resolution start time.
 * 2. Hooks into the `res.on("finish")` event.
 * 3. Once the response is sent, calculates the duration and emits
 *    a structured JSON log line to `stdout`.
 * 4. Tracks the page view in the analytics system (fire-and-forget).
 *
 * Health-check and static-asset paths are silently skipped to avoid
 * log pollution in production.
 *
 * @example
 * app.use(requestLogger);
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Skip noisy paths
  if (shouldSkip(req.path)) {
    next();
    return;
  }

  const startTime = performance.now();
  (res.locals as unknown as RequestTimingLocals)._startTime = startTime;

  // Hook the response finish event
  res.on("finish", () => {
    const durationMs = performance.now() - startTime;
    const entry = buildLogEntry(req, res, durationMs);

    // Color-code status for terminal readability
    const statusColor =
      res.statusCode >= 500
        ? "\x1b[31m" // red
        : res.statusCode >= 400
          ? "\x1b[33m" // yellow
          : "\x1b[32m"; // green
    const reset = "\x1b[0m";

    // Human-readable summary line
    console.log(
      `${statusColor}${req.method} ${req.originalUrl} ${res.statusCode}${reset} ${entry.durationMs}ms`,
    );

    // Full structured log
    console.log(JSON.stringify(entry));

    // Fire-and-forget analytics tracking
    trackPageView(req);
  });

  next();
}

/**
 * Lightweight middleware that only logs slow requests (> threshold).
 * Useful in production to surface performance problems without
 * flooding logs.
 *
 * @param thresholdMs - Requests slower than this value (ms) are logged.
 */
export function slowRequestLogger(
  thresholdMs = 1000,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = performance.now();

    res.on("finish", () => {
      const durationMs = performance.now() - startTime;
      if (durationMs >= thresholdMs) {
        console.warn(
          JSON.stringify({
            level: "warn",
            type: "slow_request",
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: Math.round(durationMs * 100) / 100,
            ip: req.ip ?? req.socket.remoteAddress,
            userId: req.user?.userId ?? null,
          }),
        );
      }
    });

    next();
  };
}
