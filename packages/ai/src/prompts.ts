import type { AiRequestOptions } from "./client.js";

/**
 * Pre-built prompt templates for AI features.
 */
export const PROMPTS = {
  codeExplain: (code: string): AiRequestOptions => ({
    prompt: `Explain the following code in detail. What does it do, how does it work, and what are the key concepts?\n\n\`\`\`\n${code}\n\`\`\``,
    systemPrompt:
      "You are a helpful code explanation assistant. Provide clear, concise explanations suitable for developers.",
    temperature: 0.3,
  }),

  bugDetect: (code: string): AiRequestOptions => ({
    prompt: `Analyze the following code for potential bugs, security vulnerabilities, and issues. List each finding with severity and suggested fix.\n\n\`\`\`\n${code}\n\`\`\``,
    systemPrompt:
      "You are an expert code reviewer focused on finding bugs and security issues. Be thorough but precise.",
    temperature: 0.2,
  }),

  commitMessage: (diff: string): AiRequestOptions => ({
    prompt: `Generate a concise, conventional commit message for the following diff. Use the format: type(scope): description\n\n${diff}`,
    systemPrompt:
      "You are a commit message generator. Follow the Conventional Commits specification. Be concise.",
    temperature: 0.3,
    maxTokens: 200,
  }),

  refactorSuggest: (code: string): AiRequestOptions => ({
    prompt: `Suggest refactoring improvements for the following code. Focus on readability, performance, and best practices. Provide the refactored version.\n\n\`\`\`\n${code}\n\`\`\``,
    systemPrompt:
      "You are a senior software engineer providing refactoring suggestions. Show improved code with explanations.",
    temperature: 0.4,
  }),

  chatWithContext: (message: string, repoContext?: string): AiRequestOptions => ({
    prompt: message,
    systemPrompt:
      "You are an AI coding assistant embedded in a development platform. Help users with coding questions, debugging, and development tasks. Be concise and practical.",
    repoContext,
    temperature: 0.7,
  }),
};
