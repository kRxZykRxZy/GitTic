import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface BranchInfo {
  name: string;
  sha: string;
  isDefault: boolean;
}

export interface TagInfo {
  name: string;
  sha: string;
  message?: string;
}

/**
 * List branches in a repository.
 */
export async function listBranches(repoPath: string): Promise<BranchInfo[]> {
  const { stdout: headRef } = await execFileAsync("git", [
    "-C",
    repoPath,
    "symbolic-ref",
    "HEAD",
  ]).catch(() => ({ stdout: "refs/heads/main" }));

  const defaultBranch = headRef.trim().replace("refs/heads/", "");

  const { stdout } = await execFileAsync("git", [
    "-C",
    repoPath,
    "for-each-ref",
    "--format=%(refname:short) %(objectname)",
    "refs/heads/",
  ]);

  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [name, sha] = line.split(" ");
      return { name, sha, isDefault: name === defaultBranch };
    });
}

/**
 * Create a branch.
 */
export async function createBranch(
  repoPath: string,
  branchName: string,
  startPoint = "HEAD"
): Promise<void> {
  await execFileAsync("git", [
    "-C",
    repoPath,
    "branch",
    branchName,
    startPoint,
  ]);
}

/**
 * Delete a branch.
 */
export async function deleteBranch(
  repoPath: string,
  branchName: string
): Promise<void> {
  await execFileAsync("git", ["-C", repoPath, "branch", "-D", branchName]);
}

/**
 * List tags.
 */
export async function listTags(repoPath: string): Promise<TagInfo[]> {
  const { stdout } = await execFileAsync("git", [
    "-C",
    repoPath,
    "for-each-ref",
    "--format=%(refname:short) %(objectname) %(subject)",
    "refs/tags/",
  ]);

  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(" ");
      const name = parts[0];
      const sha = parts[1];
      const message = parts.slice(2).join(" ") || undefined;
      return { name, sha, message };
    });
}

/**
 * Create a tag.
 */
export async function createTag(
  repoPath: string,
  tagName: string,
  sha: string,
  message?: string
): Promise<void> {
  if (message) {
    await execFileAsync("git", [
      "-C",
      repoPath,
      "tag",
      "-a",
      tagName,
      sha,
      "-m",
      message,
    ]);
  } else {
    await execFileAsync("git", ["-C", repoPath, "tag", tagName, sha]);
  }
}

/**
 * Delete a tag.
 */
export async function deleteTag(
  repoPath: string,
  tagName: string
): Promise<void> {
  await execFileAsync("git", ["-C", repoPath, "tag", "-d", tagName]);
}

/**
 * Get details for a specific branch.
 */
export async function getBranchDetails(
  repoPath: string,
  branchName: string
): Promise<BranchInfo | null> {
  try {
    // Check if branch exists
    const { stdout: headRef } = await execFileAsync("git", [
      "-C",
      repoPath,
      "symbolic-ref",
      "HEAD",
    ]).catch(() => ({ stdout: "refs/heads/main" }));

    const defaultBranch = headRef.trim().replace("refs/heads/", "");

    // Get branch details
    const { stdout } = await execFileAsync("git", [
      "-C",
      repoPath,
      "for-each-ref",
      "--format=%(refname:short) %(objectname)",
      `refs/heads/${branchName}`,
    ]);

    const line = stdout.trim();
    if (!line) {
      return null;
    }

    const [name, sha] = line.split(" ");
    return { name, sha, isDefault: name === defaultBranch };
  } catch (error) {
    return null;
  }
}
