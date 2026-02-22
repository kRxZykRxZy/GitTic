/**
 * Test code generation module.
 *
 * Generates unit test skeletons for functions, suggests test cases,
 * and creates mock dependency stubs from source code analysis.
 *
 * @module generation/test-generator
 */

/**
 * Information about a function to generate tests for.
 */
export interface TestTarget {
  /** Function name. */
  readonly name: string;
  /** Parameter names and types. */
  readonly params: readonly TestParam[];
  /** Return type. */
  readonly returnType: string;
  /** Whether the function is async. */
  readonly isAsync: boolean;
  /** Whether it's a class method. */
  readonly isMethod: boolean;
  /** Class name if it's a method. */
  readonly className?: string;
  /** Dependencies that need mocking. */
  readonly dependencies: readonly string[];
  /** Module path for importing. */
  readonly modulePath: string;
}

/**
 * A parameter to a test target function.
 */
export interface TestParam {
  /** Parameter name. */
  readonly name: string;
  /** Parameter type. */
  readonly type: string;
  /** Whether the parameter is optional. */
  readonly isOptional: boolean;
}

/**
 * A suggested test case for a function.
 */
export interface TestCase {
  /** Test case description. */
  readonly description: string;
  /** Category of test (happy path, edge case, error). */
  readonly category: TestCategory;
  /** Example input values. */
  readonly inputDescription: string;
  /** Expected behavior description. */
  readonly expectedBehavior: string;
  /** Priority of this test case. */
  readonly priority: "high" | "medium" | "low";
}

/**
 * Categories of test cases.
 */
export type TestCategory =
  | "happy-path"
  | "edge-case"
  | "error-handling"
  | "boundary"
  | "null-undefined"
  | "type-validation";

/**
 * A generated mock for a dependency.
 */
export interface GeneratedMock {
  /** Name of the dependency being mocked. */
  readonly dependencyName: string;
  /** Generated mock code. */
  readonly mockCode: string;
  /** Import path of the dependency. */
  readonly importPath: string;
}

/**
 * Configuration for test generation.
 */
export interface TestGenConfig {
  /** Test framework to generate for. */
  readonly framework: "vitest" | "jest" | "mocha";
  /** Whether to generate mocks for dependencies. */
  readonly generateMocks: boolean;
  /** Whether to include type assertions. */
  readonly includeTypeAssertions: boolean;
  /** Maximum test cases per function. */
  readonly maxTestCases: number;
  /** Whether to add describe blocks. */
  readonly useDescribeBlocks: boolean;
}

/**
 * Output of the test generator.
 */
export interface GeneratedTestFile {
  /** Generated test file content. */
  readonly content: string;
  /** Suggested test file path. */
  readonly filePath: string;
  /** Number of test cases generated. */
  readonly testCount: number;
  /** Mocks generated. */
  readonly mocks: readonly GeneratedMock[];
  /** AI prompt for enhanced test generation. */
  readonly aiPrompt: string;
}

/**
 * Default test generation configuration.
 */
export const DEFAULT_TEST_CONFIG: TestGenConfig = {
  framework: "vitest",
  generateMocks: true,
  includeTypeAssertions: true,
  maxTestCases: 10,
  useDescribeBlocks: true,
} as const;

/**
 * Extracts test targets from source code.
 *
 * @param content - Source file content.
 * @param modulePath - Module path for imports.
 * @returns Array of test targets.
 */
export function extractTestTargets(
  content: string,
  modulePath: string
): TestTarget[] {
  const targets: TestTarget[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    const funcMatch = /^export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^\s{]+))?/.exec(line);
    if (funcMatch) {
      const params = parseTestParams(funcMatch[2] ?? "");
      const deps = extractDependencies(content, funcMatch[1]!);
      targets.push({
        name: funcMatch[1]!,
        params,
        returnType: funcMatch[3] ?? "void",
        isAsync: /async\s+function/.test(line),
        isMethod: false,
        dependencies: deps,
        modulePath,
      });
    }
  }

  return targets;
}

/**
 * Parses parameter strings into TestParam objects.
 *
 * @param paramStr - Raw parameter string.
 * @returns Array of test parameters.
 */
export function parseTestParams(paramStr: string): TestParam[] {
  if (!paramStr.trim()) return [];

  const params: TestParam[] = [];
  let current = "";
  let depth = 0;

  for (const char of paramStr) {
    if (char === "<" || char === "{" || char === "(") depth++;
    else if (char === ">" || char === "}" || char === ")") depth--;
    else if (char === "," && depth === 0) {
      params.push(parseOneParam(current.trim()));
      current = "";
      continue;
    }
    current += char;
  }

  if (current.trim()) {
    params.push(parseOneParam(current.trim()));
  }

  return params;
}

/**
 * Parses a single parameter declaration.
 */
function parseOneParam(raw: string): TestParam {
  const hasDefault = raw.includes("=");
  const withoutDefault = hasDefault ? raw.split("=")[0]!.trim() : raw;
  const isOptional = withoutDefault.includes("?") || hasDefault;
  const typeMatch = /^(\w+)\??\s*:\s*(.+)$/.exec(withoutDefault);

  return {
    name: typeMatch ? typeMatch[1]! : withoutDefault.replace("?", ""),
    type: typeMatch ? typeMatch[2]!.trim() : "unknown",
    isOptional,
  };
}

/**
 * Extracts dependency names that a function uses (imported modules).
 *
 * @param content - File content.
 * @param funcName - Function name to analyze.
 * @returns Array of dependency names.
 */
function extractDependencies(content: string, funcName: string): string[] {
  const importPattern = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
  const deps: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = importPattern.exec(content)) !== null) {
    const names = match[1]!.split(",").map((n) => n.trim().split(" as ")[0]!.trim());
    const modulePath = match[2]!;

    for (const name of names) {
      if (content.includes(`${funcName}`) && content.includes(name)) {
        deps.push(`${name} (from ${modulePath})`);
      }
    }
  }

  return [...new Set(deps)];
}

/**
 * Generates test case suggestions for a function.
 *
 * @param target - The test target function.
 * @returns Array of suggested test cases.
 */
export function suggestTestCases(target: TestTarget): TestCase[] {
  const cases: TestCase[] = [];

  cases.push({
    description: `should return expected result for valid input`,
    category: "happy-path",
    inputDescription: `Valid ${target.params.map((p) => p.name).join(", ")}`,
    expectedBehavior: `Returns a valid ${target.returnType}`,
    priority: "high",
  });

  for (const param of target.params) {
    if (param.type === "string") {
      cases.push({
        description: `should handle empty string for ${param.name}`,
        category: "edge-case",
        inputDescription: `${param.name} = ""`,
        expectedBehavior: "Handles gracefully without error",
        priority: "medium",
      });
    }

    if (param.type === "number") {
      cases.push({
        description: `should handle zero for ${param.name}`,
        category: "boundary",
        inputDescription: `${param.name} = 0`,
        expectedBehavior: "Handles zero correctly",
        priority: "medium",
      });
    }

    if (param.isOptional) {
      cases.push({
        description: `should work when ${param.name} is omitted`,
        category: "null-undefined",
        inputDescription: `${param.name} is undefined`,
        expectedBehavior: "Uses default behavior",
        priority: "medium",
      });
    }
  }

  if (target.isAsync) {
    cases.push({
      description: "should reject on invalid input",
      category: "error-handling",
      inputDescription: "Invalid or malformed input",
      expectedBehavior: "Rejects with appropriate error",
      priority: "high",
    });
  }

  return cases;
}

/**
 * Generates a sample value for a TypeScript type.
 *
 * @param typeName - The type to generate a value for.
 * @returns A string representation of a sample value.
 */
export function generateSampleValue(typeName: string): string {
  const normalized = typeName.trim().toLowerCase();

  if (normalized === "string") return '"test"';
  if (normalized === "number") return "42";
  if (normalized === "boolean") return "true";
  if (normalized === "void") return "undefined";
  if (normalized === "null") return "null";
  if (normalized === "undefined") return "undefined";
  if (normalized.startsWith("array<") || normalized.endsWith("[]")) return "[]";
  if (normalized.startsWith("map<")) return "new Map()";
  if (normalized.startsWith("set<")) return "new Set()";
  if (normalized.startsWith("promise<")) return "Promise.resolve()";
  if (normalized.startsWith("record<")) return "{}";
  if (normalized.startsWith("partial<")) return "{}";
  if (normalized.startsWith("readonly")) return generateSampleValue(typeName.slice(8).trim());

  return "{}";
}

/**
 * Generates a mock for a dependency.
 *
 * @param depName - Dependency name.
 * @param importPath - Import path.
 * @param framework - Test framework.
 * @returns Generated mock.
 */
export function generateMock(
  depName: string,
  importPath: string,
  framework: "vitest" | "jest" | "mocha"
): GeneratedMock {
  let mockCode: string;

  if (framework === "vitest" || framework === "jest") {
    const fn = framework === "vitest" ? "vi.fn()" : "jest.fn()";
    mockCode = `const mock${depName} = ${fn};`;
  } else {
    mockCode = `const mock${depName} = () => {};`;
  }

  return {
    dependencyName: depName,
    mockCode,
    importPath,
  };
}

/**
 * Generates a complete test file for the given targets.
 *
 * @param targets - Functions to generate tests for.
 * @param sourceFilePath - Original source file path.
 * @param config - Test generation configuration.
 * @returns Generated test file.
 */
export function generateTestFile(
  targets: readonly TestTarget[],
  sourceFilePath: string,
  config: TestGenConfig = DEFAULT_TEST_CONFIG
): GeneratedTestFile {
  const testPath = sourceFilePath.replace(/\.ts$/, ".test.ts");
  const importNames = targets.map((t) => t.name).join(", ");
  const sourceFileName = sourceFilePath.split("/").pop()?.replace(/\.ts$/, "") ?? "module";
  const relativePath = `./${sourceFileName}`;

  const lines: string[] = [];

  if (config.framework === "vitest") {
    lines.push(`import { describe, it, expect, vi } from "vitest";`);
  } else if (config.framework === "jest") {
    lines.push(`/* eslint-disable */`);
  }

  lines.push(`import { ${importNames} } from "${relativePath}.js";`);
  lines.push("");

  let testCount = 0;
  const allMocks: GeneratedMock[] = [];

  for (const target of targets) {
    const cases = suggestTestCases(target).slice(0, config.maxTestCases);

    if (config.useDescribeBlocks) {
      lines.push(`describe("${target.name}", () => {`);
    }

    for (const tc of cases) {
      const prefix = config.useDescribeBlocks ? "  " : "";
      const asyncPrefix = target.isAsync ? "async " : "";
      lines.push(`${prefix}it("${tc.description}", ${asyncPrefix}() => {`);

      const args = target.params
        .map((p) => generateSampleValue(p.type))
        .join(", ");

      if (target.isAsync) {
        lines.push(`${prefix}  const result = await ${target.name}(${args});`);
        lines.push(`${prefix}  expect(result).toBeDefined();`);
      } else {
        lines.push(`${prefix}  const result = ${target.name}(${args});`);
        lines.push(`${prefix}  expect(result).toBeDefined();`);
      }

      lines.push(`${prefix}});`);
      lines.push("");
      testCount++;
    }

    if (config.useDescribeBlocks) {
      lines.push("});");
      lines.push("");
    }
  }

  const aiPrompt = [
    "Generate comprehensive unit tests for the following functions:",
    "",
    targets.map((t) => `- ${t.name}(${t.params.map((p) => `${p.name}: ${p.type}`).join(", ")}): ${t.returnType}`).join("\n"),
    "",
    `Use the ${config.framework} test framework.`,
    "Include happy path, edge cases, and error handling tests.",
  ].join("\n");

  return {
    content: lines.join("\n"),
    filePath: testPath,
    testCount,
    mocks: allMocks,
    aiPrompt,
  };
}
