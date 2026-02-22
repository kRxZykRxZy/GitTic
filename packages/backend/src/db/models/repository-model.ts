import { randomUUID } from "node:crypto";
import type { 
  RepositorySettings, 
  RepositoryVisibility, 
  Collaborator, 
  CollaboratorPermission,
  CollaboratorPermissions 
} from "@platform/shared/types/repository";
import { getDb } from "../connection.js";

/** Row shape for repositories from SQLite (snake_case). */
interface RepositoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  owner_id: string;
  org_id: string | null;
  visibility: string;
  default_branch: string;
  has_issues: number;
  has_projects: number;
  has_wiki: number;
  allow_merge_commit: number;
  allow_squash_merge: number;
  allow_rebase_merge: number;
  delete_branch_on_merge: number;
  archived: number;
  disabled: number;
  storage_path: string;
  star_count: number;
  fork_count: number;
  created_at: string;
  updated_at: string;
}

/** Row shape for collaborators from SQLite. */
interface CollaboratorRow {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  role: string;
  added_at: string;
}

/** Repository data structure. */
export interface Repository {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  orgId?: string;
  visibility: RepositoryVisibility;
  defaultBranch: string;
  hasIssues: boolean;
  hasProjects: boolean;
  hasWiki: boolean;
  allowMergeCommit: boolean;
  allowSquashMerge: boolean;
  allowRebaseMerge: boolean;
  deleteBranchOnMerge: boolean;
  archived: boolean;
  disabled: boolean;
  storagePath: string;
  starCount: number;
  forkCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Map database row to Repository type. */
function toRepository(row: RepositoryRow): Repository {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    ownerId: row.owner_id,
    orgId: row.org_id ?? undefined,
    visibility: row.visibility as RepositoryVisibility,
    defaultBranch: row.default_branch,
    hasIssues: row.has_issues === 1,
    hasProjects: row.has_projects === 1,
    hasWiki: row.has_wiki === 1,
    allowMergeCommit: row.allow_merge_commit === 1,
    allowSquashMerge: row.allow_squash_merge === 1,
    allowRebaseMerge: row.allow_rebase_merge === 1,
    deleteBranchOnMerge: row.delete_branch_on_merge === 1,
    archived: row.archived === 1,
    disabled: row.disabled === 1,
    storagePath: row.storage_path,
    starCount: row.star_count,
    forkCount: row.fork_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Convert permission role to individual permissions. */
function toPermissions(role: CollaboratorPermission): CollaboratorPermissions {
  return {
    admin: role === 'admin',
    maintain: role === 'admin' || role === 'maintain',
    push: role === 'admin' || role === 'maintain' || role === 'push',
    triage: role !== 'pull',
    pull: true,
  };
}

/** Map database row to Collaborator type. */
function toCollaborator(row: CollaboratorRow): Collaborator {
  const role = row.role as CollaboratorPermission;
  return {
    id: row.id,
    username: row.username,
    email: row.email ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    role,
    permissions: toPermissions(role),
    addedAt: row.added_at,
  };
}

/** Fields for creating a repository. */
export interface CreateRepositoryInput {
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  orgId?: string;
  visibility?: RepositoryVisibility;
  defaultBranch?: string;
  storagePath: string;
}

/** Fields for updating a repository. */
export interface UpdateRepositoryInput {
  name?: string;
  description?: string;
  visibility?: RepositoryVisibility;
  defaultBranch?: string;
  hasIssues?: boolean;
  hasProjects?: boolean;
  hasWiki?: boolean;
  allowMergeCommit?: boolean;
  allowSquashMerge?: boolean;
  allowRebaseMerge?: boolean;
  deleteBranchOnMerge?: boolean;
  archived?: boolean;
  disabled?: boolean;
}

/**
 * Create a new repository.
 */
export function createRepository(input: CreateRepositoryInput): Repository {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO repositories (
      id, name, slug, description, owner_id, org_id, visibility, 
      default_branch, storage_path, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.name,
    input.slug,
    input.description || null,
    input.ownerId,
    input.orgId || null,
    input.visibility || 'public',
    input.defaultBranch || 'main',
    input.storagePath,
    now,
    now,
  );

  return getRepository(id)!;
}

/**
 * Get a repository by ID.
 */
export function getRepository(id: string): Repository | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM repositories WHERE id = ?")
    .get(id) as RepositoryRow | undefined;
  return row ? toRepository(row) : null;
}

/**
 * Get a repository by owner and slug.
 */
export function getRepositoryBySlug(ownerId: string, slug: string): Repository | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM repositories WHERE owner_id = ? AND slug = ?")
    .get(ownerId, slug) as RepositoryRow | undefined;
  return row ? toRepository(row) : null;
}

/**
 * Update repository fields.
 */
export function updateRepository(id: string, input: UpdateRepositoryInput): Repository | null {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) { sets.push("name = ?"); values.push(input.name); }
  if (input.description !== undefined) { sets.push("description = ?"); values.push(input.description); }
  if (input.visibility !== undefined) { sets.push("visibility = ?"); values.push(input.visibility); }
  if (input.defaultBranch !== undefined) { sets.push("default_branch = ?"); values.push(input.defaultBranch); }
  if (input.hasIssues !== undefined) { sets.push("has_issues = ?"); values.push(input.hasIssues ? 1 : 0); }
  if (input.hasProjects !== undefined) { sets.push("has_projects = ?"); values.push(input.hasProjects ? 1 : 0); }
  if (input.hasWiki !== undefined) { sets.push("has_wiki = ?"); values.push(input.hasWiki ? 1 : 0); }
  if (input.allowMergeCommit !== undefined) { sets.push("allow_merge_commit = ?"); values.push(input.allowMergeCommit ? 1 : 0); }
  if (input.allowSquashMerge !== undefined) { sets.push("allow_squash_merge = ?"); values.push(input.allowSquashMerge ? 1 : 0); }
  if (input.allowRebaseMerge !== undefined) { sets.push("allow_rebase_merge = ?"); values.push(input.allowRebaseMerge ? 1 : 0); }
  if (input.deleteBranchOnMerge !== undefined) { sets.push("delete_branch_on_merge = ?"); values.push(input.deleteBranchOnMerge ? 1 : 0); }
  if (input.archived !== undefined) { sets.push("archived = ?"); values.push(input.archived ? 1 : 0); }
  if (input.disabled !== undefined) { sets.push("disabled = ?"); values.push(input.disabled ? 1 : 0); }

  if (sets.length === 0) return getRepository(id);

  sets.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  db.prepare(`UPDATE repositories SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return getRepository(id);
}

/**
 * Delete a repository by ID.
 */
export function deleteRepository(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM repositories WHERE id = ?").run(id);
  return result.changes > 0;
}

/**
 * Add a collaborator to a repository.
 */
export function addCollaborator(
  repositoryId: string,
  userId: string,
  permission: CollaboratorPermission = 'pull',
): boolean {
  const db = getDb();
  const now = new Date().toISOString();

  try {
    db.prepare(
      `INSERT INTO repository_collaborators (repository_id, user_id, permission, added_at)
       VALUES (?, ?, ?, ?)`,
    ).run(repositoryId, userId, permission, now);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Remove a collaborator from a repository.
 */
export function removeCollaborator(repositoryId: string, userId: string): boolean {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM repository_collaborators WHERE repository_id = ? AND user_id = ?")
    .run(repositoryId, userId);
  return result.changes > 0;
}

/**
 * Get all collaborators for a repository.
 */
export function getCollaborators(repositoryId: string): Collaborator[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT u.id, u.username, u.email, u.avatar_url, rc.permission as role, rc.added_at
       FROM repository_collaborators rc
       JOIN users u ON rc.user_id = u.id
       WHERE rc.repository_id = ?
       ORDER BY rc.added_at ASC`,
    )
    .all(repositoryId) as CollaboratorRow[];
  return rows.map(toCollaborator);
}

/**
 * Get a collaborator's permission level for a repository.
 */
export function getCollaboratorPermission(
  repositoryId: string,
  userId: string,
): CollaboratorPermission | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT permission FROM repository_collaborators WHERE repository_id = ? AND user_id = ?",
    )
    .get(repositoryId, userId) as { permission: string } | undefined;
  return row ? (row.permission as CollaboratorPermission) : null;
}

/**
 * Update a collaborator's permission.
 */
export function updateCollaboratorPermission(
  repositoryId: string,
  userId: string,
  permission: CollaboratorPermission,
): boolean {
  const db = getDb();
  const result = db
    .prepare(
      "UPDATE repository_collaborators SET permission = ? WHERE repository_id = ? AND user_id = ?",
    )
    .run(permission, repositoryId, userId);
  return result.changes > 0;
}

/**
 * List all repositories for an owner.
 */
export function listRepositories(ownerId: string): Repository[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM repositories WHERE owner_id = ? ORDER BY created_at DESC")
    .all(ownerId) as RepositoryRow[];
  return rows.map(toRepository);
}

/**
 * List all repositories for an organization.
 */
export function listOrgRepositories(orgId: string): Repository[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM repositories WHERE org_id = ? ORDER BY created_at DESC")
    .all(orgId) as RepositoryRow[];
  return rows.map(toRepository);
}

/**
 * Count total repositories for an owner.
 */
export function countRepositories(ownerId: string): number {
  const db = getDb();
  const row = db
    .prepare("SELECT COUNT(*) AS cnt FROM repositories WHERE owner_id = ?")
    .get(ownerId) as { cnt: number };
  return row.cnt;
}
