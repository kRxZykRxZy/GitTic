/**
 * Merge conflict editor for resolving three-way merge conflicts.
 * Detects conflict markers, supports accept theirs/ours/both operations,
 * and tracks resolution state.
 */

/**
 * A single merge conflict region in a file.
 */
export interface MergeConflict {
  /** Unique identifier for this conflict. */
  id: string;
  /** Start line of the conflict (<<<<<<< marker). */
  startLine: number;
  /** Line of the ======= separator. */
  separatorLine: number;
  /** End line of the conflict (>>>>>>> marker). */
  endLine: number;
  /** "Ours" content (between <<<<<<< and =======). */
  oursContent: string[];
  /** "Theirs" content (between ======= and >>>>>>>). */
  theirsContent: string[];
  /** Branch or label for "ours" side. */
  oursLabel: string;
  /** Branch or label for "theirs" side. */
  theirsLabel: string;
  /** Resolution state. */
  resolution: ConflictResolution;
  /** Whether this conflict has been resolved. */
  isResolved: boolean;
}

/**
 * Resolution choice for a merge conflict.
 */
export type ConflictResolution = "unresolved" | "ours" | "theirs" | "both" | "custom";

/**
 * Complete merge conflict state for a file.
 */
export interface MergeConflictFile {
  /** File path. */
  filePath: string;
  /** All detected conflicts. */
  conflicts: MergeConflict[];
  /** Whether all conflicts are resolved. */
  isFullyResolved: boolean;
  /** Total number of conflicts. */
  totalConflicts: number;
  /** Number of resolved conflicts. */
  resolvedCount: number;
}

/** Conflict marker patterns. */
const CONFLICT_START = /^<{7}\s*(.*)$/;
const CONFLICT_SEPARATOR = /^={7}$/;
const CONFLICT_END = /^>{7}\s*(.*)$/;

/**
 * Detects and manages merge conflicts within editor files.
 */
export class MergeEditor {
  private files = new Map<string, MergeConflictFile>();
  private conflictCounter = 0;

  /**
   * Detect merge conflicts in a file's content.
   * Returns the conflict data for the file.
   */
  detectConflicts(filePath: string, content: string): MergeConflictFile {
    const lines = content.split("\n");
    const conflicts: MergeConflict[] = [];

    let i = 0;
    while (i < lines.length) {
      const startMatch = CONFLICT_START.exec(lines[i]);
      if (startMatch) {
        const conflict = this.parseConflict(lines, i, startMatch[1] || "HEAD");
        if (conflict) {
          conflicts.push(conflict);
          i = conflict.endLine + 1;
          continue;
        }
      }
      i++;
    }

    const fileData: MergeConflictFile = {
      filePath,
      conflicts,
      isFullyResolved: conflicts.every((c) => c.isResolved),
      totalConflicts: conflicts.length,
      resolvedCount: conflicts.filter((c) => c.isResolved).length,
    };

    this.files.set(filePath, fileData);
    return fileData;
  }

  /**
   * Accept "ours" (current branch) side for a conflict.
   */
  acceptOurs(filePath: string, conflictId: string): boolean {
    return this.resolve(filePath, conflictId, "ours");
  }

  /**
   * Accept "theirs" (incoming branch) side for a conflict.
   */
  acceptTheirs(filePath: string, conflictId: string): boolean {
    return this.resolve(filePath, conflictId, "theirs");
  }

  /**
   * Accept both sides for a conflict (concatenate ours + theirs).
   */
  acceptBoth(filePath: string, conflictId: string): boolean {
    return this.resolve(filePath, conflictId, "both");
  }

  /**
   * Apply a custom resolution to a conflict.
   */
  acceptCustom(filePath: string, conflictId: string, customContent: string[]): boolean {
    const file = this.files.get(filePath);
    if (!file) return false;
    const conflict = file.conflicts.find((c) => c.id === conflictId);
    if (!conflict) return false;

    conflict.resolution = "custom";
    conflict.isResolved = true;
    conflict.oursContent = customContent;
    this.updateFileState(file);
    return true;
  }

  /**
   * Get the resolved content for a conflict.
   */
  getResolvedContent(conflict: MergeConflict): string[] {
    switch (conflict.resolution) {
      case "ours":
        return conflict.oursContent;
      case "theirs":
        return conflict.theirsContent;
      case "both":
        return [...conflict.oursContent, ...conflict.theirsContent];
      case "custom":
        return conflict.oursContent;
      default:
        return [];
    }
  }

  /**
   * Apply all resolutions and produce the final file content.
   */
  applyResolutions(filePath: string, originalContent: string): string | null {
    const file = this.files.get(filePath);
    if (!file || !file.isFullyResolved) return null;

    const lines = originalContent.split("\n");
    const result: string[] = [];

    let i = 0;
    let conflictIdx = 0;

    while (i < lines.length) {
      if (conflictIdx < file.conflicts.length) {
        const conflict = file.conflicts[conflictIdx];
        if (i === conflict.startLine) {
          result.push(...this.getResolvedContent(conflict));
          i = conflict.endLine + 1;
          conflictIdx++;
          continue;
        }
      }
      result.push(lines[i]);
      i++;
    }

    return result.join("\n");
  }

  /**
   * Get the conflict data for a file.
   */
  getFileConflicts(filePath: string): MergeConflictFile | null {
    return this.files.get(filePath) ?? null;
  }

  /**
   * Get unresolved conflicts for a file.
   */
  getUnresolvedConflicts(filePath: string): MergeConflict[] {
    const file = this.files.get(filePath);
    if (!file) return [];
    return file.conflicts.filter((c) => !c.isResolved);
  }

  /**
   * Navigate to the next unresolved conflict.
   */
  getNextUnresolved(filePath: string, currentLine: number): MergeConflict | null {
    const unresolved = this.getUnresolvedConflicts(filePath);
    return unresolved.find((c) => c.startLine > currentLine) ?? unresolved[0] ?? null;
  }

  /**
   * Check if a file has any merge conflicts.
   */
  hasConflicts(filePath: string): boolean {
    const file = this.files.get(filePath);
    return file ? file.totalConflicts > 0 : false;
  }

  /**
   * Clear conflict data for a file.
   */
  clearFile(filePath: string): void {
    this.files.delete(filePath);
  }

  /**
   * Clear all conflict data.
   */
  clearAll(): void {
    this.files.clear();
  }

  /**
   * Get all files with unresolved conflicts.
   */
  getFilesWithConflicts(): string[] {
    const result: string[] = [];
    for (const [path, file] of this.files) {
      if (file.totalConflicts > 0 && !file.isFullyResolved) {
        result.push(path);
      }
    }
    return result;
  }

  /**
   * Parse a single conflict block starting from the given line.
   */
  private parseConflict(lines: string[], startLine: number, oursLabel: string): MergeConflict | null {
    let separatorLine = -1;
    let endLine = -1;
    let theirsLabel = "";

    for (let i = startLine + 1; i < lines.length; i++) {
      if (CONFLICT_SEPARATOR.test(lines[i])) {
        separatorLine = i;
      } else if (separatorLine !== -1) {
        const endMatch = CONFLICT_END.exec(lines[i]);
        if (endMatch) {
          endLine = i;
          theirsLabel = endMatch[1] || "incoming";
          break;
        }
      }
    }

    if (separatorLine === -1 || endLine === -1) return null;

    const oursContent: string[] = [];
    for (let i = startLine + 1; i < separatorLine; i++) {
      oursContent.push(lines[i]);
    }

    const theirsContent: string[] = [];
    for (let i = separatorLine + 1; i < endLine; i++) {
      theirsContent.push(lines[i]);
    }

    return {
      id: `conflict-${++this.conflictCounter}`,
      startLine,
      separatorLine,
      endLine,
      oursContent,
      theirsContent,
      oursLabel,
      theirsLabel,
      resolution: "unresolved",
      isResolved: false,
    };
  }

  /**
   * Resolve a conflict with the specified resolution.
   */
  private resolve(filePath: string, conflictId: string, resolution: ConflictResolution): boolean {
    const file = this.files.get(filePath);
    if (!file) return false;
    const conflict = file.conflicts.find((c) => c.id === conflictId);
    if (!conflict) return false;

    conflict.resolution = resolution;
    conflict.isResolved = true;
    this.updateFileState(file);
    return true;
  }

  /**
   * Update the file-level resolved state.
   */
  private updateFileState(file: MergeConflictFile): void {
    file.resolvedCount = file.conflicts.filter((c) => c.isResolved).length;
    file.isFullyResolved = file.resolvedCount === file.totalConflicts;
  }
}
