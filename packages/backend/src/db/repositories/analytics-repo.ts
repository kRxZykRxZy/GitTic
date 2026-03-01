import { randomUUID } from "node:crypto";
import type { AuditLog, PageView, Metric } from "@platform/shared";
import { getDb } from "../connection.js";

/* ── Event types ──────────────────────────────────────────── */

export const ANALYTICS_EVENT_TYPES = [
  "auth.login",
  "repo.create",
  "repo.push",
  "pr.open",
  "pr.merge",
  "issue.open",
  "issue.close",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

interface AnalyticsEventRow {
  id: string;
  event_type: AnalyticsEventType;
  actor_user_id: string | null;
  repository_id: string | null;
  value: number;
  metadata: string;
  occurred_at: string;
}

export interface AnalyticsEvent {
  id: string;
  eventType: AnalyticsEventType;
  actorUserId?: string;
  repositoryId?: string;
  value: number;
  metadata: Record<string, string | number | boolean | null>;
  occurredAt: string;
}

export interface DashboardPoint {
  label: string;
  value: number;
  timestamp: string;
}

export interface AnalyticsSnapshot {
  totalRepos: number;
  totalLogins: number;
  totalPushes: number;
  totalPrsOpened: number;
  totalIssuesOpened: number;
  totalIssuesClosed: number;
  repoCreations: DashboardPoint[];
  logins: DashboardPoint[];
  pushes: DashboardPoint[];
  prsOpened: DashboardPoint[];
  issuesOpened: DashboardPoint[];
  issuesClosed: DashboardPoint[];
}

let analyticsSchemaReady = false;

function analyticsTablesExist(): boolean {
  const db = getDb();
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name IN ('analytics_events', 'analytics_rollups_daily')`,
    )
    .all() as Array<{ name: string }>;

  const names = new Set(tables.map((t) => t.name));
  return names.has("analytics_events") && names.has("analytics_rollups_daily");
}

export function ensureAnalyticsTables(): boolean {
  if (analyticsSchemaReady) return true;

  const db = getDb();

  try {
    if (!analyticsTablesExist()) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS analytics_events (
          id             TEXT PRIMARY KEY,
          event_type     TEXT NOT NULL,
          actor_user_id  TEXT REFERENCES users(id) ON DELETE SET NULL,
          repository_id  TEXT REFERENCES repositories(id) ON DELETE SET NULL,
          value          REAL NOT NULL DEFAULT 1,
          metadata       TEXT NOT NULL DEFAULT '{}',
          occurred_at    TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
        CREATE INDEX IF NOT EXISTS idx_analytics_events_actor ON analytics_events(actor_user_id);
        CREATE INDEX IF NOT EXISTS idx_analytics_events_repo ON analytics_events(repository_id);
        CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred_at ON analytics_events(occurred_at);

        CREATE TABLE IF NOT EXISTS analytics_rollups_daily (
          day            TEXT NOT NULL,
          event_type     TEXT NOT NULL,
          actor_user_id  TEXT,
          repository_id  TEXT,
          event_count    INTEGER NOT NULL,
          value_sum      REAL NOT NULL,
          updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
          PRIMARY KEY (day, event_type, actor_user_id, repository_id)
        );
        CREATE INDEX IF NOT EXISTS idx_analytics_rollups_daily_day ON analytics_rollups_daily(day);
        CREATE INDEX IF NOT EXISTS idx_analytics_rollups_daily_event_type ON analytics_rollups_daily(event_type);
        CREATE INDEX IF NOT EXISTS idx_analytics_rollups_daily_actor ON analytics_rollups_daily(actor_user_id);
        CREATE INDEX IF NOT EXISTS idx_analytics_rollups_daily_repo ON analytics_rollups_daily(repository_id);
      `);
    }

    analyticsSchemaReady = analyticsTablesExist();
  } catch (error) {
    console.error("[analytics] Failed to ensure analytics tables exist:", error);
    analyticsSchemaReady = false;
  }

  return analyticsSchemaReady;
}

function toAnalyticsEvent(row: AnalyticsEventRow): AnalyticsEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    actorUserId: row.actor_user_id ?? undefined,
    repositoryId: row.repository_id ?? undefined,
    value: row.value,
    metadata: JSON.parse(row.metadata) as Record<string, string | number | boolean | null>,
    occurredAt: row.occurred_at,
  };
}

function mapPoints(rows: Array<{ label: string; value: number }>): DashboardPoint[] {
  return rows.map((row) => ({
    label: row.label,
    value: Number(row.value ?? 0),
    timestamp: `${row.label}T00:00:00.000Z`,
  }));
}

export function logAnalyticsEvent(input: {
  eventType: AnalyticsEventType;
  actorUserId?: string;
  repositoryId?: string;
  value?: number;
  metadata?: Record<string, string | number | boolean | null>;
}): AnalyticsEvent {
  if (!ensureAnalyticsTables()) {
    const now = new Date().toISOString();
    return {
      id: randomUUID(),
      eventType: input.eventType,
      actorUserId: input.actorUserId,
      repositoryId: input.repositoryId,
      value: input.value ?? 1,
      metadata: input.metadata ?? {},
      occurredAt: now,
    };
  }

  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO analytics_events (id, event_type, actor_user_id, repository_id, value, metadata, occurred_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.eventType,
    input.actorUserId ?? null,
    input.repositoryId ?? null,
    input.value ?? 1,
    JSON.stringify(input.metadata ?? {}),
    now,
  );

  return {
    id,
    eventType: input.eventType,
    actorUserId: input.actorUserId,
    repositoryId: input.repositoryId,
    value: input.value ?? 1,
    metadata: input.metadata ?? {},
    occurredAt: now,
  };
}

export function listRecentEventsByActor(actorUserId: string, limit = 20): AnalyticsEvent[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, event_type, actor_user_id, repository_id, value, metadata, occurred_at
       FROM analytics_events
       WHERE actor_user_id = ?
       ORDER BY occurred_at DESC
       LIMIT ?`,
    )
    .all(actorUserId, limit) as AnalyticsEventRow[];

  return rows.map(toAnalyticsEvent);
}

export function getUserDashboardStats(userId: string, days = 30): {
  totalRepos: number;
  totalCommits: number;
  totalPullRequests: number;
  totalIssuesOpened: number;
  totalIssuesClosed: number;
  activity: DashboardPoint[];
} {
  const db = getDb();

  const totalRepos =
    (db.prepare(`SELECT COUNT(*) AS count FROM projects WHERE owner_id = ?`).get(userId) as { count: number } | undefined)?.count ?? 0;

  const [totalCommits, totalPullRequests, totalIssuesOpened, totalIssuesClosed] = [
    "repo.push",
    "pr.open",
    "issue.open",
    "issue.close",
  ].map((eventType) =>
    ((db
      .prepare(
        `SELECT COALESCE(SUM(value), 0) AS count
         FROM analytics_events
         WHERE actor_user_id = ?
           AND event_type = ?
           AND occurred_at >= datetime('now', ?)`,
      )
      .get(userId, eventType, `-${days} days`) as { count: number } | undefined)?.count ?? 0),
  );

  const activityRows = db
    .prepare(
      `SELECT date(occurred_at) AS label, COALESCE(SUM(value), 0) AS value
       FROM analytics_events
       WHERE actor_user_id = ?
         AND occurred_at >= datetime('now', ?)
       GROUP BY label
       ORDER BY label`,
    )
    .all(userId, `-${days} days`) as Array<{ label: string; value: number }>;

  return {
    totalRepos,
    totalCommits,
    totalPullRequests,
    totalIssuesOpened,
    totalIssuesClosed,
    activity: mapPoints(activityRows),
  };
}

export function getAdminDashboardSnapshot(days = 30): AnalyticsSnapshot {
  const db = getDb();

  const getTotalFor = (eventType: AnalyticsEventType): number =>
    (db
      .prepare(
        `SELECT COALESCE(SUM(value), 0) AS total
         FROM analytics_events
         WHERE event_type = ?
           AND occurred_at >= datetime('now', ?)`,
      )
      .get(eventType, `-${days} days`) as { total: number } | undefined)?.total ?? 0;

  const getSeriesFor = (eventType: AnalyticsEventType): DashboardPoint[] => {
    const rows = db
      .prepare(
        `SELECT date(occurred_at) AS label, COALESCE(SUM(value), 0) AS value
         FROM analytics_events
         WHERE event_type = ?
           AND occurred_at >= datetime('now', ?)
         GROUP BY label
         ORDER BY label`,
      )
      .all(eventType, `-${days} days`) as Array<{ label: string; value: number }>;

    return mapPoints(rows);
  };

  const totalRepos =
    (db
      .prepare(`SELECT COUNT(*) AS count FROM projects WHERE created_at >= datetime('now', ?)`)
      .get(`-${days} days`) as { count: number } | undefined)?.count ?? 0;

  return {
    totalRepos,
    totalLogins: getTotalFor("auth.login"),
    totalPushes: getTotalFor("repo.push"),
    totalPrsOpened: getTotalFor("pr.open"),
    totalIssuesOpened: getTotalFor("issue.open"),
    totalIssuesClosed: getTotalFor("issue.close"),
    repoCreations: getSeriesFor("repo.create"),
    logins: getSeriesFor("auth.login"),
    pushes: getSeriesFor("repo.push"),
    prsOpened: getSeriesFor("pr.open"),
    issuesOpened: getSeriesFor("issue.open"),
    issuesClosed: getSeriesFor("issue.close"),
  };
}

export function rollupDailyAnalytics(days = 2): number {
  if (!ensureAnalyticsTables()) return 0;

  const db = getDb();

  const result = db
    .prepare(
      `INSERT INTO analytics_rollups_daily (
         day, event_type, actor_user_id, repository_id, event_count, value_sum, updated_at
       )
       SELECT
         date(occurred_at) AS day,
         event_type,
         actor_user_id,
         repository_id,
         COUNT(*) AS event_count,
         COALESCE(SUM(value), 0) AS value_sum,
         datetime('now') AS updated_at
       FROM analytics_events
       WHERE occurred_at >= datetime('now', ?)
       GROUP BY day, event_type, actor_user_id, repository_id
       ON CONFLICT(day, event_type, actor_user_id, repository_id)
       DO UPDATE SET
         event_count = excluded.event_count,
         value_sum = excluded.value_sum,
         updated_at = excluded.updated_at`,
    )
    .run(`-${Math.max(days, 1)} days`);

  return Number(result.changes ?? 0);
}

export function purgeExpiredAnalyticsEvents(retentionDays = 180): number {
  if (!ensureAnalyticsTables()) return 0;

  const db = getDb();
  const result = db
    .prepare(`DELETE FROM analytics_events WHERE occurred_at < datetime('now', ?)`)
    .run(`-${Math.max(retentionDays, 1)} days`);

  return Number(result.changes ?? 0);
}

/* ── Existing analytics APIs retained for compatibility ───── */

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

export function logPageView(input: Omit<PageView, "id" | "timestamp">): PageView {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO page_views (id, path, user_id, ip_address, user_agent, referrer, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, input.path, input.userId || null, input.ipAddress || null, input.userAgent || null, input.referrer || null, now);

  return toPageView({
    id,
    path: input.path,
    user_id: input.userId ?? null,
    ip_address: input.ipAddress ?? null,
    user_agent: input.userAgent ?? null,
    referrer: input.referrer ?? null,
    timestamp: now,
  });
}

export function logMetric(input: Omit<Metric, "id" | "timestamp">): Metric {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO metrics (id, name, value, tags, cluster_id, timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, input.name, input.value, JSON.stringify(input.tags), input.clusterId || null, now);

  return toMetric({
    id,
    name: input.name,
    value: input.value,
    tags: JSON.stringify(input.tags),
    cluster_id: input.clusterId ?? null,
    timestamp: now,
  });
}

export function logAudit(input: Omit<AuditLog, "id" | "timestamp">): AuditLog {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO audit_logs (id, user_id, action, resource, resource_id, details, ip_address, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, input.userId, input.action, input.resource, input.resourceId, input.details || null, input.ipAddress || null, now);

  return toAuditLog({
    id,
    user_id: input.userId,
    action: input.action,
    resource: input.resource,
    resource_id: input.resourceId,
    details: input.details ?? null,
    ip_address: input.ipAddress ?? null,
    timestamp: now,
  });
}

interface StatRow { label: string; count: number }
interface ValueRow { label: string; total: number }

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

export function getCustomTimeRange(metricName: string, from: string, to: string): ValueRow[] {
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
