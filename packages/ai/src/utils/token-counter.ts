/**
 * Token counting utility module.
 *
 * Estimates token counts for text content, checks whether text
 * fits within a model's context window, and truncates text
 * to fit within token limits.
 *
 * @module utils/token-counter
 */

/**
 * Token estimation result.
 */
export interface TokenEstimate {
  /** Estimated token count. */
  readonly tokenCount: number;
  /** Character count of the input. */
  readonly charCount: number;
  /** Word count of the input. */
  readonly wordCount: number;
  /** Estimated tokens per word ratio. */
  readonly tokensPerWord: number;
}

/**
 * Context window check result.
 */
export interface ContextWindowCheck {
  /** Whether the text fits within the context window. */
  readonly fits: boolean;
  /** Estimated token count. */
  readonly tokenCount: number;
  /** Maximum allowed tokens. */
  readonly maxTokens: number;
  /** Remaining tokens available. */
  readonly remainingTokens: number;
  /** Percentage of the context window used. */
  readonly usagePercent: number;
}

/**
 * Truncation strategy for reducing text to fit token limits.
 */
export type TruncationStrategy = "end" | "start" | "middle" | "smart";

/**
 * Options for token-aware truncation.
 */
export interface TruncateOptions {
  /** Maximum number of tokens allowed. */
  readonly maxTokens: number;
  /** Truncation strategy to use. */
  readonly strategy: TruncationStrategy;
  /** Suffix to append when truncated (e.g., "..."). */
  readonly truncationIndicator: string;
  /** Whether to preserve complete sentences. */
  readonly preserveSentences: boolean;
}

/**
 * Default truncation options.
 */
export const DEFAULT_TRUNCATE_OPTIONS: TruncateOptions = {
  maxTokens: 4000,
  strategy: "end",
  truncationIndicator: "\n... (truncated)",
  preserveSentences: true,
} as const;

/**
 * Average characters per token for English text.
 * This is an approximation based on GPT tokenizer statistics.
 * Typical English text averages ~4 characters per token.
 */
const CHARS_PER_TOKEN = 4;

/**
 * Average characters per token for code content.
 * Code typically has shorter tokens due to symbols and formatting.
 */
const CHARS_PER_TOKEN_CODE = 3.5;

/**
 * Estimates the token count for a given text string.
 *
 * Uses a character-based approximation that works reasonably
 * well for English text and code. For exact counts, use a
 * proper tokenizer like tiktoken.
 *
 * @param text - The text to estimate tokens for.
 * @returns Estimated number of tokens.
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;

  const isLikelyCode = detectCodeContent(text);
  const charsPerToken = isLikelyCode ? CHARS_PER_TOKEN_CODE : CHARS_PER_TOKEN;

  return Math.ceil(text.length / charsPerToken);
}

/**
 * Provides a detailed token estimation for text.
 *
 * @param text - The text to analyze.
 * @returns Detailed token estimation with word and character counts.
 */
export function estimateTokensDetailed(text: string): TokenEstimate {
  const charCount = text.length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const tokenCount = estimateTokenCount(text);
  const tokensPerWord = wordCount > 0 ? tokenCount / wordCount : 0;

  return {
    tokenCount,
    charCount,
    wordCount,
    tokensPerWord: Math.round(tokensPerWord * 100) / 100,
  };
}

/**
 * Checks whether text fits within a context window.
 *
 * @param text - The text to check.
 * @param maxTokens - Maximum context window size in tokens.
 * @param reserveTokens - Tokens to reserve for the response.
 * @returns Context window check result.
 */
export function checkContextWindow(
  text: string,
  maxTokens: number,
  reserveTokens: number = 0
): ContextWindowCheck {
  const tokenCount = estimateTokenCount(text);
  const effectiveMax = maxTokens - reserveTokens;
  const fits = tokenCount <= effectiveMax;
  const remainingTokens = Math.max(0, effectiveMax - tokenCount);
  const usagePercent =
    effectiveMax > 0
      ? Math.round((tokenCount / effectiveMax) * 10000) / 100
      : 100;

  return {
    fits,
    tokenCount,
    maxTokens: effectiveMax,
    remainingTokens,
    usagePercent,
  };
}

/**
 * Truncates text to fit within a token limit.
 *
 * Simple implementation that truncates from the end.
 * Use truncateToTokenLimitAdvanced for more control.
 *
 * @param text - Text to truncate.
 * @param maxTokens - Maximum tokens allowed.
 * @returns Truncated text.
 */
export function truncateToTokenLimit(
  text: string,
  maxTokens: number
): string {
  const currentTokens = estimateTokenCount(text);
  if (currentTokens <= maxTokens) return text;

  const isCode = detectCodeContent(text);
  const charsPerToken = isCode ? CHARS_PER_TOKEN_CODE : CHARS_PER_TOKEN;
  const indicatorText = "\n... (truncated)";
  const indicatorTokens = estimateTokenCount(indicatorText);
  const targetChars = Math.floor((maxTokens - indicatorTokens) * charsPerToken);

  return text.slice(0, Math.max(0, targetChars)) + indicatorText;
}

/**
 * Truncates text with advanced options including strategy selection.
 *
 * @param text - Text to truncate.
 * @param options - Truncation options.
 * @returns Truncated text.
 */
export function truncateAdvanced(
  text: string,
  options: Partial<TruncateOptions> = {}
): string {
  const opts: TruncateOptions = { ...DEFAULT_TRUNCATE_OPTIONS, ...options };
  const currentTokens = estimateTokenCount(text);

  if (currentTokens <= opts.maxTokens) return text;

  const indicatorTokens = estimateTokenCount(opts.truncationIndicator);
  const targetTokens = opts.maxTokens - indicatorTokens;
  const isCode = detectCodeContent(text);
  const charsPerToken = isCode ? CHARS_PER_TOKEN_CODE : CHARS_PER_TOKEN;
  const targetChars = Math.floor(targetTokens * charsPerToken);

  switch (opts.strategy) {
    case "start":
      return opts.truncationIndicator + text.slice(-targetChars);

    case "middle": {
      const halfChars = Math.floor(targetChars / 2);
      const start = text.slice(0, halfChars);
      const end = text.slice(-halfChars);
      return start + opts.truncationIndicator + end;
    }

    case "smart":
      return smartTruncate(text, targetChars, opts);

    case "end":
    default: {
      let truncated = text.slice(0, targetChars);
      if (opts.preserveSentences) {
        truncated = truncateAtSentenceBoundary(truncated);
      }
      return truncated + opts.truncationIndicator;
    }
  }
}

/**
 * Smart truncation that preserves important sections.
 *
 * Keeps the beginning and end of text, removing middle content.
 * Tries to truncate at paragraph boundaries.
 *
 * @param text - Text to truncate.
 * @param targetChars - Target character count.
 * @param opts - Truncation options.
 * @returns Smart-truncated text.
 */
function smartTruncate(
  text: string,
  targetChars: number,
  opts: TruncateOptions
): string {
  const paragraphs = text.split("\n\n");

  if (paragraphs.length <= 2) {
    return text.slice(0, targetChars) + opts.truncationIndicator;
  }

  let result = paragraphs[0] ?? "";
  const lastParagraph = paragraphs[paragraphs.length - 1] ?? "";

  const availableChars = targetChars - lastParagraph.length - opts.truncationIndicator.length;

  if (availableChars > 0 && result.length > availableChars) {
    result = result.slice(0, availableChars);
  }

  return result + opts.truncationIndicator + "\n\n" + lastParagraph;
}

/**
 * Truncates text at the nearest sentence boundary.
 *
 * @param text - Text to find sentence boundary in.
 * @returns Text truncated at a sentence boundary.
 */
function truncateAtSentenceBoundary(text: string): string {
  const sentenceEnd = /[.!?]\s/g;
  let lastBoundary = -1;
  let match: RegExpExecArray | null;

  while ((match = sentenceEnd.exec(text)) !== null) {
    lastBoundary = match.index + 1;
  }

  if (lastBoundary > text.length * 0.5) {
    return text.slice(0, lastBoundary);
  }

  return text;
}

/**
 * Detects whether text content is likely source code.
 *
 * @param text - Text to analyze.
 * @returns True if the text appears to be code.
 */
export function detectCodeContent(text: string): boolean {
  const codeIndicators = [
    /\bfunction\b/,
    /\bconst\b/,
    /\bimport\b.*\bfrom\b/,
    /\bclass\b.*\{/,
    /\breturn\b/,
    /[{}();]/,
    /=>/,
    /\/\//,
  ];

  let matches = 0;
  for (const indicator of codeIndicators) {
    if (indicator.test(text)) {
      matches++;
    }
  }

  return matches >= 3;
}

/**
 * Estimates the total tokens for an array of messages.
 *
 * Accounts for message formatting overhead (role, delimiters).
 *
 * @param messages - Array of messages with role and content.
 * @returns Total estimated token count.
 */
export function estimateMessageTokens(
  messages: ReadonlyArray<{ role: string; content: string }>
): number {
  let total = 0;
  const overheadPerMessage = 4;

  for (const msg of messages) {
    total += estimateTokenCount(msg.content) + overheadPerMessage;
  }

  total += 3;
  return total;
}
