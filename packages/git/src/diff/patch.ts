import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

const execFileAsync = promisify(execFile);

/** Result of applying a patch to a repository. */
export interface PatchApplyResult {
  success: boolean;
  filesPatched: string[];
  rejects: string[];
  message: string;
}

/** Result of checking whether a patch can be applied cleanly. */
export interface PatchCheckResult {
  canApply: boolean;
  conflicts: string[];
  message: string;
}

/**
 * Generate a formatted patch for a specific commit.
 * Produces output suitable for email or git-apply usage.
 */
export async function formatPatch(
  repoPath: string,
  sha: string,
  outputDir?: string
): Promise<string> {
  const args = ["-C", repoPath, "format-patch", "-1", sha, "--stdout"];

  if (outputDir) {
    const { stdout } = await execFileAsync("git", [
      "-C", repoPath, "format-patch", "-1", sha, "-o", outputDir,
    ]);
    return stdout.trim();
  }

  const { stdout } = await execFileAsync("git", args);
  return stdout;
}

/**
 * Apply a patch to the repository from raw patch content.
 * Writes patch to a temporary file, applies it, then cleans up.
 */
export async function applyPatch(
  repoPath: string,
  patchContent: string,
  check = false
): Promise<PatchApplyResult> {
  const tempName = `patch-${randomBytes(8).toString("hex")}.patch`;
  const tempPath = path.join(repoPath, tempName);

  try {
    await writeFile(tempPath, patchContent, "utf-8");

    const args = ["-C", repoPath, "apply"];
    if (check) {
      args.push("--check");
    }
    args.push(tempPath);

    await execFileAsync("git", args);

    const filesPatched = extractFilesFromPatch(patchContent);

    return {
      success: true,
      filesPatched,
      rejects: [],
      message: check ? "Patch can be applied cleanly" : "Patch applied successfully",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const rejects = extractRejectsFromError(msg);
    return {
      success: false,
      filesPatched: [],
      rejects,
      message: `Patch ${check ? "check" : "apply"} failed: ${msg}`,
    };
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}

/**
 * Check whether a patch can be applied cleanly without modifying files.
 * Runs a dry-run application to detect conflicts.
 */
export async function checkPatch(
  repoPath: string,
  patchContent: string
): Promise<PatchCheckResult> {
  const result = await applyPatch(repoPath, patchContent, true);

  return {
    canApply: result.success,
    conflicts: result.rejects,
    message: result.message,
  };
}

/**
 * Generate patches for a range of commits between two refs.
 * Returns an array of patch strings, one per commit.
 */
export async function formatPatchRange(
  repoPath: string,
  base: string,
  head: string
): Promise<string[]> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "format-patch", "--stdout", `${base}..${head}`,
  ]);

  const patches: string[] = [];
  const sections = stdout.split(/^From [a-f0-9]{40} /m);

  for (let i = 1; i < sections.length; i++) {
    patches.push(`From ${sections[i]}`);
  }

  if (patches.length === 0 && stdout.trim()) {
    patches.push(stdout);
  }

  return patches;
}

/**
 * Apply a patch from a file path rather than inline content.
 * Useful for applying patches stored on disk or received as files.
 */
export async function applyPatchFile(
  repoPath: string,
  patchFilePath: string,
  threeWay = false
): Promise<PatchApplyResult> {
  try {
    const args = ["-C", repoPath, "apply"];
    if (threeWay) {
      args.push("--3way");
    }
    args.push(patchFilePath);

    await execFileAsync("git", args);

    return {
      success: true,
      filesPatched: [],
      rejects: [],
      message: "Patch file applied successfully",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      filesPatched: [],
      rejects: extractRejectsFromError(msg),
      message: `Patch file apply failed: ${msg}`,
    };
  }
}

/**
 * Extract file paths that a patch would modify from patch content.
 * Parses diff headers to find affected file paths.
 */
function extractFilesFromPatch(patchContent: string): string[] {
  const files: string[] = [];
  const regex = /^diff --git a\/(.+?) b\//gm;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(patchContent)) !== null) {
    files.push(match[1]);
  }

  return [...new Set(files)];
}

/**
 * Extract rejected file paths from a git apply error message.
 * Parses error output to identify which files could not be patched.
 */
function extractRejectsFromError(errorMsg: string): string[] {
  const rejects: string[] = [];
  const regex = /error: patch failed: (.+?):/gm;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(errorMsg)) !== null) {
    rejects.push(match[1]);
  }

  return rejects;
}
