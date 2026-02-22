import { randomUUID } from "node:crypto";
import type { 
  Organization, 
  OrganizationMember, 
  OrganizationRole,
  Team,
  TeamMember,
  TeamPrivacy,
  TeamPermission 
} from "@platform/shared/types/organization";
import { getDb } from "../connection.js";

/** Row shape for organizations from SQLite. */
interface OrganizationRow {
  id: string;
  login: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  email: string | null;
  location: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

/** Row shape for organization members. */
interface MemberRow {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  role: string;
  joined_at: string;
}

/** Row shape for teams. */
interface TeamRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  privacy: string;
  permission: string | null;
  members_count: number;
  repos_count: number;
  created_at: string;
  updated_at: string;
}

/** Row shape for team members. */
interface TeamMemberRow {
  id: string;
  username: string;
  avatar_url: string | null;
  role: string;
  joined_at: string;
}

/** Map database row to Organization type. */
function toOrganization(row: OrganizationRow, stats?: { publicRepos: number; privateRepos: number; members: number }): Organization {
  return {
    id: row.id,
    login: row.login,
    name: row.name,
    description: row.description ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    email: row.email ?? undefined,
    location: row.location ?? undefined,
    website: row.website ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publicRepos: stats?.publicRepos ?? 0,
    privateRepos: stats?.privateRepos ?? 0,
    totalRepos: (stats?.publicRepos ?? 0) + (stats?.privateRepos ?? 0),
    members: stats?.members ?? 0,
  };
}

/** Map database row to OrganizationMember type. */
function toMember(row: MemberRow): OrganizationMember {
  return {
    id: row.id,
    username: row.username,
    email: row.email ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    role: row.role as OrganizationRole,
    joinedAt: row.joined_at,
  };
}

/** Map database row to Team type. */
function toTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    privacy: row.privacy as TeamPrivacy,
    permission: row.permission as TeamPermission | undefined,
    membersCount: row.members_count,
    reposCount: row.repos_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Map database row to TeamMember type. */
function toTeamMember(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    username: row.username,
    avatarUrl: row.avatar_url ?? undefined,
    role: row.role as 'member' | 'maintainer',
    joinedAt: row.joined_at,
  };
}

/** Fields for creating an organization. */
export interface CreateOrgInput {
  login: string;
  name: string;
  description?: string;
  email?: string;
  ownerId: string;
}

/** Fields for updating an organization. */
export interface UpdateOrgInput {
  name?: string;
  description?: string;
  avatarUrl?: string;
  email?: string;
  location?: string;
  website?: string;
}

/**
 * Create a new organization.
 */
export function createOrg(input: CreateOrgInput): Organization {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO organizations (
      id, login, name, description, email, owner_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.login,
    input.name,
    input.description || null,
    input.email || null,
    input.ownerId,
    now,
    now,
  );

  addMember(id, input.ownerId, 'owner');

  return getOrg(id)!;
}

/**
 * Get an organization by ID.
 */
export function getOrg(id: string): Organization | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM organizations WHERE id = ?")
    .get(id) as OrganizationRow | undefined;
  
  if (!row) return null;

  const stats = getOrgStats(id);
  return toOrganization(row, stats);
}

/**
 * Get an organization by login (slug).
 */
export function getOrgByLogin(login: string): Organization | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM organizations WHERE LOWER(login) = LOWER(?)")
    .get(login) as OrganizationRow | undefined;
  
  if (!row) return null;

  const stats = getOrgStats(row.id);
  return toOrganization(row, stats);
}

/**
 * Get organization statistics.
 */
function getOrgStats(orgId: string): { publicRepos: number; privateRepos: number; members: number } {
  const db = getDb();
  
  const repoStats = db
    .prepare(
      `SELECT 
        COUNT(CASE WHEN visibility = 'public' THEN 1 END) as public_repos,
        COUNT(CASE WHEN visibility = 'private' THEN 1 END) as private_repos
       FROM repositories WHERE org_id = ?`,
    )
    .get(orgId) as { public_repos: number; private_repos: number } | undefined;

  const memberCount = db
    .prepare("SELECT COUNT(*) as cnt FROM org_members WHERE org_id = ?")
    .get(orgId) as { cnt: number };

  return {
    publicRepos: repoStats?.public_repos ?? 0,
    privateRepos: repoStats?.private_repos ?? 0,
    members: memberCount?.cnt ?? 0,
  };
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
  if (input.email !== undefined) { sets.push("email = ?"); values.push(input.email); }
  if (input.location !== undefined) { sets.push("location = ?"); values.push(input.location); }
  if (input.website !== undefined) { sets.push("website = ?"); values.push(input.website); }

  if (sets.length === 0) return getOrg(id);

  sets.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  db.prepare(`UPDATE organizations SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return getOrg(id);
}

/**
 * Delete an organization by ID.
 */
export function deleteOrg(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM organizations WHERE id = ?").run(id);
  return result.changes > 0;
}

/**
 * Add a member to an organization.
 */
export function addMember(orgId: string, userId: string, role: OrganizationRole = 'member'): boolean {
  const db = getDb();
  const now = new Date().toISOString();

  try {
    db.prepare(
      `INSERT INTO org_members (org_id, user_id, role, joined_at)
       VALUES (?, ?, ?, ?)`,
    ).run(orgId, userId, role, now);
    return true;
  } catch (error) {
    return false;
  }
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
 * Get all members of an organization.
 */
export function getMembers(orgId: string): OrganizationMember[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT u.id, u.username, u.email, u.avatar_url, om.role, om.joined_at
       FROM org_members om
       JOIN users u ON om.user_id = u.id
       WHERE om.org_id = ?
       ORDER BY om.joined_at ASC`,
    )
    .all(orgId) as MemberRow[];
  return rows.map(toMember);
}

/**
 * Get a member's role in an organization.
 */
export function getMemberRole(orgId: string, userId: string): OrganizationRole | null {
  const db = getDb();
  const row = db
    .prepare("SELECT role FROM org_members WHERE org_id = ? AND user_id = ?")
    .get(orgId, userId) as { role: string } | undefined;
  return row ? (row.role as OrganizationRole) : null;
}

/**
 * Update a member's role.
 */
export function updateMemberRole(orgId: string, userId: string, role: OrganizationRole): boolean {
  const db = getDb();
  const result = db
    .prepare("UPDATE org_members SET role = ? WHERE org_id = ? AND user_id = ?")
    .run(role, orgId, userId);
  return result.changes > 0;
}

/**
 * List all organizations a user is a member of.
 */
export function listUserOrgs(userId: string): Organization[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT o.* FROM organizations o
       JOIN org_members om ON o.id = om.org_id
       WHERE om.user_id = ?
       ORDER BY o.created_at DESC`,
    )
    .all(userId) as OrganizationRow[];
  
  return rows.map(row => {
    const stats = getOrgStats(row.id);
    return toOrganization(row, stats);
  });
}

/**
 * Create a team within an organization.
 */
export function createTeam(
  orgId: string,
  name: string,
  slug: string,
  description?: string,
  privacy: TeamPrivacy = 'secret',
  permission?: TeamPermission,
): Team {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO teams (id, org_id, name, slug, description, privacy, permission, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, orgId, name, slug, description || null, privacy, permission || null, now, now);

  return getTeam(id)!;
}

/**
 * Get a team by ID.
 */
export function getTeam(id: string): Team | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT t.*, 
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as members_count,
        (SELECT COUNT(*) FROM team_repositories WHERE team_id = t.id) as repos_count
       FROM teams t WHERE t.id = ?`,
    )
    .get(id) as TeamRow | undefined;
  return row ? toTeam(row) : null;
}

/**
 * List all teams in an organization.
 */
export function listTeams(orgId: string): Team[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT t.*,
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as members_count,
        (SELECT COUNT(*) FROM team_repositories WHERE team_id = t.id) as repos_count
       FROM teams t WHERE t.org_id = ?
       ORDER BY t.created_at DESC`,
    )
    .all(orgId) as TeamRow[];
  return rows.map(toTeam);
}

/**
 * Delete a team.
 */
export function deleteTeam(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM teams WHERE id = ?").run(id);
  return result.changes > 0;
}

/**
 * Add a member to a team.
 */
export function addTeamMember(teamId: string, userId: string, role: 'member' | 'maintainer' = 'member'): boolean {
  const db = getDb();
  const now = new Date().toISOString();

  try {
    db.prepare(
      `INSERT INTO team_members (team_id, user_id, role, joined_at)
       VALUES (?, ?, ?, ?)`,
    ).run(teamId, userId, role, now);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Remove a member from a team.
 */
export function removeTeamMember(teamId: string, userId: string): boolean {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM team_members WHERE team_id = ? AND user_id = ?")
    .run(teamId, userId);
  return result.changes > 0;
}

/**
 * Get all members of a team.
 */
export function getTeamMembers(teamId: string): TeamMember[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT u.id, u.username, u.avatar_url, tm.role, tm.joined_at
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ?
       ORDER BY tm.joined_at ASC`,
    )
    .all(teamId) as TeamMemberRow[];
  return rows.map(toTeamMember);
}
