/**
 * Build failure analysis module.
 *
 * Parses build logs, identifies error patterns, and suggests
 * fixes for common build failures across different build tools.
 *
 * @module analysis/build-failure
 */

/**
 * Severity level for build errors.
 */
export type BuildErrorSeverity = "error" | "warning" | "info";

/**
 * A parsed build error extracted from build output.
 */
export interface BuildError {
  /** Error severity level. */
  readonly severity: BuildErrorSeverity;
  /** Error message text. */
  readonly message: string;
  /** File path where the error occurred, if known. */
  readonly filePath?: string;
  /** Line number where the error occurred, if known. */
  readonly line?: number;
  /** Column number where the error occurred, if known. */
  readonly column?: number;
  /** Error code or identifier. */
  readonly code?: string;
  /** The build tool that produced this error. */
  readonly tool: string;
}

/**
 * A suggested fix for a build error.
 */
export interface BuildFix {
  /** Description of the fix. */
  readonly description: string;
  /** Confidence level of the suggestion (0-1). */
  readonly confidence: number;
  /** Category of the fix. */
  readonly category: string;
  /** Specific commands to run, if applicable. */
  readonly commands?: readonly string[];
}

/**
 * Result of analyzing a build failure.
 */
export interface BuildAnalysisResult {
  /** All errors found in the build output. */
  readonly errors: readonly BuildError[];
  /** All warnings found in the build output. */
  readonly warnings: readonly BuildError[];
  /** Suggested fixes for the errors. */
  readonly suggestedFixes: readonly BuildFix[];
  /** Detected build tool. */
  readonly buildTool: string;
  /** Summary of the build failure. */
  readonly summary: string;
  /** AI prompt for deeper analysis. */
  readonly analysisPrompt: string;
}

/**
 * Pattern definition for matching build errors.
 */
interface ErrorPattern {
  /** Regex pattern to match against log lines. */
  readonly pattern: RegExp;
  /** Build tool that produces this pattern. */
  readonly tool: string;
  /** Severity of matched errors. */
  readonly severity: BuildErrorSeverity;
  /** Fix suggestion category. */
  readonly category: string;
  /** Suggested fix description. */
  readonly fixDescription: string;
  /** Fix confidence level. */
  readonly confidence: number;
  /** Optional commands to suggest. */
  readonly commands?: readonly string[];
}

/**
 * Known error patterns across build tools.
 */
const ERROR_PATTERNS: readonly ErrorPattern[] = [
  {
    pattern: /error TS(\d+): (.+)/,
    tool: "typescript",
    severity: "error",
    category: "type-error",
    fixDescription: "Fix TypeScript type error",
    confidence: 0.9,
  },
  {
    pattern: /Cannot find module ['"](.+)['"]/,
    tool: "node",
    severity: "error",
    category: "missing-dependency",
    fixDescription: "Install the missing dependency",
    confidence: 0.95,
    commands: ["npm install"],
  },
  {
    pattern: /SyntaxError: (.+)/,
    tool: "node",
    severity: "error",
    category: "syntax-error",
    fixDescription: "Fix syntax error in the source code",
    confidence: 0.85,
  },
  {
    pattern: /ERR_MODULE_NOT_FOUND/,
    tool: "node",
    severity: "error",
    category: "missing-module",
    fixDescription: "Check module path and ensure file exists",
    confidence: 0.9,
  },
  {
    pattern: /ENOENT: no such file or directory/,
    tool: "filesystem",
    severity: "error",
    category: "missing-file",
    fixDescription: "Create the missing file or fix the file path",
    confidence: 0.9,
  },
  {
    pattern: /Out of memory/i,
    tool: "runtime",
    severity: "error",
    category: "memory",
    fixDescription: "Increase Node.js memory limit or optimize memory usage",
    confidence: 0.8,
    commands: ["NODE_OPTIONS='--max-old-space-size=4096'"],
  },
  {
    pattern: /warning TS(\d+): (.+)/,
    tool: "typescript",
    severity: "warning",
    category: "type-warning",
    fixDescription: "Address TypeScript warning",
    confidence: 0.7,
  },
  {
    pattern: /npm ERR! (.+)/,
    tool: "npm",
    severity: "error",
    category: "npm-error",
    fixDescription: "Fix npm package installation error",
    confidence: 0.85,
    commands: ["rm -rf node_modules", "npm install"],
  },
  {
    pattern: /EPERM|EACCES/,
    tool: "filesystem",
    severity: "error",
    category: "permission",
    fixDescription: "Fix file or directory permissions",
    confidence: 0.85,
  },
  {
    pattern: /jest.*FAIL/i,
    tool: "jest",
    severity: "error",
    category: "test-failure",
    fixDescription: "Fix failing test cases",
    confidence: 0.7,
  },
] as const;

/**
 * Parses a build log line against known error patterns.
 *
 * @param line - A single line from the build output.
 * @returns A BuildError if the line matches a known pattern, or null.
 */
export function parseLogLine(line: string): BuildError | null {
  for (const pattern of ERROR_PATTERNS) {
    const match = pattern.pattern.exec(line);
    if (match) {
      const fileMatch = /(?:at |in |from )([^\s:]+):(\d+)(?::(\d+))?/.exec(line);
      return {
        severity: pattern.severity,
        message: match[0],
        filePath: fileMatch?.[1],
        line: fileMatch?.[2] ? parseInt(fileMatch[2], 10) : undefined,
        column: fileMatch?.[3] ? parseInt(fileMatch[3], 10) : undefined,
        code: match[1],
        tool: pattern.tool,
      };
    }
  }
  return null;
}

/**
 * Detects the build tool from log content.
 *
 * @param logContent - The full build log text.
 * @returns The detected build tool name.
 */
export function detectBuildTool(logContent: string): string {
  const toolIndicators: Record<string, RegExp> = {
    typescript: /tsc|typescript|\.ts\b/i,
    webpack: /webpack/i,
    vite: /vite/i,
    esbuild: /esbuild/i,
    jest: /jest/i,
    vitest: /vitest/i,
    npm: /npm ERR!/i,
    pnpm: /pnpm/i,
  };

  for (const [tool, regex] of Object.entries(toolIndicators)) {
    if (regex.test(logContent)) {
      return tool;
    }
  }
  return "unknown";
}

/**
 * Generates fix suggestions for detected build errors.
 *
 * @param errors - Array of detected build errors.
 * @returns Array of suggested fixes with confidence scores.
 */
export function generateFixSuggestions(
  errors: readonly BuildError[]
): BuildFix[] {
  const fixes: BuildFix[] = [];
  const seenCategories = new Set<string>();

  for (const error of errors) {
    for (const pattern of ERROR_PATTERNS) {
      if (pattern.pattern.test(error.message) && !seenCategories.has(pattern.category)) {
        seenCategories.add(pattern.category);
        fixes.push({
          description: pattern.fixDescription,
          confidence: pattern.confidence,
          category: pattern.category,
          commands: pattern.commands,
        });
      }
    }
  }

  fixes.sort((a, b) => b.confidence - a.confidence);
  return fixes;
}

/**
 * Analyzes a complete build log and produces a structured result.
 *
 * @param logContent - The full build log text.
 * @returns A comprehensive build analysis result.
 */
export function analyzeBuildFailure(logContent: string): BuildAnalysisResult {
  const lines = logContent.split("\n");
  const allErrors: BuildError[] = [];

  for (const line of lines) {
    const parsed = parseLogLine(line);
    if (parsed) {
      allErrors.push(parsed);
    }
  }

  const errors = allErrors.filter((e) => e.severity === "error");
  const warnings = allErrors.filter((e) => e.severity === "warning");
  const suggestedFixes = generateFixSuggestions(errors);
  const buildTool = detectBuildTool(logContent);

  const summary =
    errors.length === 0
      ? "No errors detected in the build log."
      : `Found ${errors.length} error(s) and ${warnings.length} warning(s) from ${buildTool}.`;

  const analysisPrompt = buildAnalysisPrompt(logContent, errors, buildTool);

  return {
    errors,
    warnings,
    suggestedFixes,
    buildTool,
    summary,
    analysisPrompt,
  };
}

/**
 * Builds a prompt for AI-assisted deeper analysis of build failures.
 *
 * @param logContent - The build log content (truncated if needed).
 * @param errors - Parsed errors from the log.
 * @param buildTool - Detected build tool.
 * @returns A prompt string for the AI model.
 */
function buildAnalysisPrompt(
  logContent: string,
  errors: readonly BuildError[],
  buildTool: string
): string {
  const truncatedLog =
    logContent.length > 3000
      ? logContent.slice(-3000)
      : logContent;

  const errorSummary = errors
    .slice(0, 10)
    .map((e) => `- [${e.tool}] ${e.message}`)
    .join("\n");

  return [
    `Analyze this ${buildTool} build failure and suggest fixes.`,
    "",
    "## Detected Errors",
    errorSummary || "No errors automatically detected.",
    "",
    "## Build Log (last portion)",
    "```",
    truncatedLog,
    "```",
    "",
    "Provide specific, actionable fixes for each error.",
  ].join("\n");
}
