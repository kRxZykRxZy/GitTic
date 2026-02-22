import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Supported Git merge strategies. */
export type MergeStrategy = "recursive" | "ort" | "octopus" | "ours" | "subtree";

/** Result of a merge operation with outcome details. */
export interface MergeResult {
  success: boolean;
  sha: string | undefined;
  conflicts: string[];
  message: string;
}

/** Information about a merge conflict in a specific file. */
export interface ConflictInfo {
  path: string;
  ancestorSha: string | undefined;
  ourSha: string | undefined;
  theirSha: string | undefined;
}

/**
 * Find the best common ancestor (merge base) between two commits.
 * Returns the SHA of the merge base commit.
 */
export async function mergeBase(
  repoPath: string,
  ref1: string,
  ref2: string
): Promise<string> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "merge-base", ref1, ref2,
  ]);
  return stdout.trim();
}

/**
 * Check if a fast-forward merge is possible from source to target.
 * Returns true if target is an ancestor of source.
 */
export async function canFastForward(
  repoPath: string,
  source: string,
  target: string
): Promise<boolean> {
  try {
    const base = await mergeBase(repoPath, source, target);
    const { stdout } = await execFileAsync("git", [
      "-C", repoPath, "rev-parse", "--verify", target,
    ]);
    return base === stdout.trim();
  } catch {
    return false;
  }
}

/**
 * Perform a merge operation from source branch into target branch.
 * Supports various merge strategies and returns a detailed result.
 */
export async function merge(
  repoPath: string,
  source: string,
  target: string,
  strategy: MergeStrategy = "ort"
): Promise<MergeResult> {
  try {
    const { stdout } = await execFileAsync("git", [
      "-C", repoPath, "merge-tree", "--write-tree",
      `--merge-base=${target}`, target, source,
    ]);

    const lines = stdout.trim().split("\n");
    const treeSha = lines[0];

    const conflicts = lines
      .filter((line) => line.startsWith("CONFLICT"))
      .map((line) => line.trim());

    if (conflicts.length > 0) {
      return {
        success: false,
        sha: undefined,
        conflicts,
        message: `Merge conflicts detected using strategy '${strategy}'`,
      };
    }

    return {
      success: true,
      sha: treeSha,
      conflicts: [],
      message: `Merged ${source} into ${target}`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      sha: undefined,
      conflicts: [],
      message: `Merge failed: ${msg}`,
    };
  }
}

/**
 * List files with merge conflicts in the working tree.
 * Parses ls-files --unmerged to identify conflicted paths.
 */
export async function getMergeConflicts(
  repoPath: string
): Promise<ConflictInfo[]> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "ls-files", "--unmerged",
  ]);

  const conflicts = new Map<string, ConflictInfo>();

  for (const line of stdout.trim().split("\n").filter(Boolean)) {
    const match = /^(\d+)\s+([a-f0-9]+)\s+(\d)\s+(.+)$/.exec(line);
    if (!match) continue;

    const [, , sha, stageStr, filePath] = match;
    const stage = parseInt(stageStr, 10);

    if (!conflicts.has(filePath)) {
      conflicts.set(filePath, {
        path: filePath,
        ancestorSha: undefined,
        ourSha: undefined,
        theirSha: undefined,
      });
    }

    const info = conflicts.get(filePath)!;
    if (stage === 1) info.ancestorSha = sha;
    else if (stage === 2) info.ourSha = sha;
    else if (stage === 3) info.theirSha = sha;
  }

  return Array.from(conflicts.values());
}

/**
 * Abort an in-progress merge and restore the pre-merge state.
 * Resets HEAD and working tree to the state before the merge began.
 */
export async function abortMerge(repoPath: string): Promise<void> {
  await execFileAsync("git", ["-C", repoPath, "merge", "--abort"]);
}

/**
 * Check whether any merge is currently in progress.
 * Detects by checking for the existence of MERGE_HEAD ref.
 */
export async function isMergeInProgress(repoPath: string): Promise<boolean> {
  try {
    await execFileAsync("git", [
      "-C", repoPath, "rev-parse", "--verify", "MERGE_HEAD",
    ]);
    return true;
  } catch {
    return false;
  }
}
