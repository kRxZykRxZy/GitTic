import * as analyticsRepo from "../db/repositories/analytics-repo.js";
import { getActiveConnectionCount } from "./websocket-gateway.js";

/**
 * Metrics collection service.
 *
 * Tracks request count, latency, error rate, active connections,
 * and database query time. Uses in-memory counters with periodic
 * flush to the analytics repository for durable storage.
 */

/** Snapshot of all collected metrics. */
export interface MetricsSnapshot {
  /** Total number of HTTP requests processed. */
  requestCount: number;
  /** Total number of error responses (4xx + 5xx). */
  errorCount: number;
  /** Error rate as a ratio (0–1). */
  errorRate: number;
  /** Average request latency in milliseconds. */
  avgLatencyMs: number;
  /** Maximum observed latency in milliseconds. */
  maxLatencyMs: number;
  /** Total number of active WebSocket connections. */
  activeConnections: number;
  /** Total accumulated DB query time in milliseconds. */
  dbQueryTimeMs: number;
  /** Timestamp of the last flush. */
  lastFlushedAt: string;
  /** Uptime in seconds. */
  uptimeSeconds: number;
}

/* ── In-memory counters ──────────────────────────────────── */

let _requestCount = 0;
let _errorCount = 0;
let _totalLatencyMs = 0;
let _maxLatencyMs = 0;
let _dbQueryTimeMs = 0;
let _lastFlushedAt = new Date().toISOString();

/** Interval handle for periodic flushing. */
let _flushInterval: ReturnType<typeof setInterval> | null = null;

/** Default flush interval: 60 seconds. */
const DEFAULT_FLUSH_INTERVAL_MS = 60_000;

/**
 * Record an HTTP request with its response status and latency.
 *
 * Call this from request-logging middleware for every completed
 * request.
 *
 * @param statusCode - The HTTP response status code.
 * @param latencyMs  - Request duration in milliseconds.
 */
export function recordRequest(statusCode: number, latencyMs: number): void {
  _requestCount++;
  _totalLatencyMs += latencyMs;

  if (latencyMs > _maxLatencyMs) {
    _maxLatencyMs = latencyMs;
  }

  if (statusCode >= 400) {
    _errorCount++;
  }
}

/**
 * Record a database query execution time.
 *
 * @param durationMs - Query duration in milliseconds.
 */
export function recordDbQuery(durationMs: number): void {
  _dbQueryTimeMs += durationMs;
}

/**
 * Get the current metrics snapshot.
 *
 * Combines in-memory counters with live data (e.g. WebSocket
 * connection count from the gateway).
 *
 * @returns A complete metrics snapshot.
 */
export function getMetrics(): MetricsSnapshot {
  const avgLatency = _requestCount > 0 ? _totalLatencyMs / _requestCount : 0;
  const errorRate = _requestCount > 0 ? _errorCount / _requestCount : 0;

  return {
    requestCount: _requestCount,
    errorCount: _errorCount,
    errorRate: Math.round(errorRate * 10000) / 10000,
    avgLatencyMs: Math.round(avgLatency * 100) / 100,
    maxLatencyMs: Math.round(_maxLatencyMs * 100) / 100,
    activeConnections: getActiveConnectionCount(),
    dbQueryTimeMs: Math.round(_dbQueryTimeMs * 100) / 100,
    lastFlushedAt: _lastFlushedAt,
    uptimeSeconds: Math.round(process.uptime()),
  };
}

/**
 * Flush current counters to the analytics repository.
 *
 * Persists aggregated metrics as data points so they survive
 * process restarts and can be charted over time.
 */
export function flushMetrics(): void {
  const snapshot = getMetrics();

  try {
    analyticsRepo.logMetric({
      name: "http_request_count",
      value: snapshot.requestCount,
      tags: {},
    });

    analyticsRepo.logMetric({
      name: "http_error_count",
      value: snapshot.errorCount,
      tags: {},
    });

    analyticsRepo.logMetric({
      name: "http_avg_latency_ms",
      value: snapshot.avgLatencyMs,
      tags: {},
    });

    analyticsRepo.logMetric({
      name: "http_max_latency_ms",
      value: snapshot.maxLatencyMs,
      tags: {},
    });

    analyticsRepo.logMetric({
      name: "ws_active_connections",
      value: snapshot.activeConnections,
      tags: {},
    });

    analyticsRepo.logMetric({
      name: "db_query_time_ms",
      value: snapshot.dbQueryTimeMs,
      tags: {},
    });

    _lastFlushedAt = new Date().toISOString();

    console.log(
      `[metrics] Flushed: ${snapshot.requestCount} req, ${snapshot.errorCount} err, ${snapshot.avgLatencyMs}ms avg`,
    );
  } catch (err) {
    console.error("[metrics] Flush failed:", err);
  }
}

/**
 * Reset all in-memory counters. Typically called after a flush
 * if you want per-interval metrics rather than cumulative.
 */
export function resetCounters(): void {
  _requestCount = 0;
  _errorCount = 0;
  _totalLatencyMs = 0;
  _maxLatencyMs = 0;
  _dbQueryTimeMs = 0;
}

/**
 * Start the periodic metrics flush.
 *
 * @param intervalMs - Flush interval (default 60s).
 * @returns A function that stops the flush loop.
 */
export function startMetricsCollector(
  intervalMs = DEFAULT_FLUSH_INTERVAL_MS,
): () => void {
  if (_flushInterval) {
    clearInterval(_flushInterval);
  }

  console.log(
    `[metrics] Collector started (flush interval: ${intervalMs / 1000}s)`,
  );

  _flushInterval = setInterval(() => {
    flushMetrics();
  }, intervalMs);

  _flushInterval.unref();

  return () => {
    if (_flushInterval) {
      clearInterval(_flushInterval);
      _flushInterval = null;
      // Final flush on shutdown
      flushMetrics();
      console.log("[metrics] Collector stopped");
    }
  };
}
