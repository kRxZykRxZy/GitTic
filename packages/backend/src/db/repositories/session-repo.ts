import { randomUUID } from "node:crypto";
import type { Session } from "@platform/shared";
import { getDb } from "../connection.js";

/** Row shape from SQLite (snake_case). */
interface SessionRow {
  id: string;
  user_id: string;
  token: string;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: string;
  created_at: string;
}

/** Map a database row to the shared Session type. */
function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.user_id,
    token: row.token,
    ipAddress: row.ip_address ?? undefined,
    userAgent: row.user_agent ?? undefined,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

/** Fields accepted when creating a session. */
export interface CreateSessionInput {
  userId: string;
  token: string;
  expiresAt: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create a new session.
 */
export function createSession(input: CreateSessionInput): Session {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO sessions (id, user_id, token, ip_address, user_agent, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, input.userId, input.token, input.ipAddress || null, input.userAgent || null, input.expiresAt, now);

  return findByToken(input.token)!;
}

/**
 * Find a session by its token string.
 * Returns null if no matching session or if the session has expired.
 */
export function findByToken(token: string): Session | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM sessions WHERE token = ?")
    .get(token) as SessionRow | undefined;

  if (!row) return null;

  // Check expiry
  if (new Date(row.expires_at) < new Date()) {
    deleteSession(row.id);
    return null;
  }

  return toSession(row);
}

/**
 * Find all sessions belonging to a user.
 */
export function findByUserId(userId: string): Session[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as SessionRow[];
  return rows.map(toSession);
}

/**
 * Delete a single session by ID.
 */
export function deleteSession(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
  return result.changes > 0;
}

/**
 * Delete all expired sessions from the database.
 * Returns the number of sessions removed.
 */
export function deleteExpired(): number {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now);
  return result.changes;
}

/**
 * Delete all sessions for a given user (e.g. on password change or forced logout).
 */
export function deleteAllForUser(userId: string): number {
  const db = getDb();
  const result = db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  return result.changes;
}

/**
 * Count total active (non-expired) sessions.
 */
export function countSessions(): number {
  const db = getDb();
  const now = new Date().toISOString();
  const row = db
    .prepare("SELECT COUNT(*) AS cnt FROM sessions WHERE expires_at >= ?")
    .get(now) as { cnt: number };
  return row.cnt;
}
