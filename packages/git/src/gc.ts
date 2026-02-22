import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Run git garbage collection on a repository.
 */
export async function runGc(repoPath: string, aggressive = false): Promise<string> {
  const args = ["-C", repoPath, "gc"];
  if (aggressive) args.push("--aggressive");
  args.push("--auto");

  const { stdout, stderr } = await execFileAsync("git", args);
  return stdout + stderr;
}

/**
 * Prune unreachable objects.
 */
export async function prune(repoPath: string): Promise<string> {
  const { stdout, stderr } = await execFileAsync("git", [
    "-C",
    repoPath,
    "prune",
  ]);
  return stdout + stderr;
}

/**
 * Repack objects into packfiles.
 */
export async function repack(repoPath: string): Promise<string> {
  const { stdout, stderr } = await execFileAsync("git", [
    "-C",
    repoPath,
    "repack",
    "-a",
    "-d",
  ]);
  return stdout + stderr;
}

/**
 * Get object count and pack stats.
 */
export async function getPackStats(repoPath: string): Promise<string> {
  const { stdout } = await execFileAsync("git", [
    "-C",
    repoPath,
    "count-objects",
    "-v",
  ]);
  return stdout;
}
