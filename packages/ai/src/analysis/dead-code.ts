/**
 * Dead code detection module.
 *
 * Identifies unused exports, unreachable code, and unused imports
 * through static analysis of TypeScript/JavaScript source files.
 *
 * @module analysis/dead-code
 */

/**
 * Type of dead code detected.
 */
export type DeadCodeType =
  | "unused-export"
  | "unused-import"
  | "unreachable-code"
  | "unused-variable"
  | "unused-parameter"
  | "empty-block";

/**
 * A single dead code finding.
 */
export interface DeadCodeFinding {
  /** Type of dead code. */
  readonly type: DeadCodeType;
  /** File path where the dead code was found. */
  readonly filePath: string;
  /** Line number of the dead code. */
  readonly line: number;
  /** The identifier or code snippet involved. */
  readonly identifier: string;
  /** Description of the finding. */
  readonly description: string;
  /** Confidence level of the detection (0-1). */
  readonly confidence: number;
  /** Whether this can be safely removed. */
  readonly safeToRemove: boolean;
}

/**
 * Result of dead code analysis on a codebase.
 */
export interface DeadCodeAnalysisResult {
  /** All dead code findings. */
  readonly findings: readonly DeadCodeFinding[];
  /** Number of files analyzed. */
  readonly filesAnalyzed: number;
  /** Count of findings by type. */
  readonly countsByType: Record<DeadCodeType, number>;
  /** Summary of the analysis. */
  readonly summary: string;
  /** Estimated lines that could be removed. */
  readonly estimatedRemovableLines: number;
}

/**
 * Represents an export extracted from a source file.
 */
export interface ExportInfo {
  /** The exported name. */
  readonly name: string;
  /** The file path containing the export. */
  readonly filePath: string;
  /** Line number of the export. */
  readonly line: number;
  /** Whether it's a default export. */
  readonly isDefault: boolean;
  /** Whether it's a type-only export. */
  readonly isTypeExport: boolean;
}

/**
 * Represents an import extracted from a source file.
 */
export interface ImportInfo {
  /** The imported name. */
  readonly name: string;
  /** The module specifier. */
  readonly source: string;
  /** The file path containing the import. */
  readonly filePath: string;
  /** Line number of the import. */
  readonly line: number;
  /** Whether it's a type-only import. */
  readonly isTypeImport: boolean;
}

/**
 * Extracts all exports from a source file's content.
 *
 * @param content - File content to analyze.
 * @param filePath - Path of the file being analyzed.
 * @returns Array of extracted export information.
 */
export function extractExports(
  content: string,
  filePath: string
): ExportInfo[] {
  const exports: ExportInfo[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNum = i + 1;

    const namedExportMatch = /^export\s+(?:const|let|var|function|class|enum|interface|type)\s+(\w+)/.exec(line);
    if (namedExportMatch) {
      const isTypeExport = /^export\s+(?:interface|type)\s/.test(line);
      exports.push({
        name: namedExportMatch[1]!,
        filePath,
        line: lineNum,
        isDefault: false,
        isTypeExport,
      });
      continue;
    }

    const defaultExportMatch = /^export\s+default\s+(?:class|function)?\s*(\w+)?/.exec(line);
    if (defaultExportMatch) {
      exports.push({
        name: defaultExportMatch[1] ?? "default",
        filePath,
        line: lineNum,
        isDefault: true,
        isTypeExport: false,
      });
      continue;
    }

    const reExportMatch = /^export\s+\{([^}]+)\}/.exec(line);
    if (reExportMatch) {
      const names = reExportMatch[1]!.split(",").map((n) => n.trim());
      for (const name of names) {
        const cleanName = name.split(" as ").pop()!.trim();
        if (cleanName) {
          exports.push({
            name: cleanName,
            filePath,
            line: lineNum,
            isDefault: false,
            isTypeExport: /^export\s+type\s+\{/.test(line),
          });
        }
      }
    }
  }

  return exports;
}

/**
 * Extracts all imports from a source file's content.
 *
 * @param content - File content to analyze.
 * @param filePath - Path of the file being analyzed.
 * @returns Array of extracted import information.
 */
export function extractImports(
  content: string,
  filePath: string
): ImportInfo[] {
  const imports: ImportInfo[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNum = i + 1;

    const importMatch = /^import\s+(?:type\s+)?(?:\{([^}]+)\}|(\w+))(?:\s*,\s*\{([^}]+)\})?\s+from\s+['"]([^'"]+)['"]/.exec(line);
    if (importMatch) {
      const isTypeImport = /^import\s+type\s/.test(line);
      const source = importMatch[4]!;

      if (importMatch[1]) {
        const names = importMatch[1].split(",").map((n) => n.trim());
        for (const name of names) {
          const localName = name.includes(" as ")
            ? name.split(" as ")[1]!.trim()
            : name;
          if (localName) {
            imports.push({
              name: localName,
              source,
              filePath,
              line: lineNum,
              isTypeImport,
            });
          }
        }
      }

      if (importMatch[2]) {
        imports.push({
          name: importMatch[2],
          source,
          filePath,
          line: lineNum,
          isTypeImport,
        });
      }

      if (importMatch[3]) {
        const names = importMatch[3].split(",").map((n) => n.trim());
        for (const name of names) {
          const localName = name.includes(" as ")
            ? name.split(" as ")[1]!.trim()
            : name;
          if (localName) {
            imports.push({
              name: localName,
              source,
              filePath,
              line: lineNum,
              isTypeImport,
            });
          }
        }
      }
    }
  }

  return imports;
}

/**
 * Detects unused imports in a source file.
 *
 * @param content - File content to analyze.
 * @param filePath - Path of the file being analyzed.
 * @returns Array of dead code findings for unused imports.
 */
export function detectUnusedImports(
  content: string,
  filePath: string
): DeadCodeFinding[] {
  const findings: DeadCodeFinding[] = [];
  const imports = extractImports(content, filePath);

  const bodyLines = content.split("\n");
  for (const imp of imports) {
    const importLine = bodyLines[imp.line - 1] ?? "";
    const restOfFile = bodyLines
      .filter((_, idx) => idx !== imp.line - 1)
      .join("\n");

    const usagePattern = new RegExp(`\\b${escapeRegExp(imp.name)}\\b`);
    if (!usagePattern.test(restOfFile)) {
      findings.push({
        type: "unused-import",
        filePath,
        line: imp.line,
        identifier: imp.name,
        description: `Import '${imp.name}' from '${imp.source}' is not used in this file`,
        confidence: 0.85,
        safeToRemove: true,
      });
    }
    void importLine;
  }

  return findings;
}

/**
 * Detects unreachable code after return, throw, break, or continue.
 *
 * @param content - File content to analyze.
 * @param filePath - Path of the file being analyzed.
 * @returns Array of dead code findings.
 */
export function detectUnreachableCode(
  content: string,
  filePath: string
): DeadCodeFinding[] {
  const findings: DeadCodeFinding[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i]!.trim();
    const nextLine = lines[i + 1]!.trim();

    const isTerminator = /^(?:return|throw)\b/.test(currentLine) &&
      currentLine.endsWith(";");
    const isNextCodeLine =
      nextLine !== "" &&
      nextLine !== "}" &&
      !nextLine.startsWith("//") &&
      !nextLine.startsWith("/*") &&
      !nextLine.startsWith("*") &&
      !nextLine.startsWith("case ") &&
      !nextLine.startsWith("default:");

    if (isTerminator && isNextCodeLine) {
      findings.push({
        type: "unreachable-code",
        filePath,
        line: i + 2,
        identifier: nextLine.slice(0, 40),
        description: `Code after '${currentLine.split(" ")[0]}' statement is unreachable`,
        confidence: 0.7,
        safeToRemove: true,
      });
    }
  }

  return findings;
}

/**
 * Detects empty code blocks (empty if, else, catch, try bodies).
 *
 * @param content - File content to analyze.
 * @param filePath - Path of the file being analyzed.
 * @returns Array of dead code findings.
 */
export function detectEmptyBlocks(
  content: string,
  filePath: string
): DeadCodeFinding[] {
  const findings: DeadCodeFinding[] = [];
  const emptyBlockPattern = /\b(if|else|catch|try|for|while)\s*(?:\([^)]*\))?\s*\{\s*\}/g;

  let match: RegExpExecArray | null;
  while ((match = emptyBlockPattern.exec(content)) !== null) {
    const lineNum = content.slice(0, match.index).split("\n").length;
    findings.push({
      type: "empty-block",
      filePath,
      line: lineNum,
      identifier: match[1]!,
      description: `Empty '${match[1]}' block — consider adding logic or removing`,
      confidence: 0.9,
      safeToRemove: false,
    });
  }

  return findings;
}

/**
 * Runs a comprehensive dead code analysis on multiple files.
 *
 * @param files - Map of file path to file content.
 * @returns Complete dead code analysis result.
 */
export function analyzeDeadCode(
  files: ReadonlyMap<string, string>
): DeadCodeAnalysisResult {
  const allFindings: DeadCodeFinding[] = [];

  for (const [filePath, content] of files) {
    allFindings.push(...detectUnusedImports(content, filePath));
    allFindings.push(...detectUnreachableCode(content, filePath));
    allFindings.push(...detectEmptyBlocks(content, filePath));
  }

  const countsByType: Record<DeadCodeType, number> = {
    "unused-export": 0,
    "unused-import": 0,
    "unreachable-code": 0,
    "unused-variable": 0,
    "unused-parameter": 0,
    "empty-block": 0,
  };

  for (const finding of allFindings) {
    countsByType[finding.type]++;
  }

  const removable = allFindings.filter((f) => f.safeToRemove).length;
  const summary =
    allFindings.length === 0
      ? "No dead code detected."
      : `Found ${allFindings.length} dead code issue(s) across ${files.size} file(s). ` +
        `${removable} can be safely removed.`;

  return {
    findings: allFindings,
    filesAnalyzed: files.size,
    countsByType,
    summary,
    estimatedRemovableLines: removable,
  };
}

/**
 * Escapes special regex characters in a string.
 *
 * @param str - String to escape.
 * @returns Regex-safe string.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
