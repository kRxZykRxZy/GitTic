/**
 * Cursor management for the editor.
 * Handles single and multi-cursor positions, movement, and selection anchoring.
 */

/**
 * A single cursor position in the editor (zero-based line and column).
 */
export interface CursorPos {
  /** Zero-based line number. */
  line: number;
  /** Zero-based column number. */
  column: number;
}

/**
 * A cursor instance with optional selection anchor for tracking text selection.
 */
export interface EditorCursor {
  /** Unique identifier for this cursor in multi-cursor mode. */
  id: string;
  /** Current position of the cursor. */
  position: CursorPos;
  /** Anchor position when a selection is active, null otherwise. */
  selectionAnchor: CursorPos | null;
  /** Preferred column for vertical navigation (remembers horizontal offset). */
  desiredColumn: number;
}

/**
 * Direction constants for cursor movement operations.
 */
export type CursorDirection = "up" | "down" | "left" | "right";

/**
 * Unit of movement for cursor operations.
 */
export type CursorMoveUnit = "character" | "word" | "line" | "page" | "document";

/**
 * Manages one or more cursors within an editor instance.
 */
export class CursorManager {
  private cursors: EditorCursor[] = [];
  private _pageSize: number;

  /**
   * Create a cursor manager with an initial primary cursor at (0, 0).
   */
  constructor(pageSize: number = 30) {
    this._pageSize = pageSize;
    this.cursors = [
      {
        id: "primary",
        position: { line: 0, column: 0 },
        selectionAnchor: null,
        desiredColumn: 0,
      },
    ];
  }

  /** Number of visible lines per page (for page up/down). */
  get pageSize(): number {
    return this._pageSize;
  }

  set pageSize(value: number) {
    this._pageSize = Math.max(1, value);
  }

  /**
   * Get the primary cursor (always the first cursor).
   */
  getPrimary(): EditorCursor {
    return this.cursors[0];
  }

  /**
   * Get all active cursors.
   */
  getAll(): readonly EditorCursor[] {
    return this.cursors;
  }

  /**
   * Set the primary cursor to a specific position, clearing any multi-cursors.
   */
  setPosition(line: number, column: number): void {
    this.cursors = [
      {
        id: "primary",
        position: { line: Math.max(0, line), column: Math.max(0, column) },
        selectionAnchor: null,
        desiredColumn: Math.max(0, column),
      },
    ];
  }

  /**
   * Add an additional cursor at the given position.
   * Merges cursors that share the same position.
   */
  addCursor(line: number, column: number): EditorCursor {
    const existing = this.cursors.find(
      (c) => c.position.line === line && c.position.column === column
    );
    if (existing) {
      return existing;
    }

    const cursor: EditorCursor = {
      id: `cursor-${Date.now()}-${this.cursors.length}`,
      position: { line: Math.max(0, line), column: Math.max(0, column) },
      selectionAnchor: null,
      desiredColumn: Math.max(0, column),
    };
    this.cursors.push(cursor);
    return cursor;
  }

  /**
   * Remove a cursor by its identifier.
   * The primary cursor cannot be removed.
   */
  removeCursor(cursorId: string): boolean {
    if (cursorId === "primary") return false;
    const idx = this.cursors.findIndex((c) => c.id === cursorId);
    if (idx === -1) return false;
    this.cursors.splice(idx, 1);
    return true;
  }

  /**
   * Clear all cursors except the primary, resetting to single-cursor mode.
   */
  clearSecondary(): void {
    this.cursors = [this.cursors[0]];
  }

  /**
   * Move all cursors in the specified direction by the given unit.
   * Respects line lengths provided by the lineLength callback.
   */
  moveAll(
    direction: CursorDirection,
    unit: CursorMoveUnit,
    lineCount: number,
    lineLengthFn: (line: number) => number,
    select: boolean = false
  ): void {
    for (const cursor of this.cursors) {
      this.moveCursor(cursor, direction, unit, lineCount, lineLengthFn, select);
    }
    this.mergeDuplicates();
  }

  /**
   * Move a single cursor in the specified direction.
   */
  private moveCursor(
    cursor: EditorCursor,
    direction: CursorDirection,
    unit: CursorMoveUnit,
    lineCount: number,
    lineLengthFn: (line: number) => number,
    select: boolean
  ): void {
    if (select && !cursor.selectionAnchor) {
      cursor.selectionAnchor = { ...cursor.position };
    } else if (!select) {
      cursor.selectionAnchor = null;
    }

    const pos = cursor.position;

    switch (direction) {
      case "up":
        this.moveUp(cursor, unit, lineLengthFn);
        break;
      case "down":
        this.moveDown(cursor, unit, lineCount, lineLengthFn);
        break;
      case "left":
        this.moveLeft(cursor, unit, lineLengthFn);
        break;
      case "right":
        this.moveRight(cursor, unit, lineCount, lineLengthFn);
        break;
    }

    if (direction === "left" || direction === "right") {
      cursor.desiredColumn = pos.column;
    }
  }

  /**
   * Move cursor up by the appropriate unit amount.
   */
  private moveUp(
    cursor: EditorCursor,
    unit: CursorMoveUnit,
    lineLengthFn: (line: number) => number
  ): void {
    const pos = cursor.position;
    switch (unit) {
      case "character":
      case "word":
      case "line":
        if (pos.line > 0) {
          pos.line--;
          pos.column = Math.min(cursor.desiredColumn, lineLengthFn(pos.line));
        }
        break;
      case "page":
        pos.line = Math.max(0, pos.line - this._pageSize);
        pos.column = Math.min(cursor.desiredColumn, lineLengthFn(pos.line));
        break;
      case "document":
        pos.line = 0;
        pos.column = 0;
        break;
    }
  }

  /**
   * Move cursor down by the appropriate unit amount.
   */
  private moveDown(
    cursor: EditorCursor,
    unit: CursorMoveUnit,
    lineCount: number,
    lineLengthFn: (line: number) => number
  ): void {
    const pos = cursor.position;
    const maxLine = lineCount - 1;
    switch (unit) {
      case "character":
      case "word":
      case "line":
        if (pos.line < maxLine) {
          pos.line++;
          pos.column = Math.min(cursor.desiredColumn, lineLengthFn(pos.line));
        }
        break;
      case "page":
        pos.line = Math.min(maxLine, pos.line + this._pageSize);
        pos.column = Math.min(cursor.desiredColumn, lineLengthFn(pos.line));
        break;
      case "document":
        pos.line = maxLine;
        pos.column = lineLengthFn(maxLine);
        break;
    }
  }

  /**
   * Move cursor left by one character, wrapping to previous line if at start.
   */
  private moveLeft(
    cursor: EditorCursor,
    unit: CursorMoveUnit,
    lineLengthFn: (line: number) => number
  ): void {
    const pos = cursor.position;
    if (unit === "line") {
      pos.column = 0;
      return;
    }
    if (pos.column > 0) {
      pos.column--;
    } else if (pos.line > 0) {
      pos.line--;
      pos.column = lineLengthFn(pos.line);
    }
  }

  /**
   * Move cursor right by one character, wrapping to next line if at end.
   */
  private moveRight(
    cursor: EditorCursor,
    unit: CursorMoveUnit,
    lineCount: number,
    lineLengthFn: (line: number) => number
  ): void {
    const pos = cursor.position;
    if (unit === "line") {
      pos.column = lineLengthFn(pos.line);
      return;
    }
    if (pos.column < lineLengthFn(pos.line)) {
      pos.column++;
    } else if (pos.line < lineCount - 1) {
      pos.line++;
      pos.column = 0;
    }
  }

  /**
   * Select all text from the current cursor position to the end of the buffer.
   */
  selectAll(lineCount: number, lineLengthFn: (line: number) => number): void {
    const primary = this.cursors[0];
    primary.selectionAnchor = { line: 0, column: 0 };
    primary.position = { line: lineCount - 1, column: lineLengthFn(lineCount - 1) };
    this.clearSecondary();
  }

  /**
   * Merge cursors that occupy the same position.
   */
  private mergeDuplicates(): void {
    const seen = new Set<string>();
    this.cursors = this.cursors.filter((c) => {
      const key = `${c.position.line}:${c.position.column}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
