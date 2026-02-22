import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Aggregated statistics for a diff between two refs. */
export interface DiffStatResult {
  filesChanged: number;
  insertions: number;
  deletions: number;
  files: FileStatEntry[];
}

/** Per-file statistics within a diff. */
export interface FileStatEntry {
  path: string;
  additions: number;
  deletions: number;
  isBinary: boolean;
}

/**
 * Get short diff statistics between two refs.
 * Returns aggregate counts of files, insertions, and deletions.
 */
export async function shortstat(
  repoPath: string,
  from: string,
  to: string
): Promise<{ filesChanged: number; insertions: number; deletions: number }> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "diff", "--shortstat", from, to,
  ]);

  const filesMatch = /(\d+)\s+file/.exec(stdout);
  const insertMatch = /(\d+)\s+insertion/.exec(stdout);
  const deleteMatch = /(\d+)\s+deletion/.exec(stdout);

  return {
    filesChanged: filesMatch ? parseInt(filesMatch[1], 10) : 0,
    insertions: insertMatch ? parseInt(insertMatch[1], 10) : 0,
    deletions: deleteMatch ? parseInt(deleteMatch[1], 10) : 0,
  };
}

/**
 * Get detailed per-file diff statistics between two refs.
 * Returns structured file-level statistics including binary file detection.
 */
export async function diffStat(
  repoPath: string,
  from: string,
  to: string
): Promise<DiffStatResult> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "diff", "--numstat", from, to,
  ]);

  const files: FileStatEntry[] = stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("\t");
      const additions = parts[0] === "-" ? 0 : parseInt(parts[0], 10);
      const deletions = parts[1] === "-" ? 0 : parseInt(parts[1], 10);
      const filePath = parts[2];
      const isBinary = parts[0] === "-" && parts[1] === "-";
      return { path: filePath, additions, deletions, isBinary };
    });

  const totalInsertions = files.reduce((s, f) => s + f.additions, 0);
  const totalDeletions = files.reduce((s, f) => s + f.deletions, 0);

  return {
    filesChanged: files.length,
    insertions: totalInsertions,
    deletions: totalDeletions,
    files,
  };
}

/**
 * Count the number of files changed between two refs.
 * More efficient than a full diffStat when only the count is needed.
 */
export async function filesChanged(
  repoPath: string,
  from: string,
  to: string
): Promise<number> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "diff", "--name-only", from, to,
  ]);
  return stdout.trim().split("\n").filter(Boolean).length;
}

/**
 * Get total number of insertions between two refs.
 * Counts added lines across all changed files.
 */
export async function insertions(
  repoPath: string,
  from: string,
  to: string
): Promise<number> {
  const stats = await shortstat(repoPath, from, to);
  return stats.insertions;
}

/**
 * Get total number of deletions between two refs.
 * Counts removed lines across all changed files.
 */
export async function deletions(
  repoPath: string,
  from: string,
  to: string
): Promise<number> {
  const stats = await shortstat(repoPath, from, to);
  return stats.deletions;
}

/**
 * Get the list of file paths that changed between two refs.
 * Optionally filter by diff status (A, M, D, R, C).
 */
export async function changedFilePaths(
  repoPath: string,
  from: string,
  to: string,
  filter?: string
): Promise<string[]> {
  const args = ["-C", repoPath, "diff", "--name-only"];
  if (filter) {
    args.push(`--diff-filter=${filter}`);
  }
  args.push(from, to);

  const { stdout } = await execFileAsync("git", args);
  return stdout.trim().split("\n").filter(Boolean);
}

/**
 * Get diff statistics for a single commit compared to its parent.
 * Returns per-file stats for the changes introduced by the commit.
 */
export async function commitDiffStat(
  repoPath: string,
  sha: string
): Promise<DiffStatResult> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "diff", "--numstat", `${sha}^`, sha,
  ]);

  const files: FileStatEntry[] = stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("\t");
      const additions = parts[0] === "-" ? 0 : parseInt(parts[0], 10);
      const deletionCount = parts[1] === "-" ? 0 : parseInt(parts[1], 10);
      const filePath = parts[2];
      const isBinary = parts[0] === "-" && parts[1] === "-";
      return { path: filePath, additions, deletions: deletionCount, isBinary };
    });

  return {
    filesChanged: files.length,
    insertions: files.reduce((s, f) => s + f.additions, 0),
    deletions: files.reduce((s, f) => s + f.deletions, 0),
    files,
  };
}
