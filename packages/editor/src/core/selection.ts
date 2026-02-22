/**
 * Selection management for the editor.
 * Handles single and multi-selection, word/line selection, and range manipulation.
 */

/**
 * A contiguous text selection defined by anchor and active positions.
 * The anchor is where the selection started; active is where it ends.
 */
export interface SelectionRange {
  /** Line where the selection begins. */
  anchorLine: number;
  /** Column where the selection begins. */
  anchorColumn: number;
  /** Line where the selection ends (cursor position). */
  activeLine: number;
  /** Column where the selection ends (cursor position). */
  activeColumn: number;
}

/**
 * Normalized range with guaranteed start <= end ordering.
 */
export interface NormalizedRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

/**
 * Result of a word boundary detection operation.
 */
export interface WordBoundary {
  start: number;
  end: number;
  word: string;
}

/**
 * Manages text selections within an editor view.
 * Supports multiple simultaneous selections and provides helpers for
 * common selection patterns like word/line/paragraph selection.
 */
export class SelectionManager {
  private selections: SelectionRange[] = [];

  /**
   * Get all active selections.
   */
  getSelections(): readonly SelectionRange[] {
    return this.selections;
  }

  /**
   * Set a single selection, replacing all existing ones.
   */
  setSelection(
    anchorLine: number,
    anchorColumn: number,
    activeLine: number,
    activeColumn: number
  ): void {
    this.selections = [
      { anchorLine, anchorColumn, activeLine, activeColumn },
    ];
  }

  /**
   * Add an additional selection to the current set.
   */
  addSelection(
    anchorLine: number,
    anchorColumn: number,
    activeLine: number,
    activeColumn: number
  ): void {
    this.selections.push({ anchorLine, anchorColumn, activeLine, activeColumn });
    this.mergeOverlapping();
  }

  /**
   * Clear all selections.
   */
  clearSelections(): void {
    this.selections = [];
  }

  /**
   * Check whether any selection is currently active.
   */
  hasSelection(): boolean {
    return this.selections.length > 0;
  }

  /**
   * Get the primary (first) selection or null if none exists.
   */
  getPrimary(): SelectionRange | null {
    return this.selections.length > 0 ? this.selections[0] : null;
  }

  /**
   * Normalize a selection range so that start is always before end.
   */
  static normalize(selection: SelectionRange): NormalizedRange {
    const forward =
      selection.anchorLine < selection.activeLine ||
      (selection.anchorLine === selection.activeLine &&
        selection.anchorColumn <= selection.activeColumn);

    if (forward) {
      return {
        startLine: selection.anchorLine,
        startColumn: selection.anchorColumn,
        endLine: selection.activeLine,
        endColumn: selection.activeColumn,
      };
    }

    return {
      startLine: selection.activeLine,
      startColumn: selection.activeColumn,
      endLine: selection.anchorLine,
      endColumn: selection.anchorColumn,
    };
  }

  /**
   * Check if a selection range is empty (cursor is at anchor).
   */
  static isEmpty(selection: SelectionRange): boolean {
    return (
      selection.anchorLine === selection.activeLine &&
      selection.anchorColumn === selection.activeColumn
    );
  }

  /**
   * Select the word at the given position within a line of text.
   * Word boundaries are defined by non-alphanumeric/underscore characters.
   */
  selectWord(line: number, column: number, lineText: string): void {
    const boundary = SelectionManager.findWordBoundary(column, lineText);
    this.setSelection(line, boundary.start, line, boundary.end);
  }

  /**
   * Select an entire line by its zero-based index.
   */
  selectLine(line: number, lineLength: number): void {
    this.setSelection(line, 0, line, lineLength);
  }

  /**
   * Expand the primary selection to include the full lines it spans.
   */
  expandToFullLines(lineLengthFn: (line: number) => number): void {
    if (this.selections.length === 0) return;
    const sel = this.selections[0];
    const norm = SelectionManager.normalize(sel);
    this.selections[0] = {
      anchorLine: norm.startLine,
      anchorColumn: 0,
      activeLine: norm.endLine,
      activeColumn: lineLengthFn(norm.endLine),
    };
  }

  /**
   * Shrink the primary selection by one character on each side.
   */
  shrinkSelection(): void {
    if (this.selections.length === 0) return;
    const sel = this.selections[0];
    const norm = SelectionManager.normalize(sel);

    if (
      norm.startLine === norm.endLine &&
      norm.endColumn - norm.startColumn <= 2
    ) {
      const mid = Math.floor((norm.startColumn + norm.endColumn) / 2);
      this.selections[0] = {
        anchorLine: norm.startLine,
        anchorColumn: mid,
        activeLine: norm.endLine,
        activeColumn: mid,
      };
      return;
    }

    this.selections[0] = {
      anchorLine: norm.startLine,
      anchorColumn: norm.startColumn + 1,
      activeLine: norm.endLine,
      activeColumn: Math.max(norm.startColumn + 1, norm.endColumn - 1),
    };
  }

  /**
   * Get the text content of a selection given a line accessor function.
   */
  getSelectedText(
    selection: SelectionRange,
    getLineFn: (line: number) => string
  ): string {
    const norm = SelectionManager.normalize(selection);
    if (norm.startLine === norm.endLine) {
      return getLineFn(norm.startLine).substring(norm.startColumn, norm.endColumn);
    }

    const lines: string[] = [];
    lines.push(getLineFn(norm.startLine).substring(norm.startColumn));
    for (let i = norm.startLine + 1; i < norm.endLine; i++) {
      lines.push(getLineFn(i));
    }
    lines.push(getLineFn(norm.endLine).substring(0, norm.endColumn));
    return lines.join("\n");
  }

  /**
   * Find the word boundary around a column position in a line of text.
   */
  static findWordBoundary(column: number, lineText: string): WordBoundary {
    if (lineText.length === 0) {
      return { start: 0, end: 0, word: "" };
    }

    const col = Math.min(column, lineText.length - 1);
    const isWordChar = (ch: string): boolean => /[\w]/.test(ch);

    if (!isWordChar(lineText[col])) {
      return { start: col, end: col + 1, word: lineText[col] };
    }

    let start = col;
    while (start > 0 && isWordChar(lineText[start - 1])) {
      start--;
    }

    let end = col;
    while (end < lineText.length && isWordChar(lineText[end])) {
      end++;
    }

    return { start, end, word: lineText.substring(start, end) };
  }

  /**
   * Check whether two selection ranges overlap.
   */
  static rangesOverlap(a: NormalizedRange, b: NormalizedRange): boolean {
    if (a.endLine < b.startLine) return false;
    if (b.endLine < a.startLine) return false;
    if (a.endLine === b.startLine && a.endColumn <= b.startColumn) return false;
    if (b.endLine === a.startLine && b.endColumn <= a.startColumn) return false;
    return true;
  }

  /**
   * Merge overlapping selections to prevent duplication.
   */
  private mergeOverlapping(): void {
    if (this.selections.length <= 1) return;

    const normalized = this.selections.map((s) => ({
      original: s,
      norm: SelectionManager.normalize(s),
    }));

    normalized.sort(
      (a, b) =>
        a.norm.startLine - b.norm.startLine ||
        a.norm.startColumn - b.norm.startColumn
    );

    const merged: SelectionRange[] = [normalized[0].original];
    let lastNorm = normalized[0].norm;

    for (let i = 1; i < normalized.length; i++) {
      const curr = normalized[i];
      if (SelectionManager.rangesOverlap(lastNorm, curr.norm)) {
        const endLine = Math.max(lastNorm.endLine, curr.norm.endLine);
        const endColumn =
          endLine === lastNorm.endLine && endLine === curr.norm.endLine
            ? Math.max(lastNorm.endColumn, curr.norm.endColumn)
            : endLine === lastNorm.endLine
              ? lastNorm.endColumn
              : curr.norm.endColumn;

        merged[merged.length - 1] = {
          anchorLine: lastNorm.startLine,
          anchorColumn: lastNorm.startColumn,
          activeLine: endLine,
          activeColumn: endColumn,
        };
        lastNorm = {
          startLine: lastNorm.startLine,
          startColumn: lastNorm.startColumn,
          endLine,
          endColumn,
        };
      } else {
        merged.push(curr.original);
        lastNorm = curr.norm;
      }
    }

    this.selections = merged;
  }
}
