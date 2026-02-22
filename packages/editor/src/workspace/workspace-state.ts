/**
 * Workspace state persistence for the editor.
 * Serializes and restores open tabs, scroll positions, sidebar state, and panel sizes.
 */

/**
 * Persisted state of a single open file within the workspace.
 */
export interface PersistedFileState {
  /** File path. */
  filePath: string;
  /** Language identifier. */
  language: string;
  /** Cursor line position. */
  cursorLine: number;
  /** Cursor column position. */
  cursorColumn: number;
  /** Scroll position (top visible line). */
  scrollTop: number;
  /** Whether the tab is pinned. */
  isPinned: boolean;
  /** Timestamp of last activity. */
  lastActiveAt: number;
}

/**
 * Sidebar panel configuration.
 */
export interface SidebarState {
  /** Whether the sidebar is visible. */
  visible: boolean;
  /** Width of the sidebar in pixels. */
  width: number;
  /** Active panel identifier. */
  activePanel: string | null;
}

/**
 * Bottom panel configuration.
 */
export interface BottomPanelState {
  /** Whether the bottom panel is visible. */
  visible: boolean;
  /** Height of the bottom panel in pixels. */
  height: number;
  /** Active tab in the bottom panel. */
  activeTab: string | null;
}

/**
 * Complete workspace state snapshot for serialization.
 */
export interface WorkspaceSnapshot {
  /** Schema version for forward compatibility. */
  version: number;
  /** Ordered list of open file states. */
  openFiles: PersistedFileState[];
  /** Path of the active file, or null. */
  activeFilePath: string | null;
  /** Sidebar panel state. */
  sidebar: SidebarState;
  /** Bottom panel state. */
  bottomPanel: BottomPanelState;
  /** Editor zoom level (percentage). */
  zoomLevel: number;
  /** Recently opened file paths. */
  recentFiles: string[];
  /** Timestamp of the snapshot. */
  timestamp: number;
}

/** Default sidebar state. */
export const DEFAULT_SIDEBAR_STATE: SidebarState = {
  visible: true,
  width: 260,
  activePanel: "fileTree",
};

/** Default bottom panel state. */
export const DEFAULT_BOTTOM_PANEL_STATE: BottomPanelState = {
  visible: false,
  height: 200,
  activeTab: "terminal",
};

/**
 * Manages workspace state persistence, serialization, and restoration.
 */
export class WorkspaceState {
  private openFiles: PersistedFileState[] = [];
  private _activeFilePath: string | null = null;
  private _sidebar: SidebarState = { ...DEFAULT_SIDEBAR_STATE };
  private _bottomPanel: BottomPanelState = { ...DEFAULT_BOTTOM_PANEL_STATE };
  private _zoomLevel: number = 100;
  private _recentFiles: string[] = [];
  private maxRecentFiles: number = 30;

  /** Currently active file path. */
  get activeFilePath(): string | null {
    return this._activeFilePath;
  }

  /** Sidebar state. */
  get sidebar(): SidebarState {
    return { ...this._sidebar };
  }

  /** Bottom panel state. */
  get bottomPanel(): BottomPanelState {
    return { ...this._bottomPanel };
  }

  /** Current zoom level percentage. */
  get zoomLevel(): number {
    return this._zoomLevel;
  }

  /**
   * Add or update a file in the workspace state.
   */
  setFileState(state: PersistedFileState): void {
    const idx = this.openFiles.findIndex((f) => f.filePath === state.filePath);
    if (idx !== -1) {
      this.openFiles[idx] = state;
    } else {
      this.openFiles.push(state);
    }
  }

  /**
   * Remove a file from the workspace state.
   */
  removeFileState(filePath: string): boolean {
    const idx = this.openFiles.findIndex((f) => f.filePath === filePath);
    if (idx === -1) return false;
    this.openFiles.splice(idx, 1);
    if (this._activeFilePath === filePath) {
      this._activeFilePath = this.openFiles.length > 0
        ? this.openFiles[this.openFiles.length - 1].filePath
        : null;
    }
    return true;
  }

  /**
   * Set the active file path.
   */
  setActiveFile(filePath: string | null): void {
    this._activeFilePath = filePath;
  }

  /**
   * Get all open file states.
   */
  getOpenFiles(): readonly PersistedFileState[] {
    return this.openFiles;
  }

  /**
   * Update sidebar state.
   */
  setSidebar(update: Partial<SidebarState>): void {
    Object.assign(this._sidebar, update);
  }

  /**
   * Update bottom panel state.
   */
  setBottomPanel(update: Partial<BottomPanelState>): void {
    Object.assign(this._bottomPanel, update);
  }

  /**
   * Set the zoom level (clamped between 50% and 200%).
   */
  setZoomLevel(level: number): void {
    this._zoomLevel = Math.max(50, Math.min(200, level));
  }

  /**
   * Add a file to the recently opened list.
   */
  addRecentFile(filePath: string): void {
    this._recentFiles = this._recentFiles.filter((f) => f !== filePath);
    this._recentFiles.unshift(filePath);
    if (this._recentFiles.length > this.maxRecentFiles) {
      this._recentFiles = this._recentFiles.slice(0, this.maxRecentFiles);
    }
  }

  /**
   * Get recently opened files.
   */
  getRecentFiles(): readonly string[] {
    return this._recentFiles;
  }

  /**
   * Serialize the workspace state to a JSON-compatible snapshot.
   */
  serialize(): WorkspaceSnapshot {
    return {
      version: 1,
      openFiles: [...this.openFiles],
      activeFilePath: this._activeFilePath,
      sidebar: { ...this._sidebar },
      bottomPanel: { ...this._bottomPanel },
      zoomLevel: this._zoomLevel,
      recentFiles: [...this._recentFiles],
      timestamp: Date.now(),
    };
  }

  /**
   * Restore workspace state from a serialized snapshot.
   */
  restore(snapshot: WorkspaceSnapshot): void {
    if (!snapshot || snapshot.version !== 1) return;

    this.openFiles = snapshot.openFiles.map((f) => ({ ...f }));
    this._activeFilePath = snapshot.activeFilePath;
    this._sidebar = { ...DEFAULT_SIDEBAR_STATE, ...snapshot.sidebar };
    this._bottomPanel = { ...DEFAULT_BOTTOM_PANEL_STATE, ...snapshot.bottomPanel };
    this._zoomLevel = snapshot.zoomLevel ?? 100;
    this._recentFiles = snapshot.recentFiles ?? [];
  }

  /**
   * Convert the snapshot to a JSON string for file-based storage.
   */
  toJSON(): string {
    return JSON.stringify(this.serialize(), null, 2);
  }

  /**
   * Load workspace state from a JSON string.
   */
  fromJSON(json: string): boolean {
    try {
      const snapshot = JSON.parse(json) as WorkspaceSnapshot;
      this.restore(snapshot);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all workspace state.
   */
  reset(): void {
    this.openFiles = [];
    this._activeFilePath = null;
    this._sidebar = { ...DEFAULT_SIDEBAR_STATE };
    this._bottomPanel = { ...DEFAULT_BOTTOM_PANEL_STATE };
    this._zoomLevel = 100;
    this._recentFiles = [];
  }
}
