/**
 * Keybinding manager for the editor.
 * Handles registration, conflict detection, key chord parsing, and platform awareness.
 */

/**
 * Supported platform types for keybinding resolution.
 */
export type Platform = "mac" | "windows" | "linux";

/**
 * A parsed key chord consisting of modifier flags and a base key.
 */
export interface KeyChord {
  /** Whether Ctrl (or Cmd on Mac) is pressed. */
  ctrl: boolean;
  /** Whether Shift is pressed. */
  shift: boolean;
  /** Whether Alt (or Option on Mac) is pressed. */
  alt: boolean;
  /** Whether Meta (Cmd on Mac, Win on Windows) is pressed. */
  meta: boolean;
  /** The base key (e.g., "s", "enter", "f1"). */
  key: string;
}

/**
 * A registered keybinding entry.
 */
export interface KeybindingEntry {
  /** The command identifier this keybinding triggers. */
  commandId: string;
  /** The original keybinding string (e.g., "Ctrl+S"). */
  keybinding: string;
  /** Parsed key chord representation. */
  chord: KeyChord;
  /** Platform this binding applies to (null means all platforms). */
  platform: Platform | null;
  /** Priority for conflict resolution (higher wins). */
  priority: number;
  /** Whether this binding is user-defined (vs built-in). */
  isUserDefined: boolean;
}

/**
 * Result of a conflict check between keybindings.
 */
export interface KeybindingConflict {
  /** The conflicting keybinding string. */
  keybinding: string;
  /** Command IDs that share this binding. */
  commandIds: string[];
}

/**
 * Manages keybinding registration, parsing, and conflict detection.
 */
export class KeybindingManager {
  private bindings: KeybindingEntry[] = [];
  private _platform: Platform;

  constructor(platform?: Platform) {
    this._platform = platform ?? detectPlatform();
  }

  /** Current platform. */
  get platform(): Platform {
    return this._platform;
  }

  /**
   * Register a keybinding for a command.
   */
  register(
    commandId: string,
    keybinding: string,
    options: { platform?: Platform; priority?: number; isUserDefined?: boolean } = {}
  ): KeybindingEntry {
    const chord = parseKeyChord(keybinding);
    const entry: KeybindingEntry = {
      commandId,
      keybinding,
      chord,
      platform: options.platform ?? null,
      priority: options.priority ?? (options.isUserDefined ? 100 : 0),
      isUserDefined: options.isUserDefined ?? false,
    };

    this.bindings.push(entry);
    return entry;
  }

  /**
   * Unregister all keybindings for a command.
   */
  unregister(commandId: string): number {
    const before = this.bindings.length;
    this.bindings = this.bindings.filter((b) => b.commandId !== commandId);
    return before - this.bindings.length;
  }

  /**
   * Unregister a specific keybinding string for a command.
   */
  unregisterBinding(commandId: string, keybinding: string): boolean {
    const normalized = normalizeChordString(keybinding);
    const idx = this.bindings.findIndex(
      (b) => b.commandId === commandId && normalizeChordString(b.keybinding) === normalized
    );
    if (idx === -1) return false;
    this.bindings.splice(idx, 1);
    return true;
  }

  /**
   * Find the command that should be executed for a given keybinding on the current platform.
   * Returns the highest-priority match.
   */
  resolve(keybinding: string): string | null {
    const chord = parseKeyChord(keybinding);
    const matches = this.bindings
      .filter((b) => {
        if (b.platform && b.platform !== this._platform) return false;
        return chordsEqual(b.chord, chord);
      })
      .sort((a, b) => b.priority - a.priority);

    return matches.length > 0 ? matches[0].commandId : null;
  }

  /**
   * Get all keybindings for a command.
   */
  getBindings(commandId: string): KeybindingEntry[] {
    return this.bindings.filter((b) => b.commandId === commandId);
  }

  /**
   * Get all registered keybindings.
   */
  getAllBindings(): readonly KeybindingEntry[] {
    return this.bindings;
  }

  /**
   * Detect keybinding conflicts (multiple commands sharing the same binding).
   */
  detectConflicts(): KeybindingConflict[] {
    const groups = new Map<string, string[]>();

    for (const binding of this.bindings) {
      if (binding.platform && binding.platform !== this._platform) continue;
      const key = chordToString(binding.chord);
      const existing = groups.get(key) ?? [];
      existing.push(binding.commandId);
      groups.set(key, existing);
    }

    const conflicts: KeybindingConflict[] = [];
    for (const [keybinding, commandIds] of groups) {
      const unique = [...new Set(commandIds)];
      if (unique.length > 1) {
        conflicts.push({ keybinding, commandIds: unique });
      }
    }

    return conflicts;
  }

  /**
   * Convert a keybinding string to its platform-specific display form.
   */
  formatForDisplay(keybinding: string): string {
    const chord = parseKeyChord(keybinding);
    const parts: string[] = [];

    if (this._platform === "mac") {
      if (chord.ctrl) parts.push("⌃");
      if (chord.alt) parts.push("⌥");
      if (chord.shift) parts.push("⇧");
      if (chord.meta) parts.push("⌘");
    } else {
      if (chord.ctrl) parts.push("Ctrl");
      if (chord.alt) parts.push("Alt");
      if (chord.shift) parts.push("Shift");
      if (chord.meta) parts.push("Win");
    }

    parts.push(formatKeyName(chord.key));
    return this._platform === "mac" ? parts.join("") : parts.join("+");
  }

  /**
   * Clear all keybindings.
   */
  clear(): void {
    this.bindings = [];
  }

  /**
   * Get the number of registered keybindings.
   */
  get size(): number {
    return this.bindings.length;
  }
}

/**
 * Parse a keybinding string into a KeyChord.
 */
export function parseKeyChord(keybinding: string): KeyChord {
  const chord: KeyChord = { ctrl: false, shift: false, alt: false, meta: false, key: "" };
  const parts = keybinding.split("+").map((p) => p.trim().toLowerCase());

  for (const part of parts) {
    switch (part) {
      case "ctrl":
      case "control":
        chord.ctrl = true;
        break;
      case "shift":
        chord.shift = true;
        break;
      case "alt":
      case "option":
        chord.alt = true;
        break;
      case "meta":
      case "cmd":
      case "command":
      case "super":
      case "win":
        chord.meta = true;
        break;
      default:
        chord.key = part;
    }
  }

  return chord;
}

/**
 * Convert a KeyChord back to a normalized string representation.
 */
export function chordToString(chord: KeyChord): string {
  const parts: string[] = [];
  if (chord.ctrl) parts.push("ctrl");
  if (chord.alt) parts.push("alt");
  if (chord.shift) parts.push("shift");
  if (chord.meta) parts.push("meta");
  parts.push(chord.key);
  return parts.join("+");
}

/**
 * Compare two key chords for equality.
 */
function chordsEqual(a: KeyChord, b: KeyChord): boolean {
  return (
    a.ctrl === b.ctrl &&
    a.shift === b.shift &&
    a.alt === b.alt &&
    a.meta === b.meta &&
    a.key === b.key
  );
}

/**
 * Normalize a keybinding string for comparison.
 */
function normalizeChordString(keybinding: string): string {
  return chordToString(parseKeyChord(keybinding));
}

/**
 * Format a key name for display.
 */
function formatKeyName(key: string): string {
  const displayNames: Record<string, string> = {
    enter: "Enter",
    escape: "Esc",
    backspace: "Backspace",
    tab: "Tab",
    space: "Space",
    delete: "Del",
    home: "Home",
    end: "End",
    pageup: "PgUp",
    pagedown: "PgDn",
    arrowup: "↑",
    arrowdown: "↓",
    arrowleft: "←",
    arrowright: "→",
  };
  return displayNames[key] ?? key.toUpperCase();
}

/**
 * Detect the current platform based on process.platform.
 */
function detectPlatform(): Platform {
  const p = typeof process !== "undefined" ? process.platform : "linux";
  if (p === "darwin") return "mac";
  if (p === "win32") return "windows";
  return "linux";
}
