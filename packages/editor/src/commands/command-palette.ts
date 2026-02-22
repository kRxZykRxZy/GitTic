/**
 * Command palette for the editor.
 * Provides a searchable, filterable command interface with keyboard shortcut bindings.
 */

import type { EditorCommand } from "./command-registry.js";

/**
 * A command palette item with match scoring for display.
 */
export interface PaletteItem {
  /** The underlying command. */
  command: EditorCommand;
  /** Search relevance score (higher is better). */
  score: number;
  /** Ranges in the label that matched the search query. */
  labelHighlights: Array<{ start: number; end: number }>;
  /** Ranges in the category that matched. */
  categoryHighlights: Array<{ start: number; end: number }>;
  /** Formatted keybinding for display. */
  keybindingDisplay: string | null;
}

/**
 * Configuration for the command palette.
 */
export interface PaletteConfig {
  /** Maximum number of results to display. */
  maxResults: number;
  /** Whether to show disabled commands. */
  showDisabled: boolean;
  /** Whether to include hidden commands in unfiltered results. */
  showHidden: boolean;
  /** Placeholder text for the input. */
  placeholder: string;
}

/** Default palette configuration. */
export const DEFAULT_PALETTE_CONFIG: PaletteConfig = {
  maxResults: 50,
  showDisabled: false,
  showHidden: false,
  placeholder: "Type a command name...",
};

/**
 * Command palette providing search, filtering, and execution.
 */
export class CommandPalette {
  private commands: EditorCommand[] = [];
  private config: PaletteConfig;
  private _isOpen: boolean = false;
  private _query: string = "";
  private _selectedIndex: number = 0;
  private _filteredItems: PaletteItem[] = [];
  private recentCommandIds: string[] = [];
  private maxRecentCommands: number = 10;

  constructor(config: Partial<PaletteConfig> = {}) {
    this.config = { ...DEFAULT_PALETTE_CONFIG, ...config };
  }

  /** Whether the palette is currently open. */
  get isOpen(): boolean {
    return this._isOpen;
  }

  /** Current search query. */
  get query(): string {
    return this._query;
  }

  /** Currently selected item index. */
  get selectedIndex(): number {
    return this._selectedIndex;
  }

  /**
   * Set the commands available in the palette.
   */
  setCommands(commands: EditorCommand[]): void {
    this.commands = commands;
    if (this._isOpen) {
      this.updateFilter();
    }
  }

  /**
   * Open the command palette.
   */
  open(): void {
    this._isOpen = true;
    this._query = "";
    this._selectedIndex = 0;
    this.updateFilter();
  }

  /**
   * Close the command palette.
   */
  close(): void {
    this._isOpen = false;
    this._query = "";
    this._filteredItems = [];
    this._selectedIndex = 0;
  }

  /**
   * Update the search query and refilter results.
   */
  setQuery(query: string): void {
    this._query = query;
    this._selectedIndex = 0;
    this.updateFilter();
  }

  /**
   * Get the current filtered palette items.
   */
  getItems(): readonly PaletteItem[] {
    return this._filteredItems;
  }

  /**
   * Move the selection up.
   */
  selectPrevious(): void {
    if (this._filteredItems.length === 0) return;
    this._selectedIndex =
      (this._selectedIndex - 1 + this._filteredItems.length) % this._filteredItems.length;
  }

  /**
   * Move the selection down.
   */
  selectNext(): void {
    if (this._filteredItems.length === 0) return;
    this._selectedIndex = (this._selectedIndex + 1) % this._filteredItems.length;
  }

  /**
   * Get the currently selected item.
   */
  getSelectedItem(): PaletteItem | null {
    if (this._selectedIndex < 0 || this._selectedIndex >= this._filteredItems.length) {
      return null;
    }
    return this._filteredItems[this._selectedIndex];
  }

  /**
   * Execute the currently selected command.
   * Returns the command id if executed, null otherwise.
   */
  async executeSelected(): Promise<string | null> {
    const item = this.getSelectedItem();
    if (!item || !item.command.enabled) return null;

    this.trackRecent(item.command.id);
    this.close();
    await item.command.handler();
    return item.command.id;
  }

  /**
   * Execute a specific command by its identifier.
   */
  async executeCommand(commandId: string): Promise<boolean> {
    const command = this.commands.find((c) => c.id === commandId);
    if (!command || !command.enabled) return false;

    this.trackRecent(commandId);
    await command.handler();
    return true;
  }

  /**
   * Get recently executed command identifiers.
   */
  getRecentCommands(): readonly string[] {
    return this.recentCommandIds;
  }

  /**
   * Filter and score commands based on the current query.
   */
  private updateFilter(): void {
    let candidates = this.commands.filter((cmd) => {
      if (!this.config.showDisabled && !cmd.enabled) return false;
      if (!this.config.showHidden && !cmd.visible) return false;
      return true;
    });

    if (this._query.length === 0) {
      this._filteredItems = this.rankByRecency(candidates);
      return;
    }

    const queryLower = this._query.toLowerCase();
    const scored: PaletteItem[] = [];

    for (const cmd of candidates) {
      const labelMatch = this.fuzzyMatch(queryLower, cmd.label.toLowerCase());
      const categoryMatch = this.fuzzyMatch(queryLower, cmd.category.toLowerCase());

      const score = Math.max(labelMatch?.score ?? 0, (categoryMatch?.score ?? 0) * 0.5);
      if (score > 0) {
        scored.push({
          command: cmd,
          score: this.isRecent(cmd.id) ? score * 1.5 : score,
          labelHighlights: labelMatch?.ranges ?? [],
          categoryHighlights: categoryMatch?.ranges ?? [],
          keybindingDisplay: cmd.keybinding,
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    this._filteredItems = scored.slice(0, this.config.maxResults);
  }

  /**
   * Rank commands by recency when no query is entered.
   */
  private rankByRecency(commands: EditorCommand[]): PaletteItem[] {
    const items: PaletteItem[] = commands.map((cmd) => ({
      command: cmd,
      score: this.isRecent(cmd.id) ? 100 : 0,
      labelHighlights: [],
      categoryHighlights: [],
      keybindingDisplay: cmd.keybinding,
    }));

    items.sort((a, b) => b.score - a.score);
    return items.slice(0, this.config.maxResults);
  }

  /**
   * Fuzzy match a query against a target string.
   */
  private fuzzyMatch(
    query: string,
    target: string
  ): { score: number; ranges: Array<{ start: number; end: number }> } | null {
    let queryIdx = 0;
    let score = 0;
    const ranges: Array<{ start: number; end: number }> = [];
    let currentRange: { start: number; end: number } | null = null;

    for (let i = 0; i < target.length && queryIdx < query.length; i++) {
      if (target[i] === query[queryIdx]) {
        score += 1;
        if (currentRange && currentRange.end === i) {
          currentRange.end = i + 1;
          score += 1; // consecutive bonus
        } else {
          currentRange = { start: i, end: i + 1 };
          ranges.push(currentRange);
        }
        queryIdx++;
      }
    }

    return queryIdx === query.length ? { score, ranges } : null;
  }

  /**
   * Track a command as recently used.
   */
  private trackRecent(commandId: string): void {
    this.recentCommandIds = this.recentCommandIds.filter((id) => id !== commandId);
    this.recentCommandIds.unshift(commandId);
    if (this.recentCommandIds.length > this.maxRecentCommands) {
      this.recentCommandIds = this.recentCommandIds.slice(0, this.maxRecentCommands);
    }
  }

  /**
   * Check if a command is in the recent list.
   */
  private isRecent(commandId: string): boolean {
    return this.recentCommandIds.includes(commandId);
  }
}
