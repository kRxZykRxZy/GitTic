/**
 * Pull Request repository - manages PR data storage and retrieval using SQLite
 */

import { randomUUID } from "node:crypto";
import { getDb } from "../connection.js";

interface PullRequest {
  id: string;
  number: number;
  repositoryId: string;
  title: string;
  description: string;
  baseBranch: string;
  headBranch: string;
  state: "open" | "closed" | "merged";
  authorId: string;
  isDraft: boolean;
  mergeCommitSha?: string;
  mergedAt?: string;
  mergedById?: string;
  closedAt?: string;
  closedById?: string;
  createdAt: string;
  updatedAt: string;
}

interface PullRequestRow {
  id: string;
  number: number;
  repository_id: string;
  title: string;
  description: string | null;
  base_branch: string;
  head_branch: string;
  state: string;
  author_id: string;
  is_draft: number;
  merge_commit_sha: string | null;
  merged_at: string | null;
  merged_by_id: string | null;
  closed_at: string | null;
  closed_by_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CreatePullRequestData {
  repositoryId: string;
  title: string;
  description?: string;
  baseBranch: string;
  headBranch: string;
  authorId: string;
  isDraft?: boolean;
  assignees?: string[];
  reviewers?: string[];
  labels?: string[];
}

interface UpdatePullRequestData {
  title?: string;
  description?: string;
  state?: "open" | "closed" | "merged";
  isDraft?: boolean;
  mergeCommitSha?: string;
  mergedAt?: string;
  mergedById?: string;
  closedAt?: string;
  closedById?: string;
}

interface PaginationOptions {
  page: number;
  perPage: number;
}

interface PullRequestReviewRow {
  id: string;
  pr_id: string;
  user_id: string;
  state: string;
  body: string | null;
  commit_sha: string | null;
  submitted_at: string;
}

export interface PullRequestReview {
  id: string;
  prId: string;
  userId: string;
  state: string;
  body?: string;
  commitSha?: string;
  submittedAt: string;
}

function toPullRequestReview(row: PullRequestReviewRow): PullRequestReview {
  return {
    id: row.id,
    prId: row.pr_id,
    userId: row.user_id,
    state: row.state,
    body: row.body ?? undefined,
    commitSha: row.commit_sha ?? undefined,
    submittedAt: row.submitted_at,
  };
}

/**
 * Map database row to PullRequest
 */
function toPullRequest(row: PullRequestRow): PullRequest {
  return {
    id: row.id,
    number: row.number,
    repositoryId: row.repository_id,
    title: row.title,
    description: row.description || "",
    baseBranch: row.base_branch,
    headBranch: row.head_branch,
    state: row.state as "open" | "closed" | "merged",
    authorId: row.author_id,
    isDraft: row.is_draft === 1,
    mergeCommitSha: row.merge_commit_sha || undefined,
    mergedAt: row.merged_at || undefined,
    mergedById: row.merged_by_id || undefined,
    closedAt: row.closed_at || undefined,
    closedById: row.closed_by_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Create a new pull request
 */
export function create(data: CreatePullRequestData): PullRequest {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  
  // Get next PR number for this repository
  const lastPR = db
    .prepare("SELECT MAX(number) as max_number FROM pull_requests WHERE repository_id = ?")
    .get(data.repositoryId) as { max_number: number | null };
  const number = (lastPR.max_number || 0) + 1;
  
  db.prepare(
    `INSERT INTO pull_requests (
      id, number, repository_id, title, description, base_branch, head_branch,
      state, author_id, is_draft, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    number,
    data.repositoryId,
    data.title,
    data.description || null,
    data.baseBranch,
    data.headBranch,
    "open",
    data.authorId,
    data.isDraft ? 1 : 0,
    now,
    now
  );
  
  // Add reviewers if provided
  if (data.reviewers && data.reviewers.length > 0) {
    const stmt = db.prepare(
      "INSERT INTO pr_reviewers (pr_id, user_id) VALUES (?, ?)"
    );
    for (const reviewerId of data.reviewers) {
      stmt.run(id, reviewerId);
    }
  }
  
  // Add assignees if provided
  if (data.assignees && data.assignees.length > 0) {
    const stmt = db.prepare(
      "INSERT INTO pr_assignees (pr_id, user_id) VALUES (?, ?)"
    );
    for (const assigneeId of data.assignees) {
      stmt.run(id, assigneeId);
    }
  }
  
  // Add labels if provided
  if (data.labels && data.labels.length > 0) {
    const stmt = db.prepare(
      "INSERT INTO pr_labels (pr_id, label) VALUES (?, ?)"
    );
    for (const label of data.labels) {
      stmt.run(id, label);
    }
  }
  
  return findById(id)!;
}

/**
 * Find pull request by ID
 */
export function findById(id: string): PullRequest | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM pull_requests WHERE id = ?")
    .get(id) as PullRequestRow | undefined;
  return row ? toPullRequest(row) : null;
}

/**
 * Find pull request by repository and number
 */
export function findByNumber(repositoryId: string, number: number): PullRequest | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM pull_requests WHERE repository_id = ? AND number = ?")
    .get(repositoryId, number) as PullRequestRow | undefined;
  return row ? toPullRequest(row) : null;
}

/**
 * List pull requests for a repository
 */
export function listByProject(
  repositoryId: string,
  options: PaginationOptions,
  state?: "open" | "closed" | "merged" | "all"
): PullRequest[] {
  const db = getDb();
  const { page, perPage } = options;
  const offset = (page - 1) * perPage;
  
  let query = "SELECT * FROM pull_requests WHERE repository_id = ?";
  const params: unknown[] = [repositoryId];
  
  if (state && state !== "all") {
    query += " AND state = ?";
    params.push(state);
  }
  
  query += " ORDER BY number DESC LIMIT ? OFFSET ?";
  params.push(perPage, offset);
  
  const rows = db.prepare(query).all(...params) as PullRequestRow[];
  return rows.map(toPullRequest);
}

/**
 * List pull requests by author
 */
export function listByAuthor(
  authorId: string,
  options: PaginationOptions,
  state?: "open" | "closed" | "merged" | "all"
): PullRequest[] {
  const db = getDb();
  const { page, perPage } = options;
  const offset = (page - 1) * perPage;
  
  let query = "SELECT * FROM pull_requests WHERE author_id = ?";
  const params: unknown[] = [authorId];
  
  if (state && state !== "all") {
    query += " AND state = ?";
    params.push(state);
  }
  
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(perPage, offset);
  
  const rows = db.prepare(query).all(...params) as PullRequestRow[];
  return rows.map(toPullRequest);
}

/**
 * Update a pull request
 */
export function update(id: string, data: UpdatePullRequestData): PullRequest | null {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];
  
  if (data.title !== undefined) { sets.push("title = ?"); values.push(data.title); }
  if (data.description !== undefined) { sets.push("description = ?"); values.push(data.description); }
  if (data.state !== undefined) { sets.push("state = ?"); values.push(data.state); }
  if (data.isDraft !== undefined) { sets.push("is_draft = ?"); values.push(data.isDraft ? 1 : 0); }
  if (data.mergeCommitSha !== undefined) { sets.push("merge_commit_sha = ?"); values.push(data.mergeCommitSha); }
  if (data.mergedAt !== undefined) { sets.push("merged_at = ?"); values.push(data.mergedAt); }
  if (data.mergedById !== undefined) { sets.push("merged_by_id = ?"); values.push(data.mergedById); }
  if (data.closedAt !== undefined) { sets.push("closed_at = ?"); values.push(data.closedAt); }
  if (data.closedById !== undefined) { sets.push("closed_by_id = ?"); values.push(data.closedById); }
  
  if (sets.length === 0) return findById(id);
  
  sets.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);
  
  db.prepare(`UPDATE pull_requests SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return findById(id);
}

/**
 * Mark pull request as merged
 */
export function markAsMerged(id: string, mergeCommitSha: string, mergedById?: string): PullRequest | null {
  return update(id, {
    state: "merged",
    mergeCommitSha,
    mergedAt: new Date().toISOString(),
    mergedById,
  });
}

/**
 * Close a pull request
 */
export function close(id: string, closedById?: string): PullRequest | null {
  return update(id, {
    state: "closed",
    closedAt: new Date().toISOString(),
    closedById,
  });
}

/**
 * Reopen a pull request
 */
export function reopen(id: string): PullRequest | null {
  return update(id, {
    state: "open",
    closedAt: undefined,
    closedById: undefined,
  });
}

/**
 * Delete a pull request
 */
export function deletePullRequest(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM pull_requests WHERE id = ?").run(id);
  return result.changes > 0;
}

/**
 * Count pull requests for a repository
 */
export function countByProject(repositoryId: string, state?: "open" | "closed" | "merged" | "all"): number {
  const db = getDb();
  
  let query = "SELECT COUNT(*) as count FROM pull_requests WHERE repository_id = ?";
  const params: unknown[] = [repositoryId];
  
  if (state && state !== "all") {
    query += " AND state = ?";
    params.push(state);
  }
  
  const result = db.prepare(query).get(...params) as { count: number };
  return result.count;
}

/**
 * Check if a PR exists with the same head and base branches
 */
export function findExisting(
  repositoryId: string,
  baseBranch: string,
  headBranch: string
): PullRequest | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT * FROM pull_requests 
       WHERE repository_id = ? AND base_branch = ? AND head_branch = ? AND state = 'open'`
    )
    .get(repositoryId, baseBranch, headBranch) as PullRequestRow | undefined;
  return row ? toPullRequest(row) : null;
}

/**
 * Add reviewer to PR
 */
export function addReviewer(id: string, reviewerId: string): PullRequest | null {
  const db = getDb();
  
  try {
    db.prepare("INSERT INTO pr_reviewers (pr_id, user_id) VALUES (?, ?)")
      .run(id, reviewerId);
  } catch {
    // Already exists, ignore
  }
  
  db.prepare("UPDATE pull_requests SET updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), id);
  
  return findById(id);
}

/**
 * Remove reviewer from PR
 */
export function removeReviewer(id: string, reviewerId: string): PullRequest | null {
  const db = getDb();
  
  db.prepare("DELETE FROM pr_reviewers WHERE pr_id = ? AND user_id = ?")
    .run(id, reviewerId);
  
  db.prepare("UPDATE pull_requests SET updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), id);
  
  return findById(id);
}

/**
 * Add assignee to PR
 */
export function addAssignee(id: string, assigneeId: string): PullRequest | null {
  const db = getDb();
  
  try {
    db.prepare("INSERT INTO pr_assignees (pr_id, user_id) VALUES (?, ?)")
      .run(id, assigneeId);
  } catch {
    // Already exists, ignore
  }
  
  db.prepare("UPDATE pull_requests SET updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), id);
  
  return findById(id);
}

/**
 * Remove assignee from PR
 */
export function removeAssignee(id: string, assigneeId: string): PullRequest | null {
  const db = getDb();
  
  db.prepare("DELETE FROM pr_assignees WHERE pr_id = ? AND user_id = ?")
    .run(id, assigneeId);
  
  db.prepare("UPDATE pull_requests SET updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), id);
  
  return findById(id);
}

export function listReviews(prId: string): PullRequestReview[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM pr_reviews WHERE pr_id = ? ORDER BY submitted_at DESC")
    .all(prId) as PullRequestReviewRow[];
  return rows.map(toPullRequestReview);
}

export function countApprovals(prId: string): number {
  const db = getDb();
  const result = db
    .prepare(
      `SELECT COUNT(*) as count FROM (
        SELECT user_id, MAX(submitted_at) as latest
        FROM pr_reviews
        WHERE pr_id = ?
        GROUP BY user_id
      ) latest_reviews
      JOIN pr_reviews reviews
        ON reviews.pr_id = ?
       AND reviews.user_id = latest_reviews.user_id
       AND reviews.submitted_at = latest_reviews.latest
      WHERE reviews.state = 'approved'`
    )
    .get(prId, prId) as { count: number };
  return result.count;
}

export type { PullRequest, CreatePullRequestData, UpdatePullRequestData, PaginationOptions };
