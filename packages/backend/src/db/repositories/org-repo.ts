import { randomUUID } from "node:crypto";
import type { Organization } from "@platform/shared";
import { getDb } from "../connection.js";

/** Row shape from SQLite. */
interface OrgRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  owner_id: string;
  is_private: number;
  max_repos: number;
  max_members: number;
  created_at: string;
  updated_at: string;
}

/** Member row shape. */
interface OrgMemberRow {
  org_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

/** Public member representation. */
export interface OrgMember {
  orgId: string;
  userId: string;
  role: string;
  joinedAt: string;
}

/** Map a row to the shared Organization type. */
function toOrg(row: OrgRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    ownerId: row.owner_id,
    isPrivate: row.is_private === 1,
    maxRepos: row.max_repos,
    maxMembers: row.max_members,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Map a member row. */
function toMember(row: OrgMemberRow): OrgMember {
  return {
    orgId: row.org_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
  };
}

/** Input for creating an organization. */
export interface CreateOrgInput {
  name: string;
  slug: string;
  ownerId: string;
  description?: string;
  isPrivate?: boolean;
  maxRepos?: number;
  maxMembers?: number;
}

/** Input for updating an organization. */
export interface UpdateOrgInput {
  name?: string;
  description?: string;
  avatarUrl?: string;
  isPrivate?: boolean;
  maxRepos?: number;
  maxMembers?: number;
}

/**
 * Create a new organization and add the owner as an admin member.
 */
export function createOrg(input: CreateOrgInput): Organization {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  const insertOrg = db.prepare(
    `INSERT INTO organizations (id, name, slug, description, owner_id, is_private, max_repos, max_members, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const insertMember = db.prepare(
    `INSERT INTO org_members (org_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)`,
  );

  const txn = db.transaction(() => {
    insertOrg.run(
      id,
      input.name,
      input.slug,
      input.description || null,
      input.ownerId,
      input.isPrivate ? 1 : 0,
      input.maxRepos ?? 50,
      input.maxMembers ?? 100,
      now,
      now,
    );
    insertMember.run(id, input.ownerId, "admin", now);
  });
  txn();

  return findById(id)!;
}

/**
 * Find an organization by its ID.
 */
export function findById(id: string): Organization | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM organizations WHERE id = ?").get(id) as OrgRow | undefined;
  return row ? toOrg(row) : null;
}

/**
 * Find an organization by its URL slug.
 */
export function findBySlug(slug: string): Organization | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM organizations WHERE slug = ?")
    .get(slug) as OrgRow | undefined;
  return row ? toOrg(row) : null;
}

/**
 * Add a member to an organization.
 */
export function addMember(orgId: string, userId: string, role = "member"): void {
  const db = getDb();
  db.prepare(
    `INSERT OR REPLACE INTO org_members (org_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)`,
  ).run(orgId, userId, role, new Date().toISOString());
}

/**
 * Remove a member from an organization.
 */
export function removeMember(orgId: string, userId: string): boolean {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM org_members WHERE org_id = ? AND user_id = ?")
    .run(orgId, userId);
  return result.changes > 0;
}

/**
 * List all members of an organization.
 */
export function listMembers(orgId: string): OrgMember[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM org_members WHERE org_id = ? ORDER BY joined_at")
    .all(orgId) as OrgMemberRow[];
  return rows.map(toMember);
}

/**
 * Update organization fields.
 */
export function updateOrg(id: string, input: UpdateOrgInput): Organization | null {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) { sets.push("name = ?"); values.push(input.name); }
  if (input.description !== undefined) { sets.push("description = ?"); values.push(input.description); }
  if (input.avatarUrl !== undefined) { sets.push("avatar_url = ?"); values.push(input.avatarUrl); }
  if (input.isPrivate !== undefined) { sets.push("is_private = ?"); values.push(input.isPrivate ? 1 : 0); }
  if (input.maxRepos !== undefined) { sets.push("max_repos = ?"); values.push(input.maxRepos); }
  if (input.maxMembers !== undefined) { sets.push("max_members = ?"); values.push(input.maxMembers); }

  if (sets.length === 0) return findById(id);

  sets.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  db.prepare(`UPDATE organizations SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return findById(id);
}

/**
 * Delete an organization and all its members (cascade).
 */
export function deleteOrg(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM organizations WHERE id = ?").run(id);
  return result.changes > 0;
}

/**
 * List all organizations a user is a member of.
 */
export function listByUser(userId: string): Organization[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT o.* FROM organizations o
       JOIN org_members om ON o.id = om.org_id
       WHERE om.user_id = ?
       ORDER BY o.name`,
    )
    .all(userId) as OrgRow[];
  return rows.map(toOrg);
}
