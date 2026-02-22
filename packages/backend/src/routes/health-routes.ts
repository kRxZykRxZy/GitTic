import { Router, type Request, type Response, type NextFunction } from "express";
import { getDb } from "../db/connection.js";
import { getMetrics } from "../services/metrics-collector.js";
import { getOrchestrationStats } from "../middleware/orchestration.js";

/**
 * Health and readiness check routes.
 *
 * These endpoints are consumed by load balancers, Kubernetes
 * probes, and monitoring systems to determine service health.
 */
const router = Router();

/**
 * GET /api/health
 *
 * Basic health check. Returns 200 if the process is alive.
 * Does not check downstream dependencies.
 */
router.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "1.0.0",
  });
});

/**
 * GET /api/health/ready
 *
 * Readiness check. Verifies that the database connection is
 * functional and the service is ready to accept traffic.
 *
 * Returns 200 when ready, 503 when not.
 */
router.get("/ready", (_req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();

    // Run a trivial query to verify DB connectivity
    const result = db.prepare("SELECT 1 AS ok").get() as { ok: number } | undefined;
    if (!result || result.ok !== 1) {
      res.status(503).json({
        status: "not_ready",
        reason: "Database check failed",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      status: "ready",
      timestamp: new Date().toISOString(),
      checks: {
        database: "ok",
      },
    });
  } catch (err) {
    res.status(503).json({
      status: "not_ready",
      reason: err instanceof Error ? err.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
    next(err);
  }
});

/**
 * GET /api/health/live
 *
 * Liveness probe. Returns 200 if the event loop is responsive.
 * Used by container orchestrators to detect deadlocked processes.
 */
router.get("/live", (_req: Request, res: Response) => {
  res.json({
    status: "alive",
    timestamp: new Date().toISOString(),
    pid: process.pid,
    memoryUsage: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  });
});

/**
 * GET /api/health/metrics
 *
 * Returns Prometheus-style metrics in text exposition format.
 * Suitable for scraping by Prometheus, Grafana Agent, or
 * other monitoring systems.
 *
 * Also supports JSON output via Accept header.
 */
router.get("/metrics", (_req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = getMetrics();
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();

    const accept = _req.get("Accept") ?? "";

    if (accept.includes("application/json")) {
      res.json({
        ...metrics,
        process: {
          uptimeSeconds: process.uptime(),
          memoryRss: mem.rss,
          memoryHeapUsed: mem.heapUsed,
          memoryHeapTotal: mem.heapTotal,
          cpuUser: cpu.user,
          cpuSystem: cpu.system,
        },
      });
      return;
    }

    // Prometheus text format
    const lines: string[] = [
      "# HELP platform_request_count Total number of HTTP requests",
      "# TYPE platform_request_count counter",
      `platform_request_count ${metrics.requestCount}`,
      "",
      "# HELP platform_error_count Total number of error responses",
      "# TYPE platform_error_count counter",
      `platform_error_count ${metrics.errorCount}`,
      "",
      "# HELP platform_error_rate Error rate (errors / requests)",
      "# TYPE platform_error_rate gauge",
      `platform_error_rate ${metrics.errorRate}`,
      "",
      "# HELP platform_avg_latency_ms Average request latency in milliseconds",
      "# TYPE platform_avg_latency_ms gauge",
      `platform_avg_latency_ms ${metrics.avgLatencyMs}`,
      "",
      "# HELP platform_active_connections Current active WebSocket connections",
      "# TYPE platform_active_connections gauge",
      `platform_active_connections ${metrics.activeConnections}`,
      "",
      "# HELP process_uptime_seconds Process uptime in seconds",
      "# TYPE process_uptime_seconds gauge",
      `process_uptime_seconds ${Math.round(process.uptime())}`,
      "",
      "# HELP process_memory_rss_bytes Resident set size in bytes",
      "# TYPE process_memory_rss_bytes gauge",
      `process_memory_rss_bytes ${mem.rss}`,
      "",
      "# HELP process_memory_heap_used_bytes Heap used in bytes",
      "# TYPE process_memory_heap_used_bytes gauge",
      `process_memory_heap_used_bytes ${mem.heapUsed}`,
    ];

    res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    res.send(lines.join("\n") + "\n");
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/health/orchestration
 * 
 * Returns orchestration mode status and cluster node information
 */
router.get("/orchestration", (_req: Request, res: Response) => {
  try {
    const stats = getOrchestrationStats();
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      orchestration: stats,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      error: err instanceof Error ? err.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
