/**
 * Tab management for the editor.
 * Handles opening, closing, reordering, pinning tabs, and tracking recently closed tabs.
 */

/**
 * Represents a single editor tab.
 */
export interface EditorTab {
  /** File path opened in this tab. */
  filePath: string;
  /** Display label for the tab. */
  label: string;
  /** Whether the tab is pinned (cannot be auto-closed). */
  isPinned: boolean;
  /** Whether the file has unsaved changes. */
  isDirty: boolean;
  /** Split view pane identifier (null for main pane). */
  paneId: string | null;
  /** Timestamp when the tab was opened. */
  openedAt: number;
  /** Timestamp of the last activation. */
  lastActiveAt: number;
  /** Language identifier for the file. */
  language: string;
  /** Whether this tab is a preview (replaced when opening another file). */
  isPreview: boolean;
}

/**
 * Entry in the recently closed tabs history.
 */
export interface ClosedTabEntry {
  /** File path of the closed tab. */
  filePath: string;
  /** Cursor line at close time. */
  cursorLine: number;
  /** Cursor column at close time. */
  cursorColumn: number;
  /** Scroll position at close time. */
  scrollTop: number;
  /** Timestamp when the tab was closed. */
  closedAt: number;
}

/**
 * Manages the editor tab bar, including ordering, pinning, and recently closed history.
 */
export class TabManager {
  private tabs: EditorTab[] = [];
  private activeIndex: number = -1;
  private closedHistory: ClosedTabEntry[] = [];
  private maxClosedHistory: number;

  constructor(maxClosedHistory: number = 20) {
    this.maxClosedHistory = maxClosedHistory;
  }

  /**
   * Open a new tab or activate an existing one.
   */
  openTab(filePath: string, language: string = "plaintext", isPreview: boolean = false): EditorTab {
    const existingIdx = this.tabs.findIndex((t) => t.filePath === filePath);
    if (existingIdx !== -1) {
      this.activeIndex = existingIdx;
      this.tabs[existingIdx].lastActiveAt = Date.now();
      this.tabs[existingIdx].isPreview = false;
      return this.tabs[existingIdx];
    }

    // Replace existing preview tab if present
    if (isPreview) {
      const previewIdx = this.tabs.findIndex((t) => t.isPreview && !t.isDirty);
      if (previewIdx !== -1) {
        this.tabs.splice(previewIdx, 1);
        if (this.activeIndex >= previewIdx && this.activeIndex > 0) {
          this.activeIndex--;
        }
      }
    }

    const label = filePath.split("/").pop() || filePath;
    const tab: EditorTab = {
      filePath,
      label,
      isPinned: false,
      isDirty: false,
      paneId: null,
      openedAt: Date.now(),
      lastActiveAt: Date.now(),
      language,
      isPreview,
    };

    // Insert after pinned tabs
    const insertIdx = this.findInsertIndex();
    this.tabs.splice(insertIdx, 0, tab);
    this.activeIndex = insertIdx;
    return tab;
  }

  /**
   * Close a tab by its file path.
   * Records the tab in closed history for reopen support.
   */
  closeTab(filePath: string, cursorLine: number = 0, cursorColumn: number = 0, scrollTop: number = 0): boolean {
    const idx = this.tabs.findIndex((t) => t.filePath === filePath);
    if (idx === -1) return false;

    const tab = this.tabs[idx];
    if (tab.isPinned) return false;

    this.closedHistory.push({
      filePath: tab.filePath,
      cursorLine,
      cursorColumn,
      scrollTop,
      closedAt: Date.now(),
    });

    if (this.closedHistory.length > this.maxClosedHistory) {
      this.closedHistory.shift();
    }

    this.tabs.splice(idx, 1);

    if (this.activeIndex === idx) {
      this.activeIndex = Math.min(idx, this.tabs.length - 1);
    } else if (this.activeIndex > idx) {
      this.activeIndex--;
    }

    return true;
  }

  /**
   * Close all unpinned tabs.
   */
  closeAll(): void {
    this.tabs = this.tabs.filter((t) => t.isPinned);
    this.activeIndex = this.tabs.length > 0 ? 0 : -1;
  }

  /**
   * Close all unpinned tabs except the specified file.
   */
  closeOthers(filePath: string): void {
    this.tabs = this.tabs.filter((t) => t.isPinned || t.filePath === filePath);
    this.activeIndex = this.tabs.findIndex((t) => t.filePath === filePath);
  }

  /**
   * Get the currently active tab, or null if none.
   */
  getActiveTab(): EditorTab | null {
    if (this.activeIndex < 0 || this.activeIndex >= this.tabs.length) return null;
    return this.tabs[this.activeIndex];
  }

  /**
   * Set the active tab by file path.
   */
  setActiveTab(filePath: string): boolean {
    const idx = this.tabs.findIndex((t) => t.filePath === filePath);
    if (idx === -1) return false;
    this.activeIndex = idx;
    this.tabs[idx].lastActiveAt = Date.now();
    return true;
  }

  /**
   * Get all open tabs in order.
   */
  getTabs(): readonly EditorTab[] {
    return this.tabs;
  }

  /**
   * Toggle the pinned state of a tab.
   */
  togglePin(filePath: string): boolean {
    const tab = this.tabs.find((t) => t.filePath === filePath);
    if (!tab) return false;
    tab.isPinned = !tab.isPinned;
    tab.isPreview = false;
    this.sortPinnedFirst();
    return tab.isPinned;
  }

  /**
   * Reorder a tab from one index to another.
   */
  reorderTab(fromIndex: number, toIndex: number): boolean {
    if (fromIndex < 0 || fromIndex >= this.tabs.length) return false;
    if (toIndex < 0 || toIndex >= this.tabs.length) return false;
    const [tab] = this.tabs.splice(fromIndex, 1);
    this.tabs.splice(toIndex, 0, tab);
    if (this.activeIndex === fromIndex) {
      this.activeIndex = toIndex;
    }
    return true;
  }

  /**
   * Mark a tab as dirty (has unsaved changes).
   */
  setDirty(filePath: string, isDirty: boolean): void {
    const tab = this.tabs.find((t) => t.filePath === filePath);
    if (tab) tab.isDirty = isDirty;
  }

  /**
   * Get the recently closed tabs history.
   */
  getClosedHistory(): readonly ClosedTabEntry[] {
    return this.closedHistory;
  }

  /**
   * Reopen the most recently closed tab.
   * Returns the closed tab entry for restoring cursor/scroll state, or null.
   */
  reopenLastClosed(): ClosedTabEntry | null {
    if (this.closedHistory.length === 0) return null;
    return this.closedHistory.pop()!;
  }

  /**
   * Get the tab count.
   */
  get tabCount(): number {
    return this.tabs.length;
  }

  /**
   * Find the insert position for non-pinned tabs (after all pinned tabs).
   */
  private findInsertIndex(): number {
    for (let i = 0; i < this.tabs.length; i++) {
      if (!this.tabs[i].isPinned) return i;
    }
    return this.tabs.length;
  }

  /**
   * Sort tabs so pinned tabs come first, preserving relative order.
   */
  private sortPinnedFirst(): void {
    const pinned = this.tabs.filter((t) => t.isPinned);
    const unpinned = this.tabs.filter((t) => !t.isPinned);
    const activeFilePath = this.getActiveTab()?.filePath;
    this.tabs = [...pinned, ...unpinned];
    if (activeFilePath) {
      this.activeIndex = this.tabs.findIndex((t) => t.filePath === activeFilePath);
    }
  }
}
