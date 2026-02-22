/**
 * Refactoring advisor module.
 *
 * Analyzes code for refactoring opportunities including
 * extract method, rename, decompose, and design pattern
 * improvements.
 *
 * @module assistant/refactor-advisor
 */

/**
 * Type of refactoring suggestion.
 */
export type RefactorType =
  | "extract-method"
  | "extract-variable"
  | "extract-interface"
  | "rename"
  | "decompose"
  | "inline"
  | "move"
  | "simplify-conditional"
  | "replace-with-pattern"
  | "reduce-params";

/**
 * Priority level for a refactoring suggestion.
 */
export type RefactorPriority = "low" | "medium" | "high" | "critical";

/**
 * A single refactoring suggestion.
 */
export interface RefactorSuggestion {
  /** Type of refactoring. */
  readonly type: RefactorType;
  /** Priority level. */
  readonly priority: RefactorPriority;
  /** File path. */
  readonly filePath: string;
  /** Start line of the code to refactor. */
  readonly startLine: number;
  /** End line of the code to refactor. */
  readonly endLine: number;
  /** Description of the refactoring. */
  readonly description: string;
  /** Rationale for the suggestion. */
  readonly rationale: string;
  /** Example of the refactored code, if applicable. */
  readonly example?: string;
  /** Estimated effort. */
  readonly effort: "trivial" | "small" | "medium" | "large";
  /** Confidence level (0-1). */
  readonly confidence: number;
}

/**
 * Code quality metrics used for refactoring analysis.
 */
export interface CodeQualityMetrics {
  /** Average function length in lines. */
  readonly avgFunctionLength: number;
  /** Maximum function length. */
  readonly maxFunctionLength: number;
  /** Number of functions exceeding recommended length. */
  readonly longFunctions: number;
  /** Average parameter count. */
  readonly avgParamCount: number;
  /** Maximum parameter count. */
  readonly maxParamCount: number;
  /** Estimated cyclomatic complexity. */
  readonly cyclomaticComplexity: number;
  /** Deepest nesting level. */
  readonly maxNestingDepth: number;
  /** Number of duplicated code blocks detected. */
  readonly duplicateBlocks: number;
}

/**
 * Complete refactoring analysis result.
 */
export interface RefactorAnalysisResult {
  /** All refactoring suggestions. */
  readonly suggestions: readonly RefactorSuggestion[];
  /** Code quality metrics. */
  readonly metrics: CodeQualityMetrics;
  /** Summary of findings. */
  readonly summary: string;
  /** Overall code quality score (0-100). */
  readonly qualityScore: number;
  /** AI prompt for detailed refactoring advice. */
  readonly aiPrompt: string;
}

/**
 * Detects long functions that should be decomposed.
 *
 * @param content - Source file content.
 * @param filePath - File path for reporting.
 * @param maxLines - Maximum recommended function length.
 * @returns Array of refactoring suggestions.
 */
export function detectLongFunctions(
  content: string,
  filePath: string,
  maxLines: number = 30
): RefactorSuggestion[] {
  const suggestions: RefactorSuggestion[] = [];
  const lines = content.split("\n");
  let funcStart = -1;
  let funcName = "";
  let braceDepth = 0;
  let inFunction = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const funcMatch = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/.exec(line);

    if (funcMatch && !inFunction) {
      funcStart = i;
      funcName = funcMatch[1]!;
      inFunction = true;
      braceDepth = 0;
    }

    if (inFunction) {
      for (const char of line) {
        if (char === "{") braceDepth++;
        else if (char === "}") braceDepth--;
      }

      if (braceDepth <= 0 && funcStart >= 0 && i > funcStart) {
        const length = i - funcStart + 1;
        if (length > maxLines) {
          suggestions.push({
            type: "decompose",
            priority: length > maxLines * 2 ? "high" : "medium",
            filePath,
            startLine: funcStart + 1,
            endLine: i + 1,
            description: `Function '${funcName}' is ${length} lines long (recommended max: ${maxLines})`,
            rationale: "Long functions are harder to understand, test, and maintain. Break into smaller, focused functions.",
            effort: length > 60 ? "medium" : "small",
            confidence: 0.9,
          });
        }
        inFunction = false;
        funcStart = -1;
      }
    }
  }

  return suggestions;
}

/**
 * Detects functions with too many parameters.
 *
 * @param content - Source file content.
 * @param filePath - File path for reporting.
 * @param maxParams - Maximum recommended parameter count.
 * @returns Array of refactoring suggestions.
 */
export function detectExcessiveParams(
  content: string,
  filePath: string,
  maxParams: number = 4
): RefactorSuggestion[] {
  const suggestions: RefactorSuggestion[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const funcMatch = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/.exec(line);

    if (funcMatch) {
      const paramStr = funcMatch[2]!;
      const params = paramStr.split(",").filter((p) => p.trim());

      if (params.length > maxParams) {
        suggestions.push({
          type: "reduce-params",
          priority: params.length > maxParams + 2 ? "high" : "medium",
          filePath,
          startLine: i + 1,
          endLine: i + 1,
          description: `Function '${funcMatch[1]}' has ${params.length} parameters (recommended max: ${maxParams})`,
          rationale: "Too many parameters make functions hard to call and maintain. Consider using an options object.",
          example: `function ${funcMatch[1]!}(options: ${capitalize(funcMatch[1]!)}Options)`,
          effort: "small",
          confidence: 0.85,
        });
      }
    }
  }

  return suggestions;
}

/**
 * Detects complex conditional expressions that should be simplified.
 *
 * @param content - Source file content.
 * @param filePath - File path for reporting.
 * @returns Array of refactoring suggestions.
 */
export function detectComplexConditionals(
  content: string,
  filePath: string
): RefactorSuggestion[] {
  const suggestions: RefactorSuggestion[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    const logicalOps = (line.match(/&&|\|\|/g) ?? []).length;
    if (logicalOps >= 3) {
      suggestions.push({
        type: "extract-variable",
        priority: logicalOps >= 5 ? "high" : "medium",
        filePath,
        startLine: i + 1,
        endLine: i + 1,
        description: `Complex conditional with ${logicalOps} logical operators`,
        rationale: "Extract conditions into named boolean variables for readability.",
        example: "const isValid = condA && condB;\nconst isReady = condC || condD;\nif (isValid && isReady) { ... }",
        effort: "trivial",
        confidence: 0.8,
      });
    }

    if (/if\s*\(/.test(line)) {
      let nestedIfs = 0;
      let j = i + 1;
      let depth = 0;
      while (j < lines.length && j < i + 20) {
        const nextLine = lines[j]!;
        if (nextLine.includes("{")) depth++;
        if (nextLine.includes("}")) depth--;
        if (/\bif\s*\(/.test(nextLine) && depth > 0) nestedIfs++;
        if (depth <= 0) break;
        j++;
      }

      if (nestedIfs >= 2) {
        suggestions.push({
          type: "simplify-conditional",
          priority: "medium",
          filePath,
          startLine: i + 1,
          endLine: j + 1,
          description: `Deeply nested conditionals (${nestedIfs + 1} levels)`,
          rationale: "Use early returns or guard clauses to reduce nesting depth.",
          effort: "small",
          confidence: 0.75,
        });
      }
    }
  }

  return suggestions;
}

/**
 * Detects potential duplicate code blocks.
 *
 * @param content - Source file content.
 * @param filePath - File path for reporting.
 * @param minBlockSize - Minimum lines for a duplicate block.
 * @returns Array of refactoring suggestions.
 */
export function detectDuplicateBlocks(
  content: string,
  filePath: string,
  minBlockSize: number = 4
): RefactorSuggestion[] {
  const suggestions: RefactorSuggestion[] = [];
  const lines = content.split("\n").map((l) => l.trim());
  const seen = new Map<string, number>();

  for (let i = 0; i <= lines.length - minBlockSize; i++) {
    const block = lines.slice(i, i + minBlockSize).join("\n");
    if (block.length < 20) continue;

    const prevLine = seen.get(block);
    if (prevLine !== undefined) {
      suggestions.push({
        type: "extract-method",
        priority: "medium",
        filePath,
        startLine: i + 1,
        endLine: i + minBlockSize,
        description: `Duplicate code block (also at line ${prevLine + 1})`,
        rationale: "Extract duplicated code into a shared function to follow DRY principle.",
        effort: "small",
        confidence: 0.7,
      });
    } else {
      seen.set(block, i);
    }
  }

  return suggestions;
}

/**
 * Calculates code quality metrics for a source file.
 *
 * @param content - Source file content.
 * @returns Computed code quality metrics.
 */
export function calculateMetrics(content: string): CodeQualityMetrics {
  const lines = content.split("\n");
  const funcLengths: number[] = [];
  const paramCounts: number[] = [];
  let maxNestingDepth = 0;
  let currentDepth = 0;

  let funcStart = -1;
  let braceCount = 0;
  let inFunc = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    const funcMatch = /(?:export\s+)?(?:async\s+)?function\s+\w+\s*\(([^)]*)\)/.exec(line);
    if (funcMatch && !inFunc) {
      funcStart = i;
      inFunc = true;
      braceCount = 0;
      const params = funcMatch[1]!.split(",").filter((p) => p.trim());
      paramCounts.push(params.length);
    }

    for (const char of line) {
      if (char === "{") {
        currentDepth++;
        if (currentDepth > maxNestingDepth) maxNestingDepth = currentDepth;
        if (inFunc) braceCount++;
      }
      if (char === "}") {
        currentDepth = Math.max(0, currentDepth - 1);
        if (inFunc) {
          braceCount--;
          if (braceCount <= 0) {
            funcLengths.push(i - funcStart + 1);
            inFunc = false;
          }
        }
      }
    }
  }

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  let complexity = 1;
  const complexityPatterns = [/\bif\b/g, /\bfor\b/g, /\bwhile\b/g, /\bcase\b/g, /\bcatch\b/g, /&&/g, /\|\|/g];
  for (const pattern of complexityPatterns) {
    complexity += (content.match(pattern) ?? []).length;
  }

  return {
    avgFunctionLength: Math.round(avg(funcLengths)),
    maxFunctionLength: Math.max(0, ...funcLengths),
    longFunctions: funcLengths.filter((l) => l > 30).length,
    avgParamCount: Math.round(avg(paramCounts) * 10) / 10,
    maxParamCount: Math.max(0, ...paramCounts),
    cyclomaticComplexity: complexity,
    maxNestingDepth,
    duplicateBlocks: 0,
  };
}

/**
 * Performs a complete refactoring analysis on a source file.
 *
 * @param content - Source file content.
 * @param filePath - File path for reporting.
 * @returns Complete refactoring analysis result.
 */
export function analyzeForRefactoring(
  content: string,
  filePath: string
): RefactorAnalysisResult {
  const suggestions: RefactorSuggestion[] = [
    ...detectLongFunctions(content, filePath),
    ...detectExcessiveParams(content, filePath),
    ...detectComplexConditionals(content, filePath),
    ...detectDuplicateBlocks(content, filePath),
  ];

  suggestions.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const metrics = calculateMetrics(content);

  let qualityScore = 100;
  qualityScore -= metrics.longFunctions * 5;
  qualityScore -= suggestions.filter((s) => s.priority === "high").length * 10;
  qualityScore -= suggestions.filter((s) => s.priority === "medium").length * 5;
  qualityScore = Math.max(0, Math.min(100, qualityScore));

  const summary =
    suggestions.length === 0
      ? "Code looks clean. No refactoring suggestions."
      : `Found ${suggestions.length} refactoring opportunity(ies). Quality score: ${qualityScore}/100.`;

  const aiPrompt = [
    "Analyze this code for refactoring opportunities beyond what static analysis can detect.",
    "",
    `File: ${filePath}`,
    `Current metrics: complexity=${metrics.cyclomaticComplexity}, max nesting=${metrics.maxNestingDepth}`,
    `Static analysis found ${suggestions.length} suggestions.`,
    "",
    "Look for design pattern opportunities, SOLID principle violations, and architectural improvements.",
  ].join("\n");

  return {
    suggestions,
    metrics,
    summary,
    qualityScore,
    aiPrompt,
  };
}

/**
 * Capitalizes the first letter of a string.
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
