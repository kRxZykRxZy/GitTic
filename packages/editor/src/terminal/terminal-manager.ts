/**
 * Terminal manager for the editor.
 * Handles creation, destruction, and tracking of multiple terminal instances.
 */

import { EventEmitter } from "node:events";

/**
 * Terminal shell type.
 */
export type ShellType = "bash" | "zsh" | "sh" | "powershell" | "cmd" | "fish" | "custom";

/**
 * Configuration for creating a new terminal.
 */
export interface TerminalConfig {
  /** Shell to use. */
  shell: ShellType;
  /** Custom shell command (used when shell is "custom"). */
  shellCommand?: string;
  /** Display name for the terminal tab. */
  name?: string;
  /** Working directory. */
  cwd?: string;
  /** Environment variables to set. */
  env?: Record<string, string>;
  /** Initial terminal dimensions. */
  cols?: number;
  /** Initial terminal row count. */
  rows?: number;
}

/**
 * State of a managed terminal instance.
 */
export interface TerminalInstance {
  /** Unique terminal identifier. */
  id: string;
  /** Display name for the terminal tab. */
  name: string;
  /** Shell type. */
  shell: ShellType;
  /** Working directory. */
  cwd: string;
  /** Terminal column count. */
  cols: number;
  /** Terminal row count. */
  rows: number;
  /** Whether this terminal is currently active (visible). */
  isActive: boolean;
  /** Timestamp when the terminal was created. */
  createdAt: number;
  /** Last time the terminal received output. */
  lastActivityAt: number;
  /** Exit code if the terminal has exited, null if still running. */
  exitCode: number | null;
}

/** Default terminal configuration. */
export const DEFAULT_TERMINAL_CONFIG: Required<TerminalConfig> = {
  shell: "bash",
  shellCommand: "/bin/bash",
  name: "Terminal",
  cwd: process.cwd(),
  env: {},
  cols: 80,
  rows: 24,
};

/**
 * Manages multiple terminal instances within the editor.
 * Emits: "terminal:created", "terminal:closed", "terminal:activated", "terminal:output".
 */
export class TerminalManager extends EventEmitter {
  private terminals = new Map<string, TerminalInstance>();
  private _activeTerminalId: string | null = null;
  private terminalCounter = 0;
  private maxTerminals: number;

  constructor(maxTerminals: number = 10) {
    super();
    this.maxTerminals = maxTerminals;
  }

  /** The currently active terminal identifier. */
  get activeTerminalId(): string | null {
    return this._activeTerminalId;
  }

  /** Number of open terminals. */
  get count(): number {
    return this.terminals.size;
  }

  /**
   * Create a new terminal instance.
   * Returns the created terminal or null if the max limit is reached.
   */
  createTerminal(config: Partial<TerminalConfig> = {}): TerminalInstance | null {
    if (this.terminals.size >= this.maxTerminals) return null;

    const id = `terminal-${++this.terminalCounter}`;
    const name = config.name ?? `Terminal ${this.terminalCounter}`;
    const merged = { ...DEFAULT_TERMINAL_CONFIG, ...config };

    const instance: TerminalInstance = {
      id,
      name,
      shell: merged.shell,
      cwd: merged.cwd,
      cols: merged.cols,
      rows: merged.rows,
      isActive: false,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      exitCode: null,
    };

    this.terminals.set(id, instance);
    this.setActive(id);
    this.emit("terminal:created", { terminalId: id, shell: instance.shell });
    return instance;
  }

  /**
   * Close a terminal by its identifier.
   */
  closeTerminal(terminalId: string): boolean {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) return false;

    this.terminals.delete(terminalId);
    this.emit("terminal:closed", { terminalId, exitCode: terminal.exitCode });

    if (this._activeTerminalId === terminalId) {
      const remaining = Array.from(this.terminals.keys());
      this._activeTerminalId = remaining.length > 0 ? remaining[remaining.length - 1] : null;
      if (this._activeTerminalId) {
        const nextTerminal = this.terminals.get(this._activeTerminalId);
        if (nextTerminal) nextTerminal.isActive = true;
      }
    }

    return true;
  }

  /**
   * Close all terminals.
   */
  closeAll(): void {
    for (const terminalId of Array.from(this.terminals.keys())) {
      this.closeTerminal(terminalId);
    }
  }

  /**
   * Set the active terminal.
   */
  setActive(terminalId: string): boolean {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) return false;

    // Deactivate previous
    for (const t of this.terminals.values()) {
      t.isActive = false;
    }

    terminal.isActive = true;
    this._activeTerminalId = terminalId;
    this.emit("terminal:activated", { terminalId });
    return true;
  }

  /**
   * Get a terminal instance by id.
   */
  getTerminal(terminalId: string): TerminalInstance | null {
    return this.terminals.get(terminalId) ?? null;
  }

  /**
   * Get the currently active terminal.
   */
  getActiveTerminal(): TerminalInstance | null {
    if (!this._activeTerminalId) return null;
    return this.terminals.get(this._activeTerminalId) ?? null;
  }

  /**
   * Get all terminal instances.
   */
  getAllTerminals(): TerminalInstance[] {
    return Array.from(this.terminals.values());
  }

  /**
   * Rename a terminal.
   */
  renameTerminal(terminalId: string, name: string): boolean {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) return false;
    terminal.name = name;
    return true;
  }

  /**
   * Resize a terminal.
   */
  resizeTerminal(terminalId: string, cols: number, rows: number): boolean {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) return false;
    terminal.cols = Math.max(1, cols);
    terminal.rows = Math.max(1, rows);
    return true;
  }

  /**
   * Record terminal output for activity tracking.
   */
  recordActivity(terminalId: string): void {
    const terminal = this.terminals.get(terminalId);
    if (terminal) {
      terminal.lastActivityAt = Date.now();
    }
  }

  /**
   * Mark a terminal as exited.
   */
  setExitCode(terminalId: string, exitCode: number): void {
    const terminal = this.terminals.get(terminalId);
    if (terminal) {
      terminal.exitCode = exitCode;
    }
  }

  /**
   * Dispose all terminals and clean up event listeners.
   */
  dispose(): void {
    this.closeAll();
    this.removeAllListeners();
  }
}
