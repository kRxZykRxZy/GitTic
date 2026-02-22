import { describe, it, expect } from "vitest";
import {
  estimateTokenCount,
  estimateTokensDetailed,
  checkContextWindow,
  detectCodeContent,
} from "../utils/token-counter.js";

describe("estimateTokenCount", () => {
  it("returns 0 for empty string", () => {
    expect(estimateTokenCount("")).toBe(0);
  });

  it("returns positive count for non-empty text", () => {
    expect(estimateTokenCount("hello world")).toBeGreaterThan(0);
  });

  it("longer text produces more tokens", () => {
    const short = estimateTokenCount("hello");
    const long = estimateTokenCount("hello world this is a longer sentence");
    expect(long).toBeGreaterThan(short);
  });

  it("returns a number", () => {
    expect(typeof estimateTokenCount("test")).toBe("number");
  });

  it("handles single character", () => {
    expect(estimateTokenCount("a")).toBeGreaterThanOrEqual(1);
  });

  it("uses different rate for code-like content", () => {
    const codeText = `
      import { foo } from "bar";
      const x = 1;
      function test() { return x; }
      class Foo { constructor() {} }
    `;
    const plainText = "a".repeat(codeText.length);
    const codeTokens = estimateTokenCount(codeText);
    const plainTokens = estimateTokenCount(plainText);
    expect(codeTokens).toBeGreaterThan(plainTokens);
  });
});

describe("estimateTokensDetailed", () => {
  it("returns all fields", () => {
    const result = estimateTokensDetailed("hello world test");
    expect(result.tokenCount).toBeGreaterThan(0);
    expect(result.charCount).toBe(16);
    expect(result.wordCount).toBe(3);
    expect(typeof result.tokensPerWord).toBe("number");
  });

  it("handles empty text", () => {
    const result = estimateTokensDetailed("");
    expect(result.charCount).toBe(0);
    expect(result.wordCount).toBe(0);
    expect(result.tokenCount).toBe(0);
  });
});

describe("checkContextWindow", () => {
  it("reports fits for short text", () => {
    const result = checkContextWindow("hello", 1000);
    expect(result.fits).toBe(true);
    expect(result.remainingTokens).toBeGreaterThan(0);
  });

  it("reports does not fit for long text", () => {
    const longText = "a".repeat(10000);
    const result = checkContextWindow(longText, 10);
    expect(result.fits).toBe(false);
    expect(result.remainingTokens).toBe(0);
  });

  it("respects reserve tokens", () => {
    const result = checkContextWindow("hello", 100, 95);
    expect(result.maxTokens).toBe(5);
  });
});

describe("detectCodeContent", () => {
  it("detects code-like text", () => {
    const code = `
      import { x } from "y";
      const z = () => { return 1; };
    `;
    expect(detectCodeContent(code)).toBe(true);
  });

  it("does not detect plain English", () => {
    expect(detectCodeContent("The quick brown fox jumped over the lazy dog.")).toBe(false);
  });
});
