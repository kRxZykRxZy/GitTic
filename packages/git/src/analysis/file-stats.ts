import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** File count grouped by programming language/extension. */
export interface LanguageStats {
  language: string;
  extension: string;
  fileCount: number;
  totalBytes: number;
}

/** Information about a large file in the repository. */
export interface LargeFileInfo {
  path: string;
  sha: string;
  size: number;
}

/** Commit-level history entry for a specific file. */
export interface FileHistoryEntry {
  sha: string;
  author: string;
  date: Date;
  message: string;
}

/** Extension-to-language mapping for common file types. */
const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript (JSX)",
  ".js": "JavaScript",
  ".jsx": "JavaScript (JSX)",
  ".py": "Python",
  ".rb": "Ruby",
  ".go": "Go",
  ".rs": "Rust",
  ".java": "Java",
  ".c": "C",
  ".cpp": "C++",
  ".h": "C/C++ Header",
  ".cs": "C#",
  ".swift": "Swift",
  ".kt": "Kotlin",
  ".scala": "Scala",
  ".php": "PHP",
  ".html": "HTML",
  ".css": "CSS",
  ".scss": "SCSS",
  ".json": "JSON",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".xml": "XML",
  ".md": "Markdown",
  ".sh": "Shell",
  ".sql": "SQL",
  ".r": "R",
  ".lua": "Lua",
};

/**
 * Count files in the repository grouped by programming language.
 * Uses file extensions to classify files into language categories.
 */
export async function countByLanguage(
  repoPath: string,
  ref = "HEAD"
): Promise<LanguageStats[]> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "ls-tree", "-r", "--long", ref,
  ]);

  const langMap = new Map<string, { count: number; bytes: number; ext: string }>();

  for (const line of stdout.trim().split("\n").filter(Boolean)) {
    const match = /^\d+\s+blob\s+[a-f0-9]+\s+(\d+)\s+(.+)$/.exec(line);
    if (!match) continue;

    const size = parseInt(match[1], 10);
    const filePath = match[2];
    const dotIdx = filePath.lastIndexOf(".");
    const ext = dotIdx >= 0 ? filePath.substring(dotIdx) : "";
    const language = EXTENSION_LANGUAGE_MAP[ext] ?? (ext || "Other");

    const existing = langMap.get(language);
    if (existing) {
      existing.count++;
      existing.bytes += size;
    } else {
      langMap.set(language, { count: 1, bytes: size, ext });
    }
  }

  return Array.from(langMap.entries())
    .map(([language, data]) => ({
      language,
      extension: data.ext,
      fileCount: data.count,
      totalBytes: data.bytes,
    }))
    .sort((a, b) => b.fileCount - a.fileCount);
}

/**
 * Get the largest files in the repository at a given ref.
 * Returns files sorted by size in descending order.
 */
export async function getLargestFiles(
  repoPath: string,
  ref = "HEAD",
  limit = 20
): Promise<LargeFileInfo[]> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "ls-tree", "-r", "--long", ref,
  ]);

  const files: LargeFileInfo[] = stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const match = /^\d+\s+blob\s+([a-f0-9]+)\s+(\d+)\s+(.+)$/.exec(line);
      if (!match) return null;
      return {
        sha: match[1],
        size: parseInt(match[2], 10),
        path: match[3],
      };
    })
    .filter((f): f is LargeFileInfo => f !== null)
    .sort((a, b) => b.size - a.size);

  return files.slice(0, limit);
}

/**
 * Get the commit history for a specific file path.
 * Shows all commits that modified the given file.
 */
export async function getFileHistory(
  repoPath: string,
  filePath: string,
  ref = "HEAD",
  limit = 50
): Promise<FileHistoryEntry[]> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "log", `--max-count=${limit}`,
    "--format=%H%x00%an%x00%aI%x00%s",
    ref, "--", filePath,
  ]);

  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [sha, author, dateStr, message] = line.split("\0");
      return {
        sha,
        author,
        date: new Date(dateStr),
        message,
      };
    });
}

/**
 * Get the total size of all blobs at a given ref in bytes.
 * Sums the sizes of all files tracked in the tree.
 */
export async function totalSize(
  repoPath: string,
  ref = "HEAD"
): Promise<number> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "ls-tree", "-r", "--long", ref,
  ]);

  let total = 0;
  for (const line of stdout.trim().split("\n").filter(Boolean)) {
    const match = /^\d+\s+blob\s+[a-f0-9]+\s+(\d+)\s+/.exec(line);
    if (match) {
      total += parseInt(match[1], 10);
    }
  }

  return total;
}

/**
 * Count the total number of tracked files at a given ref.
 * Includes only blob objects, not directories.
 */
export async function totalFileCount(
  repoPath: string,
  ref = "HEAD"
): Promise<number> {
  const { stdout } = await execFileAsync("git", [
    "-C", repoPath, "ls-tree", "-r", "--name-only", ref,
  ]);
  return stdout.trim().split("\n").filter(Boolean).length;
}
