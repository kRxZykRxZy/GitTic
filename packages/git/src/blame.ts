import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** A single blame entry mapping a line to its origin commit. */
export interface BlameLine {
  sha: string;
  originalLine: number;
  finalLine: number;
  author: string;
  authorEmail: string;
  authorDate: Date;
  committer: string;
  committerEmail: string;
  committerDate: Date;
  summary: string;
  content: string;
}

/** Aggregated blame information for an entire file. */
export interface BlameResult {
  path: string;
  lines: BlameLine[];
  totalLines: number;
  uniqueCommits: number;
}

/**
 * Run git blame on a file and return structured line-by-line information.
 * Each line includes the originating commit, author, date, and content.
 */
export async function blameFile(
  repoPath: string,
  filePath: string,
  ref = "HEAD"
): Promise<BlameResult> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "blame", "--porcelain", ref, "--", filePath,
  ]);

  const lines = parseBlameOutput(stdout);
  const uniqueShas = new Set(lines.map((l) => l.sha));

  return {
    path: filePath,
    lines,
    totalLines: lines.length,
    uniqueCommits: uniqueShas.size,
  };
}

/**
 * Parse porcelain blame output into structured BlameLine entries.
 * Handles the multi-line porcelain format with header and content lines.
 */
export function parseBlameOutput(output: string): BlameLine[] {
  const results: BlameLine[] = [];
  const rawLines = output.split("\n");

  let current: Partial<BlameLine> = {};
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];

    if (!line) {
      i++;
      continue;
    }

    const headerMatch = /^([a-f0-9]{40})\s+(\d+)\s+(\d+)/.exec(line);
    if (headerMatch) {
      current = {
        sha: headerMatch[1],
        originalLine: parseInt(headerMatch[2], 10),
        finalLine: parseInt(headerMatch[3], 10),
      };
      i++;
      continue;
    }

    if (line.startsWith("author ")) {
      current.author = line.substring(7);
    } else if (line.startsWith("author-mail ")) {
      current.authorEmail = line.substring(12).replace(/[<>]/g, "");
    } else if (line.startsWith("author-time ")) {
      current.authorDate = new Date(parseInt(line.substring(12), 10) * 1000);
    } else if (line.startsWith("committer ")) {
      current.committer = line.substring(10);
    } else if (line.startsWith("committer-mail ")) {
      current.committerEmail = line.substring(15).replace(/[<>]/g, "");
    } else if (line.startsWith("committer-time ")) {
      current.committerDate = new Date(parseInt(line.substring(15), 10) * 1000);
    } else if (line.startsWith("summary ")) {
      current.summary = line.substring(8);
    } else if (line.startsWith("\t")) {
      current.content = line.substring(1);
      results.push({
        sha: current.sha ?? "",
        originalLine: current.originalLine ?? 0,
        finalLine: current.finalLine ?? 0,
        author: current.author ?? "",
        authorEmail: current.authorEmail ?? "",
        authorDate: current.authorDate ?? new Date(0),
        committer: current.committer ?? "",
        committerEmail: current.committerEmail ?? "",
        committerDate: current.committerDate ?? new Date(0),
        summary: current.summary ?? "",
        content: current.content,
      });
    }

    i++;
  }

  return results;
}

/**
 * Get blame information for a specific line range within a file.
 * Useful for showing blame in code review or editor integrations.
 */
export async function blameFileRange(
  repoPath: string,
  filePath: string,
  startLine: number,
  endLine: number,
  ref = "HEAD"
): Promise<BlameLine[]> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "blame", "--porcelain",
    `-L${startLine},${endLine}`, ref, "--", filePath,
  ]);

  return parseBlameOutput(stdout);
}
