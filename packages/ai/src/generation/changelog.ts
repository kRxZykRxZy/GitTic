/**
 * Changelog generation module.
 *
 * Parses commit history, groups by type, and generates
 * CHANGELOG.md content following Keep a Changelog format.
 *
 * @module generation/changelog
 */

/**
 * A parsed conventional commit.
 */
export interface ParsedCommit {
  /** Full commit hash. */
  readonly hash: string;
  /** Short hash (7 chars). */
  readonly shortHash: string;
  /** Commit type (feat, fix, etc.). */
  readonly type: string;
  /** Scope from the commit message. */
  readonly scope?: string;
  /** Whether it's a breaking change. */
  readonly isBreaking: boolean;
  /** The description part of the commit message. */
  readonly description: string;
  /** Commit body text. */
  readonly body?: string;
  /** Footer text (e.g., BREAKING CHANGE). */
  readonly footer?: string;
  /** Author name. */
  readonly author: string;
  /** ISO date string. */
  readonly date: string;
}

/**
 * A group of commits by type for changelog output.
 */
export interface CommitGroup {
  /** Group title (e.g., "Features", "Bug Fixes"). */
  readonly title: string;
  /** Commit type key. */
  readonly type: string;
  /** Commits in this group. */
  readonly commits: readonly ParsedCommit[];
}

/**
 * A release version entry in the changelog.
 */
export interface ReleaseEntry {
  /** Version string (e.g., "1.2.0"). */
  readonly version: string;
  /** Release date in ISO format. */
  readonly date: string;
  /** Grouped commits for this release. */
  readonly groups: readonly CommitGroup[];
  /** Breaking changes in this release. */
  readonly breakingChanges: readonly ParsedCommit[];
  /** Formatted markdown for this release. */
  readonly markdown: string;
}

/**
 * Configuration for changelog generation.
 */
export interface ChangelogConfig {
  /** Whether to include commit hashes in output. */
  readonly includeHashes: boolean;
  /** Whether to include author names. */
  readonly includeAuthors: boolean;
  /** Whether to include breaking change section. */
  readonly includeBreakingChanges: boolean;
  /** Custom type-to-title mapping overrides. */
  readonly typeTitles: Record<string, string>;
  /** Types to exclude from the changelog. */
  readonly excludeTypes: readonly string[];
  /** Repository URL for commit links. */
  readonly repoUrl?: string;
}

/**
 * Default type-to-title mappings for changelog sections.
 */
export const DEFAULT_TYPE_TITLES: Record<string, string> = {
  feat: "Features",
  fix: "Bug Fixes",
  docs: "Documentation",
  style: "Styles",
  refactor: "Code Refactoring",
  perf: "Performance Improvements",
  test: "Tests",
  build: "Build System",
  ci: "Continuous Integration",
  chore: "Chores",
  revert: "Reverts",
} as const;

/**
 * Default changelog generation configuration.
 */
export const DEFAULT_CHANGELOG_CONFIG: ChangelogConfig = {
  includeHashes: true,
  includeAuthors: false,
  includeBreakingChanges: true,
  typeTitles: DEFAULT_TYPE_TITLES,
  excludeTypes: ["chore", "style"],
  repoUrl: undefined,
} as const;

/**
 * Parses a conventional commit message string.
 *
 * @param hash - Full commit hash.
 * @param message - Full commit message (subject + body).
 * @param author - Author name.
 * @param date - ISO date string.
 * @returns Parsed commit or null if not conventional format.
 */
export function parseConventionalCommit(
  hash: string,
  message: string,
  author: string,
  date: string
): ParsedCommit | null {
  const lines = message.split("\n");
  const subject = lines[0] ?? "";

  const conventionalPattern =
    /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;
  const match = conventionalPattern.exec(subject);

  if (!match) {
    return null;
  }

  const type = match[1]!;
  const scope = match[2];
  const isBreakingMark = !!match[3];
  const description = match[4]!;

  const bodyLines: string[] = [];
  let footer: string | undefined;
  let hasBreakingFooter = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.startsWith("BREAKING CHANGE:") || line.startsWith("BREAKING-CHANGE:")) {
      hasBreakingFooter = true;
      footer = line;
    } else if (line.trim() !== "") {
      bodyLines.push(line);
    }
  }

  return {
    hash,
    shortHash: hash.slice(0, 7),
    type,
    scope,
    isBreaking: isBreakingMark || hasBreakingFooter,
    description,
    body: bodyLines.length > 0 ? bodyLines.join("\n") : undefined,
    footer,
    author,
    date,
  };
}

/**
 * Groups parsed commits by their type.
 *
 * @param commits - Array of parsed commits.
 * @param config - Changelog configuration.
 * @returns Array of commit groups sorted by importance.
 */
export function groupCommitsByType(
  commits: readonly ParsedCommit[],
  config: ChangelogConfig = DEFAULT_CHANGELOG_CONFIG
): CommitGroup[] {
  const excludeSet = new Set(config.excludeTypes);
  const grouped = new Map<string, ParsedCommit[]>();

  for (const commit of commits) {
    if (excludeSet.has(commit.type)) continue;

    const existing = grouped.get(commit.type) ?? [];
    existing.push(commit);
    grouped.set(commit.type, existing);
  }

  const typeOrder = ["feat", "fix", "perf", "refactor", "docs", "test", "build", "ci", "revert"];
  const groups: CommitGroup[] = [];

  for (const type of typeOrder) {
    const typeCommits = grouped.get(type);
    if (typeCommits && typeCommits.length > 0) {
      groups.push({
        title: config.typeTitles[type] ?? type,
        type,
        commits: typeCommits,
      });
      grouped.delete(type);
    }
  }

  for (const [type, typeCommits] of grouped) {
    groups.push({
      title: config.typeTitles[type] ?? type,
      type,
      commits: typeCommits,
    });
  }

  return groups;
}

/**
 * Formats a single commit line for the changelog.
 *
 * @param commit - Parsed commit to format.
 * @param config - Changelog configuration.
 * @returns Formatted markdown line.
 */
export function formatCommitLine(
  commit: ParsedCommit,
  config: ChangelogConfig
): string {
  const parts: string[] = [];

  if (commit.scope) {
    parts.push(`**${commit.scope}:**`);
  }

  parts.push(commit.description);

  if (config.includeHashes) {
    if (config.repoUrl) {
      parts.push(`([${commit.shortHash}](${config.repoUrl}/commit/${commit.hash}))`);
    } else {
      parts.push(`(${commit.shortHash})`);
    }
  }

  if (config.includeAuthors) {
    parts.push(`— ${commit.author}`);
  }

  return `- ${parts.join(" ")}`;
}

/**
 * Generates a release entry for a specific version.
 *
 * @param version - Version string.
 * @param date - Release date in ISO format.
 * @param commits - Commits included in this release.
 * @param config - Changelog configuration.
 * @returns Formatted release entry.
 */
export function generateReleaseEntry(
  version: string,
  date: string,
  commits: readonly ParsedCommit[],
  config: ChangelogConfig = DEFAULT_CHANGELOG_CONFIG
): ReleaseEntry {
  const groups = groupCommitsByType(commits, config);
  const breakingChanges = commits.filter((c) => c.isBreaking);

  const lines: string[] = [`## [${version}] - ${date}`];

  if (config.includeBreakingChanges && breakingChanges.length > 0) {
    lines.push("", "### ⚠ BREAKING CHANGES", "");
    for (const bc of breakingChanges) {
      const desc = bc.footer ?? bc.description;
      lines.push(`- ${bc.scope ? `**${bc.scope}:** ` : ""}${desc}`);
    }
  }

  for (const group of groups) {
    lines.push("", `### ${group.title}`, "");
    for (const commit of group.commits) {
      lines.push(formatCommitLine(commit, config));
    }
  }

  return {
    version,
    date,
    groups,
    breakingChanges,
    markdown: lines.join("\n"),
  };
}

/**
 * Generates the full changelog header.
 *
 * @returns Changelog preamble markdown.
 */
export function generateChangelogHeader(): string {
  return [
    "# Changelog",
    "",
    "All notable changes to this project will be documented in this file.",
    "",
    "The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),",
    "and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).",
  ].join("\n");
}

/**
 * Generates a complete changelog from a list of release entries.
 *
 * @param releases - Release entries in reverse chronological order.
 * @returns Complete CHANGELOG.md content.
 */
export function generateChangelog(
  releases: readonly ReleaseEntry[]
): string {
  const parts: string[] = [generateChangelogHeader()];

  for (const release of releases) {
    parts.push("", release.markdown);
  }

  return parts.join("\n") + "\n";
}

/**
 * Parses raw commit log entries into conventional commits.
 * Filters out non-conventional commits.
 *
 * @param rawCommits - Array of raw commit objects.
 * @returns Array of parsed conventional commits.
 */
export function parseCommitLog(
  rawCommits: ReadonlyArray<{
    hash: string;
    message: string;
    author: string;
    date: string;
  }>
): ParsedCommit[] {
  const parsed: ParsedCommit[] = [];

  for (const raw of rawCommits) {
    const commit = parseConventionalCommit(
      raw.hash,
      raw.message,
      raw.author,
      raw.date
    );
    if (commit) {
      parsed.push(commit);
    }
  }

  return parsed;
}
