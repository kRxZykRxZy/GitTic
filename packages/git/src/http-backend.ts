import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import type { IncomingMessage, ServerResponse } from "node:http";
import { isPathSafe } from "@platform/utils";

const execFileAsync = promisify(execFile);

/**
 * Handle Git HTTP smart protocol requests (clone, fetch, push).
 * Supports git-upload-pack (clone/fetch) and git-receive-pack (push).
 */
export function handleGitHttpRequest(
  basePath: string,
  req: IncomingMessage,
  res: ServerResponse,
  repoRelPath: string,
  service: "git-upload-pack" | "git-receive-pack"
): void {
  if (!isPathSafe(basePath, repoRelPath)) {
    res.writeHead(403);
    res.end("Forbidden: path traversal detected");
    return;
  }

  const repoPath = `${basePath}/${repoRelPath}`;

  // Info/refs endpoint
  if (req.url?.includes("/info/refs")) {
    res.setHeader(
      "Content-Type",
      `application/x-${service}-advertisement`
    );
    res.writeHead(200);

    const proc = spawn(service, ["--advertise-refs", "--stateless-rpc", repoPath]);
    const header = `# service=${service}\n`;
    const pktLine = `${(header.length + 4).toString(16).padStart(4, "0")}${header}`;
    res.write(pktLine);
    res.write("0000");

    proc.stdout.pipe(res);
    proc.stderr.on("data", (data: Buffer) => {
      console.error(`${service} stderr:`, data.toString());
    });
    return;
  }

  // Actual RPC endpoint
  res.setHeader("Content-Type", `application/x-${service}-result`);
  res.writeHead(200);

  const proc = spawn(service, ["--stateless-rpc", repoPath]);
  req.pipe(proc.stdin);
  proc.stdout.pipe(res);
  proc.stderr.on("data", (data: Buffer) => {
    console.error(`${service} stderr:`, data.toString());
  });
}

/**
 * Get diff between two refs.
 */
export async function getDiff(
  repoPath: string,
  fromRef: string,
  toRef: string
): Promise<string> {
  const { stdout } = await execFileAsync("git", [
    "-C",
    repoPath,
    "diff",
    fromRef,
    toRef,
  ]);
  return stdout;
}

/**
 * Get commit log between two refs.
 */
export async function getLog(
  repoPath: string,
  ref: string,
  maxCount = 50
): Promise<string> {
  const { stdout } = await execFileAsync("git", [
    "-C",
    repoPath,
    "log",
    `--max-count=${maxCount}`,
    "--format=%H %an %ae %at %s",
    ref,
  ]);
  return stdout;
}

/**
 * Update server info for dumb HTTP protocol support.
 */
export async function updateServerInfo(repoPath: string): Promise<void> {
  await execFileAsync("git", ["-C", repoPath, "update-server-info"]);
}
