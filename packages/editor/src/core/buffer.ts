/**
 * Line-based text buffer for editor content management.
 * Provides efficient text manipulation operations with version tracking.
 */

/**
 * Position within a text buffer.
 */
export interface BufferPosition {
  /** Zero-based line index. */
  line: number;
  /** Zero-based column index. */
  column: number;
}

/**
 * Range within a text buffer defined by start and end positions.
 */
export interface BufferRange {
  start: BufferPosition;
  end: BufferPosition;
}

/**
 * A recorded change made to the buffer for undo/redo support.
 */
export interface BufferChange {
  /** Range that was replaced (empty range for pure inserts). */
  range: BufferRange;
  /** Text that was inserted at the range. */
  text: string;
  /** Text that was removed from the range. */
  removedText: string;
  /** Buffer version before the change. */
  version: number;
}

/**
 * Line-based text buffer with version tracking.
 * Stores content as an array of lines for efficient line-level operations.
 */
export class TextBuffer {
  private lines: string[];
  private _version: number;
  private _filePath: string;
  private changeLog: BufferChange[] = [];
  private maxChangeLog = 500;

  /**
   * Create a new text buffer.
   */
  constructor(content: string = "", filePath: string = "") {
    this.lines = content.length === 0 ? [""] : content.split("\n");
    this._version = 0;
    this._filePath = filePath;
  }

  /** Current buffer version, incremented on each change. */
  get version(): number {
    return this._version;
  }

  /** File path associated with this buffer. */
  get filePath(): string {
    return this._filePath;
  }

  /** Number of lines in the buffer. */
  get lineCount(): number {
    return this.lines.length;
  }

  /**
   * Get the full content of the buffer as a single string.
   */
  getContent(): string {
    return this.lines.join("\n");
  }

  /**
   * Replace the entire content of the buffer.
   */
  setContent(content: string): void {
    this.lines = content.length === 0 ? [""] : content.split("\n");
    this._version++;
  }

  /**
   * Get a single line by zero-based index.
   * Returns empty string if line is out of range.
   */
  getLine(lineIndex: number): string {
    if (lineIndex < 0 || lineIndex >= this.lines.length) {
      return "";
    }
    return this.lines[lineIndex];
  }

  /**
   * Get the length of a specific line.
   */
  getLineLength(lineIndex: number): number {
    return this.getLine(lineIndex).length;
  }

  /**
   * Get a range of text from the buffer.
   */
  getRange(range: BufferRange): string {
    const startLine = Math.max(0, range.start.line);
    const endLine = Math.min(this.lines.length - 1, range.end.line);

    if (startLine === endLine) {
      return this.lines[startLine].substring(range.start.column, range.end.column);
    }

    const result: string[] = [];
    result.push(this.lines[startLine].substring(range.start.column));
    for (let i = startLine + 1; i < endLine; i++) {
      result.push(this.lines[i]);
    }
    result.push(this.lines[endLine].substring(0, range.end.column));
    return result.join("\n");
  }

  /**
   * Insert text at a specific position in the buffer.
   * Returns the buffer change record for undo support.
   */
  insertText(position: BufferPosition, text: string): BufferChange {
    const line = Math.max(0, Math.min(position.line, this.lines.length - 1));
    const col = Math.max(0, Math.min(position.column, this.lines[line].length));

    const currentLine = this.lines[line];
    const before = currentLine.substring(0, col);
    const after = currentLine.substring(col);

    const insertedLines = text.split("\n");
    const change: BufferChange = {
      range: { start: { line, column: col }, end: { line, column: col } },
      text,
      removedText: "",
      version: this._version,
    };

    if (insertedLines.length === 1) {
      this.lines[line] = before + insertedLines[0] + after;
    } else {
      const newLines: string[] = [];
      newLines.push(before + insertedLines[0]);
      for (let i = 1; i < insertedLines.length - 1; i++) {
        newLines.push(insertedLines[i]);
      }
      newLines.push(insertedLines[insertedLines.length - 1] + after);
      this.lines.splice(line, 1, ...newLines);
    }

    this._version++;
    this.recordChange(change);
    return change;
  }

  /**
   * Delete text within a specified range.
   * Returns the buffer change record for undo support.
   */
  deleteRange(range: BufferRange): BufferChange {
    const startLine = Math.max(0, range.start.line);
    const endLine = Math.min(this.lines.length - 1, range.end.line);
    const startCol = Math.max(0, Math.min(range.start.column, this.lines[startLine].length));
    const endCol = Math.max(0, Math.min(range.end.column, this.lines[endLine].length));

    const removedText = this.getRange({
      start: { line: startLine, column: startCol },
      end: { line: endLine, column: endCol },
    });

    const change: BufferChange = {
      range: {
        start: { line: startLine, column: startCol },
        end: { line: endLine, column: endCol },
      },
      text: "",
      removedText,
      version: this._version,
    };

    const before = this.lines[startLine].substring(0, startCol);
    const after = this.lines[endLine].substring(endCol);
    this.lines.splice(startLine, endLine - startLine + 1, before + after);

    this._version++;
    this.recordChange(change);
    return change;
  }

  /**
   * Replace text within a range with new text.
   */
  replaceRange(range: BufferRange, newText: string): BufferChange {
    const removedText = this.getRange(range);
    this.deleteRange(range);
    this._version--; // compensate, insertText increments
    const change = this.insertText(range.start, newText);
    change.removedText = removedText;
    return change;
  }

  /**
   * Get all lines as a readonly array.
   */
  getLines(): readonly string[] {
    return this.lines;
  }

  /**
   * Find all occurrences of a pattern in the buffer.
   */
  findAll(pattern: string | RegExp, caseSensitive: boolean = true): BufferRange[] {
    const results: BufferRange[] = [];
    const regex = typeof pattern === "string"
      ? new RegExp(escapeRegExp(pattern), caseSensitive ? "g" : "gi")
      : new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");

    for (let lineIdx = 0; lineIdx < this.lines.length; lineIdx++) {
      const line = this.lines[lineIdx];
      let match: RegExpExecArray | null;
      regex.lastIndex = 0;
      while ((match = regex.exec(line)) !== null) {
        results.push({
          start: { line: lineIdx, column: match.index },
          end: { line: lineIdx, column: match.index + match[0].length },
        });
        if (match[0].length === 0) {
          regex.lastIndex++;
        }
      }
    }
    return results;
  }

  /**
   * Get the change log for this buffer.
   */
  getChangeLog(): readonly BufferChange[] {
    return this.changeLog;
  }

  /**
   * Clear the change log.
   */
  clearChangeLog(): void {
    this.changeLog = [];
  }

  /**
   * Record a change, trimming oldest entries if necessary.
   */
  private recordChange(change: BufferChange): void {
    this.changeLog.push(change);
    if (this.changeLog.length > this.maxChangeLog) {
      this.changeLog = this.changeLog.slice(-this.maxChangeLog);
    }
  }
}

/**
 * Escape special regex characters in a string for literal matching.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
