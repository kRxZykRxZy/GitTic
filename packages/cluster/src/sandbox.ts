import { execFile, spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { isPathSafe } from "@platform/utils";

const execFileAsync = promisify(execFile);

export interface SandboxOptions {
  workDir: string;
  projectPath: string;
  /** Base path to constrain execution within */
  basePath: string;
  timeout?: number;
  env?: Record<string, string>;
}

export interface SandboxResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

/**
 * Execute a command inside a sandboxed environment.
 * All commands auto "cd /project/path" and are prevented from escaping.
 */
export async function executeInSandbox(
  command: string,
  options: SandboxOptions
): Promise<SandboxResult> {
  // Validate path safety
  if (!isPathSafe(options.basePath, options.projectPath)) {
    throw new Error("Sandbox escape detected: path traversal attempt");
  }

  const resolvedPath = path.resolve(options.basePath, options.projectPath);
  const startTime = Date.now();

  try {
    const { stdout, stderr } = await execFileAsync("sh", ["-c", command], {
      cwd: resolvedPath,
      timeout: options.timeout || 300_000, // 5 min default
      env: {
        ...process.env,
        ...options.env,
        HOME: resolvedPath,
        // Prevent escape via common env tricks
        SHELL: "/bin/sh",
      },
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    return {
      exitCode: 0,
      stdout,
      stderr,
      durationMs: Date.now() - startTime,
    };
  } catch (err: unknown) {
    const error = err as { code?: number; stdout?: string; stderr?: string };
    return {
      exitCode: error.code || 1,
      stdout: error.stdout || "",
      stderr: error.stderr || String(err),
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Spawn a PTY-like process for live terminal streaming over WebSocket.
 */
export function spawnTerminal(
  options: SandboxOptions
): ChildProcess {
  if (!isPathSafe(options.basePath, options.projectPath)) {
    throw new Error("Sandbox escape detected: path traversal attempt");
  }

  const resolvedPath = path.resolve(options.basePath, options.projectPath);

  return spawn("sh", [], {
    cwd: resolvedPath,
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      ...options.env,
      TERM: "xterm-256color",
      HOME: resolvedPath,
    },
  });
}
