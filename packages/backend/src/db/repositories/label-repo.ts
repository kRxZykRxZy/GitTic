/**
 * Label repository - manages labels for repositories using SQLite
 */

import { randomUUID } from "node:crypto";
import { getDb } from "../connection.js";

interface Label {
  id: string;
  repositoryId: string;
  name: string;
  color: string;
  description?: string;
  createdAt: string;
}

interface LabelRow {
  id: string;
  repository_id: string;
  name: string;
  color: string;
  description: string | null;
  created_at: string;
}

/**
 * Map label row to Label
 */
function toLabel(row: LabelRow): Label {
  return {
    id: row.id,
    repositoryId: row.repository_id,
    name: row.name,
    color: row.color,
    description: row.description || undefined,
    createdAt: row.created_at,
  };
}

/**
 * Create a new label
 */
export function createLabel(
  repositoryId: string,
  name: string,
  color: string,
  description?: string
): Label {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  
  db.prepare(
    `INSERT INTO labels (id, repository_id, name, color, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, repositoryId, name, color, description || null, now);
  
  return getLabel(id)!;
}

/**
 * Get a label by ID
 */
export function getLabel(id: string): Label | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM labels WHERE id = ?")
    .get(id) as LabelRow | undefined;
  return row ? toLabel(row) : null;
}

/**
 * Find a label by repository and name
 */
export function findLabelByName(repositoryId: string, name: string): Label | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM labels WHERE repository_id = ? AND name = ?")
    .get(repositoryId, name) as LabelRow | undefined;
  return row ? toLabel(row) : null;
}

/**
 * List all labels for a repository
 */
export function listLabels(repositoryId: string): Label[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM labels WHERE repository_id = ? ORDER BY name ASC")
    .all(repositoryId) as LabelRow[];
  return rows.map(toLabel);
}

/**
 * Update a label
 */
export function updateLabel(
  id: string,
  updates: { name?: string; color?: string; description?: string }
): Label | null {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];
  
  if (updates.name !== undefined) { sets.push("name = ?"); values.push(updates.name); }
  if (updates.color !== undefined) { sets.push("color = ?"); values.push(updates.color); }
  if (updates.description !== undefined) { sets.push("description = ?"); values.push(updates.description); }
  
  if (sets.length === 0) return getLabel(id);
  
  values.push(id);
  
  db.prepare(`UPDATE labels SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return getLabel(id);
}

/**
 * Delete a label
 */
export function deleteLabel(id: string): boolean {
  const db = getDb();
  
  // Remove label from all issues and PRs
  db.prepare("DELETE FROM issue_labels WHERE label = (SELECT name FROM labels WHERE id = ?)").run(id);
  db.prepare("DELETE FROM pr_labels WHERE label = (SELECT name FROM labels WHERE id = ?)").run(id);
  
  const result = db.prepare("DELETE FROM labels WHERE id = ?").run(id);
  return result.changes > 0;
}

/**
 * Add a label to an issue
 */
export function addIssueLabel(issueId: string, labelName: string): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  
  try {
    db.prepare("INSERT INTO issue_labels (issue_id, label, added_at) VALUES (?, ?, ?)")
      .run(issueId, labelName, now);
    
    // Update issue's updated_at timestamp
    db.prepare("UPDATE issues SET updated_at = ? WHERE id = ?").run(now, issueId);
    
    return true;
  } catch {
    // Already exists, ignore
    return false;
  }
}

/**
 * Remove a label from an issue
 */
export function removeIssueLabel(issueId: string, labelName: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM issue_labels WHERE issue_id = ? AND label = ?")
    .run(issueId, labelName);
  
  if (result.changes > 0) {
    const now = new Date().toISOString();
    db.prepare("UPDATE issues SET updated_at = ? WHERE id = ?").run(now, issueId);
  }
  
  return result.changes > 0;
}

/**
 * Get labels for an issue
 */
export function getIssueLabels(issueId: string): string[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT label FROM issue_labels WHERE issue_id = ? ORDER BY added_at ASC")
    .all(issueId) as Array<{ label: string }>;
  return rows.map(r => r.label);
}

/**
 * Add a label to a PR
 */
export function addPRLabel(prId: string, labelName: string): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  
  try {
    db.prepare("INSERT INTO pr_labels (pr_id, label, added_at) VALUES (?, ?, ?)")
      .run(prId, labelName, now);
    
    // Update PR's updated_at timestamp
    db.prepare("UPDATE pull_requests SET updated_at = ? WHERE id = ?").run(now, prId);
    
    return true;
  } catch {
    // Already exists, ignore
    return false;
  }
}

/**
 * Remove a label from a PR
 */
export function removePRLabel(prId: string, labelName: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM pr_labels WHERE pr_id = ? AND label = ?")
    .run(prId, labelName);
  
  if (result.changes > 0) {
    const now = new Date().toISOString();
    db.prepare("UPDATE pull_requests SET updated_at = ? WHERE id = ?").run(now, prId);
  }
  
  return result.changes > 0;
}

/**
 * Get labels for a PR
 */
export function getPRLabels(prId: string): string[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT label FROM pr_labels WHERE pr_id = ? ORDER BY added_at ASC")
    .all(prId) as Array<{ label: string }>;
  return rows.map(r => r.label);
}

export type { Label };
