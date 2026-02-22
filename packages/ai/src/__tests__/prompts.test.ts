import { describe, it, expect } from "vitest";
import { PROMPTS } from "../prompts.js";

describe("PROMPTS", () => {
  describe("codeExplain", () => {
    it("returns correct structure", () => {
      const result = PROMPTS.codeExplain("const x = 1;");
      expect(result.prompt).toBeDefined();
      expect(result.systemPrompt).toBeDefined();
      expect(result.temperature).toBe(0.3);
    });

    it("includes the code in the prompt", () => {
      const code = "function add(a, b) { return a + b; }";
      const result = PROMPTS.codeExplain(code);
      expect(result.prompt).toContain(code);
    });

    it("has appropriate system prompt", () => {
      const result = PROMPTS.codeExplain("test");
      expect(result.systemPrompt).toContain("explanation");
    });
  });

  describe("bugDetect", () => {
    it("returns correct structure", () => {
      const result = PROMPTS.bugDetect("let x = null;");
      expect(result.prompt).toBeDefined();
      expect(result.systemPrompt).toBeDefined();
      expect(result.temperature).toBe(0.2);
    });

    it("includes the code in the prompt", () => {
      const code = "const y = undefined;";
      const result = PROMPTS.bugDetect(code);
      expect(result.prompt).toContain(code);
    });
  });

  describe("commitMessage", () => {
    it("returns correct structure with maxTokens", () => {
      const result = PROMPTS.commitMessage("+ added line\n- removed line");
      expect(result.prompt).toBeDefined();
      expect(result.systemPrompt).toBeDefined();
      expect(result.temperature).toBe(0.3);
      expect(result.maxTokens).toBe(200);
    });

    it("includes diff in prompt", () => {
      const diff = "+const a = 1;";
      const result = PROMPTS.commitMessage(diff);
      expect(result.prompt).toContain(diff);
    });
  });

  describe("refactorSuggest", () => {
    it("returns correct structure", () => {
      const result = PROMPTS.refactorSuggest("var x = 1;");
      expect(result.prompt).toBeDefined();
      expect(result.systemPrompt).toBeDefined();
      expect(result.temperature).toBe(0.4);
    });
  });

  describe("chatWithContext", () => {
    it("returns correct structure", () => {
      const result = PROMPTS.chatWithContext("How do I fix this?");
      expect(result.prompt).toBe("How do I fix this?");
      expect(result.systemPrompt).toBeDefined();
      expect(result.temperature).toBe(0.7);
    });

    it("includes repo context when provided", () => {
      const result = PROMPTS.chatWithContext("help", "context info");
      expect(result.repoContext).toBe("context info");
    });

    it("repo context is undefined when not provided", () => {
      const result = PROMPTS.chatWithContext("help");
      expect(result.repoContext).toBeUndefined();
    });
  });
});
