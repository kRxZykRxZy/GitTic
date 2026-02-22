/**
 * Central editor state management.
 * Tracks open files, active tab, cursor positions, undo/redo history per buffer.
 */

import type { BufferPosition } from "./buffer.js";
import type { SelectionRange } from "./selection.js";

/**
 * State of a single open file in the editor.
 */
export interface OpenFileState {
  /** Absolute path to the file. */
  filePath: string;
  /** Detected language identifier (e.g. "typescript", "python"). */
  language: string;
  /** Whether the buffer has unsaved modifications. */
  isDirty: boolean;
  /** Whether the file is pinned in the tab bar. */
  isPinned: boolean;
  /** Current cursor position. */
  cursorPosition: BufferPosition;
  /** Active selections in the file. */
  selections: SelectionRange[];
  /** Scroll position (top visible line). */
  scrollTop: number;
  /** Buffer version for change tracking. */
  version: number;
  /** Timestamp when the file was opened. */
  openedAt: number;
  /** Timestamp of the last edit. */
  lastEditedAt: number | null;
}

/**
 * Viewport dimensions and scroll state.
 */
export interface ViewportState {
  /** First visible line index. */
  topLine: number;
  /** Number of visible lines. */
  visibleLineCount: number;
  /** Horizontal scroll offset in pixels. */
  scrollLeft: number;
}

/**
 * Serializable snapshot of the full editor state for persistence.
 */
export interface EditorStateSnapshot {
  /** Ordered list of open file paths. */
  openFiles: string[];
  /** Path of the active file, or null. */
  activeFile: string | null;
  /** Per-file cursor and scroll positions. */
  fileStates: Record<string, { cursorLine: number; cursorColumn: number; scrollTop: number }>;
  /** Timestamp of the snapshot. */
  timestamp: number;
}

/**
 * Manages the global editor state across all open files.
 */
export class EditorState {
  private openFiles = new Map<string, OpenFileState>();
  private fileOrder: string[] = [];
  private _activeFile: string | null = null;
  private _viewport: ViewportState = { topLine: 0, visibleLineCount: 40, scrollLeft: 0 };

  /** The currently active file path, or null if none. */
  get activeFile(): string | null {
    return this._activeFile;
  }

  /** Current viewport state. */
  get viewport(): ViewportState {
    return { ...this._viewport };
  }

  /**
   * Open a file in the editor.
   * If already open, activates it without resetting state.
   */
  openFile(filePath: string, language: string): OpenFileState {
    let state = this.openFiles.get(filePath);
    if (!state) {
      state = {
        filePath,
        language,
        isDirty: false,
        isPinned: false,
        cursorPosition: { line: 0, column: 0 },
        selections: [],
        scrollTop: 0,
        version: 0,
        openedAt: Date.now(),
        lastEditedAt: null,
      };
      this.openFiles.set(filePath, state);
      this.fileOrder.push(filePath);
    }
    this._activeFile = filePath;
    return state;
  }

  /**
   * Close a file in the editor.
   * Activates the next available file or null if none remain.
   */
  closeFile(filePath: string): boolean {
    if (!this.openFiles.has(filePath)) return false;

    const idx = this.fileOrder.indexOf(filePath);
    this.openFiles.delete(filePath);
    this.fileOrder.splice(idx, 1);

    if (this._activeFile === filePath) {
      if (this.fileOrder.length > 0) {
        const nextIdx = Math.min(idx, this.fileOrder.length - 1);
        this._activeFile = this.fileOrder[nextIdx];
      } else {
        this._activeFile = null;
      }
    }
    return true;
  }

  /**
   * Switch the active file to the specified path.
   */
  setActiveFile(filePath: string): boolean {
    if (!this.openFiles.has(filePath)) return false;
    this._activeFile = filePath;
    return true;
  }

  /**
   * Get the state of a specific open file.
   */
  getFileState(filePath: string): OpenFileState | null {
    return this.openFiles.get(filePath) ?? null;
  }

  /**
   * Get the state of the currently active file.
   */
  getActiveFileState(): OpenFileState | null {
    if (!this._activeFile) return null;
    return this.openFiles.get(this._activeFile) ?? null;
  }

  /**
   * Get the ordered list of open file paths.
   */
  getOpenFiles(): readonly string[] {
    return this.fileOrder;
  }

  /**
   * Update the cursor position for a specific file.
   */
  setCursorPosition(filePath: string, line: number, column: number): void {
    const state = this.openFiles.get(filePath);
    if (!state) return;
    state.cursorPosition = { line, column };
  }

  /**
   * Update the selections for a specific file.
   */
  setSelections(filePath: string, selections: SelectionRange[]): void {
    const state = this.openFiles.get(filePath);
    if (!state) return;
    state.selections = selections;
  }

  /**
   * Mark a file as modified (dirty) or saved (clean).
   */
  setDirty(filePath: string, isDirty: boolean): void {
    const state = this.openFiles.get(filePath);
    if (!state) return;
    state.isDirty = isDirty;
    if (isDirty) {
      state.lastEditedAt = Date.now();
    }
  }

  /**
   * Increment the buffer version for change tracking.
   */
  incrementVersion(filePath: string): number {
    const state = this.openFiles.get(filePath);
    if (!state) return 0;
    state.version++;
    return state.version;
  }

  /**
   * Toggle the pinned state of a file tab.
   */
  togglePin(filePath: string): boolean {
    const state = this.openFiles.get(filePath);
    if (!state) return false;
    state.isPinned = !state.isPinned;
    return state.isPinned;
  }

  /**
   * Update the viewport scroll state.
   */
  setViewport(topLine: number, visibleLineCount?: number, scrollLeft?: number): void {
    this._viewport.topLine = topLine;
    if (visibleLineCount !== undefined) {
      this._viewport.visibleLineCount = visibleLineCount;
    }
    if (scrollLeft !== undefined) {
      this._viewport.scrollLeft = scrollLeft;
    }
  }

  /**
   * Update the scroll position for a specific file.
   */
  setScrollTop(filePath: string, scrollTop: number): void {
    const state = this.openFiles.get(filePath);
    if (!state) return;
    state.scrollTop = scrollTop;
  }

  /**
   * Reorder a file tab from one index to another.
   */
  reorderFile(fromIndex: number, toIndex: number): boolean {
    if (fromIndex < 0 || fromIndex >= this.fileOrder.length) return false;
    if (toIndex < 0 || toIndex >= this.fileOrder.length) return false;
    const [moved] = this.fileOrder.splice(fromIndex, 1);
    this.fileOrder.splice(toIndex, 0, moved);
    return true;
  }

  /**
   * Get a count of files with unsaved changes.
   */
  getDirtyFileCount(): number {
    let count = 0;
    for (const state of this.openFiles.values()) {
      if (state.isDirty) count++;
    }
    return count;
  }

  /**
   * Create a serializable snapshot of the editor state.
   */
  snapshot(): EditorStateSnapshot {
    const fileStates: EditorStateSnapshot["fileStates"] = {};
    for (const [path, state] of this.openFiles) {
      fileStates[path] = {
        cursorLine: state.cursorPosition.line,
        cursorColumn: state.cursorPosition.column,
        scrollTop: state.scrollTop,
      };
    }
    return {
      openFiles: [...this.fileOrder],
      activeFile: this._activeFile,
      fileStates,
      timestamp: Date.now(),
    };
  }

  /**
   * Restore editor state from a snapshot.
   * Only restores file order and active file — caller must reopen files and buffers.
   */
  restoreFromSnapshot(snapshot: EditorStateSnapshot, language: string = "plaintext"): void {
    for (const filePath of snapshot.openFiles) {
      const stored = snapshot.fileStates[filePath];
      const state = this.openFile(filePath, language);
      if (stored) {
        state.cursorPosition = { line: stored.cursorLine, column: stored.cursorColumn };
        state.scrollTop = stored.scrollTop;
      }
    }
    if (snapshot.activeFile && this.openFiles.has(snapshot.activeFile)) {
      this._activeFile = snapshot.activeFile;
    }
  }
}
