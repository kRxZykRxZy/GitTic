/**
 * Terminal session state management.
 * Tracks shell session state, command history, environment variables,
 * working directory, and terminal dimensions.
 */

/**
 * A single entry in the terminal command history.
 */
export interface CommandHistoryEntry {
  /** The command string. */
  command: string;
  /** Timestamp when the command was entered. */
  timestamp: number;
  /** Exit code of the command (null if still running). */
  exitCode: number | null;
  /** Duration of the command in milliseconds (null if not measured). */
  durationMs: number | null;
}

/**
 * Terminal buffer line with metadata.
 */
export interface TerminalLine {
  /** The text content of the line. */
  text: string;
  /** Timestamp when the line was output. */
  timestamp: number;
  /** Whether this is an error/stderr line. */
  isError: boolean;
}

/**
 * Terminal dimensions.
 */
export interface TerminalDimensions {
  /** Number of columns. */
  cols: number;
  /** Number of rows. */
  rows: number;
}

/**
 * Serializable snapshot of a terminal session.
 */
export interface TerminalSessionSnapshot {
  /** Session identifier. */
  sessionId: string;
  /** Working directory. */
  cwd: string;
  /** Environment variables. */
  env: Record<string, string>;
  /** Command history. */
  history: CommandHistoryEntry[];
  /** Terminal dimensions. */
  dimensions: TerminalDimensions;
  /** Timestamp of the snapshot. */
  timestamp: number;
}

/**
 * Manages the state of a single terminal session.
 */
export class TerminalSession {
  private _sessionId: string;
  private _cwd: string;
  private _env: Map<string, string>;
  private _history: CommandHistoryEntry[] = [];
  private _outputBuffer: TerminalLine[] = [];
  private _dimensions: TerminalDimensions;
  private _isRunning: boolean = false;
  private maxHistorySize: number;
  private maxBufferSize: number;
  private historyIndex: number = -1;

  constructor(
    sessionId: string,
    options: {
      cwd?: string;
      env?: Record<string, string>;
      cols?: number;
      rows?: number;
      maxHistorySize?: number;
      maxBufferSize?: number;
    } = {}
  ) {
    this._sessionId = sessionId;
    this._cwd = options.cwd ?? process.cwd();
    this._env = new Map(Object.entries(options.env ?? {}));
    this._dimensions = {
      cols: options.cols ?? 80,
      rows: options.rows ?? 24,
    };
    this.maxHistorySize = options.maxHistorySize ?? 1000;
    this.maxBufferSize = options.maxBufferSize ?? 10000;
  }

  /** Session identifier. */
  get sessionId(): string {
    return this._sessionId;
  }

  /** Current working directory. */
  get cwd(): string {
    return this._cwd;
  }

  /** Current terminal dimensions. */
  get dimensions(): TerminalDimensions {
    return { ...this._dimensions };
  }

  /** Whether a command is currently running. */
  get isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Set the current working directory.
   */
  setCwd(cwd: string): void {
    this._cwd = cwd;
  }

  /**
   * Set an environment variable.
   */
  setEnv(key: string, value: string): void {
    this._env.set(key, value);
  }

  /**
   * Remove an environment variable.
   */
  removeEnv(key: string): boolean {
    return this._env.delete(key);
  }

  /**
   * Get an environment variable value.
   */
  getEnv(key: string): string | undefined {
    return this._env.get(key);
  }

  /**
   * Get all environment variables as a plain object.
   */
  getAllEnv(): Record<string, string> {
    const env: Record<string, string> = {};
    for (const [key, value] of this._env) {
      env[key] = value;
    }
    return env;
  }

  /**
   * Record a new command in the history.
   */
  addCommand(command: string): CommandHistoryEntry {
    const entry: CommandHistoryEntry = {
      command,
      timestamp: Date.now(),
      exitCode: null,
      durationMs: null,
    };

    this._history.push(entry);
    this.historyIndex = this._history.length;

    if (this._history.length > this.maxHistorySize) {
      this._history = this._history.slice(-this.maxHistorySize);
    }

    this._isRunning = true;
    return entry;
  }

  /**
   * Complete the last running command with its exit code.
   */
  completeCommand(exitCode: number): void {
    if (this._history.length === 0) return;
    const last = this._history[this._history.length - 1];
    last.exitCode = exitCode;
    last.durationMs = Date.now() - last.timestamp;
    this._isRunning = false;
  }

  /**
   * Get the command history.
   */
  getHistory(): readonly CommandHistoryEntry[] {
    return this._history;
  }

  /**
   * Navigate backward through command history (like pressing up arrow).
   */
  historyPrevious(): string | null {
    if (this._history.length === 0 || this.historyIndex <= 0) return null;
    this.historyIndex--;
    return this._history[this.historyIndex].command;
  }

  /**
   * Navigate forward through command history (like pressing down arrow).
   */
  historyNext(): string | null {
    if (this.historyIndex >= this._history.length - 1) {
      this.historyIndex = this._history.length;
      return null;
    }
    this.historyIndex++;
    return this._history[this.historyIndex].command;
  }

  /**
   * Search command history for entries containing the given text.
   */
  searchHistory(query: string): CommandHistoryEntry[] {
    const lowerQuery = query.toLowerCase();
    return this._history.filter((e) =>
      e.command.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Add a line to the output buffer.
   */
  addOutput(text: string, isError: boolean = false): void {
    this._outputBuffer.push({
      text,
      timestamp: Date.now(),
      isError,
    });

    if (this._outputBuffer.length > this.maxBufferSize) {
      this._outputBuffer = this._outputBuffer.slice(-this.maxBufferSize);
    }
  }

  /**
   * Get the output buffer.
   */
  getOutput(): readonly TerminalLine[] {
    return this._outputBuffer;
  }

  /**
   * Clear the output buffer.
   */
  clearOutput(): void {
    this._outputBuffer = [];
  }

  /**
   * Resize the terminal dimensions.
   */
  resize(cols: number, rows: number): void {
    this._dimensions.cols = Math.max(1, cols);
    this._dimensions.rows = Math.max(1, rows);
  }

  /**
   * Create a serializable snapshot of the session state.
   */
  snapshot(): TerminalSessionSnapshot {
    return {
      sessionId: this._sessionId,
      cwd: this._cwd,
      env: this.getAllEnv(),
      history: [...this._history],
      dimensions: { ...this._dimensions },
      timestamp: Date.now(),
    };
  }

  /**
   * Restore session state from a snapshot.
   */
  restore(snapshot: TerminalSessionSnapshot): void {
    this._cwd = snapshot.cwd;
    this._env = new Map(Object.entries(snapshot.env));
    this._history = [...snapshot.history];
    this._dimensions = { ...snapshot.dimensions };
    this.historyIndex = this._history.length;
  }

  /**
   * Clear the command history.
   */
  clearHistory(): void {
    this._history = [];
    this.historyIndex = -1;
  }

  /**
   * Get the last N commands from history.
   */
  getRecentCommands(count: number = 10): string[] {
    return this._history
      .slice(-count)
      .map((e) => e.command);
  }
}
