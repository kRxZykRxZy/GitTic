/**
 * Project summarizer module.
 *
 * Analyzes a repository and generates a comprehensive summary
 * of what the project does, its architecture, and technology stack.
 *
 * @module assistant/project-summarizer
 */

/**
 * Technology stack detected in a project.
 */
export interface TechStack {
  /** Programming languages used. */
  readonly languages: readonly LanguageUsage[];
  /** Frameworks detected. */
  readonly frameworks: readonly string[];
  /** Build tools used. */
  readonly buildTools: readonly string[];
  /** Test frameworks. */
  readonly testFrameworks: readonly string[];
  /** Package managers. */
  readonly packageManagers: readonly string[];
  /** CI/CD platforms. */
  readonly cicdPlatforms: readonly string[];
  /** Database technologies. */
  readonly databases: readonly string[];
}

/**
 * Language usage information.
 */
export interface LanguageUsage {
  /** Language name. */
  readonly name: string;
  /** Number of files. */
  readonly fileCount: number;
  /** Percentage of total source files. */
  readonly percentage: number;
}

/**
 * Project architecture classification.
 */
export type ArchitectureType =
  | "monolith"
  | "monorepo"
  | "microservices"
  | "library"
  | "cli"
  | "web-app"
  | "api"
  | "plugin"
  | "unknown";

/**
 * A module or package within the project.
 */
export interface ProjectModule {
  /** Module name. */
  readonly name: string;
  /** Module path. */
  readonly path: string;
  /** Description of what the module does. */
  readonly description: string;
  /** Number of source files. */
  readonly fileCount: number;
  /** Dependencies on other modules. */
  readonly dependencies: readonly string[];
}

/**
 * Complete project summary.
 */
export interface ProjectSummary {
  /** Project name. */
  readonly name: string;
  /** One-line description. */
  readonly tagline: string;
  /** Detailed description (2-3 sentences). */
  readonly description: string;
  /** Architecture classification. */
  readonly architecture: ArchitectureType;
  /** Technology stack. */
  readonly techStack: TechStack;
  /** Project modules/packages. */
  readonly modules: readonly ProjectModule[];
  /** Entry points. */
  readonly entryPoints: readonly string[];
  /** Total source file count. */
  readonly totalFiles: number;
  /** Estimated lines of code. */
  readonly estimatedLoc: number;
  /** Formatted summary string. */
  readonly formattedSummary: string;
  /** AI prompt for enhanced summarization. */
  readonly aiPrompt: string;
}

/**
 * Framework detection rules.
 */
const FRAMEWORK_INDICATORS: ReadonlyArray<{
  name: string;
  indicators: readonly string[];
}> = [
  { name: "React", indicators: ["react", "react-dom", "jsx", "tsx"] },
  { name: "Next.js", indicators: ["next", "next.config"] },
  { name: "Express", indicators: ["express"] },
  { name: "Fastify", indicators: ["fastify"] },
  { name: "NestJS", indicators: ["@nestjs/core"] },
  { name: "Vue", indicators: ["vue", "vuex", "pinia"] },
  { name: "Angular", indicators: ["@angular/core"] },
  { name: "Svelte", indicators: ["svelte"] },
  { name: "Hono", indicators: ["hono"] },
] as const;

/**
 * Detects languages used in the project from file paths.
 *
 * @param filePaths - All file paths in the project.
 * @returns Array of language usage statistics.
 */
export function detectLanguages(
  filePaths: readonly string[]
): LanguageUsage[] {
  const extMap: Record<string, string> = {
    ts: "TypeScript",
    tsx: "TypeScript",
    js: "JavaScript",
    jsx: "JavaScript",
    py: "Python",
    go: "Go",
    rs: "Rust",
    java: "Java",
    rb: "Ruby",
    css: "CSS",
    scss: "SCSS",
    html: "HTML",
  };

  const counts = new Map<string, number>();
  let totalSourceFiles = 0;

  for (const fp of filePaths) {
    if (fp.includes("node_modules") || fp.includes("dist") || fp.includes(".git")) continue;
    const ext = fp.split(".").pop()?.toLowerCase() ?? "";
    const lang = extMap[ext];
    if (lang) {
      counts.set(lang, (counts.get(lang) ?? 0) + 1);
      totalSourceFiles++;
    }
  }

  const languages: LanguageUsage[] = [];
  for (const [name, fileCount] of counts) {
    languages.push({
      name,
      fileCount,
      percentage: totalSourceFiles > 0 ? Math.round((fileCount / totalSourceFiles) * 100) : 0,
    });
  }

  languages.sort((a, b) => b.fileCount - a.fileCount);
  return languages;
}

/**
 * Detects frameworks from dependency lists and file paths.
 *
 * @param dependencies - Project dependency names.
 * @param filePaths - Project file paths.
 * @returns Array of detected framework names.
 */
export function detectFrameworks(
  dependencies: readonly string[],
  filePaths: readonly string[]
): string[] {
  const detected: string[] = [];
  const depsLower = new Set(dependencies.map((d) => d.toLowerCase()));
  const pathsJoined = filePaths.join("\n").toLowerCase();

  for (const fw of FRAMEWORK_INDICATORS) {
    const found = fw.indicators.some(
      (ind) => depsLower.has(ind) || pathsJoined.includes(ind)
    );
    if (found) {
      detected.push(fw.name);
    }
  }

  return detected;
}

/**
 * Classifies the project architecture type.
 *
 * @param filePaths - Project file paths.
 * @param dependencies - Project dependencies.
 * @returns Architecture type classification.
 */
export function classifyArchitecture(
  filePaths: readonly string[],
  dependencies: readonly string[]
): ArchitectureType {
  const hasPackages = filePaths.some((f) => f.startsWith("packages/"));
  const hasWorkspaceConfig = filePaths.some(
    (f) => f.includes("pnpm-workspace") || f.includes("lerna.json")
  );

  if (hasPackages || hasWorkspaceConfig) return "monorepo";

  const hasCli = dependencies.some(
    (d) => d === "commander" || d === "yargs" || d === "meow" || d === "clipanion"
  );
  if (hasCli) return "cli";

  const hasServer = dependencies.some(
    (d) => d === "express" || d === "fastify" || d === "hono" || d === "@nestjs/core"
  );
  const hasFrontend = dependencies.some(
    (d) => d === "react" || d === "vue" || d === "svelte" || d === "@angular/core"
  );

  if (hasServer && !hasFrontend) return "api";
  if (hasFrontend) return "web-app";

  const hasBin = filePaths.some((f) => f.includes("bin/"));
  if (hasBin) return "cli";

  const hasSrc = filePaths.some((f) => f.startsWith("src/"));
  if (hasSrc && !hasServer) return "library";

  return "unknown";
}

/**
 * Detects project modules from file paths (for monorepos).
 *
 * @param filePaths - All file paths.
 * @returns Array of detected project modules.
 */
export function detectModules(
  filePaths: readonly string[]
): ProjectModule[] {
  const moduleMap = new Map<string, string[]>();

  for (const fp of filePaths) {
    const match = /^packages\/([^/]+)\//.exec(fp);
    if (match) {
      const moduleName = match[1]!;
      const existing = moduleMap.get(moduleName) ?? [];
      existing.push(fp);
      moduleMap.set(moduleName, existing);
    }
  }

  const modules: ProjectModule[] = [];
  for (const [name, files] of moduleMap) {
    const sourceFiles = files.filter((f) =>
      f.endsWith(".ts") || f.endsWith(".js") || f.endsWith(".tsx") || f.endsWith(".jsx")
    );

    modules.push({
      name,
      path: `packages/${name}`,
      description: `The ${name} module`,
      fileCount: sourceFiles.length,
      dependencies: [],
    });
  }

  modules.sort((a, b) => b.fileCount - a.fileCount);
  return modules;
}

/**
 * Finds entry point files in the project.
 *
 * @param filePaths - All file paths.
 * @returns Array of entry point file paths.
 */
export function findEntryPoints(filePaths: readonly string[]): string[] {
  const entryPatterns = [
    /^src\/index\.\w+$/,
    /^src\/main\.\w+$/,
    /^src\/app\.\w+$/,
    /^index\.\w+$/,
    /^packages\/[^/]+\/src\/index\.\w+$/,
  ];

  return filePaths.filter((fp) =>
    entryPatterns.some((pattern) => pattern.test(fp))
  );
}

/**
 * Generates a complete project summary.
 *
 * @param name - Project name.
 * @param filePaths - All file paths in the project.
 * @param dependencies - Project dependency names.
 * @param readmeContent - Optional README content for context.
 * @returns Complete project summary.
 */
export function summarizeProject(
  name: string,
  filePaths: readonly string[],
  dependencies: readonly string[],
  readmeContent?: string
): ProjectSummary {
  const languages = detectLanguages(filePaths);
  const frameworks = detectFrameworks(dependencies, filePaths);
  const architecture = classifyArchitecture(filePaths, dependencies);
  const modules = detectModules(filePaths);
  const entryPoints = findEntryPoints(filePaths);

  const primaryLang = languages[0]?.name ?? "Unknown";
  const frameworkStr = frameworks.length > 0 ? frameworks.join(", ") : "none detected";

  const tagline = readmeContent
    ? extractFirstSentence(readmeContent)
    : `A ${primaryLang} ${architecture} project using ${frameworkStr}.`;

  const description =
    `${name} is a ${architecture} project primarily written in ${primaryLang}. ` +
    `It contains ${filePaths.length} files across ${modules.length || 1} module(s). ` +
    (frameworks.length > 0
      ? `Key frameworks: ${frameworkStr}.`
      : "No major frameworks detected.");

  const techStack: TechStack = {
    languages,
    frameworks,
    buildTools: detectBuildTools(filePaths, dependencies),
    testFrameworks: detectTestFrameworks(dependencies),
    packageManagers: detectPackageManagers(filePaths),
    cicdPlatforms: detectCicd(filePaths),
    databases: [],
  };

  const formattedSummary = formatSummary(name, tagline, description, architecture, techStack, modules);

  const aiPrompt = [
    `Analyze this project and provide a comprehensive summary:`,
    "",
    `Name: ${name}`,
    `Architecture: ${architecture}`,
    `Languages: ${languages.map((l) => `${l.name} (${l.percentage}%)`).join(", ")}`,
    `Frameworks: ${frameworkStr}`,
    `Modules: ${modules.map((m) => m.name).join(", ") || "single module"}`,
    readmeContent ? `\nREADME:\n${readmeContent.slice(0, 2000)}` : "",
    "",
    "Explain what this project does, who it's for, and its key architectural decisions.",
  ].join("\n");

  return {
    name,
    tagline,
    description,
    architecture,
    techStack,
    modules,
    entryPoints,
    totalFiles: filePaths.length,
    estimatedLoc: filePaths.length * 50,
    formattedSummary,
    aiPrompt,
  };
}

/**
 * Extracts the first sentence from text content.
 */
function extractFirstSentence(text: string): string {
  const cleaned = text.replace(/^#+\s*/gm, "").trim();
  const firstLine = cleaned.split("\n").find((l) => l.trim().length > 10);
  if (!firstLine) return cleaned.slice(0, 100);
  const sentence = firstLine.match(/^[^.!?]+[.!?]/);
  return sentence ? sentence[0] : firstLine.slice(0, 100);
}

/** Detects build tools. */
function detectBuildTools(filePaths: readonly string[], deps: readonly string[]): string[] {
  const tools: string[] = [];
  if (filePaths.some((f) => f.includes("tsconfig"))) tools.push("TypeScript");
  if (deps.includes("webpack")) tools.push("Webpack");
  if (deps.includes("vite")) tools.push("Vite");
  if (deps.includes("esbuild")) tools.push("esbuild");
  if (deps.includes("rollup")) tools.push("Rollup");
  return tools;
}

/** Detects test frameworks. */
function detectTestFrameworks(deps: readonly string[]): string[] {
  const fws: string[] = [];
  if (deps.includes("vitest")) fws.push("Vitest");
  if (deps.includes("jest")) fws.push("Jest");
  if (deps.includes("mocha")) fws.push("Mocha");
  return fws;
}

/** Detects package managers. */
function detectPackageManagers(filePaths: readonly string[]): string[] {
  const pms: string[] = [];
  if (filePaths.some((f) => f.includes("pnpm"))) pms.push("pnpm");
  if (filePaths.some((f) => f.includes("yarn.lock"))) pms.push("Yarn");
  if (pms.length === 0) pms.push("npm");
  return pms;
}

/** Detects CI/CD platforms. */
function detectCicd(filePaths: readonly string[]): string[] {
  const platforms: string[] = [];
  if (filePaths.some((f) => f.includes(".github/workflows"))) platforms.push("GitHub Actions");
  if (filePaths.some((f) => f.includes(".gitlab-ci"))) platforms.push("GitLab CI");
  return platforms;
}

/** Formats the summary as markdown. */
function formatSummary(
  name: string, tagline: string, description: string,
  architecture: ArchitectureType, techStack: TechStack,
  modules: readonly ProjectModule[]
): string {
  const lines = [
    `# ${name}`,
    "", tagline, "", "## Overview", description,
    "", "## Architecture", `Type: **${architecture}**`,
    "", "## Tech Stack",
    `- Languages: ${techStack.languages.map((l) => `${l.name} (${l.percentage}%)`).join(", ")}`,
    `- Frameworks: ${techStack.frameworks.join(", ") || "none"}`,
    `- Build: ${techStack.buildTools.join(", ") || "none"}`,
    `- Testing: ${techStack.testFrameworks.join(", ") || "none"}`,
  ];

  if (modules.length > 0) {
    lines.push("", "## Modules");
    for (const mod of modules) {
      lines.push(`- **${mod.name}** (${mod.fileCount} files): ${mod.description}`);
    }
  }

  return lines.join("\n");
}
