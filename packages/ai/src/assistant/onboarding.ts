/**
 * Repository onboarding assistant module.
 *
 * Analyzes project structure and key files to generate
 * onboarding guides for new contributors, including
 * project overview, setup instructions, and architecture.
 *
 * @module assistant/onboarding
 */

/**
 * A key file identified during project analysis.
 */
export interface KeyFile {
  /** File path. */
  readonly path: string;
  /** Purpose or role of this file. */
  readonly purpose: string;
  /** Importance level. */
  readonly importance: "critical" | "important" | "helpful";
  /** Category of the file. */
  readonly category: FileCategory;
}

/**
 * Categories for project files.
 */
export type FileCategory =
  | "entry-point"
  | "configuration"
  | "documentation"
  | "core-logic"
  | "api"
  | "testing"
  | "build"
  | "infrastructure";

/**
 * Project structure analysis result.
 */
export interface ProjectStructure {
  /** Project name. */
  readonly name: string;
  /** Primary programming language. */
  readonly primaryLanguage: string;
  /** Detected framework or platform. */
  readonly framework: string;
  /** Build tool used. */
  readonly buildTool: string;
  /** Test framework. */
  readonly testFramework: string;
  /** Package manager. */
  readonly packageManager: string;
  /** Whether it's a monorepo. */
  readonly isMonorepo: boolean;
  /** Top-level directories. */
  readonly directories: readonly string[];
  /** Key files identified. */
  readonly keyFiles: readonly KeyFile[];
}

/**
 * Getting started guide content.
 */
export interface OnboardingGuide {
  /** Project overview section. */
  readonly overview: string;
  /** Prerequisites section. */
  readonly prerequisites: readonly string[];
  /** Setup steps. */
  readonly setupSteps: readonly SetupStep[];
  /** Key files to review. */
  readonly keyFiles: readonly KeyFile[];
  /** Architecture overview. */
  readonly architecture: string;
  /** Development workflow tips. */
  readonly workflowTips: readonly string[];
  /** Full formatted guide. */
  readonly formattedGuide: string;
  /** AI prompt for personalized onboarding. */
  readonly aiPrompt: string;
}

/**
 * A single setup step in the onboarding guide.
 */
export interface SetupStep {
  /** Step number. */
  readonly step: number;
  /** Step description. */
  readonly description: string;
  /** Command to run, if applicable. */
  readonly command?: string;
  /** Expected outcome. */
  readonly expectedOutcome: string;
}

/**
 * File pattern rules for identifying key files.
 */
const KEY_FILE_PATTERNS: ReadonlyArray<{
  pattern: RegExp;
  purpose: string;
  importance: "critical" | "important" | "helpful";
  category: FileCategory;
}> = [
  { pattern: /^README\.md$/i, purpose: "Project documentation and overview", importance: "critical", category: "documentation" },
  { pattern: /^package\.json$/, purpose: "Project dependencies and scripts", importance: "critical", category: "configuration" },
  { pattern: /^tsconfig\.json$/, purpose: "TypeScript compiler configuration", importance: "important", category: "configuration" },
  { pattern: /src\/index\.\w+$/, purpose: "Main entry point", importance: "critical", category: "entry-point" },
  { pattern: /src\/main\.\w+$/, purpose: "Application entry point", importance: "critical", category: "entry-point" },
  { pattern: /src\/app\.\w+$/, purpose: "Application setup and initialization", importance: "critical", category: "entry-point" },
  { pattern: /\.env\.example$/, purpose: "Environment variable template", importance: "important", category: "configuration" },
  { pattern: /Dockerfile$/i, purpose: "Container build configuration", importance: "helpful", category: "infrastructure" },
  { pattern: /docker-compose/i, purpose: "Multi-container orchestration", importance: "helpful", category: "infrastructure" },
  { pattern: /\.github\/workflows/i, purpose: "CI/CD pipeline configuration", importance: "helpful", category: "build" },
  { pattern: /CONTRIBUTING\.md$/i, purpose: "Contribution guidelines", importance: "helpful", category: "documentation" },
  { pattern: /vitest\.config|jest\.config/i, purpose: "Test framework configuration", importance: "helpful", category: "testing" },
] as const;

/**
 * Identifies key files from a list of file paths.
 *
 * @param filePaths - All file paths in the repository.
 * @returns Array of identified key files.
 */
export function identifyKeyFiles(filePaths: readonly string[]): KeyFile[] {
  const keyFiles: KeyFile[] = [];

  for (const filePath of filePaths) {
    for (const rule of KEY_FILE_PATTERNS) {
      if (rule.pattern.test(filePath)) {
        keyFiles.push({
          path: filePath,
          purpose: rule.purpose,
          importance: rule.importance,
          category: rule.category,
        });
        break;
      }
    }
  }

  const importanceOrder = { critical: 0, important: 1, helpful: 2 };
  keyFiles.sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]);

  return keyFiles;
}

/**
 * Detects the primary language from file extensions.
 *
 * @param filePaths - All file paths.
 * @returns Detected primary language.
 */
export function detectPrimaryLanguage(filePaths: readonly string[]): string {
  const extCounts = new Map<string, number>();

  for (const fp of filePaths) {
    const ext = fp.split(".").pop()?.toLowerCase() ?? "";
    if (["ts", "tsx", "js", "jsx", "py", "go", "rs", "java", "rb"].includes(ext)) {
      extCounts.set(ext, (extCounts.get(ext) ?? 0) + 1);
    }
  }

  let maxExt = "unknown";
  let maxCount = 0;
  for (const [ext, count] of extCounts) {
    if (count > maxCount) {
      maxCount = count;
      maxExt = ext;
    }
  }

  const langMap: Record<string, string> = {
    ts: "TypeScript", tsx: "TypeScript", js: "JavaScript", jsx: "JavaScript",
    py: "Python", go: "Go", rs: "Rust", java: "Java", rb: "Ruby",
  };

  return langMap[maxExt] ?? maxExt;
}

/**
 * Detects the package manager from file indicators.
 *
 * @param filePaths - All file paths.
 * @returns Detected package manager name.
 */
export function detectPackageManager(filePaths: readonly string[]): string {
  const files = new Set(filePaths.map((f) => f.split("/").pop() ?? ""));
  if (files.has("pnpm-lock.yaml") || files.has("pnpm-workspace.yaml")) return "pnpm";
  if (files.has("yarn.lock")) return "yarn";
  if (files.has("bun.lockb")) return "bun";
  if (files.has("package-lock.json")) return "npm";
  return "npm";
}

/**
 * Detects if the project is a monorepo.
 *
 * @param filePaths - All file paths.
 * @returns True if monorepo indicators are found.
 */
export function detectMonorepo(filePaths: readonly string[]): boolean {
  return filePaths.some(
    (f) =>
      f.includes("pnpm-workspace.yaml") ||
      f.includes("lerna.json") ||
      f.includes("packages/") ||
      f.includes("workspaces")
  );
}

/**
 * Generates setup steps based on project configuration.
 *
 * @param structure - Analyzed project structure.
 * @returns Array of setup steps.
 */
export function generateSetupSteps(structure: ProjectStructure): SetupStep[] {
  const steps: SetupStep[] = [];
  let stepNum = 1;

  steps.push({
    step: stepNum++,
    description: "Clone the repository",
    command: `git clone <repository-url> && cd ${structure.name}`,
    expectedOutcome: "Repository cloned locally",
  });

  steps.push({
    step: stepNum++,
    description: `Install dependencies using ${structure.packageManager}`,
    command: structure.packageManager === "npm" ? "npm install" : `${structure.packageManager} install`,
    expectedOutcome: "All dependencies installed without errors",
  });

  if (structure.primaryLanguage === "TypeScript") {
    steps.push({
      step: stepNum++,
      description: "Build the project",
      command: `${structure.packageManager} run build`,
      expectedOutcome: "Project compiles without TypeScript errors",
    });
  }

  steps.push({
    step: stepNum++,
    description: "Run the test suite",
    command: `${structure.packageManager} ${structure.packageManager === "npm" ? "run test" : "test"}`,
    expectedOutcome: "All tests pass",
  });

  return steps;
}

/**
 * Generates a complete onboarding guide for a project.
 *
 * @param structure - Analyzed project structure.
 * @param readmeContent - Optional README content.
 * @returns Complete onboarding guide.
 */
export function generateOnboardingGuide(
  structure: ProjectStructure,
  readmeContent?: string
): OnboardingGuide {
  const prerequisites = [
    `Node.js (latest LTS)`,
    `${structure.packageManager} package manager`,
  ];

  if (structure.primaryLanguage === "TypeScript") {
    prerequisites.push("TypeScript knowledge recommended");
  }

  const setupSteps = generateSetupSteps(structure);

  const overview = readmeContent
    ? `${structure.name} is a ${structure.primaryLanguage} project. See README for full details.`
    : `${structure.name} is a ${structure.primaryLanguage} ${structure.isMonorepo ? "monorepo" : "project"} using ${structure.buildTool}.`;

  const architecture = structure.isMonorepo
    ? `This is a monorepo with packages in the packages/ directory. Each package has its own build and test configuration.`
    : `This is a single-package project with source code in src/. The entry point is ${structure.keyFiles.find((f) => f.category === "entry-point")?.path ?? "src/index.ts"}.`;

  const workflowTips = [
    `Run \`${structure.packageManager} run build\` to compile the project.`,
    `Run \`${structure.packageManager} ${structure.packageManager === "npm" ? "run test" : "test"}\` to execute tests.`,
    "Create a branch for each feature or fix.",
    "Follow the existing code style and conventions.",
  ];

  const formattedGuide = formatGuide(overview, prerequisites, setupSteps, structure.keyFiles, architecture, workflowTips);

  const aiPrompt = [
    `Generate a personalized onboarding guide for a new developer joining the ${structure.name} project.`,
    "",
    `Language: ${structure.primaryLanguage}`,
    `Framework: ${structure.framework}`,
    `Monorepo: ${structure.isMonorepo}`,
    `Key files: ${structure.keyFiles.map((f) => f.path).join(", ")}`,
    "",
    "Explain the project architecture, key concepts, and how to make a first contribution.",
  ].join("\n");

  return {
    overview,
    prerequisites,
    setupSteps,
    keyFiles: structure.keyFiles,
    architecture,
    workflowTips,
    formattedGuide,
    aiPrompt,
  };
}

/**
 * Formats the guide sections into a markdown document.
 */
function formatGuide(
  overview: string,
  prerequisites: readonly string[],
  setupSteps: readonly SetupStep[],
  keyFiles: readonly KeyFile[],
  architecture: string,
  tips: readonly string[]
): string {
  const lines: string[] = [
    "# Onboarding Guide",
    "",
    "## Overview",
    overview,
    "",
    "## Prerequisites",
    ...prerequisites.map((p) => `- ${p}`),
    "",
    "## Getting Started",
  ];

  for (const step of setupSteps) {
    lines.push(`${step.step}. **${step.description}**`);
    if (step.command) {
      lines.push(`   \`\`\`bash\n   ${step.command}\n   \`\`\``);
    }
    lines.push(`   Expected: ${step.expectedOutcome}`);
    lines.push("");
  }

  lines.push("## Key Files");
  for (const file of keyFiles) {
    lines.push(`- **${file.path}** — ${file.purpose} (${file.importance})`);
  }

  lines.push("", "## Architecture", architecture);
  lines.push("", "## Development Tips");
  for (const tip of tips) {
    lines.push(`- ${tip}`);
  }

  return lines.join("\n");
}
