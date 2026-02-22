import { randomUUID } from "node:crypto";
import type { DeployKey } from "@platform/shared/types/repository";
import { getDb } from "../connection.js";

/** Row shape for deploy keys from SQLite. */
interface DeployKeyRow {
  id: string;
  repository_id: string;
  title: string;
  key: string;
  fingerprint: string;
  read_only: number;
  verified: number;
  created_at: string;
  last_used: string | null;
}

/** Deploy key with additional metadata. */
export interface DeployKeyWithMeta extends DeployKey {
  repositoryId: string;
  fingerprint: string;
  lastUsed?: string;
}

/** Map database row to DeployKey type. */
function toDeployKey(row: DeployKeyRow): DeployKey {
  return {
    id: row.id,
    title: row.title,
    key: row.key,
    readOnly: row.read_only === 1,
    verified: row.verified === 1,
    createdAt: row.created_at,
  };
}

/** Map database row to DeployKeyWithMeta type. */
function toDeployKeyWithMeta(row: DeployKeyRow): DeployKeyWithMeta {
  return {
    ...toDeployKey(row),
    repositoryId: row.repository_id,
    fingerprint: row.fingerprint,
    lastUsed: row.last_used ?? undefined,
  };
}

/** Fields for creating a deploy key. */
export interface CreateDeployKeyInput {
  repositoryId: string;
  title: string;
  key: string;
  fingerprint: string;
  readOnly?: boolean;
}

/**
 * Create a new deploy key.
 */
export function createDeployKey(input: CreateDeployKeyInput): DeployKeyWithMeta {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO deploy_keys (
      id, repository_id, title, key, fingerprint, read_only, verified, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.repositoryId,
    input.title,
    input.key,
    input.fingerprint,
    input.readOnly !== false ? 1 : 0,
    0,
    now,
  );

  return getDeployKey(id)!;
}

/**
 * Get a deploy key by ID.
 */
export function getDeployKey(id: string): DeployKeyWithMeta | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM deploy_keys WHERE id = ?")
    .get(id) as DeployKeyRow | undefined;
  return row ? toDeployKeyWithMeta(row) : null;
}

/**
 * Get a deploy key by fingerprint.
 */
export function getDeployKeyByFingerprint(fingerprint: string): DeployKeyWithMeta | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM deploy_keys WHERE fingerprint = ?")
    .get(fingerprint) as DeployKeyRow | undefined;
  return row ? toDeployKeyWithMeta(row) : null;
}

/**
 * List all deploy keys for a repository.
 */
export function listDeployKeys(repositoryId: string): DeployKeyWithMeta[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM deploy_keys WHERE repository_id = ? ORDER BY created_at DESC")
    .all(repositoryId) as DeployKeyRow[];
  return rows.map(toDeployKeyWithMeta);
}

/**
 * Delete a deploy key by ID.
 */
export function deleteDeployKey(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM deploy_keys WHERE id = ?").run(id);
  return result.changes > 0;
}

/**
 * Verify a deploy key.
 */
export function verifyDeployKey(id: string): boolean {
  const db = getDb();
  const result = db
    .prepare("UPDATE deploy_keys SET verified = 1 WHERE id = ?")
    .run(id);
  return result.changes > 0;
}

/**
 * Update deploy key last used timestamp.
 */
export function updateDeployKeyLastUsed(id: string): boolean {
  const db = getDb();
  const result = db
    .prepare("UPDATE deploy_keys SET last_used = ? WHERE id = ?")
    .run(new Date().toISOString(), id);
  return result.changes > 0;
}

/**
 * Check if a deploy key has write access.
 */
export function hasWriteAccess(id: string): boolean {
  const db = getDb();
  const row = db
    .prepare("SELECT read_only FROM deploy_keys WHERE id = ?")
    .get(id) as { read_only: number } | undefined;
  return row ? row.read_only === 0 : false;
}

/**
 * Update deploy key read-only status.
 */
export function updateDeployKeyReadOnly(id: string, readOnly: boolean): boolean {
  const db = getDb();
  const result = db
    .prepare("UPDATE deploy_keys SET read_only = ? WHERE id = ?")
    .run(readOnly ? 1 : 0, id);
  return result.changes > 0;
}

/**
 * Find deploy key by repository and title.
 */
export function findDeployKeyByTitle(repositoryId: string, title: string): DeployKeyWithMeta | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM deploy_keys WHERE repository_id = ? AND title = ?")
    .get(repositoryId, title) as DeployKeyRow | undefined;
  return row ? toDeployKeyWithMeta(row) : null;
}

/**
 * Count deploy keys for a repository.
 */
export function countDeployKeys(repositoryId: string): number {
  const db = getDb();
  const row = db
    .prepare("SELECT COUNT(*) AS cnt FROM deploy_keys WHERE repository_id = ?")
    .get(repositoryId) as { cnt: number };
  return row.cnt;
}

/**
 * List all verified deploy keys for a repository.
 */
export function listVerifiedDeployKeys(repositoryId: string): DeployKeyWithMeta[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM deploy_keys 
       WHERE repository_id = ? AND verified = 1 
       ORDER BY created_at DESC`,
    )
    .all(repositoryId) as DeployKeyRow[];
  return rows.map(toDeployKeyWithMeta);
}

/**
 * Delete all deploy keys for a repository.
 */
export function deleteAllDeployKeys(repositoryId: string): number {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM deploy_keys WHERE repository_id = ?")
    .run(repositoryId);
  return result.changes;
}
