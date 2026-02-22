import { describe, it, expect, vi } from "vitest";
import { CommandRegistry, normalizeKeybinding } from "../commands/command-registry.js";

describe("CommandRegistry", () => {
  it("registers a command", () => {
    const reg = new CommandRegistry();
    const cmd = reg.register({
      id: "editor.save",
      label: "Save",
      handler: () => {},
    });
    expect(cmd.id).toBe("editor.save");
    expect(cmd.label).toBe("Save");
    expect(cmd.category).toBe("General");
    expect(cmd.enabled).toBe(true);
  });

  it("lookup returns registered command", () => {
    const reg = new CommandRegistry();
    reg.register({ id: "file.open", label: "Open File", handler: () => {} });
    const cmd = reg.get("file.open");
    expect(cmd).not.toBeNull();
    expect(cmd?.label).toBe("Open File");
  });

  it("lookup returns null for unregistered command", () => {
    const reg = new CommandRegistry();
    expect(reg.get("nonexistent")).toBeNull();
  });

  it("has() checks existence", () => {
    const reg = new CommandRegistry();
    reg.register({ id: "test.cmd", label: "Test", handler: () => {} });
    expect(reg.has("test.cmd")).toBe(true);
    expect(reg.has("missing")).toBe(false);
  });

  it("lists all commands", () => {
    const reg = new CommandRegistry();
    reg.register({ id: "cmd1", label: "Cmd1", handler: () => {} });
    reg.register({ id: "cmd2", label: "Cmd2", handler: () => {} });
    expect(reg.getAll()).toHaveLength(2);
  });

  it("tracks size", () => {
    const reg = new CommandRegistry();
    expect(reg.size).toBe(0);
    reg.register({ id: "a", label: "A", handler: () => {} });
    expect(reg.size).toBe(1);
  });

  it("unregisters a command", () => {
    const reg = new CommandRegistry();
    reg.register({ id: "temp", label: "Temp", handler: () => {} });
    expect(reg.unregister("temp")).toBe(true);
    expect(reg.has("temp")).toBe(false);
  });

  it("executes a command handler", async () => {
    const reg = new CommandRegistry();
    const fn = vi.fn();
    reg.register({ id: "run", label: "Run", handler: fn });
    const result = await reg.execute("run", "arg1");
    expect(result).toBe(true);
    expect(fn).toHaveBeenCalledWith("arg1");
  });

  it("execute returns false for missing command", async () => {
    const reg = new CommandRegistry();
    expect(await reg.execute("missing")).toBe(false);
  });

  it("execute returns false for disabled command", async () => {
    const reg = new CommandRegistry();
    reg.register({ id: "dis", label: "Dis", handler: () => {}, enabled: false });
    expect(await reg.execute("dis")).toBe(false);
  });

  it("filters by category", () => {
    const reg = new CommandRegistry();
    reg.register({ id: "a", label: "A", handler: () => {}, category: "File" });
    reg.register({ id: "b", label: "B", handler: () => {}, category: "Edit" });
    reg.register({ id: "c", label: "C", handler: () => {}, category: "File" });
    expect(reg.getByCategory("File")).toHaveLength(2);
    expect(reg.getByCategory("Edit")).toHaveLength(1);
  });

  it("gets unique categories", () => {
    const reg = new CommandRegistry();
    reg.register({ id: "a", label: "A", handler: () => {}, category: "File" });
    reg.register({ id: "b", label: "B", handler: () => {}, category: "Edit" });
    const cats = reg.getCategories();
    expect(cats).toContain("File");
    expect(cats).toContain("Edit");
    expect(cats).toHaveLength(2);
  });

  it("finds command by keybinding", () => {
    const reg = new CommandRegistry();
    reg.register({
      id: "save",
      label: "Save",
      handler: () => {},
      keybinding: "Ctrl+S",
    });
    const cmd = reg.findByKeybinding("ctrl+s");
    expect(cmd).not.toBeNull();
    expect(cmd?.id).toBe("save");
  });

  it("setEnabled toggles command enabled state", () => {
    const reg = new CommandRegistry();
    reg.register({ id: "x", label: "X", handler: () => {} });
    reg.setEnabled("x", false);
    expect(reg.get("x")?.enabled).toBe(false);
  });

  it("clear removes all commands", () => {
    const reg = new CommandRegistry();
    reg.register({ id: "a", label: "A", handler: () => {} });
    reg.clear();
    expect(reg.size).toBe(0);
  });
});

describe("normalizeKeybinding", () => {
  it("normalizes case", () => {
    expect(normalizeKeybinding("Ctrl+S")).toBe("ctrl+s");
  });

  it("sorts modifiers alphabetically", () => {
    expect(normalizeKeybinding("Shift+Ctrl+S")).toBe("ctrl+shift+s");
  });
});
