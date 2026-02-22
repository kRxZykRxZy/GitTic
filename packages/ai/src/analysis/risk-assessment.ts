/**
 * Code risk assessment module.
 *
 * Analyzes code changes for risk by computing complexity scores,
 * assessing change impact, and classifying risk levels.
 *
 * @module analysis/risk-assessment
 */

/**
 * Risk level classification.
 */
export type RiskLevel = "low" | "medium" | "high" | "critical";

/**
 * A single risk factor identified in the code.
 */
export interface RiskFactor {
  /** Name of the risk factor. */
  readonly name: string;
  /** Detailed description. */
  readonly description: string;
  /** Risk score contribution (0-10). */
  readonly score: number;
  /** Category of the risk. */
  readonly category: RiskCategory;
  /** File path associated with this risk, if any. */
  readonly filePath?: string;
}

/**
 * Categories of code risk.
 */
export type RiskCategory =
  | "complexity"
  | "change-scope"
  | "test-coverage"
  | "dependency"
  | "security"
  | "breaking-change"
  | "configuration"
  | "infrastructure";

/**
 * Complexity metrics for a code change.
 */
export interface ComplexityMetrics {
  /** Cyclomatic complexity estimate. */
  readonly cyclomaticComplexity: number;
  /** Number of lines added. */
  readonly linesAdded: number;
  /** Number of lines removed. */
  readonly linesRemoved: number;
  /** Number of files changed. */
  readonly filesChanged: number;
  /** Nesting depth maximum. */
  readonly maxNestingDepth: number;
  /** Number of functions modified. */
  readonly functionsModified: number;
  /** Number of dependencies affected. */
  readonly dependenciesAffected: number;
}

/**
 * Impact assessment of a change.
 */
export interface ChangeImpact {
  /** Areas of the codebase affected. */
  readonly affectedAreas: readonly string[];
  /** Whether this includes breaking API changes. */
  readonly hasBreakingChanges: boolean;
  /** Whether this modifies configuration files. */
  readonly modifiesConfig: boolean;
  /** Whether this changes database schemas or migrations. */
  readonly modifiesData: boolean;
  /** Whether this affects authentication or authorization. */
  readonly affectsAuth: boolean;
  /** Whether this modifies CI/CD pipelines. */
  readonly affectsCI: boolean;
}

/**
 * Complete risk assessment result.
 */
export interface RiskAssessmentResult {
  /** Overall risk level. */
  readonly riskLevel: RiskLevel;
  /** Composite risk score (0-100). */
  readonly riskScore: number;
  /** Individual risk factors identified. */
  readonly factors: readonly RiskFactor[];
  /** Complexity metrics for the change. */
  readonly complexity: ComplexityMetrics;
  /** Impact assessment. */
  readonly impact: ChangeImpact;
  /** Human-readable summary. */
  readonly summary: string;
  /** Recommendations to mitigate risk. */
  readonly recommendations: readonly string[];
  /** AI prompt for deeper analysis. */
  readonly analysisPrompt: string;
}

/**
 * Configuration file patterns that indicate higher risk.
 */
const CONFIG_PATTERNS: readonly string[] = [
  "package.json",
  "tsconfig",
  ".env",
  "docker",
  "Dockerfile",
  "nginx",
  "webpack",
  "vite.config",
  ".github/workflows",
  "Makefile",
] as const;

/**
 * Security-sensitive file patterns.
 */
const SECURITY_PATTERNS: readonly string[] = [
  "auth",
  "login",
  "password",
  "token",
  "secret",
  "crypto",
  "permission",
  "middleware",
  "cors",
  "csrf",
] as const;

/**
 * Estimates cyclomatic complexity from code content.
 * Counts decision points: if, else, for, while, switch, case, catch, &&, ||, ?.
 *
 * @param code - Source code to analyze.
 * @returns Estimated cyclomatic complexity.
 */
export function estimateCyclomaticComplexity(code: string): number {
  let complexity = 1;
  const patterns = [
    /\bif\b/g,
    /\belse\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bswitch\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /&&/g,
    /\|\|/g,
    /\?\./g,
    /\?[^:]/g,
  ];

  for (const pattern of patterns) {
    const matches = code.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  }

  return complexity;
}

/**
 * Estimates the maximum nesting depth in code.
 *
 * @param code - Source code to analyze.
 * @returns Maximum nesting depth found.
 */
export function estimateNestingDepth(code: string): number {
  let maxDepth = 0;
  let currentDepth = 0;

  for (const char of code) {
    if (char === "{") {
      currentDepth++;
      if (currentDepth > maxDepth) {
        maxDepth = currentDepth;
      }
    } else if (char === "}") {
      currentDepth = Math.max(0, currentDepth - 1);
    }
  }

  return maxDepth;
}

/**
 * Counts the number of function/method definitions in code.
 *
 * @param code - Source code to analyze.
 * @returns Number of function definitions found.
 */
export function countFunctions(code: string): number {
  const patterns = [
    /\bfunction\s+\w+/g,
    /\b\w+\s*=\s*(?:async\s+)?\(/g,
    /\b\w+\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/g,
    /=>\s*\{/g,
  ];

  let count = 0;
  for (const pattern of patterns) {
    const matches = code.match(pattern);
    if (matches) {
      count += matches.length;
    }
  }

  return Math.max(1, Math.floor(count / 2));
}

/**
 * Assesses the change impact based on file paths.
 *
 * @param filePaths - List of changed file paths.
 * @returns Change impact assessment.
 */
export function assessChangeImpact(
  filePaths: readonly string[]
): ChangeImpact {
  const affectedAreas = new Set<string>();

  for (const filePath of filePaths) {
    const parts = filePath.split("/");
    if (parts.length > 1) {
      affectedAreas.add(parts.slice(0, 2).join("/"));
    } else {
      affectedAreas.add(filePath);
    }
  }

  const lowerPaths = filePaths.map((p) => p.toLowerCase());

  return {
    affectedAreas: [...affectedAreas],
    hasBreakingChanges: lowerPaths.some(
      (p) => p.includes("api") || p.includes("interface") || p.includes("schema")
    ),
    modifiesConfig: lowerPaths.some((p) =>
      CONFIG_PATTERNS.some((cp) => p.includes(cp.toLowerCase()))
    ),
    modifiesData: lowerPaths.some(
      (p) => p.includes("migration") || p.includes("schema") || p.includes("model")
    ),
    affectsAuth: lowerPaths.some((p) =>
      SECURITY_PATTERNS.some((sp) => p.includes(sp))
    ),
    affectsCI: lowerPaths.some(
      (p) => p.includes(".github") || p.includes("ci") || p.includes("deploy")
    ),
  };
}

/**
 * Identifies risk factors from code change metrics.
 *
 * @param metrics - Complexity metrics for the change.
 * @param impact - Impact assessment of the change.
 * @returns Array of identified risk factors.
 */
export function identifyRiskFactors(
  metrics: ComplexityMetrics,
  impact: ChangeImpact
): RiskFactor[] {
  const factors: RiskFactor[] = [];

  if (metrics.filesChanged > 10) {
    factors.push({
      name: "Large Change Scope",
      description: `${metrics.filesChanged} files changed — harder to review and more likely to introduce bugs`,
      score: Math.min(10, metrics.filesChanged / 3),
      category: "change-scope",
    });
  }

  if (metrics.linesAdded + metrics.linesRemoved > 500) {
    const totalLines = metrics.linesAdded + metrics.linesRemoved;
    factors.push({
      name: "Large Diff Size",
      description: `${totalLines} lines changed — consider splitting into smaller PRs`,
      score: Math.min(10, totalLines / 200),
      category: "change-scope",
    });
  }

  if (metrics.cyclomaticComplexity > 20) {
    factors.push({
      name: "High Cyclomatic Complexity",
      description: `Cyclomatic complexity of ${metrics.cyclomaticComplexity} exceeds recommended threshold`,
      score: Math.min(10, metrics.cyclomaticComplexity / 5),
      category: "complexity",
    });
  }

  if (metrics.maxNestingDepth > 4) {
    factors.push({
      name: "Deep Nesting",
      description: `Maximum nesting depth of ${metrics.maxNestingDepth} — consider extracting functions`,
      score: Math.min(10, metrics.maxNestingDepth * 1.5),
      category: "complexity",
    });
  }

  if (impact.hasBreakingChanges) {
    factors.push({
      name: "Potential Breaking Changes",
      description: "Changes to API surfaces or interfaces may break consumers",
      score: 8,
      category: "breaking-change",
    });
  }

  if (impact.affectsAuth) {
    factors.push({
      name: "Security-Sensitive Changes",
      description: "Modifications to authentication or authorization code require careful review",
      score: 7,
      category: "security",
    });
  }

  if (impact.modifiesConfig) {
    factors.push({
      name: "Configuration Changes",
      description: "Configuration changes can affect all environments",
      score: 5,
      category: "configuration",
    });
  }

  return factors;
}

/**
 * Classifies the overall risk level from a risk score.
 *
 * @param score - Composite risk score (0-100).
 * @returns Risk level classification.
 */
export function classifyRiskLevel(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

/**
 * Generates recommendations based on identified risk factors.
 *
 * @param factors - Array of risk factors.
 * @param impact - Change impact assessment.
 * @returns Array of recommendation strings.
 */
export function generateRecommendations(
  factors: readonly RiskFactor[],
  impact: ChangeImpact
): string[] {
  const recommendations: string[] = [];

  if (factors.some((f) => f.category === "change-scope")) {
    recommendations.push("Consider splitting this change into smaller, focused pull requests.");
  }

  if (factors.some((f) => f.category === "complexity")) {
    recommendations.push("Refactor complex sections to reduce cyclomatic complexity and nesting depth.");
  }

  if (impact.hasBreakingChanges) {
    recommendations.push("Document breaking changes and update any dependent packages or services.");
  }

  if (impact.affectsAuth) {
    recommendations.push("Request a security-focused review for authentication/authorization changes.");
  }

  if (impact.modifiesData) {
    recommendations.push("Ensure database migrations are reversible and tested against production-like data.");
  }

  if (recommendations.length === 0) {
    recommendations.push("This change appears low-risk. Standard review process is sufficient.");
  }

  return recommendations;
}

/**
 * Performs a complete risk assessment on code changes.
 *
 * @param code - Combined source code of the changes.
 * @param filePaths - Paths of changed files.
 * @param linesAdded - Number of lines added.
 * @param linesRemoved - Number of lines removed.
 * @returns Complete risk assessment result.
 */
export function assessRisk(
  code: string,
  filePaths: readonly string[],
  linesAdded: number,
  linesRemoved: number
): RiskAssessmentResult {
  const complexity: ComplexityMetrics = {
    cyclomaticComplexity: estimateCyclomaticComplexity(code),
    linesAdded,
    linesRemoved,
    filesChanged: filePaths.length,
    maxNestingDepth: estimateNestingDepth(code),
    functionsModified: countFunctions(code),
    dependenciesAffected: filePaths.filter((p) => p.includes("package.json")).length,
  };

  const impact = assessChangeImpact(filePaths);
  const factors = identifyRiskFactors(complexity, impact);

  const riskScore = Math.min(
    100,
    factors.reduce((sum, f) => sum + f.score, 0) * 3
  );
  const riskLevel = classifyRiskLevel(riskScore);
  const recommendations = generateRecommendations(factors, impact);

  const summary = `Risk Level: ${riskLevel.toUpperCase()} (score: ${riskScore}/100). ` +
    `${factors.length} risk factor(s) identified across ${filePaths.length} file(s).`;

  const analysisPrompt = [
    "Analyze the following code changes for risk and provide a detailed assessment.",
    `Files changed: ${filePaths.join(", ")}`,
    `Lines: +${linesAdded} / -${linesRemoved}`,
    `Preliminary risk: ${riskLevel} (${riskScore}/100)`,
    "",
    "Provide additional risk factors not covered by static analysis.",
  ].join("\n");

  return {
    riskLevel,
    riskScore,
    factors,
    complexity,
    impact,
    summary,
    recommendations,
    analysisPrompt,
  };
}
