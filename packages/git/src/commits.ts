import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Structured representation of a parsed Git commit. */
export interface CommitInfo {
  sha: string;
  treeSha: string;
  parents: string[];
  author: { name: string; email: string; date: Date };
  committer: { name: string; email: string; date: Date };
  message: string;
  body: string;
}

/** Result of parsing a conventional commit message. */
export interface ConventionalCommit {
  type: string;
  scope: string | undefined;
  breaking: boolean;
  description: string;
  body: string;
  footers: Record<string, string>;
}

/**
 * Get a single commit by SHA, returning fully parsed commit info
 * including tree, parents, author, committer, and message.
 */
export async function getCommit(
  repoPath: string,
  sha: string
): Promise<CommitInfo> {
  const format = [
    "%H", "%T", "%P", "%an", "%ae", "%aI",
    "%cn", "%ce", "%cI", "%s", "%b",
  ].join("%x00");

  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "log", "-1", `--format=${format}`, sha,
  ]);

  const parts = stdout.trim().split("\0");
  return {
    sha: parts[0],
    treeSha: parts[1],
    parents: parts[2] ? parts[2].split(" ") : [],
    author: { name: parts[3], email: parts[4], date: new Date(parts[5]) },
    committer: { name: parts[6], email: parts[7], date: new Date(parts[8]) },
    message: parts[9],
    body: parts[10] || "",
  };
}

/**
 * Retrieve commit history for a given ref up to the specified limit.
 * Returns an array of CommitInfo objects ordered newest-first.
 */
export async function getCommitHistory(
  repoPath: string,
  ref: string,
  limit = 50
): Promise<CommitInfo[]> {
  const format = [
    "%H", "%T", "%P", "%an", "%ae", "%aI",
    "%cn", "%ce", "%cI", "%s", "%b",
  ].join("%x00");

  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "log", `--max-count=${limit}`,
    `--format=${format}%x01`, ref,
  ]);

  return stdout
    .split("\x01")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split("\0");
      return {
        sha: parts[0],
        treeSha: parts[1],
        parents: parts[2] ? parts[2].split(" ") : [],
        author: { name: parts[3], email: parts[4], date: new Date(parts[5]) },
        committer: { name: parts[6], email: parts[7], date: new Date(parts[8]) },
        message: parts[9],
        body: parts[10] || "",
      };
    });
}

/**
 * Get the parent SHAs for a specific commit.
 * Returns an empty array for root commits.
 */
export async function getCommitParents(
  repoPath: string,
  sha: string
): Promise<string[]> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "rev-parse", `${sha}^@`,
  ]).catch(() => ({ stdout: "" }));

  return stdout.trim().split("\n").filter(Boolean);
}

/**
 * Parse a commit message string as a conventional commit.
 * Supports type(scope)!: description format with optional body/footers.
 */
export function parseCommitMessage(raw: string): ConventionalCommit {
  const lines = raw.split("\n");
  const headerLine = lines[0] || "";

  const headerRegex = /^(\w+)(?:\(([^)]*)\))?(!)?\s*:\s*(.*)$/;
  const match = headerRegex.exec(headerLine);

  const type = match ? match[1] : "unknown";
  const scope = match ? match[2] || undefined : undefined;
  const breaking = match ? match[3] === "!" : false;
  const description = match ? match[4] : headerLine;

  const bodyLines: string[] = [];
  const footers: Record<string, string> = {};
  let inBody = true;
  const footerRegex = /^([\w-]+|BREAKING CHANGE)\s*:\s*(.*)$/;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (i === 1 && line.trim() === "") continue;

    const footerMatch = footerRegex.exec(line);
    if (footerMatch) {
      inBody = false;
      footers[footerMatch[1]] = footerMatch[2];
    } else if (inBody) {
      bodyLines.push(line);
    }
  }

  return {
    type,
    scope,
    breaking: breaking || "BREAKING CHANGE" in footers,
    description,
    body: bodyLines.join("\n").trim(),
    footers,
  };
}

/**
 * Get the total number of commits reachable from the given ref.
 * Useful for repository statistics and pagination.
 */
export async function getCommitCount(
  repoPath: string,
  ref = "HEAD"
): Promise<number> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "rev-list", "--count", ref,
  ]);
  return parseInt(stdout.trim(), 10);
}

/**
 * Revert a commit by creating a new commit that undoes the changes.
 * Returns the SHA and message of the new revert commit.
 */
export async function revertCommit(
  repoPath: string,
  sha: string,
  options: {
    message?: string;
    author?: { name: string; email: string };
  } = {}
): Promise<{ sha: string; message: string }> {
  const args = ["-C", repoPath, "revert"];
  
  // Add author info if provided
  if (options.author) {
    args.push("--author", `${options.author.name} <${options.author.email}>`);
  }
  
  // Add custom message if provided
  if (options.message) {
    args.push("-m", options.message);
  }
  
  // Add the commit SHA to revert
  args.push(sha);
  
  const { stdout } = await execFileAsync("git", args);
  
  // Extract the new commit SHA from the output
  const shaMatch = stdout.match(/([a-f0-9]{40})/);
  if (!shaMatch) {
    throw new Error("Failed to extract revert commit SHA");
  }
  
  // Get the commit message of the new revert commit
  const { stdout: messageOutput } = await execFileAsync("git", [
    "-C", repoPath, "log", "-1", "--pretty=%s", shaMatch[1]
  ]);
  
  return { 
    sha: shaMatch[1],
    message: messageOutput.trim() || options.message || `Revert commit ${sha.substring(0, 7)}`
  };
}

/**
 * List commits with filtering options.
 * Compatible with the expected interface in repository routes.
 */
export async function listCommits(
  repoPath: string,
  options: {
    branch?: string;
    author?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<CommitInfo[]> {
  const { branch = "HEAD", author, limit = 50, offset = 0 } = options;
  
  // Build git command arguments
  const args = ["-C", repoPath, "log"];
  
  // Add author filter if specified
  if (author) {
    args.push("--author", author);
  }
  
  // Add limit and offset for pagination
  if (offset > 0) {
    args.push("--skip", String(offset));
  }
  args.push("--max-count", String(limit));
  
  // Add format
  const format = [
    "%H", "%T", "%P", "%an", "%ae", "%aI",
    "%cn", "%ce", "%cI", "%s", "%b",
  ].join("%x00");
  args.push(`--format=${format}%x01`);
  
  // Add the branch/ref
  args.push(branch);
  
  const { stdout } = await execFileAsync("git", args);
  
  return stdout
    .split("\x01")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split("\0");
      return {
        sha: parts[0],
        treeSha: parts[1],
        parents: parts[2] ? parts[2].split(" ") : [],
        author: { name: parts[3], email: parts[4], date: new Date(parts[5]) },
        committer: { name: parts[6], email: parts[7], date: new Date(parts[8]) },
        message: parts[9],
        body: parts[10] || "",
      };
    });
}
