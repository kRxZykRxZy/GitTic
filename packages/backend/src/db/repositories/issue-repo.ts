/**
 * Issue repository - manages issues using SQLite
 */

import { randomUUID } from "node:crypto";
import { getDb } from "../connection.js";

interface Issue {
  id: string;
  number: number;
  repositoryId: string;
  title: string;
  body?: string;
  state: "open" | "closed";
  authorId: string;
  closedAt?: string;
  closedById?: string;
  createdAt: string;
  updatedAt: string;
}

interface IssueRow {
  id: string;
  number: number;
  repository_id: string;
  title: string;
  body: string | null;
  state: string;
  author_id: string;
  closed_at: string | null;
  closed_by_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateIssueData {
  repositoryId: string;
  title: string;
  body?: string;
  authorId: string;
  assignees?: string[];
  labels?: string[];
}

interface UpdateIssueData {
  title?: string;
  body?: string;
  state?: "open" | "closed";
  closedAt?: string;
  closedById?: string;
}

interface PaginationOptions {
  page: number;
  perPage: number;
}

/**
 * Map database row to Issue
 */
function toIssue(row: IssueRow): Issue {
  return {
    id: row.id,
    number: row.number,
    repositoryId: row.repository_id,
    title: row.title,
    body: row.body || undefined,
    state: row.state as "open" | "closed",
    authorId: row.author_id,
    closedAt: row.closed_at || undefined,
    closedById: row.closed_by_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Create a new issue
 */
export function create(data: CreateIssueData): Issue {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  
  // Get next issue number for this repository
  const lastIssue = db
    .prepare("SELECT MAX(number) as max_number FROM issues WHERE repository_id = ?")
    .get(data.repositoryId) as { max_number: number | null };
  const number = (lastIssue.max_number || 0) + 1;
  
  db.prepare(
    `INSERT INTO issues (
      id, number, repository_id, title, body, state, author_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    number,
    data.repositoryId,
    data.title,
    data.body || null,
    "open",
    data.authorId,
    now,
    now
  );
  
  // Add assignees if provided
  if (data.assignees && data.assignees.length > 0) {
    const stmt = db.prepare(
      "INSERT INTO issue_assignees (issue_id, user_id) VALUES (?, ?)"
    );
    for (const assigneeId of data.assignees) {
      stmt.run(id, assigneeId);
    }
  }
  
  // Add labels if provided
  if (data.labels && data.labels.length > 0) {
    const stmt = db.prepare(
      "INSERT INTO issue_labels (issue_id, label) VALUES (?, ?)"
    );
    for (const label of data.labels) {
      stmt.run(id, label);
    }
  }
  
  return findById(id)!;
}

/**
 * Find issue by ID
 */
export function findById(id: string): Issue | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM issues WHERE id = ?")
    .get(id) as IssueRow | undefined;
  return row ? toIssue(row) : null;
}

/**
 * Find issue by repository and number
 */
export function findByNumber(repositoryId: string, number: number): Issue | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM issues WHERE repository_id = ? AND number = ?")
    .get(repositoryId, number) as IssueRow | undefined;
  return row ? toIssue(row) : null;
}

/**
 * List issues for a repository
 */
export function listByRepository(
  repositoryId: string,
  options: PaginationOptions,
  state?: "open" | "closed" | "all"
): Issue[] {
  const db = getDb();
  const { page, perPage } = options;
  const offset = (page - 1) * perPage;
  
  let query = "SELECT * FROM issues WHERE repository_id = ?";
  const params: unknown[] = [repositoryId];
  
  if (state && state !== "all") {
    query += " AND state = ?";
    params.push(state);
  }
  
  query += " ORDER BY number DESC LIMIT ? OFFSET ?";
  params.push(perPage, offset);
  
  const rows = db.prepare(query).all(...params) as IssueRow[];
  return rows.map(toIssue);
}

/**
 * List issues by author
 */
export function listByAuthor(
  authorId: string,
  options: PaginationOptions,
  state?: "open" | "closed" | "all"
): Issue[] {
  const db = getDb();
  const { page, perPage } = options;
  const offset = (page - 1) * perPage;
  
  let query = "SELECT * FROM issues WHERE author_id = ?";
  const params: unknown[] = [authorId];
  
  if (state && state !== "all") {
    query += " AND state = ?";
    params.push(state);
  }
  
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(perPage, offset);
  
  const rows = db.prepare(query).all(...params) as IssueRow[];
  return rows.map(toIssue);
}

/**
 * Update an issue
 */
export function update(id: string, data: UpdateIssueData): Issue | null {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];
  
  if (data.title !== undefined) { sets.push("title = ?"); values.push(data.title); }
  if (data.body !== undefined) { sets.push("body = ?"); values.push(data.body); }
  if (data.state !== undefined) { sets.push("state = ?"); values.push(data.state); }
  if (data.closedAt !== undefined) { sets.push("closed_at = ?"); values.push(data.closedAt); }
  if (data.closedById !== undefined) { sets.push("closed_by_id = ?"); values.push(data.closedById); }
  
  if (sets.length === 0) return findById(id);
  
  sets.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);
  
  db.prepare(`UPDATE issues SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return findById(id);
}

/**
 * Close an issue
 */
export function close(id: string, closedById?: string): Issue | null {
  return update(id, {
    state: "closed",
    closedAt: new Date().toISOString(),
    closedById,
  });
}

/**
 * Reopen an issue
 */
export function reopen(id: string): Issue | null {
  return update(id, {
    state: "open",
    closedAt: undefined,
    closedById: undefined,
  });
}

/**
 * Delete an issue
 */
export function deleteIssue(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM issues WHERE id = ?").run(id);
  return result.changes > 0;
}

/**
 * Count issues for a repository
 */
export function countByRepository(repositoryId: string, state?: "open" | "closed" | "all"): number {
  const db = getDb();
  
  let query = "SELECT COUNT(*) as count FROM issues WHERE repository_id = ?";
  const params: unknown[] = [repositoryId];
  
  if (state && state !== "all") {
    query += " AND state = ?";
    params.push(state);
  }
  
  const result = db.prepare(query).get(...params) as { count: number };
  return result.count;
}

/**
 * Add assignee to issue
 */
export function addAssignee(id: string, assigneeId: string): Issue | null {
  const db = getDb();
  
  try {
    db.prepare("INSERT INTO issue_assignees (issue_id, user_id) VALUES (?, ?)")
      .run(id, assigneeId);
  } catch {
    // Already exists, ignore
  }
  
  db.prepare("UPDATE issues SET updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), id);
  
  return findById(id);
}

/**
 * Remove assignee from issue
 */
export function removeAssignee(id: string, assigneeId: string): Issue | null {
  const db = getDb();
  
  db.prepare("DELETE FROM issue_assignees WHERE issue_id = ? AND user_id = ?")
    .run(id, assigneeId);
  
  db.prepare("UPDATE issues SET updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), id);
  
  return findById(id);
}

/**
 * Get assignees for an issue
 */
export function getAssignees(issueId: string): string[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT user_id FROM issue_assignees WHERE issue_id = ? ORDER BY assigned_at ASC")
    .all(issueId) as Array<{ user_id: string }>;
  return rows.map(r => r.user_id);
}

export type { Issue, CreateIssueData, UpdateIssueData, PaginationOptions };
