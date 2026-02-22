import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Configuration for branch protection rules. */
export interface BranchProtectionConfig {
  protectedBranches: string[];
  maxFileSizeBytes: number;
  forbiddenFiles: string[];
  forbiddenExtensions: string[];
  requireSignedCommits: boolean;
}

/** Result of a pre-receive validation check. */
export interface PreReceiveResult {
  allowed: boolean;
  rejectionReason: string | undefined;
  ref: string;
  oldSha: string;
  newSha: string;
}

/** A single ref update received in a push. */
export interface RefUpdate {
  oldSha: string;
  newSha: string;
  refName: string;
}

/** Default branch protection configuration. */
const DEFAULT_CONFIG: BranchProtectionConfig = {
  protectedBranches: ["refs/heads/main", "refs/heads/master"],
  maxFileSizeBytes: 100 * 1024 * 1024,
  forbiddenFiles: [".env", ".env.local", "id_rsa", "id_ed25519"],
  forbiddenExtensions: [".pem", ".key", ".pfx", ".p12"],
  requireSignedCommits: false,
};

/**
 * Parse the stdin of a pre-receive hook into structured ref updates.
 * Each line contains oldSha, newSha, and refName separated by spaces.
 */
export function parsePreReceiveInput(input: string): RefUpdate[] {
  return input
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(" ");
      return {
        oldSha: parts[0],
        newSha: parts[1],
        refName: parts[2],
      };
    });
}

/**
 * Validate a push against branch protection rules.
 * Checks protected branches, file sizes, and forbidden files.
 */
export async function validatePush(
  repoPath: string,
  updates: RefUpdate[],
  config: Partial<BranchProtectionConfig> = {}
): Promise<PreReceiveResult[]> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const results: PreReceiveResult[] = [];

  for (const update of updates) {
    const result = await validateRefUpdate(repoPath, update, fullConfig);
    results.push(result);
  }

  return results;
}

/**
 * Validate a single ref update against protection rules.
 * Performs branch protection, size limit, and forbidden file checks.
 */
async function validateRefUpdate(
  repoPath: string,
  update: RefUpdate,
  config: BranchProtectionConfig
): Promise<PreReceiveResult> {
  const { oldSha, newSha, refName } = update;
  const zeroPad = "0000000000000000000000000000000000000000";

  if (newSha === zeroPad && config.protectedBranches.includes(refName)) {
    return {
      allowed: false,
      rejectionReason: `Cannot delete protected branch: ${refName}`,
      ref: refName,
      oldSha,
      newSha,
    };
  }

  if (oldSha !== zeroPad && config.protectedBranches.includes(refName)) {
    const isForce = await checkForcePush(repoPath, oldSha, newSha);
    if (isForce) {
      return {
        allowed: false,
        rejectionReason: `Force push not allowed on protected branch: ${refName}`,
        ref: refName,
        oldSha,
        newSha,
      };
    }
  }

  if (newSha !== zeroPad) {
    const sizeViolation = await checkFileSizeLimits(
      repoPath, oldSha === zeroPad ? undefined : oldSha, newSha, config.maxFileSizeBytes
    );
    if (sizeViolation) {
      return {
        allowed: false,
        rejectionReason: sizeViolation,
        ref: refName,
        oldSha,
        newSha,
      };
    }

    const forbiddenViolation = await checkForbiddenFiles(
      repoPath, oldSha === zeroPad ? undefined : oldSha, newSha, config
    );
    if (forbiddenViolation) {
      return {
        allowed: false,
        rejectionReason: forbiddenViolation,
        ref: refName,
        oldSha,
        newSha,
      };
    }
  }

  return {
    allowed: true,
    rejectionReason: undefined,
    ref: refName,
    oldSha,
    newSha,
  };
}

/**
 * Check if a push is a force push by verifying ancestry.
 * Returns true if oldSha is not an ancestor of newSha.
 */
async function checkForcePush(
  repoPath: string,
  oldSha: string,
  newSha: string
): Promise<boolean> {
  try {
    await execFileAsync("git", [
      "-C", repoPath, "merge-base", "--is-ancestor", oldSha, newSha,
    ]);
    return false;
  } catch {
    return true;
  }
}

/**
 * Check if any new files exceed the maximum file size limit.
 * Returns a rejection message if a violation is found.
 */
async function checkFileSizeLimits(
  repoPath: string,
  oldSha: string | undefined,
  newSha: string,
  maxBytes: number
): Promise<string | undefined> {
  const diffRange = oldSha ? `${oldSha}..${newSha}` : newSha;

  try {
    const { stdout } = await execFileAsync("git", [
      "-C", repoPath, "diff-tree", "-r", "--diff-filter=ACM",
      "--no-commit-id", diffRange,
    ]);

    for (const line of stdout.trim().split("\n").filter(Boolean)) {
      const parts = line.split(/\s+/);
      const sha = parts[3];

      const { stdout: sizeOut } = await execFileAsync("git", [
        "-C", repoPath, "cat-file", "-s", sha,
      ]);

      const size = parseInt(sizeOut.trim(), 10);
      if (size > maxBytes) {
        const filePath = parts[5];
        return `File ${filePath} exceeds size limit (${size} > ${maxBytes} bytes)`;
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}

/**
 * Check if any new or modified files match the forbidden files list.
 * Returns a rejection message if a forbidden file is detected.
 */
async function checkForbiddenFiles(
  repoPath: string,
  oldSha: string | undefined,
  newSha: string,
  config: BranchProtectionConfig
): Promise<string | undefined> {
  const diffRange = oldSha ? `${oldSha}..${newSha}` : newSha;

  try {
    const { stdout } = await execFileAsync("git", [
      "-C", repoPath, "diff-tree", "-r", "--diff-filter=ACM",
      "--no-commit-id", "--name-only", diffRange,
    ]);

    for (const filePath of stdout.trim().split("\n").filter(Boolean)) {
      const basename = filePath.split("/").pop() ?? "";

      if (config.forbiddenFiles.includes(basename)) {
        return `Forbidden file detected: ${filePath}`;
      }

      for (const ext of config.forbiddenExtensions) {
        if (filePath.endsWith(ext)) {
          return `Forbidden file extension detected: ${filePath} (${ext})`;
        }
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}
