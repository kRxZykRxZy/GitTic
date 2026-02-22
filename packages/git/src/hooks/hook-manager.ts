import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readdir, readFile, writeFile, unlink, chmod } from "node:fs/promises";
import path from "node:path";

const execFileAsync = promisify(execFile);

/** Supported Git hook types. */
export type HookType =
  | "pre-receive"
  | "post-receive"
  | "update"
  | "pre-push"
  | "pre-commit"
  | "commit-msg"
  | "post-commit"
  | "pre-rebase"
  | "post-checkout"
  | "post-merge"
  | "pre-auto-gc";

/** Information about an installed Git hook. */
export interface HookInfo {
  name: HookType;
  path: string;
  enabled: boolean;
  content: string;
}

/** Result of executing a Git hook. */
export interface HookExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  hookName: HookType;
}

/**
 * Get the hooks directory path for a repository.
 * Uses git rev-parse to find the correct hooks path.
 */
async function getHooksDir(repoPath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", [
      "-C", repoPath, "rev-parse", "--git-path", "hooks",
    ]);
    const hooksPath = stdout.trim();
    if (path.isAbsolute(hooksPath)) return hooksPath;
    return path.join(repoPath, hooksPath);
  } catch {
    return path.join(repoPath, "hooks");
  }
}

/**
 * Install a Git hook by writing a script to the hooks directory.
 * Sets executable permissions and ensures the shebang is present.
 */
export async function installHook(
  repoPath: string,
  hookType: HookType,
  script: string
): Promise<string> {
  const hooksDir = await getHooksDir(repoPath);
  const hookPath = path.join(hooksDir, hookType);

  const fullScript = script.startsWith("#!")
    ? script
    : `#!/bin/sh\n${script}`;

  await writeFile(hookPath, fullScript, "utf-8");
  await chmod(hookPath, 0o755);

  return hookPath;
}

/**
 * Remove a Git hook from the repository.
 * Deletes the hook file from the hooks directory.
 */
export async function removeHook(
  repoPath: string,
  hookType: HookType
): Promise<void> {
  const hooksDir = await getHooksDir(repoPath);
  const hookPath = path.join(hooksDir, hookType);
  await unlink(hookPath).catch(() => {});
}

/**
 * List all installed hooks in the repository.
 * Returns hook information including content and enabled state.
 */
export async function listHooks(repoPath: string): Promise<HookInfo[]> {
  const hooksDir = await getHooksDir(repoPath);
  const validHooks: HookType[] = [
    "pre-receive", "post-receive", "update", "pre-push",
    "pre-commit", "commit-msg", "post-commit", "pre-rebase",
    "post-checkout", "post-merge", "pre-auto-gc",
  ];

  const hooks: HookInfo[] = [];

  let entries: string[] = [];
  try {
    entries = await readdir(hooksDir);
  } catch {
    return hooks;
  }

  for (const entry of entries) {
    if (!validHooks.includes(entry as HookType)) continue;

    const hookPath = path.join(hooksDir, entry);
    try {
      const content = await readFile(hookPath, "utf-8");
      hooks.push({
        name: entry as HookType,
        path: hookPath,
        enabled: !entry.endsWith(".disabled"),
        content,
      });
    } catch {
      continue;
    }
  }

  return hooks;
}

/**
 * Execute a Git hook script programmatically with provided stdin data.
 * Returns the exit code and output captured from the hook execution.
 */
export async function executeHook(
  repoPath: string,
  hookType: HookType,
  stdinData?: string,
  args: string[] = []
): Promise<HookExecResult> {
  const hooksDir = await getHooksDir(repoPath);
  const hookPath = path.join(hooksDir, hookType);

  try {
    const { stdout, stderr } = await execFileAsync(hookPath, args, {
      cwd: repoPath,
      env: { ...process.env, GIT_DIR: repoPath },
      ...(stdinData ? { input: stdinData } : {}),
    });

    return {
      exitCode: 0,
      stdout,
      stderr,
      hookName: hookType,
    };
  } catch (error) {
    const execError = error as { code?: number; stdout?: string; stderr?: string };
    return {
      exitCode: typeof execError.code === "number" ? execError.code : 1,
      stdout: execError.stdout ?? "",
      stderr: execError.stderr ?? "",
      hookName: hookType,
    };
  }
}

/**
 * Check if a specific hook type is installed in the repository.
 * Returns true if the hook file exists in the hooks directory.
 */
export async function hookExists(
  repoPath: string,
  hookType: HookType
): Promise<boolean> {
  const hooks = await listHooks(repoPath);
  return hooks.some((h) => h.name === hookType);
}
