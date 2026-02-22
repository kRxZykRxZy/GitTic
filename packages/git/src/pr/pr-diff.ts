import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseDiff } from "../diff/diff-parser.js";
import type { DiffFile } from "../diff/diff-parser.js";

const execFileAsync = promisify(execFile);

/** Changed file entry in a pull request. */
export interface PrChangedFile {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed";
  additions: number;
  deletions: number;
}

/** Summary of a pull request diff. */
export interface PrDiffSummary {
  files: DiffFile[];
  totalAdditions: number;
  totalDeletions: number;
  totalFilesChanged: number;
  rawDiff: string;
}

/**
 * Generate a diff between base and head refs for a pull request.
 * Returns the parsed diff along with aggregate statistics.
 */
export async function generatePrDiff(
  repoPath: string,
  base: string,
  head: string
): Promise<PrDiffSummary> {
  const mergeBase = await getMergeBase(repoPath, base, head);

  const { stdout: rawDiff } = await execFileAsync("git", [
    "-C", repoPath, "diff", mergeBase, head,
  ]);

  const files = parseDiff(rawDiff);
  const totalAdditions = files.reduce((s, f) => s + f.additions, 0);
  const totalDeletions = files.reduce((s, f) => s + f.deletions, 0);

  return {
    files,
    totalAdditions,
    totalDeletions,
    totalFilesChanged: files.length,
    rawDiff,
  };
}

/**
 * Get the list of files changed between base and head.
 * Returns structured file change information with line counts.
 */
export async function getChangedFiles(
  repoPath: string,
  base: string,
  head: string
): Promise<PrChangedFile[]> {
  const mergeBase = await getMergeBase(repoPath, base, head);

  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "diff", "--numstat", "--diff-filter=ACDMR",
    mergeBase, head,
  ]);

  const { stdout: statusOut } = await execFileAsync("git", [
    "-C", repoPath, "diff", "--name-status", mergeBase, head,
  ]);

  const statusMap = new Map<string, string>();
  for (const line of statusOut.trim().split("\n").filter(Boolean)) {
    const parts = line.split("\t");
    const statusCode = parts[0][0];
    const filePath = parts.length > 2 ? parts[2] : parts[1];
    statusMap.set(filePath, statusCode);
  }

  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("\t");
      const additions = parts[0] === "-" ? 0 : parseInt(parts[0], 10);
      const deletions = parts[1] === "-" ? 0 : parseInt(parts[1], 10);
      const filePath = parts[2];

      const code = statusMap.get(filePath) ?? "M";
      let status: PrChangedFile["status"] = "modified";
      if (code === "A") status = "added";
      else if (code === "D") status = "deleted";
      else if (code === "R") status = "renamed";

      return { path: filePath, status, additions, deletions };
    });
}

/**
 * Get only the added lines from a PR diff as an array of strings.
 * Useful for running linters or checks on new code only.
 */
export async function getAddedLines(
  repoPath: string,
  base: string,
  head: string
): Promise<Array<{ file: string; line: number; content: string }>> {
  const { files } = await generatePrDiff(repoPath, base, head);
  const addedLines: Array<{ file: string; line: number; content: string }> = [];

  for (const file of files) {
    for (const hunk of file.hunks) {
      for (const line of hunk.lines) {
        if (line.type === "add" && line.newLineNumber !== undefined) {
          addedLines.push({
            file: file.newPath,
            line: line.newLineNumber,
            content: line.content,
          });
        }
      }
    }
  }

  return addedLines;
}

/**
 * Get only the removed lines from a PR diff as an array of strings.
 * Useful for tracking removed functionality or dependencies.
 */
export async function getRemovedLines(
  repoPath: string,
  base: string,
  head: string
): Promise<Array<{ file: string; line: number; content: string }>> {
  const { files } = await generatePrDiff(repoPath, base, head);
  const removedLines: Array<{ file: string; line: number; content: string }> = [];

  for (const file of files) {
    for (const hunk of file.hunks) {
      for (const line of hunk.lines) {
        if (line.type === "delete" && line.oldLineNumber !== undefined) {
          removedLines.push({
            file: file.oldPath,
            line: line.oldLineNumber,
            content: line.content,
          });
        }
      }
    }
  }

  return removedLines;
}

/**
 * Find the merge base between two refs for accurate diff generation.
 * Uses git merge-base to find the common ancestor.
 */
async function getMergeBase(
  repoPath: string,
  ref1: string,
  ref2: string
): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", [
      "-C", repoPath, "merge-base", ref1, ref2,
    ]);
    return stdout.trim();
  } catch {
    return ref1;
  }
}
