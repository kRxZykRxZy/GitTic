import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Represents a single entry in the stash list. */
export interface StashEntry {
  index: number;
  branch: string;
  message: string;
  sha: string;
  date: Date;
}

/**
 * List all stash entries in the repository.
 * Returns entries ordered from newest (index 0) to oldest.
 */
export async function stashList(repoPath: string): Promise<StashEntry[]> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "stash", "list",
    "--format=%H%x00%gd%x00%gs%x00%aI",
  ]);

  if (!stdout.trim()) return [];

  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line, idx) => {
      const [sha, _ref, message, dateStr] = line.split("\0");
      const branchMatch = /^On\s+(\S+):/.exec(message);
      return {
        index: idx,
        branch: branchMatch ? branchMatch[1] : "unknown",
        message: message,
        sha,
        date: new Date(dateStr),
      };
    });
}

/**
 * Push the current working directory changes onto the stash stack.
 * Optionally include untracked files and provide a custom message.
 */
export async function stashPush(
  repoPath: string,
  message?: string,
  includeUntracked = false
): Promise<string> {
  const args = ["-C", repoPath, "stash", "push"];
  if (includeUntracked) {
    args.push("--include-untracked");
  }
  if (message) {
    args.push("-m", message);
  }

  const { stdout } = await execFileAsync("git", args);
  return stdout.trim();
}

/**
 * Pop the top stash entry, applying changes and removing it from the stack.
 * Optionally specify a stash index to pop a specific entry.
 */
export async function stashPop(
  repoPath: string,
  index = 0
): Promise<string> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "stash", "pop", `stash@{${index}}`,
  ]);
  return stdout.trim();
}

/**
 * Drop a specific stash entry without applying it.
 * Permanently removes the entry from the stash stack.
 */
export async function stashDrop(
  repoPath: string,
  index = 0
): Promise<void> {
  await execFileAsync("git", [
    "-C", repoPath, "stash", "drop", `stash@{${index}}`,
  ]);
}

/**
 * Apply a stash entry without removing it from the stack.
 * The entry remains in the stash list for potential later use.
 */
export async function stashApply(
  repoPath: string,
  index = 0
): Promise<string> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "stash", "apply", `stash@{${index}}`,
  ]);
  return stdout.trim();
}

/**
 * Show the diff of a specific stash entry.
 * Returns the diff between the stash and its parent commit.
 */
export async function stashShow(
  repoPath: string,
  index = 0,
  includeUntracked = false
): Promise<string> {
  const args = ["-C", repoPath, "stash", "show", "-p", `stash@{${index}}`];
  if (includeUntracked) {
    args.push("--include-untracked");
  }
  const { stdout } = await execFileAsync("git", args);
  return stdout;
}

/**
 * Clear all stash entries from the repository.
 * This permanently deletes all stashed changes and cannot be undone.
 */
export async function stashClear(repoPath: string): Promise<void> {
  await execFileAsync("git", ["-C", repoPath, "stash", "clear"]);
}

/**
 * Get the total count of stash entries in the repository.
 * Returns zero if no entries exist.
 */
export async function stashCount(repoPath: string): Promise<number> {
  const entries = await stashList(repoPath);
  return entries.length;
}
