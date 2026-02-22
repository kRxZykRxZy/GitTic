import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Result of a cherry-pick operation. */
export interface CherryPickResult {
  success: boolean;
  sha: string | undefined;
  conflicts: string[];
  message: string;
}

/**
 * Cherry-pick a single commit onto the current branch.
 * Returns the result indicating success or conflicts.
 */
export async function cherryPick(
  repoPath: string,
  sha: string,
  noCommit = false
): Promise<CherryPickResult> {
  try {
    const args = ["-C", repoPath, "cherry-pick"];
    if (noCommit) {
      args.push("--no-commit");
    }
    args.push(sha);

    await execFileAsync("git", args);

    const result = await execFileAsync("git", [
      "-C", repoPath, "rev-parse", "HEAD",
    ]);

    return {
      success: true,
      sha: noCommit ? undefined : result.stdout.trim(),
      conflicts: [],
      message: `Successfully cherry-picked ${sha}`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const conflicts = await getCherryPickConflicts(repoPath);
    return {
      success: false,
      sha: undefined,
      conflicts,
      message: `Cherry-pick failed: ${msg}`,
    };
  }
}

/**
 * Cherry-pick a range of commits specified as an array of SHAs.
 * Applies commits sequentially and stops on the first conflict.
 */
export async function cherryPickMultiple(
  repoPath: string,
  shas: string[]
): Promise<CherryPickResult[]> {
  const results: CherryPickResult[] = [];

  for (const sha of shas) {
    const result = await cherryPick(repoPath, sha);
    results.push(result);
    if (!result.success) {
      break;
    }
  }

  return results;
}

/**
 * Abort the current cherry-pick operation.
 * Reverts the working tree and index to the pre-cherry-pick state.
 */
export async function cherryPickAbort(repoPath: string): Promise<void> {
  await execFileAsync("git", ["-C", repoPath, "cherry-pick", "--abort"]);
}

/**
 * Continue a cherry-pick after resolving conflicts.
 * Proceeds with the cherry-pick using the resolved index state.
 */
export async function cherryPickContinue(
  repoPath: string
): Promise<CherryPickResult> {
  try {
    await execFileAsync("git", [
      "-C", repoPath, "cherry-pick", "--continue",
    ]);

    const { stdout } = await execFileAsync("git", [
      "-C", repoPath, "rev-parse", "HEAD",
    ]);

    return {
      success: true,
      sha: stdout.trim(),
      conflicts: [],
      message: "Cherry-pick continued successfully",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      sha: undefined,
      conflicts: await getCherryPickConflicts(repoPath),
      message: `Cherry-pick continue failed: ${msg}`,
    };
  }
}

/**
 * Get list of conflicted files during a cherry-pick.
 * Returns file paths that have unresolved merge conflicts.
 */
async function getCherryPickConflicts(repoPath: string): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync("git", [
      "-C", repoPath, "diff", "--name-only", "--diff-filter=U",
    ]);
    return stdout.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Check whether a cherry-pick operation is currently in progress.
 * Detects the CHERRY_PICK_HEAD reference to determine state.
 */
export async function isCherryPickInProgress(
  repoPath: string
): Promise<boolean> {
  try {
    await execFileAsync("git", [
      "-C", repoPath, "rev-parse", "--verify", "CHERRY_PICK_HEAD",
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Skip the current cherry-pick commit and continue with the next one.
 * Useful when a specific commit cannot be cleanly applied.
 */
export async function cherryPickSkip(repoPath: string): Promise<void> {
  await execFileAsync("git", ["-C", repoPath, "cherry-pick", "--skip"]);
}
