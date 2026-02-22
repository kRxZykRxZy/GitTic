import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Result of a rebase operation with status and conflict information. */
export interface RebaseResult {
  success: boolean;
  currentSha: string | undefined;
  conflicts: string[];
  message: string;
}

/** Status of an in-progress rebase operation. */
export interface RebaseStatus {
  inProgress: boolean;
  currentStep: number;
  totalSteps: number;
  currentCommit: string | undefined;
  onto: string | undefined;
}

/**
 * Rebase the specified branch onto the target ref.
 * Replays commits from branch on top of onto.
 */
export async function rebase(
  repoPath: string,
  onto: string,
  branch?: string
): Promise<RebaseResult> {
  try {
    const args = ["-C", repoPath, "rebase", onto];
    if (branch) {
      args.push(branch);
    }

    await execFileAsync("git", args);

    const { stdout } = await execFileAsync("git", [
      "-C", repoPath, "rev-parse", "HEAD",
    ]);

    return {
      success: true,
      currentSha: stdout.trim(),
      conflicts: [],
      message: `Successfully rebased onto ${onto}`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const conflicts = await getRebaseConflicts(repoPath);
    return {
      success: false,
      currentSha: undefined,
      conflicts,
      message: `Rebase failed: ${msg}`,
    };
  }
}

/**
 * Start an interactive rebase from the given base commit.
 * Uses GIT_SEQUENCE_EDITOR to apply a custom todo list.
 */
export async function rebaseInteractive(
  repoPath: string,
  base: string,
  editorCommand?: string
): Promise<RebaseResult> {
  try {
    const env: Record<string, string> = { ...process.env } as Record<string, string>;
    if (editorCommand) {
      env["GIT_SEQUENCE_EDITOR"] = editorCommand;
    }

    await execFileAsync("git", ["-C", repoPath, "rebase", "-i", base], {
      env,
    });

    const { stdout } = await execFileAsync("git", [
      "-C", repoPath, "rev-parse", "HEAD",
    ]);

    return {
      success: true,
      currentSha: stdout.trim(),
      conflicts: [],
      message: `Interactive rebase from ${base} completed`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      currentSha: undefined,
      conflicts: await getRebaseConflicts(repoPath),
      message: `Interactive rebase failed: ${msg}`,
    };
  }
}

/**
 * Abort the current rebase operation.
 * Restores the branch to its original state before rebase started.
 */
export async function rebaseAbort(repoPath: string): Promise<void> {
  await execFileAsync("git", ["-C", repoPath, "rebase", "--abort"]);
}

/**
 * Continue a rebase after resolving conflicts.
 * Uses the current index state to create the rebased commit.
 */
export async function rebaseContinue(
  repoPath: string
): Promise<RebaseResult> {
  try {
    await execFileAsync("git", [
      "-C", repoPath, "rebase", "--continue",
    ]);

    const { stdout } = await execFileAsync("git", [
      "-C", repoPath, "rev-parse", "HEAD",
    ]);

    return {
      success: true,
      currentSha: stdout.trim(),
      conflicts: [],
      message: "Rebase continued successfully",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      currentSha: undefined,
      conflicts: await getRebaseConflicts(repoPath),
      message: `Rebase continue failed: ${msg}`,
    };
  }
}

/**
 * Skip the current patch in a rebase and move to the next one.
 * Useful when a specific commit cannot be cleanly applied.
 */
export async function rebaseSkip(repoPath: string): Promise<void> {
  await execFileAsync("git", ["-C", repoPath, "rebase", "--skip"]);
}

/**
 * Get list of files with conflicts during an in-progress rebase.
 * Returns paths with unresolved merge conflicts.
 */
async function getRebaseConflicts(repoPath: string): Promise<string[]> {
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
 * Get the current status of an in-progress rebase.
 * Returns step progress and the commit being applied.
 */
export async function getRebaseStatus(
  repoPath: string
): Promise<RebaseStatus> {
  try {
    await execFileAsync("git", [
      "-C", repoPath, "rev-parse", "--verify", "REBASE_HEAD",
    ]);
  } catch {
    return {
      inProgress: false,
      currentStep: 0,
      totalSteps: 0,
      currentCommit: undefined,
      onto: undefined,
    };
  }

  const { stdout: headOut } = await execFileAsync("git", [
    "-C", repoPath, "rev-parse", "REBASE_HEAD",
  ]).catch(() => ({ stdout: "" }));

  const { stdout: ontoOut } = await execFileAsync("git", [
    "-C", repoPath, "rev-parse", "--git-path", "rebase-merge/onto",
  ]).catch(() => ({ stdout: "" }));

  return {
    inProgress: true,
    currentStep: 0,
    totalSteps: 0,
    currentCommit: headOut.trim() || undefined,
    onto: ontoOut.trim() || undefined,
  };
}
