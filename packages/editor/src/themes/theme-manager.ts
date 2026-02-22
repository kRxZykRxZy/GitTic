/**
 * Theme manager for the editor.
 * Registers, switches, and retrieves editor themes with built-in defaults.
 */

/**
 * A complete editor theme definition.
 */
export interface EditorTheme {
  /** Unique theme identifier. */
  id: string;
  /** Human-readable display name. */
  name: string;
  /** Whether this is a dark, light, or high-contrast theme. */
  type: "dark" | "light" | "high-contrast";
  /** Editor UI colors. */
  colors: ThemeColors;
  /** Whether this is a built-in theme (cannot be removed). */
  isBuiltIn: boolean;
}

/**
 * UI color definitions for a theme.
 */
export interface ThemeColors {
  /** Main editor background. */
  editorBackground: string;
  /** Main editor foreground (text). */
  editorForeground: string;
  /** Editor line highlight. */
  editorLineHighlight: string;
  /** Editor selection background. */
  editorSelectionBackground: string;
  /** Editor cursor color. */
  editorCursor: string;
  /** Sidebar background. */
  sidebarBackground: string;
  /** Sidebar foreground. */
  sidebarForeground: string;
  /** Activity bar background. */
  activityBarBackground: string;
  /** Status bar background. */
  statusBarBackground: string;
  /** Status bar foreground. */
  statusBarForeground: string;
  /** Tab bar background. */
  tabBarBackground: string;
  /** Active tab background. */
  tabActiveBackground: string;
  /** Active tab foreground. */
  tabActiveForeground: string;
  /** Inactive tab foreground. */
  tabInactiveForeground: string;
  /** Panel (terminal, output) background. */
  panelBackground: string;
  /** Primary accent color. */
  accentColor: string;
  /** Error color for diagnostics. */
  errorColor: string;
  /** Warning color for diagnostics. */
  warningColor: string;
  /** Info color for diagnostics. */
  infoColor: string;
  /** Line number color. */
  lineNumberColor: string;
  /** Active line number color. */
  lineNumberActiveColor: string;
}

/** Built-in dark theme. */
export const DARK_THEME: EditorTheme = {
  id: "dark-default",
  name: "Dark (Default)",
  type: "dark",
  isBuiltIn: true,
  colors: {
    editorBackground: "#1e1e1e",
    editorForeground: "#d4d4d4",
    editorLineHighlight: "#2a2d2e",
    editorSelectionBackground: "#264f78",
    editorCursor: "#aeafad",
    sidebarBackground: "#252526",
    sidebarForeground: "#cccccc",
    activityBarBackground: "#333333",
    statusBarBackground: "#007acc",
    statusBarForeground: "#ffffff",
    tabBarBackground: "#252526",
    tabActiveBackground: "#1e1e1e",
    tabActiveForeground: "#ffffff",
    tabInactiveForeground: "#969696",
    panelBackground: "#1e1e1e",
    accentColor: "#007acc",
    errorColor: "#f44747",
    warningColor: "#cca700",
    infoColor: "#3794ff",
    lineNumberColor: "#858585",
    lineNumberActiveColor: "#c6c6c6",
  },
};

/** Built-in light theme. */
export const LIGHT_THEME: EditorTheme = {
  id: "light-default",
  name: "Light (Default)",
  type: "light",
  isBuiltIn: true,
  colors: {
    editorBackground: "#ffffff",
    editorForeground: "#000000",
    editorLineHighlight: "#f0f0f0",
    editorSelectionBackground: "#add6ff",
    editorCursor: "#000000",
    sidebarBackground: "#f3f3f3",
    sidebarForeground: "#333333",
    activityBarBackground: "#2c2c2c",
    statusBarBackground: "#007acc",
    statusBarForeground: "#ffffff",
    tabBarBackground: "#ececec",
    tabActiveBackground: "#ffffff",
    tabActiveForeground: "#333333",
    tabInactiveForeground: "#999999",
    panelBackground: "#f3f3f3",
    accentColor: "#007acc",
    errorColor: "#e51400",
    warningColor: "#bf8803",
    infoColor: "#1a85ff",
    lineNumberColor: "#237893",
    lineNumberActiveColor: "#0b216f",
  },
};

/** Built-in high contrast theme. */
export const HIGH_CONTRAST_THEME: EditorTheme = {
  id: "high-contrast",
  name: "High Contrast",
  type: "high-contrast",
  isBuiltIn: true,
  colors: {
    editorBackground: "#000000",
    editorForeground: "#ffffff",
    editorLineHighlight: "#1a1a1a",
    editorSelectionBackground: "#0000ff",
    editorCursor: "#ffffff",
    sidebarBackground: "#000000",
    sidebarForeground: "#ffffff",
    activityBarBackground: "#000000",
    statusBarBackground: "#000000",
    statusBarForeground: "#ffffff",
    tabBarBackground: "#000000",
    tabActiveBackground: "#000000",
    tabActiveForeground: "#ffffff",
    tabInactiveForeground: "#aaaaaa",
    panelBackground: "#000000",
    accentColor: "#ffff00",
    errorColor: "#ff0000",
    warningColor: "#ffff00",
    infoColor: "#00ffff",
    lineNumberColor: "#ffffff",
    lineNumberActiveColor: "#ffff00",
  },
};

/**
 * Manages editor themes: registration, switching, and retrieval.
 */
export class ThemeManager {
  private themes = new Map<string, EditorTheme>();
  private _activeThemeId: string;

  constructor(defaultTheme: string = "dark-default") {
    this.registerTheme(DARK_THEME);
    this.registerTheme(LIGHT_THEME);
    this.registerTheme(HIGH_CONTRAST_THEME);
    this._activeThemeId = defaultTheme;
  }

  /**
   * Register a new theme or replace an existing custom theme.
   */
  registerTheme(theme: EditorTheme): void {
    const existing = this.themes.get(theme.id);
    if (existing?.isBuiltIn && !theme.isBuiltIn) return;
    this.themes.set(theme.id, theme);
  }

  /**
   * Remove a custom theme by its identifier.
   * Built-in themes cannot be removed.
   */
  removeTheme(themeId: string): boolean {
    const theme = this.themes.get(themeId);
    if (!theme || theme.isBuiltIn) return false;
    if (this._activeThemeId === themeId) {
      this._activeThemeId = "dark-default";
    }
    return this.themes.delete(themeId);
  }

  /**
   * Switch to a different theme by its identifier.
   */
  setActiveTheme(themeId: string): boolean {
    if (!this.themes.has(themeId)) return false;
    this._activeThemeId = themeId;
    return true;
  }

  /**
   * Get the currently active theme.
   */
  getActiveTheme(): EditorTheme {
    return this.themes.get(this._activeThemeId) ?? DARK_THEME;
  }

  /**
   * Get a theme by its identifier.
   */
  getTheme(themeId: string): EditorTheme | null {
    return this.themes.get(themeId) ?? null;
  }

  /**
   * List all registered themes.
   */
  listThemes(): EditorTheme[] {
    return Array.from(this.themes.values());
  }

  /**
   * List themes filtered by type.
   */
  listByType(type: EditorTheme["type"]): EditorTheme[] {
    return this.listThemes().filter((t) => t.type === type);
  }

  /**
   * Get the identifier of the active theme.
   */
  get activeThemeId(): string {
    return this._activeThemeId;
  }

  /**
   * Get the number of registered themes.
   */
  get themeCount(): number {
    return this.themes.size;
  }
}
