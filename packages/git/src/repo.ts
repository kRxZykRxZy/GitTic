import { execFile } from "node:child_process";
import { mkdir, access, readdir, stat, rm } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { isPathSafe } from "@platform/utils";

/**
 * Initialize a bare Git repository for storing packfiles only.
 */
const execFileAsync = promisify(execFile);

export async function initBareRepo(storagePath: string): Promise<void> {
  try {
    // Create the directory recursively
    await mkdir(storagePath, { recursive: true });

    // Run the git command to initialize a bare repository
    await execFileAsync("git", ["init", "--bare", storagePath]);
  } catch (error) {
    console.error('Error initializing bare repository:', error);
    throw error; // Optionally rethrow after logging
  }
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
