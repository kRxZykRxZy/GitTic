/**
 * Performance analysis module.
 *
 * Detects common performance anti-patterns in code including
 * N+1 query patterns, memory leaks, synchronous blocking,
 * and other slow patterns.
 *
 * @module analysis/performance
 */

/**
 * Severity of a performance finding.
 */
export type PerformanceSeverity = "critical" | "warning" | "info";

/**
 * Category of a performance issue.
 */
export type PerformanceCategory =
  | "n-plus-one"
  | "memory-leak"
  | "blocking-operation"
  | "inefficient-loop"
  | "excessive-allocation"
  | "missing-cleanup"
  | "unbounded-growth"
  | "redundant-computation";

/**
 * A single performance finding.
 */
export interface PerformanceFinding {
  /** Category of the performance issue. */
  readonly category: PerformanceCategory;
  /** Severity of the issue. */
  readonly severity: PerformanceSeverity;
  /** File path where the issue was found. */
  readonly filePath: string;
  /** Line number of the issue. */
  readonly line: number;
  /** Description of the performance concern. */
  readonly description: string;
  /** Suggested fix or optimization. */
  readonly suggestion: string;
  /** Code snippet exhibiting the issue. */
  readonly snippet: string;
  /** Estimated impact description. */
  readonly estimatedImpact: string;
}

/**
 * Result of a performance analysis.
 */
export interface PerformanceAnalysisResult {
  /** All performance findings. */
  readonly findings: readonly PerformanceFinding[];
  /** Count by category. */
  readonly countsByCategory: Partial<Record<PerformanceCategory, number>>;
  /** Overall performance health score (0-100, higher is better). */
  readonly healthScore: number;
  /** Summary of findings. */
  readonly summary: string;
  /** AI prompt for further analysis. */
  readonly analysisPrompt: string;
}

/**
 * Pattern definition for detecting performance issues.
 */
interface PerformancePattern {
  /** Regex to match. */
  readonly pattern: RegExp;
  /** Category of the issue. */
  readonly category: PerformanceCategory;
  /** Severity level. */
  readonly severity: PerformanceSeverity;
  /** Description template. */
  readonly description: string;
  /** Suggestion template. */
  readonly suggestion: string;
  /** Impact description. */
  readonly impact: string;
}

/**
 * Known performance anti-patterns.
 */
const PERFORMANCE_PATTERNS: readonly PerformancePattern[] = [
  {
    pattern: /for\s*\([^)]*\)\s*\{[^}]*await\s/,
    category: "n-plus-one",
    severity: "critical",
    description: "Sequential await inside a loop — causes N+1 query pattern",
    suggestion: "Use Promise.all() or batch the operations outside the loop",
    impact: "Linear increase in latency with data size",
  },
  {
    pattern: /\.forEach\(\s*async\s/,
    category: "n-plus-one",
    severity: "critical",
    description: "Async callback in forEach — promises are not awaited",
    suggestion: "Use a for...of loop with await, or Promise.all() with .map()",
    impact: "Uncontrolled concurrent operations and potential race conditions",
  },
  {
    pattern: /setInterval\s*\([^)]+\)\s*(?!.*clearInterval)/,
    category: "memory-leak",
    severity: "warning",
    description: "setInterval without corresponding clearInterval",
    suggestion: "Store the interval ID and clear it during cleanup",
    impact: "Accumulated timers causing memory leaks over time",
  },
  {
    pattern: /addEventListener\s*\([^)]+\)\s*(?!.*removeEventListener)/,
    category: "memory-leak",
    severity: "warning",
    description: "addEventListener without corresponding removeEventListener",
    suggestion: "Remove event listeners during cleanup to prevent memory leaks",
    impact: "Event listeners accumulate on long-lived objects",
  },
  {
    pattern: /JSON\.parse\s*\(\s*JSON\.stringify\s*\(/,
    category: "inefficient-loop",
    severity: "warning",
    description: "JSON.parse(JSON.stringify()) used for deep cloning",
    suggestion: "Use structuredClone() or a dedicated deep clone utility",
    impact: "Slow serialization/deserialization, loses non-JSON-safe values",
  },
  {
    pattern: /fs\.readFileSync|fs\.writeFileSync/,
    category: "blocking-operation",
    severity: "warning",
    description: "Synchronous file I/O blocks the event loop",
    suggestion: "Use async fs methods (fs.promises.readFile, fs.promises.writeFile)",
    impact: "Blocks all other operations during file I/O",
  },
  {
    pattern: /new\s+Array\(\s*\d{6,}\s*\)/,
    category: "excessive-allocation",
    severity: "warning",
    description: "Large array pre-allocation may cause excessive memory usage",
    suggestion: "Consider using a streaming or chunked approach instead",
    impact: "High memory consumption on instantiation",
  },
  {
    pattern: /while\s*\(\s*true\s*\)/,
    category: "blocking-operation",
    severity: "info",
    description: "Infinite loop detected — ensure there is a break condition",
    suggestion: "Add explicit break conditions and consider using async iteration",
    impact: "May block the event loop if no await or break inside",
  },
  {
    pattern: /\.concat\(\s*\)\s*(?:\.concat|\[)/,
    category: "redundant-computation",
    severity: "info",
    description: "Chained .concat() calls create intermediate arrays",
    suggestion: "Use spread operator or Array.from() to combine arrays in one step",
    impact: "Extra memory allocations for temporary arrays",
  },
  {
    pattern: /new\s+Map\(\)|new\s+Set\(\)/,
    category: "missing-cleanup",
    severity: "info",
    description: "Collection created without apparent cleanup or size bounds",
    suggestion: "Consider adding a cleanup mechanism or maximum size limit",
    impact: "Unbounded growth if entries are never removed",
  },
] as const;

/**
 * Analyzes a single line of code for performance issues.
 *
 * @param line - Source code line.
 * @param lineNum - Line number in the file.
 * @param filePath - File path.
 * @returns Array of performance findings for this line.
 */
export function analyzeLine(
  line: string,
  lineNum: number,
  filePath: string
): PerformanceFinding[] {
  const findings: PerformanceFinding[] = [];

  for (const pattern of PERFORMANCE_PATTERNS) {
    if (pattern.pattern.test(line)) {
      findings.push({
        category: pattern.category,
        severity: pattern.severity,
        filePath,
        line: lineNum,
        description: pattern.description,
        suggestion: pattern.suggestion,
        snippet: line.trim().slice(0, 100),
        estimatedImpact: pattern.impact,
      });
    }
  }

  return findings;
}

/**
 * Analyzes a full source file for performance issues.
 *
 * @param content - Full file content.
 * @param filePath - File path being analyzed.
 * @returns Array of performance findings.
 */
export function analyzeFilePerformance(
  content: string,
  filePath: string
): PerformanceFinding[] {
  const findings: PerformanceFinding[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    findings.push(...analyzeLine(lines[i]!, i + 1, filePath));
  }

  // Multi-line pattern detection: await inside for loop
  const multiLinePatterns = [
    {
      pattern: /for\s*\([^)]*\)\s*\{[\s\S]*?await\s/g,
      category: "n-plus-one" as PerformanceCategory,
      severity: "critical" as PerformanceSeverity,
      description: "Await inside a for loop — sequential async calls",
      suggestion: "Collect promises and use Promise.all() for parallel execution",
      impact: "Latency scales linearly with iterations",
    },
  ];

  for (const mp of multiLinePatterns) {
    let match: RegExpExecArray | null;
    while ((match = mp.pattern.exec(content)) !== null) {
      const lineNum = content.slice(0, match.index).split("\n").length;
      const alreadyFound = findings.some(
        (f) => f.category === mp.category && Math.abs(f.line - lineNum) < 3
      );
      if (!alreadyFound) {
        findings.push({
          category: mp.category,
          severity: mp.severity,
          filePath,
          line: lineNum,
          description: mp.description,
          suggestion: mp.suggestion,
          snippet: match[0].slice(0, 100),
          estimatedImpact: mp.impact,
        });
      }
    }
  }

  return findings;
}

/**
 * Calculates a performance health score from findings.
 *
 * @param findings - All performance findings.
 * @returns Score from 0 (poor) to 100 (excellent).
 */
export function calculateHealthScore(
  findings: readonly PerformanceFinding[]
): number {
  let deductions = 0;

  for (const finding of findings) {
    switch (finding.severity) {
      case "critical":
        deductions += 20;
        break;
      case "warning":
        deductions += 10;
        break;
      case "info":
        deductions += 3;
        break;
    }
  }

  return Math.max(0, 100 - deductions);
}

/**
 * Analyzes multiple files for performance issues.
 *
 * @param files - Map of file path to content.
 * @returns Complete performance analysis result.
 */
export function analyzePerformance(
  files: ReadonlyMap<string, string>
): PerformanceAnalysisResult {
  const allFindings: PerformanceFinding[] = [];

  for (const [filePath, content] of files) {
    allFindings.push(...analyzeFilePerformance(content, filePath));
  }

  const countsByCategory: Partial<Record<PerformanceCategory, number>> = {};
  for (const finding of allFindings) {
    countsByCategory[finding.category] =
      (countsByCategory[finding.category] ?? 0) + 1;
  }

  const healthScore = calculateHealthScore(allFindings);

  const criticalCount = allFindings.filter(
    (f) => f.severity === "critical"
  ).length;
  const warningCount = allFindings.filter(
    (f) => f.severity === "warning"
  ).length;

  const summary =
    allFindings.length === 0
      ? "No performance issues detected. Code looks efficient."
      : `Found ${allFindings.length} performance issue(s): ${criticalCount} critical, ${warningCount} warnings. Health score: ${healthScore}/100.`;

  const analysisPrompt = [
    "Analyze the following code for performance issues not caught by static analysis.",
    "",
    `Current findings: ${allFindings.length} issues (health score: ${healthScore}/100)`,
    "",
    "Look for: database query patterns, caching opportunities, algorithm complexity,",
    "unnecessary re-renders, and resource management issues.",
  ].join("\n");

  return {
    findings: allFindings,
    countsByCategory,
    healthScore,
    summary,
    analysisPrompt,
  };
}
