import { getDb } from "../connection.js";

interface ProjectStarRow {
  user_id: string;
  project_id: string;
  created_at: string;
}

function toProjectStar(row: ProjectStarRow) {
  return {
    userId: row.user_id,
    projectId: row.project_id,
    createdAt: row.created_at,
  };
}

export function addStar(userId: string, projectId: string): boolean {
  const db = getDb();
  const result = db
    .prepare("INSERT OR IGNORE INTO project_stars (user_id, project_id) VALUES (?, ?)")
    .run(userId, projectId);
  return result.changes > 0;
}

export function removeStar(userId: string, projectId: string): boolean {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM project_stars WHERE user_id = ? AND project_id = ?")
    .run(userId, projectId);
  return result.changes > 0;
}

export function hasStarred(userId: string, projectId: string): boolean {
  const db = getDb();
  const row = db
    .prepare("SELECT 1 as found FROM project_stars WHERE user_id = ? AND project_id = ?")
    .get(userId, projectId) as { found: number } | undefined;
  return row?.found === 1;
}

export function countStarsForProject(projectId: string): number {
  const db = getDb();
  const row = db
    .prepare("SELECT COUNT(*) as count FROM project_stars WHERE project_id = ?")
    .get(projectId) as { count: number };
  return row.count;
}

export function listStarsForProject(projectId: string): Array<{ userId: string; projectId: string; createdAt: string }> {
  const db = getDb();
  const rows = db
    .prepare("SELECT user_id, project_id, created_at FROM project_stars WHERE project_id = ? ORDER BY created_at DESC")
    .all(projectId) as ProjectStarRow[];
  return rows.map(toProjectStar);
}
