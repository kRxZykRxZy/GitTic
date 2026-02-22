/**
 * Advanced commit message generation module.
 *
 * Parses diff hunks to generate conventional commit messages
 * with appropriate scope, type, and multi-line body content.
 *
 * @module generation/commit-message
 */

/**
 * Conventional commit types.
 */
export type CommitType =
  | "feat"
  | "fix"
  | "docs"
  | "style"
  | "refactor"
  | "perf"
  | "test"
  | "build"
  | "ci"
  | "chore"
  | "revert";

/**
 * A parsed diff hunk for analysis.
 */
export interface DiffHunk {
  /** File path being changed. */
  readonly filePath: string;
  /** Lines added in this hunk. */
  readonly additions: readonly string[];
  /** Lines removed in this hunk. */
  readonly deletions: readonly string[];
  /** Number of lines added. */
  readonly addedCount: number;
  /** Number of lines removed. */
  readonly removedCount: number;
}

/**
 * Parsed diff summary for commit message generation.
 */
export interface DiffSummary {
  /** All hunks in the diff. */
  readonly hunks: readonly DiffHunk[];
  /** Total lines added. */
  readonly totalAdded: number;
  /** Total lines removed. */
  readonly totalRemoved: number;
  /** Files modified. */
  readonly filesModified: readonly string[];
  /** Detected primary change type. */
  readonly detectedType: CommitType;
  /** Detected scope from file paths. */
  readonly detectedScope: string | undefined;
  /** Whether this appears to be a breaking change. */
  readonly isBreaking: boolean;
}

/**
 * A generated commit message.
 */
export interface GeneratedCommitMessage {
  /** The subject line (first line). */
  readonly subject: string;
  /** The optional body paragraphs. */
  readonly body: readonly string[];
  /** Optional footer (breaking changes, references). */
  readonly footer: string | undefined;
  /** The full formatted message. */
  readonly fullMessage: string;
  /** Commit type used. */
  readonly type: CommitType;
  /** Scope used, if any. */
  readonly scope: string | undefined;
  /** Confidence level (0-1). */
  readonly confidence: number;
}

/**
 * Configuration for commit message generation.
 */
export interface CommitMessageConfig {
  /** Maximum subject line length. */
  readonly maxSubjectLength: number;
  /** Maximum body line length. */
  readonly maxBodyLineLength: number;
  /** Whether to include file list in body. */
  readonly includeFileList: boolean;
  /** Whether to include stats in body. */
  readonly includeStats: boolean;
  /** Default commit type if detection fails. */
  readonly defaultType: CommitType;
}

/**
 * Default commit message generation configuration.
 */
export const DEFAULT_COMMIT_CONFIG: CommitMessageConfig = {
  maxSubjectLength: 72,
  maxBodyLineLength: 80,
  includeFileList: true,
  includeStats: true,
  defaultType: "chore",
} as const;

/**
 * Mapping of file path patterns to commit types.
 */
const TYPE_PATTERNS: ReadonlyArray<{ pattern: RegExp; type: CommitType }> = [
  { pattern: /\.test\.|\.spec\.|__tests__/, type: "test" },
  { pattern: /\.md$|docs\/|README/, type: "docs" },
  { pattern: /\.css$|\.scss$|\.less$|\.styled/, type: "style" },
  { pattern: /\.github\/workflows|Dockerfile|\.yml$|Makefile/, type: "ci" },
  { pattern: /package\.json|tsconfig|webpack|vite\.config/, type: "build" },
  { pattern: /perf|benchmark|optimize/, type: "perf" },
] as const;

/**
 * Parses a raw unified diff string into structured hunks.
 *
 * @param rawDiff - Raw unified diff content.
 * @returns Array of parsed diff hunks.
 */
export function parseDiffHunks(rawDiff: string): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  const lines = rawDiff.split("\n");
  let currentFile = "";
  let additions: string[] = [];
  let deletions: string[] = [];

  for (const line of lines) {
    const fileMatch = /^diff --git a\/(.+?) b\//.exec(line);
    if (fileMatch) {
      if (currentFile && (additions.length > 0 || deletions.length > 0)) {
        hunks.push({
          filePath: currentFile,
          additions: [...additions],
          deletions: [...deletions],
          addedCount: additions.length,
          removedCount: deletions.length,
        });
      }
      currentFile = fileMatch[1]!;
      additions = [];
      deletions = [];
      continue;
    }

    if (line.startsWith("+") && !line.startsWith("+++")) {
      additions.push(line.slice(1));
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      deletions.push(line.slice(1));
    }
  }

  if (currentFile && (additions.length > 0 || deletions.length > 0)) {
    hunks.push({
      filePath: currentFile,
      additions: [...additions],
      deletions: [...deletions],
      addedCount: additions.length,
      removedCount: deletions.length,
    });
  }

  return hunks;
}

/**
 * Detects the commit type from changed file paths and content.
 *
 * @param hunks - Parsed diff hunks.
 * @returns Detected commit type.
 */
export function detectCommitType(hunks: readonly DiffHunk[]): CommitType {
  const filePaths = hunks.map((h) => h.filePath);

  for (const { pattern, type } of TYPE_PATTERNS) {
    if (filePaths.some((fp) => pattern.test(fp))) {
      return type;
    }
  }

  const totalAdded = hunks.reduce((s, h) => s + h.addedCount, 0);
  const totalRemoved = hunks.reduce((s, h) => s + h.removedCount, 0);

  if (totalAdded > 0 && totalRemoved === 0) {
    return "feat";
  }

  const hasFixKeywords = hunks.some((h) =>
    h.additions.some((a) =>
      /fix|bug|patch|resolve|correct/i.test(a)
    )
  );
  if (hasFixKeywords) {
    return "fix";
  }

  if (totalRemoved > totalAdded * 2) {
    return "refactor";
  }

  return "feat";
}

/**
 * Detects the scope from changed file paths.
 *
 * @param hunks - Parsed diff hunks.
 * @returns Detected scope string or undefined.
 */
export function detectScope(hunks: readonly DiffHunk[]): string | undefined {
  const filePaths = hunks.map((h) => h.filePath);

  if (filePaths.length === 1) {
    const parts = filePaths[0]!.split("/");
    if (parts.length >= 2) {
      return parts[parts.length - 2]!;
    }
    return parts[0]!.replace(/\.\w+$/, "");
  }

  const directories = filePaths.map((fp) => {
    const parts = fp.split("/");
    return parts.length >= 2 ? parts.slice(0, -1).join("/") : "";
  });

  const commonDir = findCommonPrefix(directories);
  if (commonDir) {
    const parts = commonDir.split("/").filter(Boolean);
    return parts[parts.length - 1];
  }

  return undefined;
}

/**
 * Finds the longest common prefix among strings.
 *
 * @param strings - Array of strings to compare.
 * @returns The common prefix, or empty string if none.
 */
function findCommonPrefix(strings: readonly string[]): string {
  if (strings.length === 0) return "";
  if (strings.length === 1) return strings[0]!;

  let prefix = strings[0]!;
  for (let i = 1; i < strings.length; i++) {
    while (!strings[i]!.startsWith(prefix) && prefix.length > 0) {
      prefix = prefix.slice(0, -1);
    }
  }
  return prefix;
}

/**
 * Detects whether the change includes breaking modifications.
 *
 * @param hunks - Parsed diff hunks.
 * @returns True if breaking changes are detected.
 */
export function detectBreakingChange(hunks: readonly DiffHunk[]): boolean {
  return hunks.some((h) => {
    const hasRemovedExports = h.deletions.some((d) => /^export\s/.test(d.trim()));
    const hasRenamedExports = hasRemovedExports &&
      h.additions.some((a) => /^export\s/.test(a.trim()));
    return hasRemovedExports && !hasRenamedExports;
  });
}

/**
 * Summarizes a diff for commit message generation.
 *
 * @param rawDiff - Raw unified diff text.
 * @returns Parsed diff summary.
 */
export function summarizeDiff(rawDiff: string): DiffSummary {
  const hunks = parseDiffHunks(rawDiff);
  const totalAdded = hunks.reduce((s, h) => s + h.addedCount, 0);
  const totalRemoved = hunks.reduce((s, h) => s + h.removedCount, 0);

  return {
    hunks,
    totalAdded,
    totalRemoved,
    filesModified: hunks.map((h) => h.filePath),
    detectedType: detectCommitType(hunks),
    detectedScope: detectScope(hunks),
    isBreaking: detectBreakingChange(hunks),
  };
}

/**
 * Generates a conventional commit message from a diff summary.
 *
 * @param summary - Parsed diff summary.
 * @param config - Optional generation configuration.
 * @returns Generated commit message with all parts.
 */
export function generateCommitMessage(
  summary: DiffSummary,
  config: CommitMessageConfig = DEFAULT_COMMIT_CONFIG
): GeneratedCommitMessage {
  const type = summary.detectedType;
  const scope = summary.detectedScope;
  const breaking = summary.isBreaking ? "!" : "";

  const scopePart = scope ? `(${scope})` : "";
  const description = generateDescription(summary);
  const subject = `${type}${scopePart}${breaking}: ${description}`.slice(
    0,
    config.maxSubjectLength
  );

  const body: string[] = [];

  if (config.includeStats) {
    body.push(
      `Changes: +${summary.totalAdded} -${summary.totalRemoved} in ${summary.filesModified.length} file(s)`
    );
  }

  if (config.includeFileList && summary.filesModified.length <= 10) {
    body.push("");
    body.push("Modified files:");
    for (const file of summary.filesModified) {
      body.push(`- ${file}`);
    }
  }

  let footer: string | undefined;
  if (summary.isBreaking) {
    footer = "BREAKING CHANGE: This change modifies the public API surface.";
  }

  const parts = [subject];
  if (body.length > 0) {
    parts.push("", ...body);
  }
  if (footer) {
    parts.push("", footer);
  }

  return {
    subject,
    body,
    footer,
    fullMessage: parts.join("\n"),
    type,
    scope,
    confidence: calculateConfidence(summary),
  };
}

/**
 * Generates a concise description from a diff summary.
 *
 * @param summary - The diff summary.
 * @returns A short description string.
 */
function generateDescription(summary: DiffSummary): string {
  const fileCount = summary.filesModified.length;

  if (fileCount === 1) {
    const fileName = summary.filesModified[0]!.split("/").pop() ?? "file";
    if (summary.totalAdded > 0 && summary.totalRemoved === 0) {
      return `add ${fileName}`;
    }
    if (summary.totalRemoved > 0 && summary.totalAdded === 0) {
      return `remove ${fileName}`;
    }
    return `update ${fileName}`;
  }

  const scope = summary.detectedScope;
  if (scope) {
    return `update ${scope} (${fileCount} files)`;
  }

  return `update ${fileCount} files`;
}

/**
 * Calculates confidence level for the generated commit message.
 *
 * @param summary - The diff summary.
 * @returns Confidence score between 0 and 1.
 */
function calculateConfidence(summary: DiffSummary): number {
  let confidence = 0.5;

  if (summary.filesModified.length === 1) {
    confidence += 0.2;
  }
  if (summary.detectedScope) {
    confidence += 0.1;
  }
  if (summary.totalAdded + summary.totalRemoved < 100) {
    confidence += 0.1;
  }

  return Math.min(1, confidence);
}

/**
 * Builds an AI prompt for generating a commit message.
 *
 * @param rawDiff - Raw diff content.
 * @param summary - Pre-computed diff summary.
 * @returns Prompt string for the AI model.
 */
export function buildCommitMessagePrompt(
  rawDiff: string,
  summary: DiffSummary
): string {
  const truncatedDiff =
    rawDiff.length > 4000 ? rawDiff.slice(0, 4000) + "\n... (truncated)" : rawDiff;

  return [
    "Generate a conventional commit message for the following changes.",
    "",
    `Detected type: ${summary.detectedType}`,
    `Detected scope: ${summary.detectedScope ?? "none"}`,
    `Files: ${summary.filesModified.length}, +${summary.totalAdded} / -${summary.totalRemoved}`,
    summary.isBreaking ? "This includes BREAKING CHANGES." : "",
    "",
    "Follow the format: type(scope): description",
    "",
    "```diff",
    truncatedDiff,
    "```",
  ].join("\n");
}
