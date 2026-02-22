/**
 * AI code review module.
 *
 * Analyzes code diffs for issues and generates review comments
 * with severity levels. Provides prompt building for AI-powered
 * code review assistance.
 *
 * @module analysis/code-review
 */

/**
 * Severity of a review finding.
 */
export type ReviewSeverity = "critical" | "major" | "minor" | "suggestion" | "nitpick";

/**
 * Category of a review finding.
 */
export type ReviewCategory =
  | "bug"
  | "security"
  | "performance"
  | "style"
  | "maintainability"
  | "error-handling"
  | "naming"
  | "documentation"
  | "testing"
  | "logic";

/**
 * A single review comment on a code change.
 */
export interface ReviewComment {
  /** File path the comment applies to. */
  readonly filePath: string;
  /** Line number in the new file. */
  readonly line: number;
  /** Severity of the finding. */
  readonly severity: ReviewSeverity;
  /** Category of the finding. */
  readonly category: ReviewCategory;
  /** Description of the issue found. */
  readonly message: string;
  /** Suggested fix or improvement. */
  readonly suggestion?: string;
  /** Snippet of code being commented on. */
  readonly codeSnippet?: string;
}

/**
 * A parsed diff hunk from a code change.
 */
export interface DiffHunk {
  /** File path being modified. */
  readonly filePath: string;
  /** Starting line in the old file. */
  readonly oldStart: number;
  /** Number of lines from the old file. */
  readonly oldCount: number;
  /** Starting line in the new file. */
  readonly newStart: number;
  /** Number of lines in the new file. */
  readonly newCount: number;
  /** The raw diff content for this hunk. */
  readonly content: string;
  /** Lines added in this hunk. */
  readonly addedLines: readonly string[];
  /** Lines removed in this hunk. */
  readonly removedLines: readonly string[];
}

/**
 * Options for code review analysis.
 */
export interface ReviewOptions {
  /** Focus on specific categories only. */
  readonly focusCategories?: readonly ReviewCategory[];
  /** Minimum severity to report. */
  readonly minSeverity: ReviewSeverity;
  /** Maximum number of comments to generate. */
  readonly maxComments: number;
  /** File patterns to include in the review. */
  readonly includePatterns: readonly string[];
  /** File patterns to exclude from the review. */
  readonly excludePatterns: readonly string[];
  /** Whether to include style/nitpick comments. */
  readonly includeNitpicks: boolean;
}

/**
 * Complete code review result.
 */
export interface ReviewResult {
  /** All review comments found. */
  readonly comments: readonly ReviewComment[];
  /** Summary of the review findings. */
  readonly summary: string;
  /** Count of findings by severity. */
  readonly severityCounts: Record<ReviewSeverity, number>;
  /** Count of findings by category. */
  readonly categoryCounts: Partial<Record<ReviewCategory, number>>;
  /** Overall risk assessment. */
  readonly riskLevel: "low" | "medium" | "high" | "critical";
  /** AI prompt for detailed review. */
  readonly reviewPrompt: string;
}

/**
 * Severity priority for filtering and sorting.
 */
const SEVERITY_PRIORITY: Record<ReviewSeverity, number> = {
  critical: 0,
  major: 1,
  minor: 2,
  suggestion: 3,
  nitpick: 4,
};

/**
 * Default review options.
 */
export const DEFAULT_REVIEW_OPTIONS: ReviewOptions = {
  minSeverity: "suggestion",
  maxComments: 50,
  includePatterns: ["*.ts", "*.js", "*.tsx", "*.jsx"],
  excludePatterns: ["*.test.*", "*.spec.*", "*.d.ts", "node_modules"],
  includeNitpicks: false,
} as const;

/**
 * Parses a unified diff string into structured hunks.
 *
 * @param diffContent - Raw unified diff text.
 * @returns Array of parsed diff hunks.
 */
export function parseDiff(diffContent: string): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  const fileRegex = /^(?:diff --git a\/(.+?) b\/|--- a\/(.+)|(\+\+\+ b\/(.+)))/gm;
  const hunkRegex = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@(.*)$/gm;

  let currentFile = "";
  const lines = diffContent.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    const fileMatch = /^diff --git a\/(.+?) b\//.exec(line);
    if (fileMatch) {
      currentFile = fileMatch[1]!;
      i++;
      continue;
    }

    const hunkMatch = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/.exec(line);
    if (hunkMatch && currentFile) {
      const oldStart = parseInt(hunkMatch[1]!, 10);
      const oldCount = parseInt(hunkMatch[2] || "1", 10);
      const newStart = parseInt(hunkMatch[3]!, 10);
      const newCount = parseInt(hunkMatch[4] || "1", 10);

      const addedLines: string[] = [];
      const removedLines: string[] = [];
      const hunkLines: string[] = [line];
      i++;

      while (i < lines.length && !/^(diff --git|@@)/.test(lines[i]!)) {
        const hunkLine = lines[i]!;
        hunkLines.push(hunkLine);
        if (hunkLine.startsWith("+") && !hunkLine.startsWith("+++")) {
          addedLines.push(hunkLine.slice(1));
        } else if (hunkLine.startsWith("-") && !hunkLine.startsWith("---")) {
          removedLines.push(hunkLine.slice(1));
        }
        i++;
      }

      hunks.push({
        filePath: currentFile,
        oldStart,
        oldCount,
        newStart,
        newCount,
        content: hunkLines.join("\n"),
        addedLines,
        removedLines,
      });
      continue;
    }

    i++;
  }

  // Ensure fileRegex and hunkRegex are used (suppress unused warnings)
  void fileRegex;
  void hunkRegex;

  return hunks;
}

/**
 * Checks if a file path matches a set of glob-like patterns.
 *
 * @param filePath - The file path to check.
 * @param patterns - Patterns to match against.
 * @returns True if the path matches any pattern.
 */
export function matchesFilePattern(
  filePath: string,
  patterns: readonly string[]
): boolean {
  return patterns.some((pattern) => {
    if (pattern.startsWith("*")) {
      return filePath.endsWith(pattern.slice(1));
    }
    return filePath.includes(pattern);
  });
}

/**
 * Determines the overall risk level based on review comments.
 *
 * @param comments - Array of review comments.
 * @returns Risk level classification.
 */
export function assessRiskLevel(
  comments: readonly ReviewComment[]
): "low" | "medium" | "high" | "critical" {
  const criticalCount = comments.filter(
    (c) => c.severity === "critical"
  ).length;
  const majorCount = comments.filter((c) => c.severity === "major").length;

  if (criticalCount > 0) return "critical";
  if (majorCount >= 3) return "high";
  if (majorCount >= 1) return "medium";
  return "low";
}

/**
 * Counts findings by severity level.
 *
 * @param comments - Array of review comments.
 * @returns A record of severity to count.
 */
export function countBySeverity(
  comments: readonly ReviewComment[]
): Record<ReviewSeverity, number> {
  const counts: Record<ReviewSeverity, number> = {
    critical: 0,
    major: 0,
    minor: 0,
    suggestion: 0,
    nitpick: 0,
  };

  for (const comment of comments) {
    counts[comment.severity]++;
  }

  return counts;
}

/**
 * Counts findings by category.
 *
 * @param comments - Array of review comments.
 * @returns A partial record of category to count.
 */
export function countByCategory(
  comments: readonly ReviewComment[]
): Partial<Record<ReviewCategory, number>> {
  const counts: Partial<Record<ReviewCategory, number>> = {};

  for (const comment of comments) {
    counts[comment.category] = (counts[comment.category] ?? 0) + 1;
  }

  return counts;
}

/**
 * Filters and sorts review comments based on options.
 *
 * @param comments - All review comments.
 * @param options - Review configuration options.
 * @returns Filtered and sorted comments.
 */
export function filterComments(
  comments: readonly ReviewComment[],
  options: ReviewOptions
): ReviewComment[] {
  let filtered = [...comments];

  const minPriority = SEVERITY_PRIORITY[options.minSeverity];
  filtered = filtered.filter(
    (c) => SEVERITY_PRIORITY[c.severity] <= minPriority
  );

  if (!options.includeNitpicks) {
    filtered = filtered.filter((c) => c.severity !== "nitpick");
  }

  if (options.focusCategories && options.focusCategories.length > 0) {
    const cats = new Set(options.focusCategories);
    filtered = filtered.filter((c) => cats.has(c.category));
  }

  filtered.sort(
    (a, b) => SEVERITY_PRIORITY[a.severity] - SEVERITY_PRIORITY[b.severity]
  );

  return filtered.slice(0, options.maxComments);
}

/**
 * Builds an AI prompt for reviewing a code diff.
 *
 * @param hunks - Parsed diff hunks to review.
 * @param options - Review options for focus areas.
 * @returns A prompt string for the AI model.
 */
export function buildReviewPrompt(
  hunks: readonly DiffHunk[],
  options: ReviewOptions = DEFAULT_REVIEW_OPTIONS
): string {
  const diffText = hunks
    .map((h) => `### ${h.filePath}\n${h.content}`)
    .join("\n\n");

  const focusAreas = options.focusCategories
    ? `Focus on: ${options.focusCategories.join(", ")}`
    : "Review all aspects: bugs, security, performance, style, maintainability";

  return [
    "Review the following code changes and provide detailed feedback.",
    "",
    focusAreas,
    "",
    `Maximum ${options.maxComments} comments. Minimum severity: ${options.minSeverity}.`,
    "",
    "For each finding, provide:",
    "1. File path and line number",
    "2. Severity (critical/major/minor/suggestion)",
    "3. Category (bug/security/performance/style/maintainability/error-handling)",
    "4. Description of the issue",
    "5. Suggested fix",
    "",
    "## Diff",
    diffText,
  ].join("\n");
}

/**
 * Generates a human-readable summary from review comments.
 *
 * @param comments - Review comments to summarize.
 * @returns A summary string.
 */
export function generateReviewSummary(
  comments: readonly ReviewComment[]
): string {
  if (comments.length === 0) {
    return "No issues found in the code changes. Looks good!";
  }

  const counts = countBySeverity(comments);
  const parts: string[] = [];

  if (counts.critical > 0) parts.push(`${counts.critical} critical`);
  if (counts.major > 0) parts.push(`${counts.major} major`);
  if (counts.minor > 0) parts.push(`${counts.minor} minor`);
  if (counts.suggestion > 0) parts.push(`${counts.suggestion} suggestion(s)`);

  return `Found ${comments.length} issue(s): ${parts.join(", ")}.`;
}
