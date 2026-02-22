import { parseDiff } from "../diff/diff-parser.js";
import type { DiffFile, DiffHunk, DiffLine } from "../diff/diff-parser.js";

/** A position within a diff identified by file and line. */
export interface DiffPosition {
  file: string;
  position: number;
  side: "LEFT" | "RIGHT";
  line: number;
  hunkIndex: number;
}

/** A review comment anchored to a specific diff position. */
export interface ReviewComment {
  id: string;
  body: string;
  path: string;
  position: number;
  line: number;
  side: "LEFT" | "RIGHT";
  outdated: boolean;
}

/** Result of resolving a comment position in a new diff. */
export interface PositionResolution {
  resolved: boolean;
  newPosition: number | undefined;
  newLine: number | undefined;
  outdated: boolean;
  reason: string;
}

/**
 * Map a file line number to a position within the diff.
 * Position is the 1-based index of the line within the diff output.
 */
export function mapLineToPosition(
  diffFiles: DiffFile[],
  filePath: string,
  line: number,
  side: "LEFT" | "RIGHT" = "RIGHT"
): DiffPosition | undefined {
  const file = diffFiles.find(
    (f) => f.newPath === filePath || f.oldPath === filePath
  );

  if (!file) return undefined;

  let position = 0;

  for (let hunkIdx = 0; hunkIdx < file.hunks.length; hunkIdx++) {
    const hunk = file.hunks[hunkIdx];
    position++;

    for (const diffLine of hunk.lines) {
      position++;

      if (side === "RIGHT" && diffLine.newLineNumber === line) {
        return {
          file: filePath,
          position,
          side,
          line,
          hunkIndex: hunkIdx,
        };
      }

      if (side === "LEFT" && diffLine.oldLineNumber === line) {
        return {
          file: filePath,
          position,
          side,
          line,
          hunkIndex: hunkIdx,
        };
      }
    }
  }

  return undefined;
}

/**
 * Resolve a diff position back to a file line number.
 * Converts a position integer to the corresponding source line.
 */
export function resolvePosition(
  diffFiles: DiffFile[],
  filePath: string,
  position: number
): { line: number; side: "LEFT" | "RIGHT" } | undefined {
  const file = diffFiles.find(
    (f) => f.newPath === filePath || f.oldPath === filePath
  );

  if (!file) return undefined;

  let currentPos = 0;

  for (const hunk of file.hunks) {
    currentPos++;
    if (currentPos === position) {
      return { line: hunk.newStart, side: "RIGHT" };
    }

    for (const diffLine of hunk.lines) {
      currentPos++;
      if (currentPos === position) {
        if (diffLine.type === "delete") {
          return {
            line: diffLine.oldLineNumber ?? 0,
            side: "LEFT",
          };
        }
        return {
          line: diffLine.newLineNumber ?? diffLine.oldLineNumber ?? 0,
          side: "RIGHT",
        };
      }
    }
  }

  return undefined;
}

/**
 * Check if a review comment is outdated by comparing old and new diffs.
 * A comment is outdated if the line it references has been modified.
 */
export function outdatedCheck(
  comment: ReviewComment,
  oldDiff: string,
  newDiff: string
): PositionResolution {
  const oldFiles = parseDiff(oldDiff);
  const newFiles = parseDiff(newDiff);

  const oldPos = resolvePosition(oldFiles, comment.path, comment.position);
  if (!oldPos) {
    return {
      resolved: false,
      newPosition: undefined,
      newLine: undefined,
      outdated: true,
      reason: "Original position no longer exists in the diff",
    };
  }

  const newFile = newFiles.find(
    (f) => f.newPath === comment.path || f.oldPath === comment.path
  );

  if (!newFile) {
    return {
      resolved: false,
      newPosition: undefined,
      newLine: undefined,
      outdated: true,
      reason: "File is no longer in the diff",
    };
  }

  const newPosition = mapLineToPosition(
    newFiles,
    comment.path,
    oldPos.line,
    oldPos.side
  );

  if (!newPosition) {
    return {
      resolved: false,
      newPosition: undefined,
      newLine: undefined,
      outdated: true,
      reason: "Line is no longer part of the changed region",
    };
  }

  return {
    resolved: true,
    newPosition: newPosition.position,
    newLine: newPosition.line,
    outdated: false,
    reason: "Comment position resolved successfully",
  };
}

/**
 * Calculate the line offset between two versions of a file.
 * Accounts for insertions and deletions that shift line numbers.
 */
export function calculateLineOffset(
  hunks: DiffHunk[],
  targetLine: number
): number {
  let offset = 0;

  for (const hunk of hunks) {
    if (hunk.oldStart > targetLine) break;

    for (const line of hunk.lines) {
      if (line.type === "add") offset++;
      else if (line.type === "delete") offset--;
    }
  }

  return offset;
}

/**
 * Find all positions in a diff that are available for commenting.
 * Returns valid position numbers and their corresponding lines.
 */
export function getCommentablePositions(
  diffFiles: DiffFile[],
  filePath: string
): DiffPosition[] {
  const file = diffFiles.find(
    (f) => f.newPath === filePath || f.oldPath === filePath
  );

  if (!file) return [];

  const positions: DiffPosition[] = [];
  let position = 0;

  for (let hunkIdx = 0; hunkIdx < file.hunks.length; hunkIdx++) {
    const hunk = file.hunks[hunkIdx];
    position++;

    for (const diffLine of hunk.lines) {
      position++;
      const side: "LEFT" | "RIGHT" = diffLine.type === "delete" ? "LEFT" : "RIGHT";
      const line = side === "LEFT"
        ? diffLine.oldLineNumber ?? 0
        : diffLine.newLineNumber ?? 0;

      positions.push({
        file: filePath,
        position,
        side,
        line,
        hunkIndex: hunkIdx,
      });
    }
  }

  return positions;
}
