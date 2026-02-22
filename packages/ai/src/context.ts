/**
 * Context builder module.
 *
 * Builds repository context from file lists, README, package.json,
 * and recent commits. Handles truncation to fit within model
 * context windows.
 *
 * @module context
 */

import { estimateTokenCount, truncateToTokenLimit } from "./utils/token-counter.js";

/**
 * Represents a single file in the repository context.
 */
export interface ContextFile {
  /** Relative file path. */
  readonly path: string;
  /** File content. */
  readonly content: string;
  /** File size in bytes. */
  readonly sizeBytes: number;
  /** Programming language identifier. */
  readonly language?: string;
}

/**
 * A recent commit for context.
 */
export interface ContextCommit {
  /** Commit SHA hash (short form). */
  readonly sha: string;
  /** Commit message. */
  readonly message: string;
  /** Author name. */
  readonly author: string;
  /** ISO date string. */
  readonly date: string;
  /** List of changed file paths. */
  readonly filesChanged: readonly string[];
}

/**
 * Package metadata extracted from package.json.
 */
export interface PackageMetadata {
  /** Package name. */
  readonly name: string;
  /** Package version. */
  readonly version: string;
  /** Package description. */
  readonly description?: string;
  /** Runtime dependency names. */
  readonly dependencies: readonly string[];
  /** Development dependency names. */
  readonly devDependencies: readonly string[];
  /** Available scripts. */
  readonly scripts: Record<string, string>;
}

/**
 * Options for building repository context.
 */
export interface ContextBuildOptions {
  /** Maximum token count for the entire context. */
  readonly maxTokens: number;
  /** Whether to include file contents (not just paths). */
  readonly includeFileContents: boolean;
  /** Maximum number of files to include. */
  readonly maxFiles: number;
  /** Maximum number of recent commits. */
  readonly maxCommits: number;
  /** File path patterns to prioritize (e.g., source files). */
  readonly priorityPatterns: readonly string[];
  /** File path patterns to exclude. */
  readonly excludePatterns: readonly string[];
}

/**
 * The assembled repository context.
 */
export interface RepoContext {
  /** Formatted context string ready for prompt inclusion. */
  readonly contextString: string;
  /** Estimated token count of the context. */
  readonly tokenCount: number;
  /** Number of files included. */
  readonly filesIncluded: number;
  /** Whether the context was truncated to fit. */
  readonly wasTruncated: boolean;
  /** Sections included in the context. */
  readonly sections: readonly string[];
}

/**
 * Default context build options.
 */
export const DEFAULT_CONTEXT_OPTIONS: ContextBuildOptions = {
  maxTokens: 8000,
  includeFileContents: true,
  maxFiles: 20,
  maxCommits: 10,
  priorityPatterns: [
    "src/index",
    "src/main",
    "src/app",
    "README",
    "package.json",
  ],
  excludePatterns: [
    "node_modules",
    ".git",
    "dist",
    "build",
    ".env",
    "*.lock",
  ],
} as const;

/**
 * Checks whether a file path matches any of the given glob-like patterns.
 *
 * @param filePath - The file path to test.
 * @param patterns - Patterns to match against.
 * @returns True if the path matches at least one pattern.
 */
export function matchesPattern(
  filePath: string,
  patterns: readonly string[]
): boolean {
  const normalized = filePath.toLowerCase();
  return patterns.some((pattern) => {
    const lowerPattern = pattern.toLowerCase();
    if (lowerPattern.startsWith("*")) {
      return normalized.endsWith(lowerPattern.slice(1));
    }
    return normalized.includes(lowerPattern);
  });
}

/**
 * Prioritizes and filters files for context inclusion.
 *
 * @param files - All available files.
 * @param options - Context build options.
 * @returns Sorted and filtered file list.
 */
export function prioritizeFiles(
  files: readonly ContextFile[],
  options: ContextBuildOptions
): ContextFile[] {
  const filtered = files.filter(
    (f) => !matchesPattern(f.path, options.excludePatterns)
  );

  const scored = filtered.map((file) => {
    let score = 0;
    if (matchesPattern(file.path, options.priorityPatterns)) {
      score += 100;
    }
    if (file.path.endsWith(".ts") || file.path.endsWith(".js")) {
      score += 10;
    }
    if (file.path.includes("index")) {
      score += 5;
    }
    if (file.sizeBytes < 5000) {
      score += 3;
    }
    return { file, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, options.maxFiles).map((s) => s.file);
}

/**
 * Formats package metadata into a context section.
 *
 * @param pkg - Package metadata to format.
 * @returns Formatted string for context inclusion.
 */
export function formatPackageSection(pkg: PackageMetadata): string {
  const lines: string[] = [
    `## Package: ${pkg.name} (v${pkg.version})`,
  ];

  if (pkg.description) {
    lines.push(`Description: ${pkg.description}`);
  }

  if (pkg.dependencies.length > 0) {
    lines.push(`Dependencies: ${pkg.dependencies.join(", ")}`);
  }

  if (pkg.devDependencies.length > 0) {
    lines.push(`Dev Dependencies: ${pkg.devDependencies.join(", ")}`);
  }

  const scriptNames = Object.keys(pkg.scripts);
  if (scriptNames.length > 0) {
    lines.push(`Scripts: ${scriptNames.join(", ")}`);
  }

  return lines.join("\n");
}

/**
 * Formats recent commits into a context section.
 *
 * @param commits - Recent commits.
 * @param maxCommits - Maximum number of commits to include.
 * @returns Formatted string for context inclusion.
 */
export function formatCommitsSection(
  commits: readonly ContextCommit[],
  maxCommits: number
): string {
  const limited = commits.slice(0, maxCommits);
  const lines: string[] = ["## Recent Commits"];

  for (const commit of limited) {
    const filesStr =
      commit.filesChanged.length > 3
        ? `${commit.filesChanged.slice(0, 3).join(", ")} +${commit.filesChanged.length - 3} more`
        : commit.filesChanged.join(", ");
    lines.push(
      `- ${commit.sha} ${commit.message} (${commit.author}, ${commit.date}) [${filesStr}]`
    );
  }

  return lines.join("\n");
}

/**
 * Formats file contents into a context section.
 *
 * @param files - Files to include.
 * @param includeContents - Whether to include full file content.
 * @returns Formatted string for context inclusion.
 */
export function formatFilesSection(
  files: readonly ContextFile[],
  includeContents: boolean
): string {
  const lines: string[] = ["## Repository Files"];

  for (const file of files) {
    if (includeContents) {
      const langTag = file.language ?? "";
      lines.push(`### ${file.path}`);
      lines.push(`\`\`\`${langTag}`);
      lines.push(file.content);
      lines.push("```");
    } else {
      lines.push(`- ${file.path} (${file.sizeBytes} bytes)`);
    }
  }

  return lines.join("\n");
}

/**
 * Builds a complete repository context string from available data.
 *
 * Assembles sections from README, package metadata, recent commits,
 * and file contents, then truncates to fit the token limit.
 *
 * @param options - Configuration for context building.
 * @param files - Available repository files.
 * @param readme - Optional README content.
 * @param packageMeta - Optional package.json metadata.
 * @param commits - Optional recent commits.
 * @returns The assembled repository context.
 */
export function buildRepoContext(
  options: Partial<ContextBuildOptions>,
  files: readonly ContextFile[],
  readme?: string,
  packageMeta?: PackageMetadata,
  commits?: readonly ContextCommit[]
): RepoContext {
  const opts: ContextBuildOptions = { ...DEFAULT_CONTEXT_OPTIONS, ...options };
  const sections: string[] = [];
  let contextParts: string[] = [];

  if (readme) {
    const readmeSection = `## README\n${readme}`;
    contextParts.push(readmeSection);
    sections.push("readme");
  }

  if (packageMeta) {
    contextParts.push(formatPackageSection(packageMeta));
    sections.push("package");
  }

  if (commits && commits.length > 0) {
    contextParts.push(formatCommitsSection(commits, opts.maxCommits));
    sections.push("commits");
  }

  const prioritized = prioritizeFiles(files, opts);
  if (prioritized.length > 0) {
    contextParts.push(
      formatFilesSection(prioritized, opts.includeFileContents)
    );
    sections.push("files");
  }

  let fullContext = contextParts.join("\n\n");
  const tokenCount = estimateTokenCount(fullContext);
  let wasTruncated = false;

  if (tokenCount > opts.maxTokens) {
    fullContext = truncateToTokenLimit(fullContext, opts.maxTokens);
    wasTruncated = true;
  }

  return {
    contextString: fullContext,
    tokenCount: estimateTokenCount(fullContext),
    filesIncluded: prioritized.length,
    wasTruncated,
    sections,
  };
}

/**
 * Extracts package metadata from a raw package.json string.
 *
 * @param packageJsonContent - Raw JSON string of package.json.
 * @returns Parsed package metadata.
 */
export function parsePackageJson(
  packageJsonContent: string
): PackageMetadata {
  const parsed = JSON.parse(packageJsonContent) as Record<string, unknown>;

  return {
    name: (parsed["name"] as string) ?? "unknown",
    version: (parsed["version"] as string) ?? "0.0.0",
    description: parsed["description"] as string | undefined,
    dependencies: Object.keys(
      (parsed["dependencies"] as Record<string, string>) ?? {}
    ),
    devDependencies: Object.keys(
      (parsed["devDependencies"] as Record<string, string>) ?? {}
    ),
    scripts: (parsed["scripts"] as Record<string, string>) ?? {},
  };
}
