import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Supported Git object types. */
export type GitObjectType = "blob" | "tree" | "commit" | "tag";

/** A single entry in a Git tree object. */
export interface TreeEntry {
  mode: string;
  type: GitObjectType;
  sha: string;
  path: string;
}

/**
 * Read a Git object's content using cat-file.
 * Returns the raw content of the specified object type.
 */
export async function catFile(
  repoPath: string,
  sha: string,
  type: GitObjectType
): Promise<string> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "cat-file", type, sha,
  ]);
  return stdout;
}

/**
 * Determine the type of a Git object given its SHA.
 * Returns 'blob', 'tree', 'commit', or 'tag'.
 */
export async function getObjectType(
  repoPath: string,
  sha: string
): Promise<GitObjectType> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "cat-file", "-t", sha,
  ]);
  return stdout.trim() as GitObjectType;
}

/**
 * Get the size of a Git object in bytes.
 * Uses cat-file -s to query the object database.
 */
export async function getObjectSize(
  repoPath: string,
  sha: string
): Promise<number> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "cat-file", "-s", sha,
  ]);
  return parseInt(stdout.trim(), 10);
}

/**
 * List entries in a Git tree object.
 * Optionally recurse into subtrees for a full listing.
 */
export async function listTree(
  repoPath: string,
  sha: string,
  recursive = false
): Promise<TreeEntry[]> {
  const args = ["-C", repoPath, "ls-tree"];
  if (recursive) {
    args.push("-r");
  }
  args.push(sha);

  const { stdout } = await execFileAsync("git", args);

  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const tabIndex = line.indexOf("\t");
      const meta = line.substring(0, tabIndex);
      const filePath = line.substring(tabIndex + 1);
      const [mode, type, objSha] = meta.split(/\s+/);
      return {
        mode,
        type: type as GitObjectType,
        sha: objSha,
        path: filePath,
      };
    });
}

/**
 * Read the content of a blob object as a UTF-8 string.
 * Convenience wrapper over catFile for blob objects.
 */
export async function readBlob(
  repoPath: string,
  sha: string
): Promise<string> {
  return catFile(repoPath, sha, "blob");
}

/**
 * Check whether a given object exists in the repository database.
 * Returns true if the object is reachable, false otherwise.
 */
export async function objectExists(
  repoPath: string,
  sha: string
): Promise<boolean> {
  try {
    await execFileAsync("git", [
      "-C", repoPath, "cat-file", "-e", sha,
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Pretty-print a Git object for debugging.
 * Uses cat-file -p to render the object in human-readable form.
 */
export async function prettyPrint(
  repoPath: string,
  sha: string
): Promise<string> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "cat-file", "-p", sha,
  ]);
  return stdout;
}
