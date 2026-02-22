/**
 * Diff viewer for comparing file versions.
 * Computes line-level diffs, supports side-by-side and inline display,
 * highlights changes, and collapses unchanged regions.
 */

/**
 * Type of change for a diff line.
 */
export type DiffLineType = "added" | "removed" | "unchanged" | "modified";

/**
 * A single line in a diff output.
 */
export interface DiffLine {
  /** Type of change. */
  type: DiffLineType;
  /** Line number in the old version (null for added lines). */
  oldLineNumber: number | null;
  /** Line number in the new version (null for removed lines). */
  newLineNumber: number | null;
  /** Text content of the line. */
  content: string;
}

/**
 * A contiguous group of diff lines (a hunk).
 */
export interface DiffHunk {
  /** Starting line in the old version. */
  oldStart: number;
  /** Number of lines from the old version. */
  oldCount: number;
  /** Starting line in the new version. */
  newStart: number;
  /** Number of lines in the new version. */
  newCount: number;
  /** Lines in this hunk. */
  lines: DiffLine[];
}

/**
 * Complete diff result between two texts.
 */
export interface DiffResult {
  /** All hunks in the diff. */
  hunks: DiffHunk[];
  /** Total added lines. */
  addedCount: number;
  /** Total removed lines. */
  removedCount: number;
  /** Total unchanged lines. */
  unchangedCount: number;
  /** Whether the files are identical. */
  isIdentical: boolean;
}

/**
 * A collapsible region of unchanged lines.
 */
export interface CollapsibleRegion {
  /** Start line index in the diff output. */
  startLine: number;
  /** End line index in the diff output. */
  endLine: number;
  /** Number of lines in this region. */
  lineCount: number;
  /** Whether the region is currently collapsed. */
  isCollapsed: boolean;
}

/**
 * Configuration for the diff viewer.
 */
export interface DiffViewerConfig {
  /** Number of context lines to show around changes. */
  contextLines: number;
  /** Minimum number of unchanged lines before collapsing. */
  collapseThreshold: number;
  /** Whether to ignore whitespace differences. */
  ignoreWhitespace: boolean;
  /** Whether to ignore trailing whitespace. */
  ignoreTrailingWhitespace: boolean;
}

/** Default diff viewer configuration. */
export const DEFAULT_DIFF_VIEWER_CONFIG: DiffViewerConfig = {
  contextLines: 3,
  collapseThreshold: 8,
  ignoreWhitespace: false,
  ignoreTrailingWhitespace: true,
};

/**
 * Computes and displays diffs between two text documents.
 */
export class DiffViewer {
  private config: DiffViewerConfig;
  private collapsedRegions: CollapsibleRegion[] = [];

  constructor(config: Partial<DiffViewerConfig> = {}) {
    this.config = { ...DEFAULT_DIFF_VIEWER_CONFIG, ...config };
  }

  /**
   * Compute the diff between two text strings.
   */
  computeDiff(oldText: string, newText: string): DiffResult {
    const oldLines = oldText.split("\n");
    const newLines = newText.split("\n");

    const diffLines = this.myersDiff(oldLines, newLines);
    const hunks = this.groupIntoHunks(diffLines);

    let addedCount = 0;
    let removedCount = 0;
    let unchangedCount = 0;

    for (const line of diffLines) {
      switch (line.type) {
        case "added":
          addedCount++;
          break;
        case "removed":
          removedCount++;
          break;
        case "unchanged":
          unchangedCount++;
          break;
      }
    }

    return {
      hunks,
      addedCount,
      removedCount,
      unchangedCount,
      isIdentical: addedCount === 0 && removedCount === 0,
    };
  }

  /**
   * Find collapsible regions of unchanged lines in a diff result.
   */
  findCollapsibleRegions(diffResult: DiffResult): CollapsibleRegion[] {
    const regions: CollapsibleRegion[] = [];
    const allLines = diffResult.hunks.flatMap((h) => h.lines);

    let regionStart = -1;
    let count = 0;

    for (let i = 0; i < allLines.length; i++) {
      if (allLines[i].type === "unchanged") {
        if (regionStart === -1) regionStart = i;
        count++;
      } else {
        if (count >= this.config.collapseThreshold) {
          const innerStart = regionStart + this.config.contextLines;
          const innerEnd = i - this.config.contextLines;
          if (innerEnd > innerStart) {
            regions.push({
              startLine: innerStart,
              endLine: innerEnd,
              lineCount: innerEnd - innerStart,
              isCollapsed: true,
            });
          }
        }
        regionStart = -1;
        count = 0;
      }
    }

    if (count >= this.config.collapseThreshold) {
      const innerStart = regionStart + this.config.contextLines;
      const innerEnd = regionStart + count - this.config.contextLines;
      if (innerEnd > innerStart) {
        regions.push({
          startLine: innerStart,
          endLine: innerEnd,
          lineCount: innerEnd - innerStart,
          isCollapsed: true,
        });
      }
    }

    this.collapsedRegions = regions;
    return regions;
  }

  /**
   * Toggle a collapsed region.
   */
  toggleRegion(regionIndex: number): boolean {
    if (regionIndex < 0 || regionIndex >= this.collapsedRegions.length) return false;
    this.collapsedRegions[regionIndex].isCollapsed = !this.collapsedRegions[regionIndex].isCollapsed;
    return true;
  }

  /**
   * Expand all collapsed regions.
   */
  expandAll(): void {
    for (const region of this.collapsedRegions) {
      region.isCollapsed = false;
    }
  }

  /**
   * Collapse all collapsible regions.
   */
  collapseAll(): void {
    for (const region of this.collapsedRegions) {
      region.isCollapsed = true;
    }
  }

  /**
   * Simple line-level diff using a Myers-like algorithm.
   * Computes the longest common subsequence and derives added/removed/unchanged lines.
   */
  private myersDiff(oldLines: string[], newLines: string[]): DiffLine[] {
    const lcs = this.longestCommonSubsequence(oldLines, newLines);
    const result: DiffLine[] = [];

    let oldIdx = 0;
    let newIdx = 0;
    let lcsIdx = 0;

    while (oldIdx < oldLines.length || newIdx < newLines.length) {
      if (lcsIdx < lcs.length && oldIdx < oldLines.length && this.linesEqual(oldLines[oldIdx], lcs[lcsIdx])) {
        if (newIdx < newLines.length && this.linesEqual(newLines[newIdx], lcs[lcsIdx])) {
          result.push({
            type: "unchanged",
            oldLineNumber: oldIdx + 1,
            newLineNumber: newIdx + 1,
            content: oldLines[oldIdx],
          });
          oldIdx++;
          newIdx++;
          lcsIdx++;
        } else if (newIdx < newLines.length) {
          result.push({
            type: "added",
            oldLineNumber: null,
            newLineNumber: newIdx + 1,
            content: newLines[newIdx],
          });
          newIdx++;
        }
      } else if (oldIdx < oldLines.length && (lcsIdx >= lcs.length || !this.linesEqual(oldLines[oldIdx], lcs[lcsIdx]))) {
        result.push({
          type: "removed",
          oldLineNumber: oldIdx + 1,
          newLineNumber: null,
          content: oldLines[oldIdx],
        });
        oldIdx++;
      } else if (newIdx < newLines.length) {
        result.push({
          type: "added",
          oldLineNumber: null,
          newLineNumber: newIdx + 1,
          content: newLines[newIdx],
        });
        newIdx++;
      }
    }

    return result;
  }

  /**
   * Compute the longest common subsequence of two line arrays.
   */
  private longestCommonSubsequence(a: string[], b: string[]): string[] {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (this.linesEqual(a[i - 1], b[j - 1])) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const lcs: string[] = [];
    let i = m;
    let j = n;
    while (i > 0 && j > 0) {
      if (this.linesEqual(a[i - 1], b[j - 1])) {
        lcs.unshift(a[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return lcs;
  }

  /**
   * Compare two lines, respecting whitespace configuration.
   */
  private linesEqual(a: string, b: string): boolean {
    let lineA = a;
    let lineB = b;

    if (this.config.ignoreWhitespace) {
      lineA = lineA.replace(/\s+/g, " ").trim();
      lineB = lineB.replace(/\s+/g, " ").trim();
    } else if (this.config.ignoreTrailingWhitespace) {
      lineA = lineA.trimEnd();
      lineB = lineB.trimEnd();
    }

    return lineA === lineB;
  }

  /**
   * Group flat diff lines into hunks.
   */
  private groupIntoHunks(lines: DiffLine[]): DiffHunk[] {
    if (lines.length === 0) return [];

    const hunks: DiffHunk[] = [];
    let currentHunk: DiffHunk = {
      oldStart: 1,
      oldCount: 0,
      newStart: 1,
      newCount: 0,
      lines: [],
    };

    for (const line of lines) {
      currentHunk.lines.push(line);
      if (line.oldLineNumber !== null) currentHunk.oldCount++;
      if (line.newLineNumber !== null) currentHunk.newCount++;
    }

    if (currentHunk.lines.length > 0) {
      hunks.push(currentHunk);
    }

    return hunks;
  }
}
