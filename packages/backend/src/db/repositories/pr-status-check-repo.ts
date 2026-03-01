import { randomUUID } from "node:crypto";
import { getDb } from "../connection.js";

interface PrStatusCheckRow {
  id: string;
  pr_id: string;
  check_name: string;
  status: string;
  details: string | null;
  created_at: string;
  updated_at: string;
}

export type PrStatusCheckState = "success" | "pending" | "failure";

export interface PrStatusCheck {
  id: string;
  prId: string;
  checkName: string;
  status: PrStatusCheckState;
  details?: string;
  createdAt: string;
  updatedAt: string;
}

function toStatusCheck(row: PrStatusCheckRow): PrStatusCheck {
  return {
    id: row.id,
    prId: row.pr_id,
    checkName: row.check_name,
    status: row.status as PrStatusCheckState,
    details: row.details ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listByPrId(prId: string): PrStatusCheck[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM pr_status_checks WHERE pr_id = ? ORDER BY check_name ASC")
    .all(prId) as PrStatusCheckRow[];
  return rows.map(toStatusCheck);
}

export function upsertForPr(prId: string, checkName: string, status: PrStatusCheckState, details?: string): PrStatusCheck {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM pr_status_checks WHERE pr_id = ? AND check_name = ?")
    .get(prId, checkName) as { id: string } | undefined;
  const now = new Date().toISOString();

  if (existing) {
    db.prepare(
      "UPDATE pr_status_checks SET status = ?, details = ?, updated_at = ? WHERE id = ?"
    ).run(status, details ?? null, now, existing.id);

    const row = db.prepare("SELECT * FROM pr_status_checks WHERE id = ?").get(existing.id) as PrStatusCheckRow;
    return toStatusCheck(row);
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO pr_status_checks (id, pr_id, check_name, status, details, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, prId, checkName, status, details ?? null, now, now);

  const row = db.prepare("SELECT * FROM pr_status_checks WHERE id = ?").get(id) as PrStatusCheckRow;
  return toStatusCheck(row);
}
