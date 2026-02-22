import { describe, it, expect } from "vitest";
import {
  extractCodeBlocks,
  extractCodeBlockByLanguage,
  stripCodeBlocks,
  cleanResponse,
} from "../utils/response-parser.js";

describe("extractCodeBlocks", () => {
  it("extracts a single code block", () => {
    const text = "Some text\n```typescript\nconst x = 1;\n```\nMore text";
    const blocks = extractCodeBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].code).toBe("const x = 1;");
    expect(blocks[0].language).toBe("typescript");
  });

  it("extracts multiple code blocks", () => {
    const text = "```js\nfoo()\n```\ntext\n```python\nbar()\n```";
    const blocks = extractCodeBlocks(text);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].language).toBe("js");
    expect(blocks[1].language).toBe("python");
  });

  it("handles code block without language", () => {
    const text = "```\nhello\n```";
    const blocks = extractCodeBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].language).toBe("");
    expect(blocks[0].code).toBe("hello");
  });

  it("returns empty array when no code blocks", () => {
    expect(extractCodeBlocks("no code here")).toHaveLength(0);
  });

  it("extracts tilde-fenced code blocks", () => {
    const text = "~~~js\nconst a = 1;\n~~~";
    const blocks = extractCodeBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].code).toBe("const a = 1;");
  });

  it("includes startIndex and endIndex", () => {
    const text = "prefix\n```ts\ncode\n```\nsuffix";
    const blocks = extractCodeBlocks(text);
    expect(blocks[0].startIndex).toBeGreaterThanOrEqual(0);
    expect(blocks[0].endIndex).toBeGreaterThan(blocks[0].startIndex);
  });

  it("handles multiline code", () => {
    const text = "```js\nline1\nline2\nline3\n```";
    const blocks = extractCodeBlocks(text);
    expect(blocks[0].code).toBe("line1\nline2\nline3");
  });
});

describe("extractCodeBlockByLanguage", () => {
  it("finds block by language", () => {
    const text = "```js\nfoo()\n```\n```python\nbar()\n```";
    const block = extractCodeBlockByLanguage(text, "python");
    expect(block).toBeDefined();
    expect(block?.code).toBe("bar()");
  });

  it("returns undefined for missing language", () => {
    const text = "```js\nfoo()\n```";
    expect(extractCodeBlockByLanguage(text, "rust")).toBeUndefined();
  });
});

describe("stripCodeBlocks", () => {
  it("removes code blocks from text", () => {
    const text = "Before\n```js\ncode\n```\nAfter";
    const result = stripCodeBlocks(text);
    expect(result).not.toContain("```");
    expect(result).toContain("Before");
    expect(result).toContain("After");
  });
});

describe("cleanResponse", () => {
  it("removes common AI prefixes", () => {
    expect(cleanResponse("Sure, here is the code")).not.toMatch(/^Sure/);
    expect(cleanResponse("Of course! Here is the answer")).not.toMatch(/^Of course/);
  });

  it("removes trailing filler", () => {
    const result = cleanResponse("The answer is 42.\nLet me know if you need more help.");
    expect(result).not.toContain("Let me know");
  });

  it("trims whitespace", () => {
    expect(cleanResponse("  hello  ")).toBe("hello");
  });
});
