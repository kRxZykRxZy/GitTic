/**
 * Split view management for the editor.
 * Supports horizontal and vertical splits with focus tracking and pane resizing.
 */

/**
 * Direction of a split.
 */
export type SplitDirection = "horizontal" | "vertical";

/**
 * Represents a single pane within a split layout.
 */
export interface SplitPane {
  /** Unique pane identifier. */
  id: string;
  /** File path currently displayed in this pane. */
  filePath: string | null;
  /** Relative size weight of this pane (0.0 to 1.0). */
  sizeWeight: number;
  /** Whether this pane currently has focus. */
  isFocused: boolean;
  /** Scroll position for this pane. */
  scrollTop: number;
  /** Cursor line in this pane. */
  cursorLine: number;
  /** Cursor column in this pane. */
  cursorColumn: number;
}

/**
 * A split group containing two or more panes arranged in a direction.
 */
export interface SplitGroup {
  /** Unique identifier for this split group. */
  id: string;
  /** Direction of the split. */
  direction: SplitDirection;
  /** Panes in this group (ordered left-to-right or top-to-bottom). */
  panes: SplitPane[];
  /** Parent group identifier, null for the root. */
  parentId: string | null;
}

/**
 * Serializable snapshot of the split view layout.
 */
export interface SplitViewSnapshot {
  /** All groups in the layout. */
  groups: SplitGroup[];
  /** The identifier of the focused pane. */
  focusedPaneId: string | null;
}

/**
 * Manages split view panes for side-by-side editing.
 */
export class SplitViewManager {
  private groups: Map<string, SplitGroup> = new Map();
  private focusedPaneId: string | null = null;
  private paneCounter = 0;
  private groupCounter = 0;

  constructor() {
    const rootPane = this.createPane();
    const rootGroup: SplitGroup = {
      id: this.nextGroupId(),
      direction: "horizontal",
      panes: [rootPane],
      parentId: null,
    };
    this.groups.set(rootGroup.id, rootGroup);
    this.focusedPaneId = rootPane.id;
  }

  /**
   * Get the currently focused pane.
   */
  getFocusedPane(): SplitPane | null {
    if (!this.focusedPaneId) return null;
    for (const group of this.groups.values()) {
      const pane = group.panes.find((p) => p.id === this.focusedPaneId);
      if (pane) return pane;
    }
    return null;
  }

  /**
   * Set focus to a specific pane by its identifier.
   */
  setFocus(paneId: string): boolean {
    const pane = this.findPane(paneId);
    if (!pane) return false;

    // Clear previous focus
    for (const group of this.groups.values()) {
      for (const p of group.panes) {
        p.isFocused = false;
      }
    }

    pane.isFocused = true;
    this.focusedPaneId = paneId;
    return true;
  }

  /**
   * Split the currently focused pane in the specified direction.
   * Returns the newly created pane.
   */
  split(direction: SplitDirection, filePath?: string): SplitPane | null {
    const focusedPane = this.getFocusedPane();
    if (!focusedPane) return null;

    const group = this.findGroupForPane(focusedPane.id);
    if (!group) return null;

    const newPane = this.createPane(filePath);

    if (group.panes.length === 1 || group.direction === direction) {
      group.direction = direction;
      const paneIdx = group.panes.findIndex((p) => p.id === focusedPane.id);
      group.panes.splice(paneIdx + 1, 0, newPane);
      this.redistributeWeights(group);
    } else {
      const newGroup: SplitGroup = {
        id: this.nextGroupId(),
        direction,
        panes: [focusedPane, newPane],
        parentId: group.id,
      };
      this.groups.set(newGroup.id, newGroup);
      this.redistributeWeights(newGroup);
    }

    this.setFocus(newPane.id);
    return newPane;
  }

  /**
   * Close a pane by its identifier.
   * If the last pane in a group is closed, the group is removed.
   */
  closePane(paneId: string): boolean {
    const group = this.findGroupForPane(paneId);
    if (!group) return false;

    if (group.panes.length <= 1 && this.groups.size <= 1) {
      return false; // Cannot close the last pane
    }

    const idx = group.panes.findIndex((p) => p.id === paneId);
    group.panes.splice(idx, 1);

    if (group.panes.length === 0) {
      this.groups.delete(group.id);
    } else {
      this.redistributeWeights(group);
    }

    if (this.focusedPaneId === paneId) {
      const nextPane = group.panes[Math.min(idx, group.panes.length - 1)];
      if (nextPane) {
        this.setFocus(nextPane.id);
      } else {
        const firstGroup = this.groups.values().next().value as SplitGroup | undefined;
        if (firstGroup && firstGroup.panes.length > 0) {
          this.setFocus(firstGroup.panes[0].id);
        }
      }
    }

    return true;
  }

  /**
   * Resize a pane by adjusting its weight within its group.
   * The delta is applied to this pane and subtracted from the adjacent pane.
   */
  resizePane(paneId: string, delta: number): boolean {
    const group = this.findGroupForPane(paneId);
    if (!group || group.panes.length < 2) return false;

    const idx = group.panes.findIndex((p) => p.id === paneId);
    const adjacentIdx = idx < group.panes.length - 1 ? idx + 1 : idx - 1;

    const pane = group.panes[idx];
    const adjacent = group.panes[adjacentIdx];

    const newWeight = Math.max(0.1, Math.min(0.9, pane.sizeWeight + delta));
    const weightDiff = newWeight - pane.sizeWeight;

    if (adjacent.sizeWeight - weightDiff < 0.1) return false;

    pane.sizeWeight = newWeight;
    adjacent.sizeWeight -= weightDiff;
    return true;
  }

  /**
   * Open a file in the specified pane.
   */
  openInPane(paneId: string, filePath: string): boolean {
    const pane = this.findPane(paneId);
    if (!pane) return false;
    pane.filePath = filePath;
    return true;
  }

  /**
   * Get all split groups.
   */
  getGroups(): readonly SplitGroup[] {
    return Array.from(this.groups.values());
  }

  /**
   * Get all panes across all groups.
   */
  getAllPanes(): SplitPane[] {
    const panes: SplitPane[] = [];
    for (const group of this.groups.values()) {
      panes.push(...group.panes);
    }
    return panes;
  }

  /**
   * Get the total number of panes.
   */
  get paneCount(): number {
    let count = 0;
    for (const group of this.groups.values()) {
      count += group.panes.length;
    }
    return count;
  }

  /**
   * Create a serializable snapshot of the split layout.
   */
  snapshot(): SplitViewSnapshot {
    return {
      groups: Array.from(this.groups.values()).map((g) => ({
        ...g,
        panes: g.panes.map((p) => ({ ...p })),
      })),
      focusedPaneId: this.focusedPaneId,
    };
  }

  /**
   * Create a new pane with default values.
   */
  private createPane(filePath?: string): SplitPane {
    return {
      id: `pane-${++this.paneCounter}`,
      filePath: filePath ?? null,
      sizeWeight: 1.0,
      isFocused: false,
      scrollTop: 0,
      cursorLine: 0,
      cursorColumn: 0,
    };
  }

  /**
   * Generate the next unique group identifier.
   */
  private nextGroupId(): string {
    return `group-${++this.groupCounter}`;
  }

  /**
   * Find a pane by its identifier across all groups.
   */
  private findPane(paneId: string): SplitPane | null {
    for (const group of this.groups.values()) {
      const pane = group.panes.find((p) => p.id === paneId);
      if (pane) return pane;
    }
    return null;
  }

  /**
   * Find the group that contains a specific pane.
   */
  private findGroupForPane(paneId: string): SplitGroup | null {
    for (const group of this.groups.values()) {
      if (group.panes.some((p) => p.id === paneId)) return group;
    }
    return null;
  }

  /**
   * Redistribute equal weights to all panes in a group.
   */
  private redistributeWeights(group: SplitGroup): void {
    const weight = 1.0 / group.panes.length;
    for (const pane of group.panes) {
      pane.sizeWeight = weight;
    }
  }
}
