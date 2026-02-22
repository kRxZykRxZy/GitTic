import { describe, it, expect } from "vitest";
import { ThemeManager, DARK_THEME, LIGHT_THEME } from "../themes/theme-manager.js";
import type { EditorTheme, ThemeColors } from "../themes/theme-manager.js";

function makeCustomTheme(id: string, type: EditorTheme["type"] = "dark"): EditorTheme {
  return {
    id,
    name: `Custom ${id}`,
    type,
    isBuiltIn: false,
    colors: { ...DARK_THEME.colors },
  };
}

describe("ThemeManager", () => {
  it("initializes with built-in themes", () => {
    const tm = new ThemeManager();
    expect(tm.themeCount).toBe(3);
  });

  it("defaults to dark theme", () => {
    const tm = new ThemeManager();
    expect(tm.activeThemeId).toBe("dark-default");
    expect(tm.getActiveTheme().id).toBe("dark-default");
  });

  it("allows specifying default theme", () => {
    const tm = new ThemeManager("light-default");
    expect(tm.activeThemeId).toBe("light-default");
  });

  it("registers a custom theme", () => {
    const tm = new ThemeManager();
    const custom = makeCustomTheme("my-theme");
    tm.registerTheme(custom);
    expect(tm.themeCount).toBe(4);
    expect(tm.getTheme("my-theme")).not.toBeNull();
  });

  it("switches theme", () => {
    const tm = new ThemeManager();
    const result = tm.setActiveTheme("light-default");
    expect(result).toBe(true);
    expect(tm.activeThemeId).toBe("light-default");
  });

  it("fails to switch to non-existent theme", () => {
    const tm = new ThemeManager();
    expect(tm.setActiveTheme("nonexistent")).toBe(false);
    expect(tm.activeThemeId).toBe("dark-default");
  });

  it("gets current theme", () => {
    const tm = new ThemeManager();
    const theme = tm.getActiveTheme();
    expect(theme.id).toBe("dark-default");
    expect(theme.type).toBe("dark");
  });

  it("removes custom theme", () => {
    const tm = new ThemeManager();
    tm.registerTheme(makeCustomTheme("removable"));
    expect(tm.removeTheme("removable")).toBe(true);
    expect(tm.getTheme("removable")).toBeNull();
  });

  it("cannot remove built-in theme", () => {
    const tm = new ThemeManager();
    expect(tm.removeTheme("dark-default")).toBe(false);
  });

  it("falls back to dark-default when active custom theme is removed", () => {
    const tm = new ThemeManager();
    tm.registerTheme(makeCustomTheme("temp"));
    tm.setActiveTheme("temp");
    tm.removeTheme("temp");
    expect(tm.activeThemeId).toBe("dark-default");
  });

  it("listThemes returns all themes", () => {
    const tm = new ThemeManager();
    tm.registerTheme(makeCustomTheme("extra"));
    const themes = tm.listThemes();
    expect(themes.length).toBe(4);
  });

  it("listByType filters correctly", () => {
    const tm = new ThemeManager();
    const darkThemes = tm.listByType("dark");
    expect(darkThemes.every((t) => t.type === "dark")).toBe(true);
  });

  it("getTheme returns null for unknown id", () => {
    const tm = new ThemeManager();
    expect(tm.getTheme("no-such-theme")).toBeNull();
  });
});
