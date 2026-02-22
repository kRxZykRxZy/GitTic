import { randomUUID } from "node:crypto";
import type { FeatureFlag } from "@platform/shared";
import { getDb } from "../connection.js";

/** Row shape from SQLite. */
interface FlagRow {
  id: string;
  name: string;
  enabled: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/** Map a row to the shared FeatureFlag type. */
function toFlag(row: FlagRow): FeatureFlag {
  return {
    id: row.id,
    name: row.name,
    enabled: row.enabled === 1,
    description: row.description ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Input for creating a feature flag. */
export interface CreateFlagInput {
  name: string;
  description?: string;
  enabled?: boolean;
}

/** Input for updating a feature flag. */
export interface UpdateFlagInput {
  name?: string;
  description?: string;
  enabled?: boolean;
}

/**
 * Create a new feature flag.
 */
export function createFlag(input: CreateFlagInput): FeatureFlag {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO feature_flags (id, name, enabled, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, input.name, input.enabled ? 1 : 0, input.description || null, now, now);

  return findByName(input.name)!;
}

/**
 * Find a feature flag by its unique name.
 */
export function findByName(name: string): FeatureFlag | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM feature_flags WHERE name = ?")
    .get(name) as FlagRow | undefined;
  return row ? toFlag(row) : null;
}

/**
 * List all feature flags.
 */
export function listFlags(): FeatureFlag[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM feature_flags ORDER BY name")
    .all() as FlagRow[];
  return rows.map(toFlag);
}

/**
 * Update one or more fields of a feature flag.
 */
export function updateFlag(id: string, input: UpdateFlagInput): FeatureFlag | null {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) { sets.push("name = ?"); values.push(input.name); }
  if (input.description !== undefined) { sets.push("description = ?"); values.push(input.description); }
  if (input.enabled !== undefined) { sets.push("enabled = ?"); values.push(input.enabled ? 1 : 0); }

  if (sets.length === 0) {
    const row = db.prepare("SELECT * FROM feature_flags WHERE id = ?").get(id) as FlagRow | undefined;
    return row ? toFlag(row) : null;
  }

  sets.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  db.prepare(`UPDATE feature_flags SET ${sets.join(", ")} WHERE id = ?`).run(...values);

  const row = db.prepare("SELECT * FROM feature_flags WHERE id = ?").get(id) as FlagRow | undefined;
  return row ? toFlag(row) : null;
}

/**
 * Toggle a feature flag (flip its enabled state).
 */
export function toggleFlag(id: string): FeatureFlag | null {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE feature_flags SET enabled = CASE WHEN enabled = 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?`,
  ).run(now, id);

  const row = db.prepare("SELECT * FROM feature_flags WHERE id = ?").get(id) as FlagRow | undefined;
  return row ? toFlag(row) : null;
}

/**
 * Delete a feature flag by ID.
 */
export function deleteFlag(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM feature_flags WHERE id = ?").run(id);
  return result.changes > 0;
}
