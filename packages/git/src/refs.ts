import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Represents a single Git reference (branch, tag, or other). */
export interface RefInfo {
  name: string;
  sha: string;
  type: "heads" | "tags" | "remotes" | "other";
}

/**
 * Resolve a symbolic or partial ref to a full SHA-1 hash.
 * Accepts branch names, tags, abbreviated SHAs, and symbolic refs.
 */
export async function resolveRef(
  repoPath: string,
  ref: string
): Promise<string> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "rev-parse", "--verify", ref,
  ]);
  return stdout.trim();
}

/**
 * Update a reference to point to a new SHA.
 * If oldSha is provided, performs a compare-and-swap for safety.
 */
export async function updateRef(
  repoPath: string,
  refName: string,
  newSha: string,
  oldSha?: string
): Promise<void> {
  const args = ["-C", repoPath, "update-ref", refName, newSha];
  if (oldSha) {
    args.push(oldSha);
  }
  await execFileAsync("git", args);
}

/**
 * Delete a reference from the repository.
 * Removes the specified ref from the ref database.
 */
export async function deleteRef(
  repoPath: string,
  refName: string
): Promise<void> {
  await execFileAsync("git", [
    "-C", repoPath, "update-ref", "-d", refName,
  ]);
}

/**
 * Classify a ref name into its category based on prefix.
 * Returns 'heads', 'tags', 'remotes', or 'other'.
 */
function classifyRef(refName: string): RefInfo["type"] {
  if (refName.startsWith("refs/heads/")) return "heads";
  if (refName.startsWith("refs/tags/")) return "tags";
  if (refName.startsWith("refs/remotes/")) return "remotes";
  return "other";
}

/**
 * List all references in the repository matching an optional pattern.
 * Returns structured RefInfo objects for each matching ref.
 */
export async function listRefs(
  repoPath: string,
  pattern?: string
): Promise<RefInfo[]> {
  const args = [
    "-C", repoPath, "for-each-ref",
    "--format=%(refname) %(objectname)",
  ];
  if (pattern) {
    args.push(pattern);
  }

  const { stdout } = await execFileAsync("git", args);

  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const spaceIdx = line.indexOf(" ");
      const name = line.substring(0, spaceIdx);
      const sha = line.substring(spaceIdx + 1);
      return { name, sha, type: classifyRef(name) };
    });
}

/**
 * Get the current HEAD reference, returning the full symbolic ref.
 * Returns 'refs/heads/main' format for attached HEAD states.
 */
export async function getHead(repoPath: string): Promise<string> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "symbolic-ref", "HEAD",
  ]);
  return stdout.trim();
}

/**
 * Set HEAD to point to a specific branch reference.
 * Used when changing the default branch of a bare repository.
 */
export async function setHead(
  repoPath: string,
  branchRef: string
): Promise<void> {
  const fullRef = branchRef.startsWith("refs/")
    ? branchRef
    : `refs/heads/${branchRef}`;
  await execFileAsync("git", [
    "-C", repoPath, "symbolic-ref", "HEAD", fullRef,
  ]);
}

/**
 * Read or create a symbolic reference.
 * If target is provided, creates a symbolic ref; otherwise reads it.
 */
export async function symbolicRef(
  repoPath: string,
  name: string,
  target?: string
): Promise<string> {
  if (target) {
    await execFileAsync("git", [
      "-C", repoPath, "symbolic-ref", name, target,
    ]);
    return target;
  }

  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "symbolic-ref", name,
  ]);
  return stdout.trim();
}

/**
 * Check whether a ref exists in the repository.
 * Returns true if the ref can be resolved, false otherwise.
 */
export async function refExists(
  repoPath: string,
  ref: string
): Promise<boolean> {
  try {
    await execFileAsync("git", [
      "-C", repoPath, "rev-parse", "--verify", ref,
    ]);
    return true;
  } catch {
    return false;
  }
}
