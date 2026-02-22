/**
 * Undo/redo history management for editor operations.
 * Supports grouped operations, max history size, and transactional batches.
 */

/**
 * A single operation recorded in the history stack.
 */
export interface HistoryOperation {
  /** Unique identifier for this operation. */
  id: string;
  /** Type of operation performed. */
  type: "insert" | "delete" | "replace" | "format" | "custom";
  /** Timestamp when the operation occurred. */
  timestamp: number;
  /** Data needed to undo this operation. */
  undoData: OperationData;
  /** Data needed to redo this operation. */
  redoData: OperationData;
  /** Optional group identifier to batch related operations. */
  groupId?: string;
}

/**
 * Positional data describing a text change.
 */
export interface OperationData {
  /** Starting line of the affected range. */
  startLine: number;
  /** Starting column of the affected range. */
  startColumn: number;
  /** Ending line of the affected range. */
  endLine: number;
  /** Ending column of the affected range. */
  endColumn: number;
  /** Text content involved in the operation. */
  text: string;
}

/**
 * Configuration options for the history stack.
 */
export interface HistoryConfig {
  /** Maximum number of undo entries to keep. */
  maxSize: number;
  /** Time window (ms) for auto-grouping rapid edits. */
  groupingInterval: number;
}

/** Default history configuration values. */
export const DEFAULT_HISTORY_CONFIG: HistoryConfig = {
  maxSize: 1000,
  groupingInterval: 300,
};

/**
 * Manages undo/redo history for an editor buffer.
 * Automatically groups rapid successive edits into single undo entries.
 */
export class UndoRedoHistory {
  private undoStack: HistoryOperation[] = [];
  private redoStack: HistoryOperation[] = [];
  private config: HistoryConfig;
  private currentGroupId: string | null = null;
  private lastOperationTime: number = 0;
  private operationCounter: number = 0;
  private inTransaction: boolean = false;
  private transactionOps: HistoryOperation[] = [];

  constructor(config: Partial<HistoryConfig> = {}) {
    this.config = { ...DEFAULT_HISTORY_CONFIG, ...config };
  }

  /**
   * Push a new operation onto the undo stack.
   * Clears the redo stack since new edits invalidate the redo path.
   */
  push(
    type: HistoryOperation["type"],
    undoData: OperationData,
    redoData: OperationData
  ): HistoryOperation {
    const now = Date.now();
    const groupId = this.resolveGroupId(now);
    this.lastOperationTime = now;

    const operation: HistoryOperation = {
      id: `op-${++this.operationCounter}`,
      type,
      timestamp: now,
      undoData,
      redoData,
      groupId,
    };

    if (this.inTransaction) {
      this.transactionOps.push(operation);
      return operation;
    }

    this.undoStack.push(operation);
    this.redoStack = [];
    this.trimToMaxSize();
    return operation;
  }

  /**
   * Undo the most recent operation or group of operations.
   * Returns the operations that were undone, or null if nothing to undo.
   */
  undo(): HistoryOperation[] | null {
    if (this.undoStack.length === 0) return null;

    const last = this.undoStack[this.undoStack.length - 1];
    const groupId = last.groupId;
    const undone: HistoryOperation[] = [];

    if (groupId) {
      while (
        this.undoStack.length > 0 &&
        this.undoStack[this.undoStack.length - 1].groupId === groupId
      ) {
        const op = this.undoStack.pop()!;
        undone.push(op);
        this.redoStack.push(op);
      }
    } else {
      const op = this.undoStack.pop()!;
      undone.push(op);
      this.redoStack.push(op);
    }

    return undone;
  }

  /**
   * Redo the most recently undone operation or group.
   * Returns the operations that were redone, or null if nothing to redo.
   */
  redo(): HistoryOperation[] | null {
    if (this.redoStack.length === 0) return null;

    const last = this.redoStack[this.redoStack.length - 1];
    const groupId = last.groupId;
    const redone: HistoryOperation[] = [];

    if (groupId) {
      while (
        this.redoStack.length > 0 &&
        this.redoStack[this.redoStack.length - 1].groupId === groupId
      ) {
        const op = this.redoStack.pop()!;
        redone.push(op);
        this.undoStack.push(op);
      }
    } else {
      const op = this.redoStack.pop()!;
      redone.push(op);
      this.undoStack.push(op);
    }

    return redone;
  }

  /**
   * Whether an undo operation is available.
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Whether a redo operation is available.
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Clear all history (both undo and redo stacks).
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.currentGroupId = null;
    this.lastOperationTime = 0;
  }

  /**
   * Begin a transaction that groups all subsequent operations into a single undo entry.
   */
  beginTransaction(): void {
    this.inTransaction = true;
    this.transactionOps = [];
  }

  /**
   * Commit the current transaction, merging all operations into a single group.
   */
  commitTransaction(): void {
    if (!this.inTransaction) return;
    this.inTransaction = false;

    if (this.transactionOps.length === 0) return;

    const txGroupId = `tx-${++this.operationCounter}`;
    for (const op of this.transactionOps) {
      op.groupId = txGroupId;
      this.undoStack.push(op);
    }
    this.redoStack = [];
    this.transactionOps = [];
    this.trimToMaxSize();
  }

  /**
   * Abort the current transaction, discarding all batched operations.
   */
  abortTransaction(): void {
    this.inTransaction = false;
    this.transactionOps = [];
  }

  /** Number of undo operations available. */
  get undoSize(): number {
    return this.undoStack.length;
  }

  /** Number of redo operations available. */
  get redoSize(): number {
    return this.redoStack.length;
  }

  /**
   * Get the full undo stack for inspection (read-only).
   */
  getUndoStack(): readonly HistoryOperation[] {
    return this.undoStack;
  }

  /**
   * Get the full redo stack for inspection (read-only).
   */
  getRedoStack(): readonly HistoryOperation[] {
    return this.redoStack;
  }

  /**
   * Determine the group identifier for a new operation.
   * Groups rapid successive edits under the same identifier.
   */
  private resolveGroupId(now: number): string {
    const elapsed = now - this.lastOperationTime;
    if (elapsed > this.config.groupingInterval || !this.currentGroupId) {
      this.currentGroupId = `grp-${++this.operationCounter}`;
    }
    return this.currentGroupId;
  }

  /**
   * Trim the undo stack to respect the configured max size.
   */
  private trimToMaxSize(): void {
    if (this.undoStack.length > this.config.maxSize) {
      const excess = this.undoStack.length - this.config.maxSize;
      this.undoStack.splice(0, excess);
    }
  }
}
