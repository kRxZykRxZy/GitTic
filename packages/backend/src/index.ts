import { getConfig } from "./config/app-config.js";
import { validateEnv } from "./config/env-schema.js";
import { getDb } from "./db/connection.js";
import { runMigrations } from "./db/migrations.js";
import { createServer } from "./server.js";
import { createWebSocketGateway, closeWebSocketGateway } from "./services/websocket-gateway.js";
import { startLoadMonitor } from "./services/load-monitor.js";
import { startMetricsCollector } from "./services/metrics-collector.js";
import { scheduleBackgroundIndex } from "./services/indexing-service.js";
import * as clusterRepo from "./db/repositories/cluster-repo.js";

/**
 * Print a startup banner with basic platform info.
 */
function printBanner(host: string, port: number): void {
  const divider = "═".repeat(50);
  console.log(`╔${divider}╗`);
  console.log(`║  📦  Platform Backend                            ║`);
  console.log(`║  🌐  http://${host}:${port}${" ".repeat(Math.max(0, 35 - host.length - String(port).length))}║`);
  console.log(`╚${divider}╝`);
}

/**
 * Start cluster stale node cleanup scheduler.
 * Removes cluster nodes that haven't sent a heartbeat for 30+ seconds.
 */
function startClusterCleanup(): () => void {
  const cleanupInterval = setInterval(() => {
    try {
      const removed = clusterRepo.cleanupStaleNodes(30_000); // 30 second threshold
      if (removed > 0) {
        console.log(`[cluster] Cleaned up ${removed} stale cluster node(s)`);
      }
    } catch (err) {
      console.error("[cluster] Cleanup error:", err);
    }
  }, 10_000); // Run cleanup every 10 seconds

  return () => clearInterval(cleanupInterval);
}

/**
 * Main entry point.
 * 1. Validate environment variables
 * 2. Load configuration
 * 3. Initialize database and run migrations
 * 4. Create and start the HTTP server
 */
async function main(): Promise<void> {
  // ── Step 1: Validate env ────────────────────────────────
  const envErrors = validateEnv();
  if (envErrors.length > 0) {
    console.error("❌ Environment validation errors:");
    for (const err of envErrors) {
      console.error(`   • ${err}`);
    }
    process.exit(1);
  }

  // ── Step 2: Load config ─────────────────────────────────
  const config = getConfig();
  console.log(`[config] Environment: ${config.nodeEnv}`);
  console.log(`[config] Database driver: ${config.db.driver}`);
  console.log(`[config] SQLite path: ${config.db.sqlitePath ?? "N/A"}`);

  // ── Step 3: Initialize database ─────────────────────────
  console.log("[db] Initializing database connection…");
  getDb();
  console.log("[db] Running migrations…");
  runMigrations();
  console.log("[db] Migrations complete.");

  // ── Step 4: Start server ────────────────────────────────
  const { app, start } = createServer();
  printBanner(config.host, config.port);
  const server = start();

  // ── Step 5: Start WebSocket gateway ────────────────────
  createWebSocketGateway(server);
  console.log("[ws] WebSocket gateway attached to HTTP server");

  // ── Step 6: Start background services ──────────────────
  const stopLoadMonitor = startLoadMonitor();
  const stopMetrics = startMetricsCollector();
  const stopIndexer = scheduleBackgroundIndex();
  const stopClusterCleanup = startClusterCleanup();
  console.log("[services] Background services started");

  // Graceful shutdown of background services
  process.on("SIGTERM", () => {
    stopLoadMonitor();
    stopMetrics();
    stopIndexer();
    stopClusterCleanup();
    closeWebSocketGateway();
  });
  process.on("SIGINT", () => {
    stopLoadMonitor();
    stopMetrics();
    stopIndexer();
    stopClusterCleanup();
    closeWebSocketGateway();
  });
}

// Run
main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
