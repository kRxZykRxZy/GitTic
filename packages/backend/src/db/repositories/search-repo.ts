import type { SearchEntry } from "@platform/shared";
import { getDb } from "../connection.js";

/** Row from the FTS5 search_index virtual table. */
interface FtsRow {
  entity_id: string;
  type: string;
  title: string;
  content: string;
  rank: number;
}

/** Row from the search_meta scoring table. */
interface MetaRow {
  entity_id: string;
  type: string;
  score: number;
  updated_at: string;
}

/** Map FTS + meta rows to the shared SearchEntry type. */
function toSearchEntry(fts: FtsRow, meta?: MetaRow): SearchEntry {
  return {
    id: fts.entity_id,
    type: fts.type as SearchEntry["type"],
    entityId: fts.entity_id,
    title: fts.title,
    content: fts.content,
    score: meta?.score ?? 0,
    updatedAt: meta?.updated_at ?? new Date().toISOString(),
  };
}

/** Input for indexing a search entry. */
export interface IndexInput {
  entityId: string;
  type: SearchEntry["type"];
  title: string;
  content: string;
  score?: number;
}

/** Search result with relevance rank. */
export interface SearchResult extends SearchEntry {
  /** FTS5 relevance rank (lower = more relevant). */
  rank: number;
}

/**
 * Index (insert or replace) a document in the search index.
 */
export function index(input: IndexInput): void {
  const db = getDb();
  const now = new Date().toISOString();

  // Remove existing entry if present (FTS5 doesn't support REPLACE)
  remove(input.entityId);

  db.prepare(
    `INSERT INTO search_index (entity_id, type, title, content) VALUES (?, ?, ?, ?)`,
  ).run(input.entityId, input.type, input.title, input.content);

  db.prepare(
    `INSERT OR REPLACE INTO search_meta (entity_id, type, score, updated_at) VALUES (?, ?, ?, ?)`,
  ).run(input.entityId, input.type, input.score ?? 0, now);
}

/**
 * Full-text search using SQLite FTS5.
 * Results are sorted by a combination of FTS relevance and trending score.
 */
export function search(
  query: string,
  opts: { page: number; perPage: number; type?: SearchEntry["type"] } = { page: 1, perPage: 20 },
): SearchResult[] {
  const db = getDb();
  const offset = (opts.page - 1) * opts.perPage;

  // Sanitize the query for FTS5 (escape special characters)
  const safeQuery = query.replace(/['"]/g, "").trim();
  if (!safeQuery) return [];

  let sql: string;
  let params: unknown[];

  if (opts.type) {
    sql = `
      SELECT si.entity_id, si.type, si.title, si.content, rank,
             COALESCE(sm.score, 0) AS meta_score,
             COALESCE(sm.updated_at, '') AS updated_at
      FROM search_index si
      LEFT JOIN search_meta sm ON si.entity_id = sm.entity_id
      WHERE search_index MATCH ? AND si.type = ?
      ORDER BY (rank * -1) + (meta_score * 0.1) DESC
      LIMIT ? OFFSET ?`;
    params = [safeQuery, opts.type, opts.perPage, offset];
  } else {
    sql = `
      SELECT si.entity_id, si.type, si.title, si.content, rank,
             COALESCE(sm.score, 0) AS meta_score,
             COALESCE(sm.updated_at, '') AS updated_at
      FROM search_index si
      LEFT JOIN search_meta sm ON si.entity_id = sm.entity_id
      WHERE search_index MATCH ?
      ORDER BY (rank * -1) + (meta_score * 0.1) DESC
      LIMIT ? OFFSET ?`;
    params = [safeQuery, opts.perPage, offset];
  }

  const rows = db.prepare(sql).all(...params) as Array<
    FtsRow & { meta_score: number; updated_at: string }
  >;

  return rows.map((r) => ({
    id: r.entity_id,
    type: r.type as SearchEntry["type"],
    entityId: r.entity_id,
    title: r.title,
    content: r.content,
    score: r.meta_score,
    updatedAt: r.updated_at,
    rank: r.rank,
  }));
}

/**
 * Remove a document from the search index.
 */
export function remove(entityId: string): void {
  const db = getDb();
  db.prepare("DELETE FROM search_index WHERE entity_id = ?").run(entityId);
  db.prepare("DELETE FROM search_meta WHERE entity_id = ?").run(entityId);
}

/**
 * Reindex all projects from the projects table.
 * Clears the existing index and rebuilds it.
 */
export function reindex(): number {
  const db = getDb();

  // Clear the search index
  db.prepare("DELETE FROM search_index").run();
  db.prepare("DELETE FROM search_meta").run();

  // Re-populate from projects
  const projects = db
    .prepare("SELECT id, name, slug, description, star_count, clone_count, created_at FROM projects WHERE is_private = 0")
    .all() as Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      star_count: number;
      clone_count: number;
      created_at: string;
    }>;

  const insertFts = db.prepare(
    "INSERT INTO search_index (entity_id, type, title, content) VALUES (?, ?, ?, ?)",
  );
  const insertMeta = db.prepare(
    "INSERT INTO search_meta (entity_id, type, score, updated_at) VALUES (?, ?, ?, ?)",
  );

  const txn = db.transaction(() => {
    for (const p of projects) {
      const content = [p.name, p.slug, p.description || ""].join(" ");
      const score = computeTrendingScore(p.star_count, p.clone_count, p.created_at);
      insertFts.run(p.id, "repo", p.name, content);
      insertMeta.run(p.id, "repo", score, new Date().toISOString());
    }
  });
  txn();

  // Also index users
  const users = db
    .prepare("SELECT id, username, display_name, bio FROM users")
    .all() as Array<{ id: string; username: string; display_name: string | null; bio: string | null }>;

  const txn2 = db.transaction(() => {
    for (const u of users) {
      const content = [u.username, u.display_name || "", u.bio || ""].join(" ");
      insertFts.run(u.id, "user", u.username, content);
      insertMeta.run(u.id, "user", 0, new Date().toISOString());
    }
  });
  txn2();

  return projects.length + users.length;
}

/**
 * Compute a trending score based on stars, clones, and recency.
 * Higher score = more trending.
 */
export function computeTrendingScore(
  stars: number,
  clones: number,
  createdAt: string,
): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = Math.max(ageMs / (1000 * 60 * 60 * 24), 1);

  // Logarithmic decay with star/clone boost
  const activity = stars * 2 + clones;
  const recencyBoost = 1 / Math.log2(ageDays + 2);

  return Math.round((activity * recencyBoost) * 100) / 100;
}
