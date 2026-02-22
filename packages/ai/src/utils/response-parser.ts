/**
 * Response parser utility module.
 *
 * Extracts code blocks, parses structured responses (JSON, markdown),
 * and cleans AI output for downstream consumption.
 *
 * @module utils/response-parser
 */

/**
 * A code block extracted from AI response.
 */
export interface CodeBlock {
  /** The code content (without fences). */
  readonly code: string;
  /** The language identifier from the fence, if specified. */
  readonly language: string;
  /** Starting index in the original text. */
  readonly startIndex: number;
  /** Ending index in the original text. */
  readonly endIndex: number;
}

/**
 * A structured section in a markdown response.
 */
export interface MarkdownSection {
  /** Section heading text. */
  readonly heading: string;
  /** Heading level (1-6). */
  readonly level: number;
  /** Section content (excluding the heading). */
  readonly content: string;
}

/**
 * A parsed list item from markdown.
 */
export interface ListItem {
  /** The item text. */
  readonly text: string;
  /** Nesting level (0 for top-level). */
  readonly level: number;
  /** Whether it's an ordered list item. */
  readonly ordered: boolean;
  /** Item number for ordered lists. */
  readonly number?: number;
}

/**
 * Result of parsing a structured AI response.
 */
export interface ParsedResponse {
  /** Plain text content with code blocks removed. */
  readonly plainText: string;
  /** All code blocks found in the response. */
  readonly codeBlocks: readonly CodeBlock[];
  /** Markdown sections found. */
  readonly sections: readonly MarkdownSection[];
  /** List items found. */
  readonly listItems: readonly ListItem[];
  /** Whether the response contained JSON. */
  readonly containsJson: boolean;
  /** Parsed JSON value if the response was JSON. */
  readonly jsonValue?: unknown;
}

/**
 * Extracts all fenced code blocks from markdown text.
 *
 * Handles both triple-backtick and triple-tilde fences,
 * with optional language identifiers.
 *
 * @param text - The markdown text to extract code blocks from.
 * @returns Array of extracted code blocks.
 */
export function extractCodeBlocks(text: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const pattern = /```(\w*)\n([\s\S]*?)```|~~~(\w*)\n([\s\S]*?)~~~/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const language = (match[1] ?? match[3] ?? "").trim();
    const code = (match[2] ?? match[4] ?? "").trim();

    blocks.push({
      code,
      language,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return blocks;
}

/**
 * Extracts the first code block of a specific language.
 *
 * @param text - Markdown text.
 * @param language - Language to filter by.
 * @returns The first matching code block, or undefined.
 */
export function extractCodeBlockByLanguage(
  text: string,
  language: string
): CodeBlock | undefined {
  const blocks = extractCodeBlocks(text);
  return blocks.find(
    (b) => b.language.toLowerCase() === language.toLowerCase()
  );
}

/**
 * Removes all code blocks from text, returning plain text.
 *
 * @param text - Text containing code blocks.
 * @returns Text with code blocks removed.
 */
export function stripCodeBlocks(text: string): string {
  return text
    .replace(/```\w*\n[\s\S]*?```/g, "")
    .replace(/~~~\w*\n[\s\S]*?~~~/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Parses markdown headings and their content into sections.
 *
 * @param text - Markdown text to parse.
 * @returns Array of markdown sections.
 */
export function parseMarkdownSections(text: string): MarkdownSection[] {
  const sections: MarkdownSection[] = [];
  const lines = text.split("\n");
  let currentHeading = "";
  let currentLevel = 0;
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);

    if (headingMatch) {
      if (currentHeading) {
        sections.push({
          heading: currentHeading,
          level: currentLevel,
          content: currentContent.join("\n").trim(),
        });
      }

      currentLevel = headingMatch[1]!.length;
      currentHeading = headingMatch[2]!;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentHeading) {
    sections.push({
      heading: currentHeading,
      level: currentLevel,
      content: currentContent.join("\n").trim(),
    });
  }

  return sections;
}

/**
 * Extracts list items from markdown text.
 *
 * @param text - Markdown text to parse.
 * @returns Array of list items.
 */
export function extractListItems(text: string): ListItem[] {
  const items: ListItem[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const unorderedMatch = /^(\s*)[*\-+]\s+(.+)$/.exec(line);
    if (unorderedMatch) {
      const indent = unorderedMatch[1]!.length;
      items.push({
        text: unorderedMatch[2]!.trim(),
        level: Math.floor(indent / 2),
        ordered: false,
      });
      continue;
    }

    const orderedMatch = /^(\s*)(\d+)[.)]\s+(.+)$/.exec(line);
    if (orderedMatch) {
      const indent = orderedMatch[1]!.length;
      items.push({
        text: orderedMatch[3]!.trim(),
        level: Math.floor(indent / 2),
        ordered: true,
        number: parseInt(orderedMatch[2]!, 10),
      });
    }
  }

  return items;
}

/**
 * Attempts to parse JSON from an AI response.
 *
 * Handles responses where JSON is embedded in markdown code blocks
 * or mixed with plain text.
 *
 * @param text - AI response text.
 * @returns Parsed JSON value or undefined if not parseable.
 */
export function extractJson(text: string): unknown | undefined {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // Not plain JSON
  }

  const jsonBlock = extractCodeBlockByLanguage(text, "json");
  if (jsonBlock) {
    try {
      return JSON.parse(jsonBlock.code);
    } catch {
      // Invalid JSON in block
    }
  }

  const jsonMatch = /\{[\s\S]*\}|\[[\s\S]*\]/.exec(text);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // Not valid JSON
    }
  }

  return undefined;
}

/**
 * Cleans AI response text by removing common artifacts.
 *
 * Removes leading/trailing whitespace, excessive newlines,
 * AI disclaimers, and other noise from responses.
 *
 * @param text - Raw AI response text.
 * @returns Cleaned text.
 */
export function cleanResponse(text: string): string {
  let cleaned = text.trim();

  cleaned = cleaned.replace(
    /^(Sure[,!]?\s*|Of course[,!]?\s*|Here(?:'s| is)\s*|I'd be happy to\s*|Certainly[,!]?\s*)/i,
    ""
  );

  cleaned = cleaned.replace(
    /\n*(Let me know if you (?:need|have|want)[\s\S]*?$|Is there anything else[\s\S]*?$|I hope this helps[\s\S]*?$|Feel free to[\s\S]*?$)/i,
    ""
  );

  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Parses a complete AI response into structured components.
 *
 * @param text - Raw AI response text.
 * @returns Parsed response with extracted components.
 */
export function parseResponse(text: string): ParsedResponse {
  const cleaned = cleanResponse(text);
  const codeBlocks = extractCodeBlocks(cleaned);
  const plainText = stripCodeBlocks(cleaned);
  const sections = parseMarkdownSections(cleaned);
  const listItems = extractListItems(cleaned);
  const jsonValue = extractJson(cleaned);

  return {
    plainText,
    codeBlocks,
    sections,
    listItems,
    containsJson: jsonValue !== undefined,
    jsonValue,
  };
}

/**
 * Extracts a specific field from a structured AI response.
 *
 * Useful when the AI returns responses in a known format like:
 * "Summary: ...\nDetails: ...\n"
 *
 * @param text - AI response text.
 * @param fieldName - Field name to extract.
 * @returns Field value or undefined.
 */
export function extractField(
  text: string,
  fieldName: string
): string | undefined {
  const pattern = new RegExp(
    `(?:^|\\n)\\**${escapeRegExp(fieldName)}\\**:\\s*(.+?)(?:\\n(?:\\w+:|$)|$)`,
    "is"
  );

  const match = pattern.exec(text);
  return match ? match[1]!.trim() : undefined;
}

/**
 * Splits a long AI response into logical chunks.
 *
 * @param text - Text to split.
 * @param maxChunkSize - Maximum characters per chunk.
 * @returns Array of text chunks.
 */
export function splitIntoChunks(
  text: string,
  maxChunkSize: number = 2000
): string[] {
  if (text.length <= maxChunkSize) return [text];

  const chunks: string[] = [];
  const paragraphs = text.split("\n\n");
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 2 > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
