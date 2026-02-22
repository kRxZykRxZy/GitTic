/**
 * File operations manager for the editor.
 * Handles opening, saving, closing, renaming, and deleting project files.
 * Tracks modification state and supports auto-save on a configurable timer.
 */

import { EventEmitter } from "node:events";

/**
 * State of a file managed by the file manager.
 */
export interface ManagedFile {
  /** Absolute file path. */
  filePath: string;
  /** Current content of the file in memory. */
  content: string;
  /** Content at last save (for dirty detection). */
  savedContent: string;
  /** Whether the in-memory content differs from disk. */
  isDirty: boolean;
  /** Whether the file is read-only. */
  isReadOnly: boolean;
  /** File size in bytes at last read. */
  sizeBytes: number;
  /** Last modification time from the filesystem. */
  lastModified: number;
  /** Encoding used to read/write this file. */
  encoding: string;
  /** Timestamp when the file was opened. */
  openedAt: number;
}

/**
 * Configuration for the file manager.
 */
export interface FileManagerConfig {
  /** Whether auto-save is enabled. */
  autoSave: boolean;
  /** Auto-save delay in milliseconds. */
  autoSaveDelay: number;
  /** Maximum file size in bytes that can be opened. */
  maxFileSize: number;
  /** Default encoding for new files. */
  defaultEncoding: string;
}

/** Default file manager configuration. */
export const DEFAULT_FILE_MANAGER_CONFIG: FileManagerConfig = {
  autoSave: true,
  autoSaveDelay: 1000,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  defaultEncoding: "utf-8",
};

/**
 * Manages file lifecycle operations within the editor workspace.
 * Emits events: "file:opened", "file:saved", "file:closed", "file:modified", "file:renamed".
 */
export class FileManager extends EventEmitter {
  private files = new Map<string, ManagedFile>();
  private config: FileManagerConfig;
  private autoSaveTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private saveHandler: ((filePath: string, content: string) => Promise<void>) | null = null;

  constructor(config: Partial<FileManagerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_FILE_MANAGER_CONFIG, ...config };
  }

  /**
   * Register a handler for persisting file content to disk.
   * The handler receives the file path and content to write.
   */
  setSaveHandler(handler: (filePath: string, content: string) => Promise<void>): void {
    this.saveHandler = handler;
  }

  /**
   * Open a file and load its content into memory.
   * Returns the managed file state.
   */
  openFile(
    filePath: string,
    content: string,
    options: { encoding?: string; readOnly?: boolean; sizeBytes?: number } = {}
  ): ManagedFile {
    const existing = this.files.get(filePath);
    if (existing) return existing;

    const managed: ManagedFile = {
      filePath,
      content,
      savedContent: content,
      isDirty: false,
      isReadOnly: options.readOnly ?? false,
      sizeBytes: options.sizeBytes ?? Buffer.byteLength(content, "utf-8"),
      lastModified: Date.now(),
      encoding: options.encoding ?? this.config.defaultEncoding,
      openedAt: Date.now(),
    };

    this.files.set(filePath, managed);
    this.emit("file:opened", { filePath });
    return managed;
  }

  /**
   * Update the in-memory content of an open file.
   * Schedules auto-save if enabled.
   */
  updateContent(filePath: string, content: string): boolean {
    const file = this.files.get(filePath);
    if (!file || file.isReadOnly) return false;

    file.content = content;
    file.isDirty = content !== file.savedContent;
    file.lastModified = Date.now();
    this.emit("file:modified", { filePath, isDirty: file.isDirty });

    if (this.config.autoSave && file.isDirty) {
      this.scheduleAutoSave(filePath);
    }

    return true;
  }

  /**
   * Save a file to disk using the registered save handler.
   */
  async saveFile(filePath: string): Promise<boolean> {
    const file = this.files.get(filePath);
    if (!file) return false;
    if (!this.saveHandler) return false;

    await this.saveHandler(filePath, file.content);
    file.savedContent = file.content;
    file.isDirty = false;
    file.sizeBytes = Buffer.byteLength(file.content, "utf-8");
    this.clearAutoSaveTimer(filePath);
    this.emit("file:saved", { filePath, sizeBytes: file.sizeBytes });
    return true;
  }

  /**
   * Close a file, removing it from memory.
   * Returns true if the file was open and is now closed.
   */
  closeFile(filePath: string): boolean {
    const file = this.files.get(filePath);
    if (!file) return false;

    this.clearAutoSaveTimer(filePath);
    this.files.delete(filePath);
    this.emit("file:closed", { filePath, hadUnsavedChanges: file.isDirty });
    return true;
  }

  /**
   * Rename a managed file (updates the internal key).
   */
  renameFile(oldPath: string, newPath: string): boolean {
    const file = this.files.get(oldPath);
    if (!file) return false;

    this.clearAutoSaveTimer(oldPath);
    this.files.delete(oldPath);
    file.filePath = newPath;
    this.files.set(newPath, file);
    this.emit("file:renamed", { oldPath, newPath });
    return true;
  }

  /**
   * Mark a file for deletion (removes it from managed files).
   */
  deleteFile(filePath: string): boolean {
    return this.closeFile(filePath);
  }

  /**
   * Get the managed file state for a given path.
   */
  getFile(filePath: string): ManagedFile | null {
    return this.files.get(filePath) ?? null;
  }

  /**
   * Get all currently open file paths.
   */
  getOpenFilePaths(): string[] {
    return Array.from(this.files.keys());
  }

  /**
   * Get all files that have unsaved changes.
   */
  getDirtyFiles(): ManagedFile[] {
    return Array.from(this.files.values()).filter((f) => f.isDirty);
  }

  /**
   * Check whether a file is currently open.
   */
  isFileOpen(filePath: string): boolean {
    return this.files.has(filePath);
  }

  /**
   * Reload a file with new content (e.g., after external modification).
   */
  reloadFile(filePath: string, content: string): boolean {
    const file = this.files.get(filePath);
    if (!file) return false;

    file.content = content;
    file.savedContent = content;
    file.isDirty = false;
    file.lastModified = Date.now();
    file.sizeBytes = Buffer.byteLength(content, "utf-8");
    return true;
  }

  /**
   * Save all files that have unsaved changes.
   */
  async saveAll(): Promise<string[]> {
    const saved: string[] = [];
    for (const file of this.files.values()) {
      if (file.isDirty) {
        const success = await this.saveFile(file.filePath);
        if (success) saved.push(file.filePath);
      }
    }
    return saved;
  }

  /**
   * Close all open files.
   */
  closeAll(): void {
    for (const filePath of Array.from(this.files.keys())) {
      this.closeFile(filePath);
    }
  }

  /**
   * Dispose all resources, clearing timers and file state.
   */
  dispose(): void {
    for (const timer of this.autoSaveTimers.values()) {
      clearTimeout(timer);
    }
    this.autoSaveTimers.clear();
    this.files.clear();
    this.removeAllListeners();
  }

  /**
   * Schedule an auto-save for a file, debouncing rapid edits.
   */
  private scheduleAutoSave(filePath: string): void {
    this.clearAutoSaveTimer(filePath);
    const timer = setTimeout(() => {
      this.saveFile(filePath).catch(() => {
        /* auto-save failures are silently ignored */
      });
    }, this.config.autoSaveDelay);
    this.autoSaveTimers.set(filePath, timer);
  }

  /**
   * Clear a pending auto-save timer for a file.
   */
  private clearAutoSaveTimer(filePath: string): void {
    const timer = this.autoSaveTimers.get(filePath);
    if (timer) {
      clearTimeout(timer);
      this.autoSaveTimers.delete(filePath);
    }
  }
}
