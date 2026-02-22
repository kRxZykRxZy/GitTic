import { describe, it, expect } from "vitest";
import { TextBuffer } from "../core/buffer.js";

describe("TextBuffer", () => {
  it("initializes with empty content", () => {
    const buf = new TextBuffer();
    expect(buf.getContent()).toBe("");
    expect(buf.lineCount).toBe(1);
    expect(buf.version).toBe(0);
  });

  it("initializes with provided content", () => {
    const buf = new TextBuffer("hello\nworld");
    expect(buf.getContent()).toBe("hello\nworld");
    expect(buf.lineCount).toBe(2);
  });

  it("tracks file path", () => {
    const buf = new TextBuffer("", "test.ts");
    expect(buf.filePath).toBe("test.ts");
  });

  it("gets a specific line", () => {
    const buf = new TextBuffer("line1\nline2\nline3");
    expect(buf.getLine(0)).toBe("line1");
    expect(buf.getLine(1)).toBe("line2");
    expect(buf.getLine(2)).toBe("line3");
  });

  it("returns empty string for out-of-range line", () => {
    const buf = new TextBuffer("hello");
    expect(buf.getLine(-1)).toBe("");
    expect(buf.getLine(99)).toBe("");
  });

  it("inserts text and increments version", () => {
    const buf = new TextBuffer("hello world");
    const v0 = buf.version;
    buf.insertText({ line: 0, column: 5 }, " beautiful");
    expect(buf.getContent()).toBe("hello beautiful world");
    expect(buf.version).toBe(v0 + 1);
  });

  it("inserts multiline text", () => {
    const buf = new TextBuffer("hello");
    buf.insertText({ line: 0, column: 5 }, "\nworld");
    expect(buf.lineCount).toBe(2);
    expect(buf.getLine(0)).toBe("hello");
    expect(buf.getLine(1)).toBe("world");
  });

  it("deletes a range of text", () => {
    const buf = new TextBuffer("hello world");
    buf.deleteRange({
      start: { line: 0, column: 5 },
      end: { line: 0, column: 11 },
    });
    expect(buf.getContent()).toBe("hello");
  });

  it("deletes across multiple lines", () => {
    const buf = new TextBuffer("line1\nline2\nline3");
    buf.deleteRange({
      start: { line: 0, column: 3 },
      end: { line: 1, column: 3 },
    });
    expect(buf.getLine(0)).toBe("line2");
  });

  it("tracks version through multiple edits", () => {
    const buf = new TextBuffer("hello");
    buf.insertText({ line: 0, column: 5 }, " world");
    buf.insertText({ line: 0, column: 11 }, "!");
    expect(buf.version).toBe(2);
  });

  it("setContent replaces everything", () => {
    const buf = new TextBuffer("old content");
    buf.setContent("new content");
    expect(buf.getContent()).toBe("new content");
    expect(buf.version).toBe(1);
  });

  it("getLineLength returns correct length", () => {
    const buf = new TextBuffer("hello\nworld!");
    expect(buf.getLineLength(0)).toBe(5);
    expect(buf.getLineLength(1)).toBe(6);
  });

  it("findAll finds pattern matches", () => {
    const buf = new TextBuffer("foo bar foo baz foo");
    const matches = buf.findAll("foo");
    expect(matches).toHaveLength(3);
  });

  it("getChangeLog records changes", () => {
    const buf = new TextBuffer("hello");
    buf.insertText({ line: 0, column: 0 }, "x");
    expect(buf.getChangeLog().length).toBeGreaterThan(0);
  });

  it("clearChangeLog empties the log", () => {
    const buf = new TextBuffer("hello");
    buf.insertText({ line: 0, column: 0 }, "x");
    buf.clearChangeLog();
    expect(buf.getChangeLog()).toHaveLength(0);
  });
});
