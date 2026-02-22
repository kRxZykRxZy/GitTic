/**
 * File watcher for monitoring project file changes.
 * Provides debounced notifications and configurable ignore patterns.
 */

import { EventEmitter } from "node:events";
import { join, relative, sep } from "node:path";

/**
 * Types of file system changes detected by the watcher.
 */
export type FileChangeType = "created" | "modified" | "deleted" | "renamed";

/**
 * A single file change event payload.
 */
export interface FileChangeEvent {
  /** Type of change that occurred. */
  type: FileChangeType;
  /** Absolute path of the affected file. */
  filePath: string;
  /** Relative path from the watched root. */
  relativePath: string;
  /** Timestamp of the change detection. */
  timestamp: number;
  /** Previous path in case of a rename. */
  oldPath?: string;
}

/**
 * Configuration for the file watcher.
 */
export interface FileWatcherConfig {
  /** Glob patterns to ignore (e.g., node_modules, .git). */
  ignorePatterns: string[];
  /** Debounce interval in milliseconds for batching rapid changes. */
  debounceMs: number;
  /** Whether to watch subdirectories recursively. */
  recursive: boolean;
  /** Maximum number of events to batch before flushing. */
  maxBatchSize: number;
}

/** Default watcher configuration. */
export const DEFAULT_WATCHER_CONFIG: FileWatcherConfig = {
  ignorePatterns: [
    "node_modules",
    ".git",
    "dist",
    ".next",
    "__pycache__",
    ".DS_Store",
    "*.swp",
    "*.swo",
  ],
  debounceMs: 250,
  recursive: true,
  maxBatchSize: 100,
};

/**
 * Watches a project directory for file changes.
 * Batches rapid changes and filters out ignored paths.
 * Emits: "changes" (FileChangeEvent[]), "error" (Error).
 */
export class FileWatcher extends EventEmitter {
  private rootPath: string;
  private config: FileWatcherConfig;
  private pendingChanges: FileChangeEvent[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private _isWatching = false;
  private compiledIgnores: RegExp[] = [];
  private abortController: AbortController | null = null;

  constructor(rootPath: string, config: Partial<FileWatcherConfig> = {}) {
    super();
    this.rootPath = rootPath;
    this.config = { ...DEFAULT_WATCHER_CONFIG, ...config };
    this.compiledIgnores = this.config.ignorePatterns.map((p) =>
      this.patternToRegex(p)
    );
  }

  /** Whether the watcher is currently active. */
  get isWatching(): boolean {
    return this._isWatching;
  }

  /** The root directory being watched. */
  get watchRoot(): string {
    return this.rootPath;
  }

  /**
   * Start watching the root directory for changes.
   */
  start(): void {
    if (this._isWatching) return;
    this._isWatching = true;
    this.abortController = new AbortController();
    this.emit("started", { rootPath: this.rootPath });
  }

  /**
   * Stop watching and clean up resources.
   */
  stop(): void {
    if (!this._isWatching) return;
    this._isWatching = false;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.flushPending();

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.emit("stopped", { rootPath: this.rootPath });
  }

  /**
   * Manually report a file change (used for integrating with external watchers).
   */
  reportChange(type: FileChangeType, filePath: string, oldPath?: string): void {
    if (!this._isWatching) return;

    const relativePath = this.toRelativePath(filePath);
    if (this.isIgnored(relativePath)) return;

    const event: FileChangeEvent = {
      type,
      filePath,
      relativePath,
      timestamp: Date.now(),
      oldPath,
    };

    this.pendingChanges.push(event);

    if (this.pendingChanges.length >= this.config.maxBatchSize) {
      this.flushPending();
      return;
    }

    this.scheduleFlush();
  }

  /**
   * Check if a path matches any ignore pattern.
   */
  isIgnored(relativePath: string): boolean {
    const segments = relativePath.split(sep);
    for (const regex of this.compiledIgnores) {
      for (const segment of segments) {
        if (regex.test(segment)) return true;
      }
      if (regex.test(relativePath)) return true;
    }
    return false;
  }

  /**
   * Add an ignore pattern at runtime.
   */
  addIgnorePattern(pattern: string): void {
    this.config.ignorePatterns.push(pattern);
    this.compiledIgnores.push(this.patternToRegex(pattern));
  }

  /**
   * Remove an ignore pattern at runtime.
   */
  removeIgnorePattern(pattern: string): boolean {
    const idx = this.config.ignorePatterns.indexOf(pattern);
    if (idx === -1) return false;
    this.config.ignorePatterns.splice(idx, 1);
    this.compiledIgnores.splice(idx, 1);
    return true;
  }

  /**
   * Get the current list of ignore patterns.
   */
  getIgnorePatterns(): readonly string[] {
    return this.config.ignorePatterns;
  }

  /**
   * Update the debounce interval.
   */
  setDebounceMs(ms: number): void {
    this.config.debounceMs = Math.max(0, ms);
  }

  /**
   * Convert a file path to a path relative to the watch root.
   */
  private toRelativePath(filePath: string): string {
    return relative(this.rootPath, filePath);
  }

  /**
   * Schedule a debounced flush of pending changes.
   */
  private scheduleFlush(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.flushPending();
    }, this.config.debounceMs);
  }

  /**
   * Flush all pending change events, deduplicating by file path.
   */
  private flushPending(): void {
    if (this.pendingChanges.length === 0) return;

    const deduped = this.deduplicateChanges(this.pendingChanges);
    this.pendingChanges = [];

    if (deduped.length > 0) {
      this.emit("changes", deduped);
    }
  }

  /**
   * Deduplicate changes, keeping only the latest event per file path.
   */
  private deduplicateChanges(changes: FileChangeEvent[]): FileChangeEvent[] {
    const latest = new Map<string, FileChangeEvent>();
    for (const change of changes) {
      const existing = latest.get(change.filePath);
      if (!existing || change.timestamp > existing.timestamp) {
        latest.set(change.filePath, change);
      }
    }
    return Array.from(latest.values());
  }

  /**
   * Convert a simplified glob/name pattern to a regular expression.
   */
  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    return new RegExp(`^${escaped}$`);
  }

  /**
   * Dispose the watcher, releasing all resources.
   */
  dispose(): void {
    this.stop();
    this.removeAllListeners();
  }
}

/**
 * Create a file watcher with the default configuration.
 */
export function createFileWatcher(
  rootPath: string,
  config?: Partial<FileWatcherConfig>
): FileWatcher {
  return new FileWatcher(rootPath, config);
}
