import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Result of a merge readiness check. */
export interface MergeCheckResult {
  mergeable: boolean;
  reason: string;
  conflictFiles: string[];
  checks: MergeCheckItem[];
}

/** Individual check item within a merge readiness evaluation. */
export interface MergeCheckItem {
  name: string;
  passed: boolean;
  description: string;
}

/** Branch protection rules to validate before merging. */
export interface BranchProtectionRules {
  requireLinearHistory: boolean;
  requiredReviewers: number;
  requireSignedCommits: boolean;
  requiredStatusChecks: string[];
  dismissStaleReviews: boolean;
}

/**
 * Check if a PR can be merged by testing for conflicts.
 * Performs a trial merge-tree operation without modifying refs.
 */
export async function checkMergeability(
  repoPath: string,
  base: string,
  head: string
): Promise<MergeCheckResult> {
  const checks: MergeCheckItem[] = [];

  const refsExist = await verifyRefsExist(repoPath, base, head);
  checks.push(refsExist);

  if (!refsExist.passed) {
    return {
      mergeable: false,
      reason: refsExist.description,
      conflictFiles: [],
      checks,
    };
  }

  const hasCommits = await checkHasNewCommits(repoPath, base, head);
  checks.push(hasCommits);

  const conflicts = await conflictFiles(repoPath, base, head);
  const noConflicts: MergeCheckItem = {
    name: "no_conflicts",
    passed: conflicts.length === 0,
    description: conflicts.length === 0
      ? "No merge conflicts detected"
      : `${conflicts.length} file(s) have conflicts`,
  };
  checks.push(noConflicts);

  const allPassed = checks.every((c) => c.passed);

  return {
    mergeable: allPassed,
    reason: allPassed
      ? "All merge checks passed"
      : checks.filter((c) => !c.passed).map((c) => c.description).join("; "),
    conflictFiles: conflicts,
    checks,
  };
}

/**
 * Get list of files that would conflict during a merge.
 * Uses merge-tree to detect conflicts without touching the working tree.
 */
export async function conflictFiles(
  repoPath: string,
  base: string,
  head: string
): Promise<string[]> {
  try {
    const { stdout: mergeBaseOut } = await execFileAsync("git", [
      "-C", repoPath, "merge-base", base, head,
    ]);
    const mergeBase = mergeBaseOut.trim();

    const { stdout } = await execFileAsync("git", [
      "-C", repoPath, "merge-tree", "--write-tree",
      `--merge-base=${mergeBase}`, base, head,
    ]).catch((error) => ({
      stdout: (error as { stdout?: string }).stdout ?? "",
    }));

    const conflicts: string[] = [];
    for (const line of stdout.split("\n")) {
      const match = /CONFLICT \([^)]+\):\s*(?:Merge conflict in\s+)?(.+)/.exec(line);
      if (match) {
        conflicts.push(match[1].trim());
      }
    }

    return conflicts;
  } catch {
    return [];
  }
}

/**
 * Check if required status checks have passed for a commit.
 * Validates against a list of required check names.
 */
export function requiredStatusChecks(
  passedChecks: string[],
  requiredChecks: string[]
): MergeCheckItem {
  const missing = requiredChecks.filter((c) => !passedChecks.includes(c));

  return {
    name: "required_status_checks",
    passed: missing.length === 0,
    description: missing.length === 0
      ? "All required status checks passed"
      : `Missing required checks: ${missing.join(", ")}`,
  };
}

/**
 * Validate branch protection rules for a merge.
 * Checks linear history, reviews, signatures, and status checks.
 */
export async function branchProtectionCheck(
  repoPath: string,
  base: string,
  head: string,
  rules: BranchProtectionRules,
  context: {
    approvedReviewers: number;
    passedChecks: string[];
    commitsAreSigned: boolean;
  }
): Promise<MergeCheckItem[]> {
  const checks: MergeCheckItem[] = [];

  if (rules.requireLinearHistory) {
    const canFf = await checkCanFastForward(repoPath, base, head);
    checks.push({
      name: "linear_history",
      passed: canFf,
      description: canFf
        ? "Fast-forward merge is possible"
        : "Linear history required but fast-forward is not possible",
    });
  }

  if (rules.requiredReviewers > 0) {
    checks.push({
      name: "required_reviewers",
      passed: context.approvedReviewers >= rules.requiredReviewers,
      description: context.approvedReviewers >= rules.requiredReviewers
        ? `Has ${context.approvedReviewers} approved review(s)`
        : `Needs ${rules.requiredReviewers} review(s), has ${context.approvedReviewers}`,
    });
  }

  if (rules.requireSignedCommits) {
    checks.push({
      name: "signed_commits",
      passed: context.commitsAreSigned,
      description: context.commitsAreSigned
        ? "All commits are signed"
        : "Unsigned commits detected",
    });
  }

  if (rules.requiredStatusChecks.length > 0) {
    checks.push(
      requiredStatusChecks(context.passedChecks, rules.requiredStatusChecks)
    );
  }

  return checks;
}

/**
 * Verify that both base and head refs exist in the repository.
 * Returns a check result indicating whether the refs are valid.
 */
async function verifyRefsExist(
  repoPath: string,
  base: string,
  head: string
): Promise<MergeCheckItem> {
  try {
    await execFileAsync("git", [
      "-C", repoPath, "rev-parse", "--verify", base,
    ]);
    await execFileAsync("git", [
      "-C", repoPath, "rev-parse", "--verify", head,
    ]);
    return {
      name: "refs_exist",
      passed: true,
      description: "Both base and head refs exist",
    };
  } catch {
    return {
      name: "refs_exist",
      passed: false,
      description: "One or both refs do not exist",
    };
  }
}

/**
 * Check if the head branch has new commits not in the base branch.
 * Returns a check result indicating whether there are mergeable changes.
 */
async function checkHasNewCommits(
  repoPath: string,
  base: string,
  head: string
): Promise<MergeCheckItem> {
  try {
    const { stdout } = await execFileAsync("git", [
      "-C", repoPath, "rev-list", "--count", `${base}..${head}`,
    ]);
    const count = parseInt(stdout.trim(), 10);
    return {
      name: "has_commits",
      passed: count > 0,
      description: count > 0
        ? `${count} new commit(s) to merge`
        : "No new commits to merge",
    };
  } catch {
    return {
      name: "has_commits",
      passed: false,
      description: "Could not determine commit count",
    };
  }
}

/**
 * Check if a fast-forward merge is possible between base and head.
 * Returns true if base is an ancestor of head.
 */
async function checkCanFastForward(
  repoPath: string,
  base: string,
  head: string
): Promise<boolean> {
  try {
    await execFileAsync("git", [
      "-C", repoPath, "merge-base", "--is-ancestor", base, head,
    ]);
    return true;
  } catch {
    return false;
  }
}
