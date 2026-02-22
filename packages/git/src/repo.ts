import { execFile } from "node:child_process";
import { mkdir, access, readdir, stat, rm } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { isPathSafe } from "@platform/utils";

const execFileAsync = promisify(execFile);

/**
 * Initialize a bare Git repository for storing packfiles only.
 */
export async function initBareRepo(storagePath: string): Promise<void> {
  await mkdir(storagePath, { recursive: true });
  await execFileAsync("git", ["init", "--bare", storagePath]);
}

/**
 * Check if a path is a valid bare Git repository.
 */
export async function isBareRepo(repoPath: string): Promise<boolean> {
  try {
    const result = await execFileAsync("git", [
      "-C",
      repoPath,
      "rev-parse",
      "--is-bare-repository",
    ]);
    return result.stdout.trim() === "true";
  } catch {
    return false;
  }
}

/**
 * Delete a bare repository.
 */
export async function deleteRepo(
  basePath: string,
  repoPath: string
): Promise<void> {
  if (!isPathSafe(basePath, repoPath)) {
    throw new Error("Path traversal detected");
  }
  const resolved = path.resolve(basePath, repoPath);
  await rm(resolved, { recursive: true, force: true });
}

/**
 * Fork a repository by cloning it as a new bare repo.
 */
export async function forkRepo(
  sourcePath: string,
  targetPath: string
): Promise<void> {
  await mkdir(path.dirname(targetPath), { recursive: true });
  await execFileAsync("git", ["clone", "--bare", sourcePath, targetPath]);
}

/**
 * Get repository size in bytes.
 */
export async function getRepoSize(repoPath: string): Promise<number> {
  const result = await execFileAsync("du", ["-sb", repoPath]);
  const sizeStr = result.stdout.split("\t")[0];
  return parseInt(sizeStr, 10);
}
