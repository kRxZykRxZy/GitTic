import { describe, it, expect } from "vitest";
import { sanitizeHtml, sanitizeShellArg, stripControlChars } from "../sanitize.js";

describe("sanitizeHtml", () => {
  it("escapes script tags", () => {
    const input = '<script>alert("xss")</script>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("</script>");
    expect(result).toContain("&lt;script&gt;");
  });

  it("preserves safe text without special chars", () => {
    expect(sanitizeHtml("Hello World")).toBe("Hello World");
  });

  it("handles empty input", () => {
    expect(sanitizeHtml("")).toBe("");
  });

  it("escapes all HTML special characters", () => {
    expect(sanitizeHtml("&")).toBe("&amp;");
    expect(sanitizeHtml("<")).toBe("&lt;");
    expect(sanitizeHtml(">")).toBe("&gt;");
    expect(sanitizeHtml('"')).toBe("&quot;");
    expect(sanitizeHtml("'")).toBe("&#x27;");
    expect(sanitizeHtml("/")).toBe("&#x2F;");
  });

  it("handles nested tags", () => {
    const input = '<div><script>alert("nested")</script></div>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("<div>");
    expect(result).toContain("&lt;div&gt;");
  });

  it("escapes multiple special characters in one string", () => {
    const input = '<a href="test">link</a>';
    const result = sanitizeHtml(input);
    expect(result).toBe("&lt;a href=&quot;test&quot;&gt;link&lt;&#x2F;a&gt;");
  });

  it("handles string with only special characters", () => {
    const result = sanitizeHtml("<>&\"'/");
    expect(result).toBe("&lt;&gt;&amp;&quot;&#x27;&#x2F;");
  });
});

describe("sanitizeShellArg", () => {
  it("removes shell metacharacters", () => {
    expect(sanitizeShellArg("hello; rm -rf /")).toBe("hellorm-rf/");
  });

  it("preserves alphanumeric and safe chars", () => {
    expect(sanitizeShellArg("my-file_v2.0/path")).toBe("my-file_v2.0/path");
  });

  it("removes spaces and special chars", () => {
    expect(sanitizeShellArg("$(whoami)")).toBe("whoami");
  });
});

describe("stripControlChars", () => {
  it("removes null bytes", () => {
    expect(stripControlChars("hello\x00world")).toBe("helloworld");
  });

  it("preserves newlines and tabs", () => {
    expect(stripControlChars("hello\n\tworld")).toBe("hello\n\tworld");
  });

  it("removes other control characters", () => {
    expect(stripControlChars("test\x01\x02\x03")).toBe("test");
  });
});
