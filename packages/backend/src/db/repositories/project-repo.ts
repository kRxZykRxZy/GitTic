import { randomUUID } from "node:crypto";
import type { Project } from "@platform/shared";
import { getDb } from "../connection.js";

/** Row shape from SQLite. */
interface ProjectRow {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    owner_id: string;
    org_id: string | null;
    is_private: number;
    default_branch: string;
    forked_from_id: string | null;
    clone_count: number;
    star_count: number;
    storage_path: string;
    created_at: string;
    updated_at: string;
}

/** Map a row to the shared Project type. */
function toProject(row: ProjectRow): Project {
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description ?? undefined,
        ownerId: row.owner_id,
        orgId: row.org_id ?? undefined,
        isPrivate: row.is_private === 1,
        defaultBranch: row.default_branch,
        forkedFromId: row.forked_from_id ?? undefined,
        cloneCount: row.clone_count,
        starCount: row.star_count,
        storagePath: row.storage_path,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

/** Input for creating a project. */
export interface CreateProjectInput {
    name: string;
    slug: string;
    ownerId: string;
    storagePath: string;
    description?: string;
    orgId?: string;
    isPrivate?: boolean;
    defaultBranch?: string;
}

/** Input for updating a project. */
export interface UpdateProjectInput {
    name?: string;
    description?: string;
    isPrivate?: boolean;
    defaultBranch?: string;
    starCount?: number;
}

/** Pagination options. */
export interface PaginationOpts {
    page: number;
    perPage: number;
}

/**
 * Create a new project.
 */
export function createProject(input: CreateProjectInput): Project {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
        `INSERT INTO projects (id, name, slug, description, owner_id, org_id, is_private, default_branch, storage_path, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
        id,
        input.name,
        input.slug,
        input.description || null,
        input.ownerId,
        input.orgId || null,
        input.isPrivate ? 1 : 0,
        input.defaultBranch || "main",
        input.storagePath,
        now,
        now,
    );

    return findById(id)!;
}

/**
 * Find a project by its ID.
 */
export function findById(id: string): Project | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow | undefined;
    return row ? toProject(row) : null;
}

/**
 * Find a project by owner + slug combination.
 */
export function findBySlug(ownerId: string, slug: string): Project | null {
    const db = getDb();
    const row = db
        .prepare("SELECT * FROM projects WHERE owner_id = ? AND slug = ?")
        .get(ownerId, slug) as ProjectRow | undefined;
    return row ? toProject(row) : null;
}

/**
 * Find all projects owned by a specific user.
 */
export function findByOwner(ownerId: string, opts: PaginationOpts): Project[] {
    const db = getDb();
    const offset = (opts.page - 1) * opts.perPage;
    const rows = db
        .prepare("SELECT * FROM projects WHERE owner_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?")
        .all(ownerId, opts.perPage, offset) as ProjectRow[];
    return rows.map(toProject);
}

/**
 * Find all projects within an organization.
 */
export function findByOrg(orgId: string, opts: PaginationOpts): Project[] {
    const db = getDb();
    const offset = (opts.page - 1) * opts.perPage;
    const rows = db
        .prepare("SELECT * FROM projects WHERE org_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?")
        .all(orgId, opts.perPage, offset) as ProjectRow[];
    return rows.map(toProject);
}

/**
 * Update project fields.
 */
export function updateProject(id: string, input: UpdateProjectInput): Project | null {
    const db = getDb();
    const sets: string[] = [];
    const values: unknown[] = [];

    if (input.name !== undefined) { sets.push("name = ?"); values.push(input.name); }
    if (input.description !== undefined) { sets.push("description = ?"); values.push(input.description); }
    if (input.isPrivate !== undefined) { sets.push("is_private = ?"); values.push(input.isPrivate ? 1 : 0); }
    if (input.defaultBranch !== undefined) { sets.push("default_branch = ?"); values.push(input.defaultBranch); }
    if (input.starCount !== undefined) { sets.push("star_count = ?"); values.push(input.starCount); }

    if (sets.length === 0) return findById(id);

    sets.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    db.prepare(`UPDATE projects SET ${sets.join(", ")} WHERE id = ?`).run(...values);
    return findById(id);
}

/**
 * Delete a project by ID.
 */
export function deleteProject(id: string): boolean {
    const db = getDb();
    const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
    return result.changes > 0;
}

/**
 * List all projects with pagination (public projects only by default).
 */
export function listProjects(opts: PaginationOpts, includePrivate = false): Project[] {
    const db = getDb();
    const offset = (opts.page - 1) * opts.perPage;
    const where = includePrivate ? "" : "WHERE is_private = 0";
    const rows = db
        .prepare(`SELECT * FROM projects ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
        .all(opts.perPage, offset) as ProjectRow[];
    return rows.map(toProject);
}

/**
 * Search projects by name or description.
 */
export function searchProjects(query: string, opts: PaginationOpts): Project[] {
    const db = getDb();
    const offset = (opts.page - 1) * opts.perPage;
    const pattern = `%${query}%`;
    const rows = db
        .prepare(
            `SELECT * FROM projects
       WHERE is_private = 0 AND (name LIKE ? OR description LIKE ?)
       ORDER BY star_count DESC, created_at DESC LIMIT ? OFFSET ?`,
        )
        .all(pattern, pattern, opts.perPage, offset) as ProjectRow[];
    return rows.map(toProject);
}

/**
 * Increment the clone counter for a project.
 */
export function incrementCloneCount(id: string): void {
    const db = getDb();
    db.prepare("UPDATE projects SET clone_count = clone_count + 1 WHERE id = ?").run(id);
}

/**
 * Fork a project: creates a new project referencing the original.
 */
export function forkProject(
    sourceId: string,
    newOwnerId: string,
    newSlug: string,
    newStoragePath: string,
): Project | null {
    const source = findById(sourceId);
    if (!source) return null;

    const id = randomUUID();
    const now = new Date().toISOString();
    const db = getDb();

    db.prepare(
        `INSERT INTO projects (id, name, slug, description, owner_id, is_private, default_branch, forked_from_id, storage_path, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
    ).run(id, source.name, newSlug, source.description || null, newOwnerId, source.defaultBranch, sourceId, newStoragePath, now, now);

    return findById(id);
}

export function countProjects(): number {
    const db = getDb();
    const result = db.prepare("SELECT COUNT(*) as count FROM projects").get() as { count: number };
    return result.count;
}

/**
 * Count the number of forks derived from a project.
 */
export function countForksBySourceProject(sourceProjectId: string): number {
    const db = getDb();
    const result = db
        .prepare("SELECT COUNT(*) as count FROM projects WHERE forked_from_id = ?")
        .get(sourceProjectId) as { count: number };
    return result.count;
}
