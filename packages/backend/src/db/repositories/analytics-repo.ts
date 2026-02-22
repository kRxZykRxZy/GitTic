import { randomUUID } from "node:crypto";
import type { AuditLog, PageView, Metric } from "@platform/shared";
import { getDb } from "../connection.js";

/* ── Row types ─────────────────────────────────────────────── */

interface AuditLogRow {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id: string;
  details: string | null;
  ip_address: string | null;
  timestamp: string;
}

interface PageViewRow {
  id: string;
  path: string;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  timestamp: string;
}

interface MetricRow {
  id: string;
  name: string;
  value: number;
  tags: string;
  cluster_id: string | null;
  timestamp: string;
}

/* ── Row mappers ───────────────────────────────────────────── */

function toAuditLog(r: AuditLogRow): AuditLog {
  return {
    id: r.id,
    userId: r.user_id,
    action: r.action,
    resource: r.resource,
    resourceId: r.resource_id,
    details: r.details ?? undefined,
    ipAddress: r.ip_address ?? undefined,
    timestamp: r.timestamp,
  };
}

function toPageView(r: PageViewRow): PageView {
  return {
    id: r.id,
    path: r.path,
    userId: r.user_id ?? undefined,
    ipAddress: r.ip_address ?? undefined,
    userAgent: r.user_agent ?? undefined,
    referrer: r.referrer ?? undefined,
    timestamp: r.timestamp,
  };
}

function toMetric(r: MetricRow): Metric {
  return {
    id: r.id,
    name: r.name,
    value: r.value,
    tags: JSON.parse(r.tags) as Record<string, string>,
    clusterId: r.cluster_id ?? undefined,
    timestamp: r.timestamp,
  };
}

/* ── Write operations ──────────────────────────────────────── */

/** Log a page view event. */
export function logPageView(input: Omit<PageView, "id" | "timestamp">): PageView {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO page_views (id, path, user_id, ip_address, user_agent, referrer, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, input.path, input.userId || null, input.ipAddress || null, input.userAgent || null, input.referrer || null, now);

  return { ...input, id, timestamp: now } as PageView;
}

/** Log a numeric metric data point. */
export function logMetric(input: Omit<Metric, "id" | "timestamp">): Metric {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO metrics (id, name, value, tags, cluster_id, timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, input.name, input.value, JSON.stringify(input.tags), input.clusterId || null, now);

  return { ...input, id, timestamp: now };
}

/** Log an audit trail entry. */
export function logAudit(input: Omit<AuditLog, "id" | "timestamp">): AuditLog {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO audit_logs (id, user_id, action, resource, resource_id, details, ip_address, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, input.userId, input.action, input.resource, input.resourceId, input.details || null, input.ipAddress || null, now);

  return { ...input, id, timestamp: now } as AuditLog;
}

/* ── Stat helpers (time-series aggregates) ─────────────────── */

interface StatRow { label: string; count: number }
interface ValueRow { label: string; total: number }

/**
 * Page view counts grouped by day for the last N days.
 */
export function getPageViewStats(days = 30): StatRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT date(timestamp) AS label, COUNT(*) AS count
       FROM page_views
       WHERE timestamp >= datetime('now', ?)
       GROUP BY label ORDER BY label`,
    )
    .all(`-${days} days`) as StatRow[];
}

/**
 * New user sign-ups per day for the last N days.
 */
export function getUserGrowth(days = 30): StatRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT date(created_at) AS label, COUNT(*) AS count
       FROM users
       WHERE created_at >= datetime('now', ?)
       GROUP BY label ORDER BY label`,
    )
    .all(`-${days} days`) as StatRow[];
}

/**
 * Number of distinct active users (with sessions) per day.
 */
export function getActiveUsers(days = 30): StatRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT date(created_at) AS label, COUNT(DISTINCT user_id) AS count
       FROM sessions
       WHERE created_at >= datetime('now', ?)
       GROUP BY label ORDER BY label`,
    )
    .all(`-${days} days`) as StatRow[];
}

/**
 * New projects created per day.
 */
export function getProjectTrends(days = 30): StatRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT date(created_at) AS label, COUNT(*) AS count
       FROM projects
       WHERE created_at >= datetime('now', ?)
       GROUP BY label ORDER BY label`,
    )
    .all(`-${days} days`) as StatRow[];
}

/**
 * Total clone counts aggregated per day via metrics.
 */
export function getCloneStats(days = 30): ValueRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT date(timestamp) AS label, SUM(value) AS total
       FROM metrics
       WHERE name = 'clone' AND timestamp >= datetime('now', ?)
       GROUP BY label ORDER BY label`,
    )
    .all(`-${days} days`) as ValueRow[];
}

/**
 * Build (pipeline run) outcomes per day.
 */
export function getBuildStats(days = 30): StatRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT date(created_at) AS label, COUNT(*) AS count
       FROM pipeline_runs
       WHERE created_at >= datetime('now', ?)
       GROUP BY label ORDER BY label`,
    )
    .all(`-${days} days`) as StatRow[];
}

/**
 * Average cluster CPU load per day.
 */
export function getClusterLoad(days = 7): ValueRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT date(timestamp) AS label, AVG(value) AS total
       FROM metrics
       WHERE name = 'cluster_cpu' AND timestamp >= datetime('now', ?)
       GROUP BY label ORDER BY label`,
    )
    .all(`-${days} days`) as ValueRow[];
}

/**
 * Generic time-range query for any metric.
 */
export function getCustomTimeRange(
  metricName: string,
  from: string,
  to: string,
): ValueRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT date(timestamp) AS label, SUM(value) AS total
       FROM metrics
       WHERE name = ? AND timestamp >= ? AND timestamp <= ?
       GROUP BY label ORDER BY label`,
    )
    .all(metricName, from, to) as ValueRow[];
}
