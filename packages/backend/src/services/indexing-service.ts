import * as searchRepo from "../db/repositories/search-repo.js";
import * as projectRepo from "../db/repositories/project-repo.js";
import * as userRepo from "../db/repositories/user-repo.js";
import { getDb } from "../db/connection.js";

/**
 * Background indexing service for code intelligence and search.
 *
 * Provides functions to index individual projects, users, and
 * code content, as well as full reindex and periodic scheduling.
 */

/** Tracks the interval handle for the background scheduler. */
let _indexInterval: ReturnType<typeof setInterval> | null = null;

/** Default reindex interval: 30 minutes. */
const DEFAULT_REINDEX_INTERVAL_MS = 30 * 60 * 1000;

/**
 * Index a project's metadata and README content into the
 * full-text search index.
 *
 * @param projectId - The project ID to index.
 * @returns true if the project was found and indexed.
 */
export function indexProject(projectId: string): boolean {
  const project = projectRepo.findById(projectId);
  if (!project) return false;

  // Skip private projects from public search
  if (project.isPrivate) return false;

  const contentParts = [
    project.name,
    project.slug,
    project.description ?? "",
  ];

  const score = searchRepo.computeTrendingScore(
    project.starCount,
    project.cloneCount,
    project.createdAt,
  );

  searchRepo.index({
    entityId: project.id,
    type: "repo",
    title: project.name,
    content: contentParts.join(" "),
    score,
  });

  return true;
}

/**
 * Index a user's profile information for search.
 *
 * @param userId - The user ID to index.
 * @returns true if the user was found and indexed.
 */
export function indexUser(userId: string): boolean {
  const user = userRepo.findById(userId);
  if (!user) return false;

  const contentParts = [
    user.username,
    user.displayName ?? "",
    user.bio ?? "",
  ];

  searchRepo.index({
    entityId: user.id,
    type: "user",
    title: user.username,
    content: contentParts.join(" "),
    score: 0,
  });

  return true;
}

/**
 * Index code content from a project. Reads file metadata from
 * the database (or git storage) and indexes it for code search.
 *
 * This is a simplified version that indexes project-level
 * metadata as code search entries. A full implementation would
 * walk the git tree and index individual files.
 *
 * @param projectId - The project to index code for.
 * @returns Number of entries indexed.
 */
export function indexCode(projectId: string): number {
  const project = projectRepo.findById(projectId);
  if (!project || project.isPrivate) return 0;

  // Index the project description and slug as a code entry
  // A production system would use @platform/git to read files
  const codeContent = [
    `Repository: ${project.name}`,
    `Path: ${project.storagePath}`,
    `Branch: ${project.defaultBranch}`,
    project.description ?? "",
  ].join("\n");

  searchRepo.index({
    entityId: `code:${project.id}`,
    type: "code",
    title: `${project.name} (code)`,
    content: codeContent,
    score: 0,
  });

  return 1;
}

/**
 * Perform a full reindex of all public projects and users.
 *
 * This clears the existing search index and rebuilds it from
 * scratch. Runs inside a transaction for consistency.
 *
 * @returns Total number of entries indexed.
 */
export function reindexAll(): number {
  const db = getDb();

  // Use the built-in reindex which handles projects and users
  const baseCount = searchRepo.reindex();

  // Additionally index code entries for all public projects
  const projects = db
    .prepare("SELECT id FROM projects WHERE is_private = 0")
    .all() as Array<{ id: string }>;

  let codeCount = 0;
  for (const { id } of projects) {
    codeCount += indexCode(id);
  }

  console.log(
    `[indexing] Reindex complete: ${baseCount} base entries + ${codeCount} code entries`,
  );

  return baseCount + codeCount;
}

/**
 * Schedule periodic background reindexing.
 *
 * Runs a full reindex at the specified interval. The first reindex
 * is deferred by the interval duration (not run immediately at
 * startup to avoid blocking the boot sequence).
 *
 * @param intervalMs - Reindex interval in milliseconds. Defaults
 *                     to 30 minutes.
 * @returns A function that stops the scheduler.
 */
export function scheduleBackgroundIndex(
  intervalMs = DEFAULT_REINDEX_INTERVAL_MS,
): () => void {
  // Clear any existing scheduler
  if (_indexInterval) {
    clearInterval(_indexInterval);
  }

  console.log(
    `[indexing] Background indexer scheduled every ${intervalMs / 1000}s`,
  );

  _indexInterval = setInterval(() => {
    try {
      const start = Date.now();
      const count = reindexAll();
      const elapsed = Date.now() - start;
      console.log(
        `[indexing] Background reindex completed: ${count} entries in ${elapsed}ms`,
      );
    } catch (err) {
      console.error("[indexing] Background reindex failed:", err);
    }
  }, intervalMs);

  // Don't prevent the process from exiting
  _indexInterval.unref();

  return () => {
    if (_indexInterval) {
      clearInterval(_indexInterval);
      _indexInterval = null;
      console.log("[indexing] Background indexer stopped");
    }
  };
}
