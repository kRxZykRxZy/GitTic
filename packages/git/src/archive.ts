import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";

const execFileAsync = promisify(execFile);

/** Supported archive formats for repository export. */
export type ArchiveFormat = "tar" | "tar.gz" | "zip";

/** Options for creating a repository archive. */
export interface ArchiveOptions {
  format: ArchiveFormat;
  prefix?: string;
  outputPath?: string;
  paths?: string[];
}

/**
 * Create an archive of the repository at the specified ref.
 * Generates a tar or zip archive written to the given output path.
 */
export async function createArchive(
  repoPath: string,
  ref: string,
  options: ArchiveOptions
): Promise<string> {
  const { format, prefix, outputPath, paths } = options;

  const outputFile = outputPath ?? path.join(
    repoPath, `archive-${ref.replace(/\//g, "-")}.${format}`
  );

  await mkdir(path.dirname(outputFile), { recursive: true });

  const args = ["-C", repoPath, "archive"];

  if (format === "tar.gz") {
    args.push("--format=tar.gz");
  } else {
    args.push(`--format=${format}`);
  }

  args.push(`--output=${outputFile}`);

  if (prefix) {
    args.push(`--prefix=${prefix}/`);
  }

  args.push(ref);

  if (paths && paths.length > 0) {
    args.push("--", ...paths);
  }

  await execFileAsync("git", args);

  return outputFile;
}

/**
 * Stream an archive directly without writing to disk.
 * Returns a readable stream suitable for piping to HTTP responses.
 */
export function streamArchive(
  repoPath: string,
  ref: string,
  format: ArchiveFormat = "tar",
  prefix?: string
): Readable {
  const args = ["-C", repoPath, "archive"];

  if (format === "tar.gz") {
    args.push("--format=tar.gz");
  } else {
    args.push(`--format=${format}`);
  }

  if (prefix) {
    args.push(`--prefix=${prefix}/`);
  }

  args.push(ref);

  const proc = spawn("git", args);

  proc.stderr.on("data", (data: Buffer) => {
    console.error("git archive stderr:", data.toString());
  });

  return proc.stdout;
}

/**
 * Get the content type header value for a given archive format.
 * Useful for setting HTTP response headers when streaming archives.
 */
export function getArchiveContentType(format: ArchiveFormat): string {
  switch (format) {
    case "tar":
      return "application/x-tar";
    case "tar.gz":
      return "application/gzip";
    case "zip":
      return "application/zip";
  }
}

/**
 * Save a streamed archive to a file on disk.
 * Creates parent directories if they do not exist.
 */
export async function saveArchiveStream(
  stream: Readable,
  outputPath: string
): Promise<void> {
  await mkdir(path.dirname(outputPath), { recursive: true });

  return new Promise((resolve, reject) => {
    const ws = createWriteStream(outputPath);
    stream.pipe(ws);
    ws.on("finish", resolve);
    ws.on("error", reject);
    stream.on("error", reject);
  });
}

/**
 * List the files that would be included in an archive for the given ref.
 * Useful for previewing archive contents without generating the file.
 */
export async function listArchiveFiles(
  repoPath: string,
  ref: string,
  paths?: string[]
): Promise<string[]> {
  const args = ["-C", repoPath, "ls-tree", "-r", "--name-only", ref];

  if (paths && paths.length > 0) {
    args.push("--", ...paths);
  }

  const { stdout } = await execFileAsync("git", args);
  return stdout.trim().split("\n").filter(Boolean);
}
