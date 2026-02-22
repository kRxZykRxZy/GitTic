/**
 * Discussion repository - manages discussions using SQLite
 */

import { randomUUID } from "node:crypto";
import { getDb } from "../connection.js";

interface Discussion {
  id: string;
  number: number;
  repositoryId: string;
  title: string;
  body?: string;
  category: string;
  state: "open" | "closed";
  authorId: string;
  closedAt?: string;
  closedById?: string;
  createdAt: string;
  updatedAt: string;
}

interface DiscussionRow {
  id: string;
  number: number;
  repository_id: string;
  title: string;
  body: string | null;
  category: string;
  state: string;
  author_id: string;
  closed_at: string | null;
  closed_by_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateDiscussionData {
  repositoryId: string;
  title: string;
  body?: string;
  category?: string;
  authorId: string;
}

interface UpdateDiscussionData {
  title?: string;
  body?: string;
  category?: string;
  state?: "open" | "closed";
  closedAt?: string;
  closedById?: string;
}

interface PaginationOptions {
  page: number;
  perPage: number;
}

/**
 * Map database row to Discussion
 */
function toDiscussion(row: DiscussionRow): Discussion {
  return {
    id: row.id,
    number: row.number,
    repositoryId: row.repository_id,
    title: row.title,
    body: row.body || undefined,
    category: row.category,
    state: row.state as "open" | "closed",
    authorId: row.author_id,
    closedAt: row.closed_at || undefined,
    closedById: row.closed_by_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Create a new discussion
 */
export function create(data: CreateDiscussionData): Discussion {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  
  // Get next discussion number for this repository
  const lastDiscussion = db
    .prepare("SELECT MAX(number) as max_number FROM discussions WHERE repository_id = ?")
    .get(data.repositoryId) as { max_number: number | null };
  const number = (lastDiscussion.max_number || 0) + 1;
  
  db.prepare(
    `INSERT INTO discussions (
      id, number, repository_id, title, body, category, state, author_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    number,
    data.repositoryId,
    data.title,
    data.body || null,
    data.category || "general",
    "open",
    data.authorId,
    now,
    now
  );
  
  return findById(id)!;
}

/**
 * Find discussion by ID
 */
export function findById(id: string): Discussion | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM discussions WHERE id = ?")
    .get(id) as DiscussionRow | undefined;
  return row ? toDiscussion(row) : null;
}

/**
 * Find discussion by repository and number
 */
export function findByNumber(repositoryId: string, number: number): Discussion | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM discussions WHERE repository_id = ? AND number = ?")
    .get(repositoryId, number) as DiscussionRow | undefined;
  return row ? toDiscussion(row) : null;
}

/**
 * List discussions for a repository
 */
export function listByRepository(
  repositoryId: string,
  options: PaginationOptions,
  category?: string,
  state?: "open" | "closed" | "all"
): Discussion[] {
  const db = getDb();
  const { page, perPage } = options;
  const offset = (page - 1) * perPage;
  
  let query = "SELECT * FROM discussions WHERE repository_id = ?";
  const params: unknown[] = [repositoryId];
  
  if (category) {
    query += " AND category = ?";
    params.push(category);
  }
  
  if (state && state !== "all") {
    query += " AND state = ?";
    params.push(state);
  }
  
  query += " ORDER BY number DESC LIMIT ? OFFSET ?";
  params.push(perPage, offset);
  
  const rows = db.prepare(query).all(...params) as DiscussionRow[];
  return rows.map(toDiscussion);
}

/**
 * Update a discussion
 */
export function update(id: string, data: UpdateDiscussionData): Discussion | null {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];
  
  if (data.title !== undefined) { sets.push("title = ?"); values.push(data.title); }
  if (data.body !== undefined) { sets.push("body = ?"); values.push(data.body); }
  if (data.category !== undefined) { sets.push("category = ?"); values.push(data.category); }
  if (data.state !== undefined) { sets.push("state = ?"); values.push(data.state); }
  if (data.closedAt !== undefined) { sets.push("closed_at = ?"); values.push(data.closedAt); }
  if (data.closedById !== undefined) { sets.push("closed_by_id = ?"); values.push(data.closedById); }
  
  if (sets.length === 0) return findById(id);
  
  sets.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);
  
  db.prepare(`UPDATE discussions SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return findById(id);
}

/**
 * Close a discussion
 */
export function close(id: string, closedById?: string): Discussion | null {
  return update(id, {
    state: "closed",
    closedAt: new Date().toISOString(),
    closedById,
  });
}

/**
 * Reopen a discussion
 */
export function reopen(id: string): Discussion | null {
  return update(id, {
    state: "open",
    closedAt: undefined,
    closedById: undefined,
  });
}

/**
 * Delete a discussion
 */
export function deleteDiscussion(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM discussions WHERE id = ?").run(id);
  return result.changes > 0;
}

/**
 * Count discussions for a repository
 */
export function countByRepository(
  repositoryId: string,
  category?: string,
  state?: "open" | "closed" | "all"
): number {
  const db = getDb();
  
  let query = "SELECT COUNT(*) as count FROM discussions WHERE repository_id = ?";
  const params: unknown[] = [repositoryId];
  
  if (category) {
    query += " AND category = ?";
    params.push(category);
  }
  
  if (state && state !== "all") {
    query += " AND state = ?";
    params.push(state);
  }
  
  const result = db.prepare(query).get(...params) as { count: number };
  return result.count;
}

export type { Discussion, CreateDiscussionData, UpdateDiscussionData, PaginationOptions };
