import { describe, it, expect } from "vitest";
import { slugify } from "../string/slugify.js";
import { truncate, truncateMiddle } from "../string/truncate.js";
import { mask, maskEmail, maskSecret } from "../string/mask.js";

describe("slugify", () => {
  it("converts basic strings to slugs", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("handles special characters", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("transliterates accented characters", () => {
    expect(slugify("Crème Brûlée")).toBe("creme-brulee");
  });

  it("uses custom separator", () => {
    expect(slugify("foo bar", { separator: "_" })).toBe("foo_bar");
  });

  it("respects lowercase option", () => {
    expect(slugify("Hello World", { lowercase: false })).toBe("Hello-World");
  });

  it("respects maxLength option", () => {
    const result = slugify("this is a very long title", { maxLength: 10 });
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("removes leading/trailing separators", () => {
    expect(slugify("  hello  ")).toBe("hello");
  });
});

describe("truncate", () => {
  it("returns short strings unchanged", () => {
    expect(truncate("hello", { maxLength: 100 })).toBe("hello");
  });

  it("truncates long strings with suffix", () => {
    const result = truncate("This is a long sentence that should be truncated", {
      maxLength: 20,
    });
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result).toContain("…");
  });

  it("respects word boundary", () => {
    const result = truncate("Hello beautiful world today", {
      maxLength: 20,
      wordBoundary: true,
    });
    expect(result).toContain("…");
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it("works without word boundary", () => {
    const result = truncate("Helloworld", {
      maxLength: 6,
      wordBoundary: false,
    });
    expect(result).toContain("…");
  });

  it("uses custom suffix", () => {
    const result = truncate("Hello World this is long text", {
      maxLength: 15,
      suffix: "...",
    });
    expect(result).toContain("...");
  });
});

describe("truncateMiddle", () => {
  it("returns short strings unchanged", () => {
    expect(truncateMiddle("hello", 10)).toBe("hello");
  });

  it("truncates from the middle", () => {
    const result = truncateMiddle("abcdefghij", 7);
    expect(result.length).toBe(7);
    expect(result).toContain("…");
  });
});

describe("mask", () => {
  it("masks entire string by default", () => {
    expect(mask("secret")).toBe("******");
  });

  it("keeps start and end characters", () => {
    expect(mask("4111111111111111", { keepStart: 4, keepEnd: 4 })).toBe(
      "4111********1111"
    );
  });

  it("handles empty string", () => {
    expect(mask("")).toBe("");
  });

  it("returns original when keepStart + keepEnd >= length", () => {
    expect(mask("hi", { keepStart: 1, keepEnd: 1 })).toBe("hi");
  });

  it("uses custom mask character", () => {
    expect(mask("secret", { maskChar: "#" })).toBe("######");
  });
});

describe("maskEmail", () => {
  it("masks email local part", () => {
    const result = maskEmail("john.doe@example.com");
    expect(result).toBe("j*******@example.com");
  });

  it("handles single char local part", () => {
    expect(maskEmail("j@example.com")).toBe("j@example.com");
  });
});

describe("maskSecret", () => {
  it("shows first 4 chars by default", () => {
    expect(maskSecret("sk-1234567890")).toBe("sk-1*********");
  });

  it("masks entirely when shorter than visible chars", () => {
    expect(maskSecret("abc", 4)).toBe("***");
  });
});
