/**
 * Git panel state management for the editor.
 * Tracks changed files, staged/unstaged state, diff display mode, and commit drafts.
 */

/**
 * Status of a file in the git working tree.
 */
export type GitFileStatus =
  | "modified"
  | "added"
  | "deleted"
  | "renamed"
  | "copied"
  | "untracked"
  | "ignored"
  | "conflicted";

/**
 * Staging state of a file.
 */
export type StagingState = "staged" | "unstaged" | "partially-staged";

/**
 * A tracked file in the git panel with its change information.
 */
export interface GitFileEntry {
  /** File path relative to the repository root. */
  filePath: string;
  /** Git status of the file. */
  status: GitFileStatus;
  /** Current staging state. */
  stagingState: StagingState;
  /** Number of insertions in the diff. */
  insertions: number;
  /** Number of deletions in the diff. */
  deletions: number;
  /** Old path in case of rename. */
  oldPath?: string;
}

/**
 * Display mode for diffs.
 */
export type DiffDisplayMode = "inline" | "side-by-side" | "unified";

/**
 * Configuration for the git panel.
 */
export interface GitPanelConfig {
  /** Whether to auto-refresh on file save. */
  autoRefresh: boolean;
  /** Diff display mode. */
  diffDisplayMode: DiffDisplayMode;
  /** Whether to show untracked files. */
  showUntracked: boolean;
  /** Whether to show ignored files. */
  showIgnored: boolean;
  /** Whether to sort files by status. */
  sortByStatus: boolean;
}

/** Default git panel configuration. */
export const DEFAULT_GIT_PANEL_CONFIG: GitPanelConfig = {
  autoRefresh: true,
  diffDisplayMode: "inline",
  showUntracked: true,
  showIgnored: false,
  sortByStatus: true,
};

/**
 * Manages the state of the git changes panel in the editor sidebar.
 */
export class GitPanel {
  private files: Map<string, GitFileEntry> = new Map();
  private _commitMessage: string = "";
  private _isAmend: boolean = false;
  private _currentBranch: string = "main";
  private _isLoading: boolean = false;
  private config: GitPanelConfig;

  constructor(config: Partial<GitPanelConfig> = {}) {
    this.config = { ...DEFAULT_GIT_PANEL_CONFIG, ...config };
  }

  /** Current commit message draft. */
  get commitMessage(): string {
    return this._commitMessage;
  }

  /** Whether this is an amend commit. */
  get isAmend(): boolean {
    return this._isAmend;
  }

  /** Current branch name. */
  get currentBranch(): string {
    return this._currentBranch;
  }

  /** Whether the panel is loading data. */
  get isLoading(): boolean {
    return this._isLoading;
  }

  /**
   * Set the commit message draft.
   */
  setCommitMessage(message: string): void {
    this._commitMessage = message;
  }

  /**
   * Toggle amend mode.
   */
  setAmend(isAmend: boolean): void {
    this._isAmend = isAmend;
  }

  /**
   * Set the current branch name.
   */
  setBranch(branch: string): void {
    this._currentBranch = branch;
  }

  /**
   * Update the file list with fresh git status data.
   */
  updateFiles(entries: GitFileEntry[]): void {
    this.files.clear();
    for (const entry of entries) {
      this.files.set(entry.filePath, entry);
    }
  }

  /**
   * Stage a file for commit.
   */
  stageFile(filePath: string): boolean {
    const file = this.files.get(filePath);
    if (!file) return false;
    file.stagingState = "staged";
    return true;
  }

  /**
   * Unstage a file.
   */
  unstageFile(filePath: string): boolean {
    const file = this.files.get(filePath);
    if (!file) return false;
    file.stagingState = "unstaged";
    return true;
  }

  /**
   * Stage all files.
   */
  stageAll(): void {
    for (const file of this.files.values()) {
      file.stagingState = "staged";
    }
  }

  /**
   * Unstage all files.
   */
  unstageAll(): void {
    for (const file of this.files.values()) {
      file.stagingState = "unstaged";
    }
  }

  /**
   * Get all file entries.
   */
  getAllFiles(): GitFileEntry[] {
    let entries = Array.from(this.files.values());
    if (!this.config.showUntracked) {
      entries = entries.filter((e) => e.status !== "untracked");
    }
    if (!this.config.showIgnored) {
      entries = entries.filter((e) => e.status !== "ignored");
    }
    if (this.config.sortByStatus) {
      entries.sort((a, b) => statusPriority(a.status) - statusPriority(b.status));
    }
    return entries;
  }

  /**
   * Get only staged files.
   */
  getStagedFiles(): GitFileEntry[] {
    return this.getAllFiles().filter((e) => e.stagingState === "staged");
  }

  /**
   * Get only unstaged files.
   */
  getUnstagedFiles(): GitFileEntry[] {
    return this.getAllFiles().filter((e) => e.stagingState === "unstaged");
  }

  /**
   * Get files with conflicts.
   */
  getConflictedFiles(): GitFileEntry[] {
    return this.getAllFiles().filter((e) => e.status === "conflicted");
  }

  /**
   * Get the total number of changed files.
   */
  get changedFileCount(): number {
    return this.files.size;
  }

  /**
   * Get a summary of insertions and deletions across all files.
   */
  getDiffSummary(): { insertions: number; deletions: number } {
    let insertions = 0;
    let deletions = 0;
    for (const file of this.files.values()) {
      insertions += file.insertions;
      deletions += file.deletions;
    }
    return { insertions, deletions };
  }

  /**
   * Set the diff display mode.
   */
  setDiffDisplayMode(mode: DiffDisplayMode): void {
    this.config.diffDisplayMode = mode;
  }

  /**
   * Get the current diff display mode.
   */
  getDiffDisplayMode(): DiffDisplayMode {
    return this.config.diffDisplayMode;
  }

  /**
   * Clear the commit message draft.
   */
  clearCommitMessage(): void {
    this._commitMessage = "";
    this._isAmend = false;
  }

  /**
   * Set loading state.
   */
  setLoading(isLoading: boolean): void {
    this._isLoading = isLoading;
  }

  /**
   * Clear all tracked file state.
   */
  clear(): void {
    this.files.clear();
    this._commitMessage = "";
    this._isAmend = false;
  }
}

/**
 * Get sort priority for a git file status (lower is displayed first).
 */
function statusPriority(status: GitFileStatus): number {
  const priorities: Record<GitFileStatus, number> = {
    conflicted: 0,
    modified: 1,
    added: 2,
    deleted: 3,
    renamed: 4,
    copied: 5,
    untracked: 6,
    ignored: 7,
  };
  return priorities[status] ?? 99;
}
