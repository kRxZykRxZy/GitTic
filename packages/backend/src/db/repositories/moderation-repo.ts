import { randomUUID } from "node:crypto";
import type { ModerationReport } from "@platform/shared";
import { getDb } from "../connection.js";

/** Row shape from SQLite. */
interface ReportRow {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  moderator_id: string | null;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
}

/** Map a row to the shared ModerationReport type. */
function toReport(row: ReportRow): ModerationReport {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    targetType: row.target_type as ModerationReport["targetType"],
    targetId: row.target_id,
    reason: row.reason,
    details: row.details ?? undefined,
    status: row.status as ModerationReport["status"],
    moderatorId: row.moderator_id ?? undefined,
    resolution: row.resolution ?? undefined,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at ?? undefined,
  };
}

/** Input for creating a moderation report. */
export interface CreateReportInput {
  reporterId: string;
  targetType: ModerationReport["targetType"];
  targetId: string;
  reason: string;
  details?: string;
}

/** Pagination options. */
export interface PaginationOpts {
  page: number;
  perPage: number;
}

/**
 * Create a new moderation report.
 */
export function createReport(input: CreateReportInput): ModerationReport {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO moderation_reports (id, reporter_id, target_type, target_id, reason, details, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'open', ?)`,
  ).run(id, input.reporterId, input.targetType, input.targetId, input.reason, input.details || null, now);

  return findById(id)!;
}

/**
 * Find a report by its ID.
 */
export function findById(id: string): ModerationReport | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM moderation_reports WHERE id = ?")
    .get(id) as ReportRow | undefined;
  return row ? toReport(row) : null;
}

/**
 * List reports with pagination, optionally filtered by status.
 */
export function listReports(
  opts: PaginationOpts,
  status?: ModerationReport["status"],
): ModerationReport[] {
  const db = getDb();
  const offset = (opts.page - 1) * opts.perPage;

  if (status) {
    const rows = db
      .prepare(
        `SELECT * FROM moderation_reports WHERE status = ?
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .all(status, opts.perPage, offset) as ReportRow[];
    return rows.map(toReport);
  }

  const rows = db
    .prepare("SELECT * FROM moderation_reports ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .all(opts.perPage, offset) as ReportRow[];
  return rows.map(toReport);
}

/**
 * Update the status of a report (e.g. reviewed, resolved, dismissed).
 */
export function updateStatus(
  id: string,
  status: ModerationReport["status"],
  moderatorId?: string,
): boolean {
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE moderation_reports SET status = ?, moderator_id = COALESCE(?, moderator_id) WHERE id = ?`,
    )
    .run(status, moderatorId || null, id);
  return result.changes > 0;
}

/**
 * Get all reports for a specific target (e.g. all reports on a user or project).
 */
export function getByTarget(
  targetType: ModerationReport["targetType"],
  targetId: string,
): ModerationReport[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM moderation_reports WHERE target_type = ? AND target_id = ? ORDER BY created_at DESC",
    )
    .all(targetType, targetId) as ReportRow[];
  return rows.map(toReport);
}

/**
 * Count the number of reports with status 'open'.
 */
export function getOpenCount(): number {
  const db = getDb();
  const row = db
    .prepare("SELECT COUNT(*) AS cnt FROM moderation_reports WHERE status = 'open'")
    .get() as { cnt: number };
  return row.cnt;
}

/**
 * Resolve a report with a resolution note.
 */
export function resolve(
  id: string,
  moderatorId: string,
  resolution: string,
): ModerationReport | null {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE moderation_reports
     SET status = 'resolved', moderator_id = ?, resolution = ?, resolved_at = ?
     WHERE id = ?`,
  ).run(moderatorId, resolution, now, id);

  return findById(id);
}
