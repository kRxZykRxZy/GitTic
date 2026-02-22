/**
 * Comment repository - manages comments for issues and PRs using SQLite
 */

import { randomUUID } from "node:crypto";
import { getDb } from "../connection.js";
import * as notificationRepo from "./notification-repo.js";
import * as userRepo from "./user-repo.js";

interface Comment {
    id: string;
    authorId: string;
    body: string;
    createdAt: string;
    updatedAt: string;
}

interface IssueComment extends Comment {
    issueId: string;
}

interface PRComment extends Comment {
    prId: string;
}

interface CommentRow {
    id: string;
    author_id: string;
    body: string;
    created_at: string;
    updated_at: string;
}

interface IssueCommentRow extends CommentRow {
    issue_id: string;
}

interface PRCommentRow extends CommentRow {
    pr_id: string;
}

/**
 * Map issue comment row to IssueComment
 */
function toIssueComment(row: IssueCommentRow): IssueComment {
    return {
        id: row.id,
        issueId: row.issue_id,
        authorId: row.author_id,
        body: row.body,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

/**
 * Map PR comment row to PRComment
 */
function toPRComment(row: PRCommentRow): PRComment {
    return {
        id: row.id,
        prId: row.pr_id,
        authorId: row.author_id,
        body: row.body,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// ─────────────────────────────────────────────────────────────
// Issue Comments
// ─────────────────────────────────────────────────────────────

/**
 * Create a new issue comment and handle @mentions
 */
export function createIssueComment(
    issueId: string,
    authorId: string,
    body: string,
    issueTitle?: string
): IssueComment {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
        `INSERT INTO issue_comments (id, issue_id, author_id, body, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, issueId, authorId, body, now, now);

    // Update issue's updated_at timestamp
    db.prepare("UPDATE issues SET updated_at = ? WHERE id = ?").run(now, issueId);

    // Create mention notifications
    if (issueTitle) {
        notificationRepo.createMentionNotifications(
            body,
            authorId,
            "issue",
            issueId,
            issueTitle,
            (username) => {
                const user = userRepo.findByUsername(username);
                return user ? user.id : null;
            }
        );
    }

    return getIssueComment(id)!;
}

/**
 * Get an issue comment by ID
 */
export function getIssueComment(id: string): IssueComment | null {
    const db = getDb();
    const row = db
        .prepare("SELECT * FROM issue_comments WHERE id = ?")
        .get(id) as IssueCommentRow | undefined;
    return row ? toIssueComment(row) : null;
}

/**
 * List all comments for an issue
 */
export function listIssueComments(issueId: string): IssueComment[] {
    const db = getDb();
    const rows = db
        .prepare("SELECT * FROM issue_comments WHERE issue_id = ? ORDER BY created_at ASC")
        .all(issueId) as IssueCommentRow[];
    return rows.map(toIssueComment);
}

/**
 * Update an issue comment
 */
export function updateIssueComment(id: string, body: string): IssueComment | null {
    const db = getDb();
    const now = new Date().toISOString();

    db.prepare("UPDATE issue_comments SET body = ?, updated_at = ? WHERE id = ?")
        .run(body, now, id);

    return getIssueComment(id);
}

/**
 * Delete an issue comment
 */
export function deleteIssueComment(id: string): boolean {
    const db = getDb();
    const result = db.prepare("DELETE FROM issue_comments WHERE id = ?").run(id);
    return result.changes > 0;
}

/**
 * Count comments for an issue
 */
export function countIssueComments(issueId: string): number {
    const db = getDb();
    const result = db
        .prepare("SELECT COUNT(*) as count FROM issue_comments WHERE issue_id = ?")
        .get(issueId) as { count: number };
    return result.count;
}

// ─────────────────────────────────────────────────────────────
// PR Comments
// ─────────────────────────────────────────────────────────────

/**
 * Create a new PR comment and handle @mentions
 */
export function createPRComment(
    prId: string,
    authorId: string,
    body: string,
    prTitle?: string
): PRComment {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
        `INSERT INTO pr_comments (id, pr_id, author_id, body, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, prId, authorId, body, now, now);

    // Update PR's updated_at timestamp
    db.prepare("UPDATE pull_requests SET updated_at = ? WHERE id = ?").run(now, prId);

    // Create mention notifications
    if (prTitle) {
        notificationRepo.createMentionNotifications(
            body,
            authorId,
            "pull_request",
            prId,
            prTitle,
            (username) => {
                const user = userRepo.findByUsername(username);
                return user ? user.id : null;
            }
        );
    }

    return getPRComment(id)!;
}

/**
 * Get a PR comment by ID
 */
export function getPRComment(id: string): PRComment | null {
    const db = getDb();
    const row = db
        .prepare("SELECT * FROM pr_comments WHERE id = ?")
        .get(id) as PRCommentRow | undefined;
    return row ? toPRComment(row) : null;
}

/**
 * List all comments for a PR
 */
export function listPRComments(prId: string): PRComment[] {
    const db = getDb();
    const rows = db
        .prepare("SELECT * FROM pr_comments WHERE pr_id = ? ORDER BY created_at ASC")
        .all(prId) as PRCommentRow[];
    return rows.map(toPRComment);
}

/**
 * Update a PR comment
 */
export function updatePRComment(id: string, body: string): PRComment | null {
    const db = getDb();
    const now = new Date().toISOString();

    db.prepare("UPDATE pr_comments SET body = ?, updated_at = ? WHERE id = ?")
        .run(body, now, id);

    return getPRComment(id);
}

/**
 * Delete a PR comment
 */
export function deletePRComment(id: string): boolean {
    const db = getDb();
    const result = db.prepare("DELETE FROM pr_comments WHERE id = ?").run(id);
    return result.changes > 0;
}

/**
 * Count comments for a PR
 */
export function countPRComments(prId: string): number {
    const db = getDb();
    const result = db
        .prepare("SELECT COUNT(*) as count FROM pr_comments WHERE pr_id = ?")
        .get(prId) as { count: number };
    return result.count;
}

export type { Comment, IssueComment, PRComment };
