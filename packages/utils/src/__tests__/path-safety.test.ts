import { describe, it, expect } from "vitest";
import { isPathSafe, safeResolvePath } from "../path-safety.js";

describe("isPathSafe", () => {
  const base = "/home/user/repos";

  it("allows safe relative paths", () => {
    expect(isPathSafe(base, "project/src/index.ts")).toBe(true);
  });

  it("allows current directory reference", () => {
    expect(isPathSafe(base, ".")).toBe(true);
    expect(isPathSafe(base, "./file.txt")).toBe(true);
  });

  it("blocks path traversal with ../", () => {
    expect(isPathSafe(base, "../../../etc/passwd")).toBe(false);
  });

  it("blocks traversal beyond base", () => {
    expect(isPathSafe(base, "../../outside")).toBe(false);
  });

  it("allows nested subdirectories", () => {
    expect(isPathSafe(base, "a/b/c/d/e.txt")).toBe(true);
  });

  it("allows filenames with dots", () => {
    expect(isPathSafe(base, "file.test.ts")).toBe(true);
  });

  it("blocks sneaky traversal via encoded dots", () => {
    expect(isPathSafe(base, "project/../../outside")).toBe(false);
  });

  it("allows going up then back into base", () => {
    expect(isPathSafe(base, "project/../project/file.txt")).toBe(true);
  });

  it("handles absolute paths within base", () => {
    expect(isPathSafe(base, "/home/user/repos/file.txt")).toBe(true);
  });

  it("blocks absolute paths outside base", () => {
    expect(isPathSafe(base, "/tmp/evil")).toBe(false);
  });
});

describe("safeResolvePath", () => {
  const base = "/home/user/repos";

  it("returns resolved path when safe", () => {
    const result = safeResolvePath(base, "project/file.txt");
    expect(result).toBe("/home/user/repos/project/file.txt");
  });

  it("returns null when path escapes base", () => {
    expect(safeResolvePath(base, "../../../etc/passwd")).toBeNull();
  });

  it("returns base path for current dir", () => {
    expect(safeResolvePath(base, ".")).toBe("/home/user/repos");
  });
});
