/**
 * Typed event emitter for editor lifecycle events.
 * Provides strongly-typed publish/subscribe for all editor actions.
 */

/**
 * Map of editor event names to their payload types.
 */
export interface EditorEventMap {
  "file:opened": FileOpenedEvent;
  "file:closed": FileClosedEvent;
  "file:saved": FileSavedEvent;
  "file:modified": FileModifiedEvent;
  "cursor:moved": CursorMovedEvent;
  "selection:changed": SelectionChangedEvent;
  "tab:activated": TabActivatedEvent;
  "tab:closed": TabClosedEvent;
  "theme:changed": ThemeChangedEvent;
  "command:executed": CommandExecutedEvent;
  "search:completed": SearchCompletedEvent;
  "terminal:created": TerminalCreatedEvent;
  "terminal:closed": TerminalClosedEvent;
  "workspace:restored": WorkspaceRestoredEvent;
  "git:status-changed": GitStatusChangedEvent;
}

/** Payload when a file is opened in the editor. */
export interface FileOpenedEvent {
  filePath: string;
  language: string;
  timestamp: number;
}

/** Payload when a file tab is closed. */
export interface FileClosedEvent {
  filePath: string;
  hadUnsavedChanges: boolean;
  timestamp: number;
}

/** Payload when a file is written to disk. */
export interface FileSavedEvent {
  filePath: string;
  sizeBytes: number;
  timestamp: number;
}

/** Payload when buffer content changes. */
export interface FileModifiedEvent {
  filePath: string;
  version: number;
  timestamp: number;
}

/** Payload when the cursor position changes. */
export interface CursorMovedEvent {
  filePath: string;
  line: number;
  column: number;
  timestamp: number;
}

/** Payload when text selection changes. */
export interface SelectionChangedEvent {
  filePath: string;
  selections: Array<{ startLine: number; startCol: number; endLine: number; endCol: number }>;
  timestamp: number;
}

/** Payload when a tab becomes active. */
export interface TabActivatedEvent {
  filePath: string;
  previousFilePath: string | null;
  timestamp: number;
}

/** Payload when a tab is closed. */
export interface TabClosedEvent {
  filePath: string;
  tabIndex: number;
  timestamp: number;
}

/** Payload when the editor theme changes. */
export interface ThemeChangedEvent {
  themeId: string;
  previousThemeId: string;
  timestamp: number;
}

/** Payload when a command is executed. */
export interface CommandExecutedEvent {
  commandId: string;
  source: "palette" | "keybinding" | "menu" | "api";
  timestamp: number;
}

/** Payload when a text search finishes. */
export interface SearchCompletedEvent {
  query: string;
  matchCount: number;
  fileCount: number;
  durationMs: number;
  timestamp: number;
}

/** Payload when a terminal is created. */
export interface TerminalCreatedEvent {
  terminalId: string;
  shell: string;
  timestamp: number;
}

/** Payload when a terminal is destroyed. */
export interface TerminalClosedEvent {
  terminalId: string;
  exitCode: number | null;
  timestamp: number;
}

/** Payload when workspace state is restored from persisted data. */
export interface WorkspaceRestoredEvent {
  tabCount: number;
  activeFile: string | null;
  timestamp: number;
}

/** Payload when tracked git status of files changes. */
export interface GitStatusChangedEvent {
  changedFiles: number;
  stagedFiles: number;
  timestamp: number;
}

/** Listener function type for a specific event. */
type EventListener<T> = (event: T) => void;

/**
 * Strongly-typed event emitter for editor events.
 * Supports subscribing, unsubscribing, one-time listeners, and clearing.
 */
export class EditorEventEmitter {
  private listeners = new Map<string, Set<EventListener<unknown>>>();
  private onceListeners = new Map<string, Set<EventListener<unknown>>>();

  /**
   * Subscribe to an editor event.
   * Returns an unsubscribe function for convenient cleanup.
   */
  on<K extends keyof EditorEventMap>(
    event: K,
    listener: EventListener<EditorEventMap[K]>
  ): () => void {
    const key = event as string;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener as EventListener<unknown>);

    return () => {
      this.off(event, listener);
    };
  }

  /**
   * Subscribe to an editor event for a single firing only.
   */
  once<K extends keyof EditorEventMap>(
    event: K,
    listener: EventListener<EditorEventMap[K]>
  ): void {
    const key = event as string;
    if (!this.onceListeners.has(key)) {
      this.onceListeners.set(key, new Set());
    }
    this.onceListeners.get(key)!.add(listener as EventListener<unknown>);
  }

  /**
   * Unsubscribe a listener from an event.
   */
  off<K extends keyof EditorEventMap>(
    event: K,
    listener: EventListener<EditorEventMap[K]>
  ): void {
    const key = event as string;
    this.listeners.get(key)?.delete(listener as EventListener<unknown>);
    this.onceListeners.get(key)?.delete(listener as EventListener<unknown>);
  }

  /**
   * Emit an event, notifying all registered listeners.
   */
  emit<K extends keyof EditorEventMap>(
    event: K,
    payload: EditorEventMap[K]
  ): void {
    const key = event as string;

    const regular = this.listeners.get(key);
    if (regular) {
      for (const listener of regular) {
        listener(payload);
      }
    }

    const once = this.onceListeners.get(key);
    if (once) {
      for (const listener of once) {
        listener(payload);
      }
      once.clear();
    }
  }

  /**
   * Remove all listeners for a specific event, or all events if none specified.
   */
  clear<K extends keyof EditorEventMap>(event?: K): void {
    if (event) {
      const key = event as string;
      this.listeners.delete(key);
      this.onceListeners.delete(key);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
    }
  }

  /**
   * Get the count of listeners for a specific event.
   */
  listenerCount<K extends keyof EditorEventMap>(event: K): number {
    const key = event as string;
    const regular = this.listeners.get(key)?.size ?? 0;
    const once = this.onceListeners.get(key)?.size ?? 0;
    return regular + once;
  }

  /**
   * Get all event names that have active listeners.
   */
  eventNames(): string[] {
    const names = new Set<string>();
    for (const key of this.listeners.keys()) {
      if (this.listeners.get(key)!.size > 0) {
        names.add(key);
      }
    }
    for (const key of this.onceListeners.keys()) {
      if (this.onceListeners.get(key)!.size > 0) {
        names.add(key);
      }
    }
    return Array.from(names);
  }
}

/** Singleton editor event bus for global editor event communication. */
export const editorEventBus = new EditorEventEmitter();
