/**
 * PR summary generation module.
 *
 * Generates comprehensive pull request summaries from diffs,
 * including affected areas, breaking changes, and test coverage notes.
 *
 * @module generation/pr-summary
 */

/**
 * A change in a specific area of the codebase.
 */
export interface AffectedArea {
  /** Area name (usually a directory or module). */
  readonly name: string;
  /** Number of files changed in this area. */
  readonly fileCount: number;
  /** Total lines added. */
  readonly linesAdded: number;
  /** Total lines removed. */
  readonly linesRemoved: number;
  /** Description of changes in this area. */
  readonly changeDescription: string;
}

/**
 * A breaking change identified in the PR.
 */
export interface BreakingChange {
  /** Description of what changed. */
  readonly description: string;
  /** File where the breaking change occurs. */
  readonly filePath: string;
  /** Migration guidance for consumers. */
  readonly migrationNote: string;
}

/**
 * Test coverage observation for the PR.
 */
export interface TestCoverageNote {
  /** Description of coverage status. */
  readonly description: string;
  /** Whether new tests were added. */
  readonly hasNewTests: boolean;
  /** Whether existing tests were modified. */
  readonly hasModifiedTests: boolean;
  /** Areas lacking test coverage. */
  readonly uncoveredAreas: readonly string[];
}

/**
 * File change summary for the PR.
 */
export interface FileChange {
  /** File path. */
  readonly filePath: string;
  /** Type of change. */
  readonly changeType: "added" | "modified" | "deleted" | "renamed";
  /** Number of additions. */
  readonly additions: number;
  /** Number of deletions. */
  readonly deletions: number;
  /** Detected file category. */
  readonly category: string;
}

/**
 * Complete PR summary output.
 */
export interface PrSummary {
  /** Short title/headline for the PR. */
  readonly title: string;
  /** Overall description of what the PR does. */
  readonly description: string;
  /** Areas of the codebase affected. */
  readonly affectedAreas: readonly AffectedArea[];
  /** Breaking changes, if any. */
  readonly breakingChanges: readonly BreakingChange[];
  /** Test coverage observations. */
  readonly testCoverage: TestCoverageNote;
  /** Individual file changes. */
  readonly fileChanges: readonly FileChange[];
  /** Stats summary line. */
  readonly stats: string;
  /** The complete formatted summary. */
  readonly formattedSummary: string;
  /** AI prompt for enhanced summary generation. */
  readonly aiPrompt: string;
}

/**
 * Categorizes a file by its path and extension.
 *
 * @param filePath - The file path to categorize.
 * @returns A human-readable category string.
 */
export function categorizeFile(filePath: string): string {
  const lower = filePath.toLowerCase();

  if (/\.test\.|\.spec\.|__tests__/.test(lower)) return "test";
  if (/\.md$/.test(lower)) return "documentation";
  if (/\.css$|\.scss$|\.less$/.test(lower)) return "styles";
  if (/\.json$/.test(lower)) return "configuration";
  if (/\.ya?ml$/.test(lower)) return "configuration";
  if (/\.github\/|\.gitlab/.test(lower)) return "ci/cd";
  if (/dockerfile|docker-compose/i.test(lower)) return "infrastructure";
  if (/migration|schema/.test(lower)) return "database";
  if (/\.tsx?$|\.jsx?$/.test(lower)) return "source";
  return "other";
}

/**
 * Detects the change type from diff information.
 *
 * @param additions - Number of additions.
 * @param deletions - Number of deletions.
 * @param isNew - Whether the file is newly created.
 * @returns The change type classification.
 */
export function detectChangeType(
  additions: number,
  deletions: number,
  isNew: boolean
): "added" | "modified" | "deleted" | "renamed" {
  if (isNew) return "added";
  if (additions === 0 && deletions > 0) return "deleted";
  return "modified";
}

/**
 * Groups file changes into affected areas.
 *
 * @param fileChanges - Individual file changes.
 * @returns Array of affected area summaries.
 */
export function groupIntoAreas(
  fileChanges: readonly FileChange[]
): AffectedArea[] {
  const areaMap = new Map<string, {
    files: number;
    added: number;
    removed: number;
    categories: Set<string>;
  }>();

  for (const file of fileChanges) {
    const parts = file.filePath.split("/");
    const areaName = parts.length >= 2
      ? parts.slice(0, 2).join("/")
      : parts[0] ?? "root";

    const existing = areaMap.get(areaName) ?? {
      files: 0,
      added: 0,
      removed: 0,
      categories: new Set<string>(),
    };

    existing.files++;
    existing.added += file.additions;
    existing.removed += file.deletions;
    existing.categories.add(file.category);
    areaMap.set(areaName, existing);
  }

  const areas: AffectedArea[] = [];
  for (const [name, data] of areaMap) {
    const categoryList = [...data.categories].join(", ");
    areas.push({
      name,
      fileCount: data.files,
      linesAdded: data.added,
      linesRemoved: data.removed,
      changeDescription: `${data.files} file(s) changed (${categoryList}): +${data.added} / -${data.removed}`,
    });
  }

  areas.sort((a, b) => b.fileCount - a.fileCount);
  return areas;
}

/**
 * Detects breaking changes from diff content and file paths.
 *
 * @param fileChanges - File changes to analyze.
 * @param diffContent - Raw diff content.
 * @returns Array of detected breaking changes.
 */
export function detectBreakingChanges(
  fileChanges: readonly FileChange[],
  diffContent: string
): BreakingChange[] {
  const changes: BreakingChange[] = [];

  const removedExports = diffContent.match(/^-export\s.+$/gm);
  if (removedExports) {
    for (const line of removedExports) {
      const nameMatch = /export\s+(?:const|function|class|type|interface)\s+(\w+)/.exec(line);
      if (nameMatch) {
        changes.push({
          description: `Removed export: ${nameMatch[1]}`,
          filePath: "unknown",
          migrationNote: `Update consumers that depend on '${nameMatch[1]}'`,
        });
      }
    }
  }

  for (const file of fileChanges) {
    if (file.changeType === "deleted" && file.category === "source") {
      changes.push({
        description: `Deleted source file: ${file.filePath}`,
        filePath: file.filePath,
        migrationNote: `Ensure no other modules import from '${file.filePath}'`,
      });
    }
  }

  return changes;
}

/**
 * Assesses test coverage for the PR.
 *
 * @param fileChanges - File changes in the PR.
 * @returns Test coverage notes.
 */
export function assessTestCoverage(
  fileChanges: readonly FileChange[]
): TestCoverageNote {
  const testFiles = fileChanges.filter((f) => f.category === "test");
  const sourceFiles = fileChanges.filter((f) => f.category === "source");
  const hasNewTests = testFiles.some((f) => f.changeType === "added");
  const hasModifiedTests = testFiles.some((f) => f.changeType === "modified");

  const testedDirs = new Set(
    testFiles.map((f) => {
      const parts = f.filePath.split("/");
      return parts.slice(0, -1).join("/");
    })
  );

  const uncoveredAreas: string[] = [];
  for (const src of sourceFiles) {
    const srcDir = src.filePath.split("/").slice(0, -1).join("/");
    if (!testedDirs.has(srcDir)) {
      uncoveredAreas.push(srcDir);
    }
  }

  const uniqueUncovered = [...new Set(uncoveredAreas)];

  let description: string;
  if (testFiles.length === 0 && sourceFiles.length > 0) {
    description = "No test changes included. Consider adding tests for the modified source files.";
  } else if (testFiles.length > 0) {
    description = `${testFiles.length} test file(s) ${hasNewTests ? "added" : "modified"}.`;
  } else {
    description = "No source or test files changed.";
  }

  return {
    description,
    hasNewTests,
    hasModifiedTests,
    uncoveredAreas: uniqueUncovered,
  };
}

/**
 * Generates a complete PR summary from file changes and diff content.
 *
 * @param fileChanges - Array of file change descriptors.
 * @param diffContent - Raw diff content of the PR.
 * @param prTitle - Optional PR title override.
 * @returns Complete PR summary.
 */
export function generatePrSummary(
  fileChanges: readonly FileChange[],
  diffContent: string,
  prTitle?: string
): PrSummary {
  const affectedAreas = groupIntoAreas(fileChanges);
  const breakingChanges = detectBreakingChanges(fileChanges, diffContent);
  const testCoverage = assessTestCoverage(fileChanges);

  const totalAdded = fileChanges.reduce((s, f) => s + f.additions, 0);
  const totalRemoved = fileChanges.reduce((s, f) => s + f.deletions, 0);
  const stats = `${fileChanges.length} file(s) changed, +${totalAdded} / -${totalRemoved}`;

  const title = prTitle ?? generateTitle(fileChanges, affectedAreas);
  const description = generateDescription(affectedAreas, breakingChanges, testCoverage);

  const formattedSummary = formatSummary(
    title, description, affectedAreas, breakingChanges, testCoverage, stats
  );

  const aiPrompt = buildAiPrompt(diffContent, stats);

  return {
    title,
    description,
    affectedAreas,
    breakingChanges,
    testCoverage,
    fileChanges,
    stats,
    formattedSummary,
    aiPrompt,
  };
}

/**
 * Generates a PR title from changes.
 */
function generateTitle(
  files: readonly FileChange[],
  areas: readonly AffectedArea[]
): string {
  if (areas.length === 1) {
    return `Update ${areas[0]!.name} (${files.length} files)`;
  }
  return `Update ${areas.length} areas (${files.length} files)`;
}

/**
 * Generates the PR description text.
 */
function generateDescription(
  areas: readonly AffectedArea[],
  breaking: readonly BreakingChange[],
  tests: TestCoverageNote
): string {
  const parts: string[] = [];
  parts.push(`Changes across ${areas.length} area(s) of the codebase.`);

  if (breaking.length > 0) {
    parts.push(`⚠️ Contains ${breaking.length} breaking change(s).`);
  }

  parts.push(tests.description);
  return parts.join(" ");
}

/**
 * Formats the complete summary as markdown.
 */
function formatSummary(
  title: string,
  description: string,
  areas: readonly AffectedArea[],
  breaking: readonly BreakingChange[],
  tests: TestCoverageNote,
  stats: string
): string {
  const lines: string[] = [
    `## ${title}`,
    "",
    description,
    "",
    `**Stats:** ${stats}`,
    "",
    "### Affected Areas",
  ];

  for (const area of areas) {
    lines.push(`- **${area.name}**: ${area.changeDescription}`);
  }

  if (breaking.length > 0) {
    lines.push("", "### ⚠️ Breaking Changes");
    for (const bc of breaking) {
      lines.push(`- ${bc.description}`);
      lines.push(`  - Migration: ${bc.migrationNote}`);
    }
  }

  lines.push("", "### Test Coverage", tests.description);

  if (tests.uncoveredAreas.length > 0) {
    lines.push("Uncovered areas:");
    for (const area of tests.uncoveredAreas) {
      lines.push(`- ${area}`);
    }
  }

  return lines.join("\n");
}

/**
 * Builds an AI prompt for enhanced PR summary generation.
 */
function buildAiPrompt(diffContent: string, stats: string): string {
  const truncated = diffContent.length > 5000
    ? diffContent.slice(0, 5000) + "\n... (truncated)"
    : diffContent;

  return [
    "Generate a detailed PR summary for the following changes.",
    "",
    `Stats: ${stats}`,
    "",
    "Include: what changed, why it matters, potential risks, and review focus areas.",
    "",
    "```diff",
    truncated,
    "```",
  ].join("\n");
}
