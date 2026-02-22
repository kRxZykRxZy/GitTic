/**
 * Command registry for storing and looking up editor commands.
 * Each command has an id, label, handler, optional keybinding, and category.
 */

/**
 * A registered editor command with its handler and metadata.
 */
export interface EditorCommand {
  /** Unique command identifier (e.g., "editor.save", "file.open"). */
  id: string;
  /** Human-readable label for display. */
  label: string;
  /** Command category for grouping in UI. */
  category: string;
  /** Description of what the command does. */
  description: string;
  /** The function to execute when the command is invoked. */
  handler: CommandHandler;
  /** Associated keyboard shortcut string (e.g., "Ctrl+S"). */
  keybinding: string | null;
  /** Whether the command is currently enabled. */
  enabled: boolean;
  /** Whether the command is visible in the command palette. */
  visible: boolean;
}

/**
 * Handler function for a command, receiving optional arguments.
 */
export type CommandHandler = (...args: unknown[]) => void | Promise<void>;

/**
 * Options for registering a new command.
 */
export interface RegisterCommandOptions {
  /** Unique command identifier. */
  id: string;
  /** Display label. */
  label: string;
  /** Category for grouping. */
  category?: string;
  /** Description. */
  description?: string;
  /** Command handler function. */
  handler: CommandHandler;
  /** Keyboard shortcut. */
  keybinding?: string;
  /** Whether the command is enabled (default: true). */
  enabled?: boolean;
  /** Whether the command is visible in palette (default: true). */
  visible?: boolean;
}

/**
 * Central registry for all editor commands.
 * Provides registration, lookup, listing, and execution of commands.
 */
export class CommandRegistry {
  private commands = new Map<string, EditorCommand>();

  /**
   * Register a new command. Overwrites any existing command with the same id.
   */
  register(options: RegisterCommandOptions): EditorCommand {
    const command: EditorCommand = {
      id: options.id,
      label: options.label,
      category: options.category ?? "General",
      description: options.description ?? "",
      handler: options.handler,
      keybinding: options.keybinding ?? null,
      enabled: options.enabled ?? true,
      visible: options.visible ?? true,
    };
    this.commands.set(command.id, command);
    return command;
  }

  /**
   * Unregister a command by its identifier.
   */
  unregister(commandId: string): boolean {
    return this.commands.delete(commandId);
  }

  /**
   * Get a command by its identifier.
   */
  get(commandId: string): EditorCommand | null {
    return this.commands.get(commandId) ?? null;
  }

  /**
   * Check whether a command is registered.
   */
  has(commandId: string): boolean {
    return this.commands.has(commandId);
  }

  /**
   * Execute a command by its identifier with optional arguments.
   */
  async execute(commandId: string, ...args: unknown[]): Promise<boolean> {
    const command = this.commands.get(commandId);
    if (!command || !command.enabled) return false;

    await command.handler(...args);
    return true;
  }

  /**
   * Get all registered commands.
   */
  getAll(): EditorCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get commands filtered by category.
   */
  getByCategory(category: string): EditorCommand[] {
    return this.getAll().filter((c) => c.category === category);
  }

  /**
   * Get all unique command categories.
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    for (const cmd of this.commands.values()) {
      categories.add(cmd.category);
    }
    return Array.from(categories).sort();
  }

  /**
   * Find a command by its keybinding string.
   */
  findByKeybinding(keybinding: string): EditorCommand | null {
    const normalized = normalizeKeybinding(keybinding);
    for (const cmd of this.commands.values()) {
      if (cmd.keybinding && normalizeKeybinding(cmd.keybinding) === normalized) {
        return cmd;
      }
    }
    return null;
  }

  /**
   * Set the enabled state of a command.
   */
  setEnabled(commandId: string, enabled: boolean): boolean {
    const command = this.commands.get(commandId);
    if (!command) return false;
    command.enabled = enabled;
    return true;
  }

  /**
   * Set the keybinding for a command.
   */
  setKeybinding(commandId: string, keybinding: string | null): boolean {
    const command = this.commands.get(commandId);
    if (!command) return false;
    command.keybinding = keybinding;
    return true;
  }

  /**
   * Get the total number of registered commands.
   */
  get size(): number {
    return this.commands.size;
  }

  /**
   * Clear all registered commands.
   */
  clear(): void {
    this.commands.clear();
  }
}

/**
 * Normalize a keybinding string for consistent comparison.
 * Sorts modifier keys alphabetically and lowercases everything.
 */
export function normalizeKeybinding(keybinding: string): string {
  const parts = keybinding
    .split("+")
    .map((p) => p.trim().toLowerCase());

  const modifiers = parts.filter((p) => isModifierKey(p)).sort();
  const keys = parts.filter((p) => !isModifierKey(p));
  return [...modifiers, ...keys].join("+");
}

/**
 * Check if a key part is a modifier key.
 */
function isModifierKey(key: string): boolean {
  return ["ctrl", "alt", "shift", "meta", "cmd", "super"].includes(key);
}
