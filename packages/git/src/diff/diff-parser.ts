/** Represents a single line within a diff hunk. */
export interface DiffLine {
  type: "add" | "delete" | "context";
  oldLineNumber: number | undefined;
  newLineNumber: number | undefined;
  content: string;
}

/** A contiguous block of changes within a diff. */
export interface DiffHunk {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  header: string;
  lines: DiffLine[];
}

/** Parsed diff information for a single file. */
export interface DiffFile {
  oldPath: string;
  newPath: string;
  status: "added" | "deleted" | "modified" | "renamed" | "copied";
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
  isBinary: boolean;
}

/**
 * Parse a unified diff string into structured DiffFile objects.
 * Handles standard unified diff format with multiple files and hunks.
 */
export function parseDiff(rawDiff: string): DiffFile[] {
  const files: DiffFile[] = [];
  const diffSections = rawDiff.split(/^diff --git /m).filter(Boolean);

  for (const section of diffSections) {
    const lines = section.split("\n");
    const headerLine = lines[0] || "";

    const pathMatch = /^a\/(.+?)\s+b\/(.+)$/.exec(headerLine);
    const oldPath = pathMatch ? pathMatch[1] : "";
    const newPath = pathMatch ? pathMatch[2] : "";

    const isBinary = lines.some((l) =>
      l.startsWith("Binary files") || l.includes("GIT binary patch")
    );

    let status: DiffFile["status"] = "modified";
    for (const line of lines) {
      if (line.startsWith("new file mode")) {
        status = "added";
        break;
      } else if (line.startsWith("deleted file mode")) {
        status = "deleted";
        break;
      } else if (line.startsWith("rename from")) {
        status = "renamed";
        break;
      } else if (line.startsWith("copy from")) {
        status = "copied";
        break;
      }
    }

    const hunks = parseHunks(lines);
    const additions = hunks.reduce(
      (sum, h) => sum + h.lines.filter((l) => l.type === "add").length, 0
    );
    const deletions = hunks.reduce(
      (sum, h) => sum + h.lines.filter((l) => l.type === "delete").length, 0
    );

    files.push({
      oldPath,
      newPath,
      status,
      hunks,
      additions,
      deletions,
      isBinary,
    });
  }

  return files;
}

/**
 * Parse hunk sections from the lines of a single file diff.
 * Extracts line-by-line change information with line numbers.
 */
function parseHunks(lines: string[]): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  let currentHunk: DiffHunk | undefined;
  let oldLine = 0;
  let newLine = 0;

  for (const line of lines) {
    const hunkHeaderMatch = /^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@(.*)$/.exec(line);

    if (hunkHeaderMatch) {
      const oldStart = parseInt(hunkHeaderMatch[1], 10);
      const oldCount = parseInt(hunkHeaderMatch[2] ?? "1", 10);
      const newStart = parseInt(hunkHeaderMatch[3], 10);
      const newCount = parseInt(hunkHeaderMatch[4] ?? "1", 10);

      currentHunk = {
        oldStart,
        oldCount,
        newStart,
        newCount,
        header: hunkHeaderMatch[5].trim(),
        lines: [],
      };
      hunks.push(currentHunk);
      oldLine = oldStart;
      newLine = newStart;
      continue;
    }

    if (!currentHunk) continue;

    if (line.startsWith("+")) {
      currentHunk.lines.push({
        type: "add",
        oldLineNumber: undefined,
        newLineNumber: newLine++,
        content: line.substring(1),
      });
    } else if (line.startsWith("-")) {
      currentHunk.lines.push({
        type: "delete",
        oldLineNumber: oldLine++,
        newLineNumber: undefined,
        content: line.substring(1),
      });
    } else if (line.startsWith(" ")) {
      currentHunk.lines.push({
        type: "context",
        oldLineNumber: oldLine++,
        newLineNumber: newLine++,
        content: line.substring(1),
      });
    }
  }

  return hunks;
}

/**
 * Generate a summary string from parsed diff files.
 * Shows total files changed, insertions, and deletions.
 */
export function summarizeDiff(files: DiffFile[]): string {
  const totalAdditions = files.reduce((s, f) => s + f.additions, 0);
  const totalDeletions = files.reduce((s, f) => s + f.deletions, 0);
  const fileCount = files.length;

  return `${fileCount} file(s) changed, ${totalAdditions} insertion(s)(+), ${totalDeletions} deletion(s)(-)`;
}

/**
 * Filter diff files by status type.
 * Returns only files matching the specified change status.
 */
export function filterDiffByStatus(
  files: DiffFile[],
  status: DiffFile["status"]
): DiffFile[] {
  return files.filter((f) => f.status === status);
}
