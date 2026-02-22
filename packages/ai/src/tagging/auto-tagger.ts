/**
 * Auto-tagging module.
 *
 * Classifies issues and pull requests by type (bug, feature, docs),
 * priority, and affected area using text analysis.
 *
 * @module tagging/auto-tagger
 */

/**
 * Issue/PR type classification.
 */
export type IssueType = "bug" | "feature" | "docs" | "chore" | "question" | "enhancement" | "security" | "performance";

/**
 * Priority level classification.
 */
export type PriorityLevel = "critical" | "high" | "medium" | "low";

/**
 * Affected area of the codebase.
 */
export interface AffectedArea {
  /** Area name. */
  readonly name: string;
  /** Confidence that this area is affected (0-1). */
  readonly confidence: number;
}

/**
 * Result of auto-tagging an issue or PR.
 */
export interface TaggingResult {
  /** Detected issue type. */
  readonly type: IssueType;
  /** Type detection confidence (0-1). */
  readonly typeConfidence: number;
  /** Detected priority. */
  readonly priority: PriorityLevel;
  /** Priority detection confidence (0-1). */
  readonly priorityConfidence: number;
  /** Affected areas. */
  readonly affectedAreas: readonly AffectedArea[];
  /** Suggested labels. */
  readonly suggestedLabels: readonly string[];
  /** AI prompt for enhanced classification. */
  readonly aiPrompt: string;
}

/**
 * Input for auto-tagging analysis.
 */
export interface TaggingInput {
  /** Title of the issue or PR. */
  readonly title: string;
  /** Body/description text. */
  readonly body: string;
  /** Labels already applied. */
  readonly existingLabels?: readonly string[];
  /** File paths changed (for PRs). */
  readonly changedFiles?: readonly string[];
  /** Author username. */
  readonly author?: string;
}

/**
 * Type detection keyword patterns.
 */
const TYPE_PATTERNS: ReadonlyArray<{
  type: IssueType;
  keywords: readonly string[];
  titleWeight: number;
  bodyWeight: number;
}> = [
  {
    type: "bug",
    keywords: ["bug", "error", "fix", "crash", "broken", "issue", "fail", "wrong", "incorrect", "not working", "regression", "exception", "stack trace", "unexpected"],
    titleWeight: 2.0,
    bodyWeight: 1.0,
  },
  {
    type: "feature",
    keywords: ["feature", "add", "new", "implement", "create", "support", "introduce", "proposal", "rfc"],
    titleWeight: 2.0,
    bodyWeight: 1.0,
  },
  {
    type: "docs",
    keywords: ["docs", "documentation", "readme", "typo", "spelling", "example", "guide", "tutorial", "comment"],
    titleWeight: 2.0,
    bodyWeight: 1.0,
  },
  {
    type: "enhancement",
    keywords: ["improve", "enhancement", "better", "optimize", "refactor", "update", "upgrade", "modernize"],
    titleWeight: 1.5,
    bodyWeight: 1.0,
  },
  {
    type: "security",
    keywords: ["security", "vulnerability", "cve", "exploit", "xss", "injection", "auth", "permission", "csrf"],
    titleWeight: 3.0,
    bodyWeight: 1.5,
  },
  {
    type: "performance",
    keywords: ["performance", "slow", "memory", "leak", "latency", "speed", "optimize", "cache", "bottleneck"],
    titleWeight: 2.0,
    bodyWeight: 1.0,
  },
  {
    type: "question",
    keywords: ["question", "how to", "help", "why", "what is", "clarify", "explain", "confused"],
    titleWeight: 2.0,
    bodyWeight: 0.5,
  },
  {
    type: "chore",
    keywords: ["chore", "maintenance", "cleanup", "deprecate", "remove", "delete", "bump", "dependency"],
    titleWeight: 1.5,
    bodyWeight: 1.0,
  },
] as const;

/**
 * Priority detection patterns.
 */
const PRIORITY_PATTERNS: ReadonlyArray<{
  priority: PriorityLevel;
  keywords: readonly string[];
  weight: number;
}> = [
  {
    priority: "critical",
    keywords: ["critical", "urgent", "immediately", "production down", "data loss", "security vulnerability", "p0", "blocker", "outage"],
    weight: 3.0,
  },
  {
    priority: "high",
    keywords: ["important", "high priority", "asap", "p1", "breaking", "regression", "major", "severe"],
    weight: 2.0,
  },
  {
    priority: "medium",
    keywords: ["should", "needed", "expected", "moderate", "p2"],
    weight: 1.0,
  },
  {
    priority: "low",
    keywords: ["nice to have", "low priority", "minor", "cosmetic", "p3", "eventually", "when possible"],
    weight: 0.5,
  },
] as const;

/**
 * Counts keyword matches in text and returns a weighted score.
 *
 * @param text - Text to search in.
 * @param keywords - Keywords to search for.
 * @param weight - Weight multiplier for each match.
 * @returns Weighted score.
 */
export function scoreKeywords(
  text: string,
  keywords: readonly string[],
  weight: number
): number {
  const lower = text.toLowerCase();
  let score = 0;

  for (const keyword of keywords) {
    if (lower.includes(keyword.toLowerCase())) {
      score += weight;
    }
  }

  return score;
}

/**
 * Detects the issue type from title and body text.
 *
 * @param title - Issue/PR title.
 * @param body - Issue/PR body text.
 * @returns Detected type and confidence.
 */
export function detectType(
  title: string,
  body: string
): { type: IssueType; confidence: number } {
  let bestType: IssueType = "chore";
  let bestScore = 0;
  let totalScore = 0;

  for (const pattern of TYPE_PATTERNS) {
    const titleScore = scoreKeywords(title, pattern.keywords, pattern.titleWeight);
    const bodyScore = scoreKeywords(body, pattern.keywords, pattern.bodyWeight);
    const score = titleScore + bodyScore;
    totalScore += score;

    if (score > bestScore) {
      bestScore = score;
      bestType = pattern.type;
    }
  }

  const confidence = totalScore > 0 ? Math.min(0.95, bestScore / totalScore) : 0.3;

  return { type: bestType, confidence };
}

/**
 * Detects priority level from text content.
 *
 * @param title - Issue/PR title.
 * @param body - Issue/PR body text.
 * @returns Detected priority and confidence.
 */
export function detectPriority(
  title: string,
  body: string
): { priority: PriorityLevel; confidence: number } {
  const combined = `${title} ${body}`;
  let bestPriority: PriorityLevel = "medium";
  let bestScore = 0;
  let totalScore = 0;

  for (const pattern of PRIORITY_PATTERNS) {
    const score = scoreKeywords(combined, pattern.keywords, pattern.weight);
    totalScore += score;

    if (score > bestScore) {
      bestScore = score;
      bestPriority = pattern.priority;
    }
  }

  const confidence = totalScore > 0 ? Math.min(0.9, bestScore / totalScore) : 0.4;

  return { priority: bestPriority, confidence };
}

/**
 * Detects affected areas from file paths and text mentions.
 *
 * @param changedFiles - File paths changed in a PR.
 * @param body - Issue/PR body text.
 * @returns Array of affected areas with confidence.
 */
export function detectAffectedAreas(
  changedFiles: readonly string[],
  body: string
): AffectedArea[] {
  const areas = new Map<string, number>();

  for (const filePath of changedFiles) {
    const parts = filePath.split("/");
    if (parts.length >= 2) {
      const area = parts.slice(0, 2).join("/");
      areas.set(area, (areas.get(area) ?? 0) + 1);
    }
  }

  const areaPatterns = ["api", "auth", "database", "ui", "config", "tests", "docs", "build"];
  const lowerBody = body.toLowerCase();
  for (const area of areaPatterns) {
    if (lowerBody.includes(area)) {
      areas.set(area, (areas.get(area) ?? 0) + 0.5);
    }
  }

  const totalScore = [...areas.values()].reduce((s, v) => s + v, 0);
  const result: AffectedArea[] = [];

  for (const [name, score] of areas) {
    result.push({
      name,
      confidence: totalScore > 0 ? Math.min(0.95, score / totalScore) : 0.5,
    });
  }

  result.sort((a, b) => b.confidence - a.confidence);
  return result.slice(0, 5);
}

/**
 * Generates suggested labels from tagging results.
 *
 * @param type - Detected issue type.
 * @param priority - Detected priority.
 * @param areas - Affected areas.
 * @returns Array of suggested label strings.
 */
export function generateLabels(
  type: IssueType,
  priority: PriorityLevel,
  areas: readonly AffectedArea[]
): string[] {
  const labels: string[] = [];

  labels.push(`type:${type}`);
  labels.push(`priority:${priority}`);

  for (const area of areas.slice(0, 3)) {
    if (area.confidence > 0.3) {
      labels.push(`area:${area.name.replace(/\//g, "-")}`);
    }
  }

  return labels;
}

/**
 * Performs auto-tagging analysis on an issue or PR.
 *
 * @param input - The tagging input with title, body, and metadata.
 * @returns Complete tagging result.
 */
export function autoTag(input: TaggingInput): TaggingResult {
  const { type, confidence: typeConfidence } = detectType(input.title, input.body);
  const { priority, confidence: priorityConfidence } = detectPriority(input.title, input.body);
  const affectedAreas = detectAffectedAreas(input.changedFiles ?? [], input.body);
  const suggestedLabels = generateLabels(type, priority, affectedAreas);

  const aiPrompt = [
    "Classify this issue/PR and suggest appropriate labels.",
    "",
    `Title: ${input.title}`,
    `Body: ${input.body.slice(0, 1000)}`,
    input.changedFiles ? `Files: ${input.changedFiles.join(", ")}` : "",
    "",
    `Initial classification: type=${type} (${Math.round(typeConfidence * 100)}%), priority=${priority}`,
    "",
    "Provide refined classification with type, priority, and affected areas.",
  ].join("\n");

  return {
    type,
    typeConfidence,
    priority,
    priorityConfidence,
    affectedAreas,
    suggestedLabels,
    aiPrompt,
  };
}
