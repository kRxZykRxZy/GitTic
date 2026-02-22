/**
 * README generator module.
 *
 * Generates comprehensive README.md content from codebase analysis,
 * including project description, installation, usage, and API reference.
 *
 * @module generation/readme-generator
 */

/**
 * Information about a project used to generate the README.
 */
export interface ProjectInfo {
  /** Project name from package.json. */
  readonly name: string;
  /** Project version. */
  readonly version: string;
  /** Short description. */
  readonly description: string;
  /** Package manager used. */
  readonly packageManager: "npm" | "pnpm" | "yarn" | "bun";
  /** Main entry point file. */
  readonly entryPoint: string;
  /** License identifier. */
  readonly license?: string;
  /** Repository URL. */
  readonly repositoryUrl?: string;
  /** Available npm scripts. */
  readonly scripts: Record<string, string>;
  /** Runtime dependencies. */
  readonly dependencies: readonly string[];
  /** Dev dependencies. */
  readonly devDependencies: readonly string[];
  /** Whether the project uses TypeScript. */
  readonly isTypeScript: boolean;
}

/**
 * An exported API member for documentation.
 */
export interface ApiMember {
  /** Member name. */
  readonly name: string;
  /** Member type (function, class, interface, constant). */
  readonly kind: "function" | "class" | "interface" | "type" | "constant";
  /** Brief description. */
  readonly description: string;
  /** Source file path. */
  readonly filePath: string;
  /** Signature or type definition. */
  readonly signature?: string;
}

/**
 * Configuration for README generation.
 */
export interface ReadmeConfig {
  /** Sections to include in the README. */
  readonly sections: readonly ReadmeSection[];
  /** Whether to include badges. */
  readonly includeBadges: boolean;
  /** Whether to include table of contents. */
  readonly includeToc: boolean;
  /** Whether to include contributing section. */
  readonly includeContributing: boolean;
  /** Custom header content. */
  readonly headerContent?: string;
}

/**
 * Available README sections.
 */
export type ReadmeSection =
  | "description"
  | "installation"
  | "usage"
  | "api"
  | "scripts"
  | "dependencies"
  | "contributing"
  | "license";

/**
 * Default README configuration.
 */
export const DEFAULT_README_CONFIG: ReadmeConfig = {
  sections: [
    "description",
    "installation",
    "usage",
    "api",
    "scripts",
    "license",
  ],
  includeBadges: true,
  includeToc: true,
  includeContributing: false,
} as const;

/**
 * Generates the title and badges section.
 *
 * @param info - Project information.
 * @param config - README configuration.
 * @returns Formatted title section.
 */
export function generateTitleSection(
  info: ProjectInfo,
  config: ReadmeConfig
): string {
  const lines: string[] = [`# ${info.name}`];

  if (config.includeBadges) {
    const badges: string[] = [];
    badges.push(`![Version](https://img.shields.io/badge/version-${info.version}-blue)`);
    if (info.license) {
      badges.push(`![License](https://img.shields.io/badge/license-${info.license}-green)`);
    }
    if (info.isTypeScript) {
      badges.push("![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)");
    }
    lines.push("", badges.join(" "));
  }

  return lines.join("\n");
}

/**
 * Generates the description section.
 *
 * @param info - Project information.
 * @returns Formatted description section.
 */
export function generateDescriptionSection(info: ProjectInfo): string {
  return [
    "## Description",
    "",
    info.description || `${info.name} is a project built with ${info.isTypeScript ? "TypeScript" : "JavaScript"}.`,
  ].join("\n");
}

/**
 * Generates the installation section.
 *
 * @param info - Project information.
 * @returns Formatted installation section.
 */
export function generateInstallationSection(info: ProjectInfo): string {
  const installCmd = getInstallCommand(info.packageManager, info.name);
  const lines: string[] = [
    "## Installation",
    "",
    "```bash",
    installCmd,
    "```",
  ];

  if (info.isTypeScript) {
    lines.push("", "This package includes TypeScript type definitions.");
  }

  return lines.join("\n");
}

/**
 * Returns the appropriate install command for a package manager.
 *
 * @param pm - Package manager identifier.
 * @param name - Package name.
 * @returns Install command string.
 */
export function getInstallCommand(
  pm: "npm" | "pnpm" | "yarn" | "bun",
  name: string
): string {
  switch (pm) {
    case "npm":
      return `npm install ${name}`;
    case "pnpm":
      return `pnpm add ${name}`;
    case "yarn":
      return `yarn add ${name}`;
    case "bun":
      return `bun add ${name}`;
  }
}

/**
 * Generates the usage section with examples.
 *
 * @param info - Project information.
 * @param apiMembers - Exported API members.
 * @returns Formatted usage section.
 */
export function generateUsageSection(
  info: ProjectInfo,
  apiMembers: readonly ApiMember[]
): string {
  const lang = info.isTypeScript ? "typescript" : "javascript";
  const importStatement = info.isTypeScript
    ? `import { ${apiMembers.slice(0, 3).map((m) => m.name).join(", ")} } from "${info.name}";`
    : `const { ${apiMembers.slice(0, 3).map((m) => m.name).join(", ")} } = require("${info.name}");`;

  const lines: string[] = [
    "## Usage",
    "",
    `\`\`\`${lang}`,
    importStatement,
    "```",
  ];

  const functions = apiMembers.filter((m) => m.kind === "function");
  if (functions.length > 0) {
    lines.push("", "### Examples", "");
    for (const func of functions.slice(0, 5)) {
      lines.push(`#### \`${func.name}\``);
      lines.push("");
      lines.push(func.description);
      if (func.signature) {
        lines.push("", `\`\`\`${lang}`, func.signature, "```");
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Generates the API reference section.
 *
 * @param apiMembers - All exported API members.
 * @returns Formatted API reference section.
 */
export function generateApiSection(
  apiMembers: readonly ApiMember[]
): string {
  const lines: string[] = ["## API Reference", ""];

  const grouped = new Map<string, ApiMember[]>();
  for (const member of apiMembers) {
    const kind = member.kind;
    const existing = grouped.get(kind) ?? [];
    existing.push(member);
    grouped.set(kind, existing);
  }

  const kindOrder: readonly string[] = [
    "class",
    "function",
    "interface",
    "type",
    "constant",
  ];

  for (const kind of kindOrder) {
    const members = grouped.get(kind);
    if (!members || members.length === 0) continue;

    lines.push(
      `### ${kind.charAt(0).toUpperCase() + kind.slice(1)}s`,
      ""
    );

    lines.push("| Name | Description | Source |");
    lines.push("|------|-------------|--------|");

    for (const member of members) {
      const desc = member.description.slice(0, 80);
      lines.push(`| \`${member.name}\` | ${desc} | \`${member.filePath}\` |`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Generates the scripts section.
 *
 * @param scripts - Available npm scripts.
 * @returns Formatted scripts section.
 */
export function generateScriptsSection(
  scripts: Record<string, string>
): string {
  const entries = Object.entries(scripts);
  if (entries.length === 0) return "";

  const lines: string[] = ["## Scripts", ""];
  lines.push("| Script | Command |");
  lines.push("|--------|---------|");

  for (const [name, command] of entries) {
    lines.push(`| \`${name}\` | \`${command}\` |`);
  }

  return lines.join("\n");
}

/**
 * Generates the license section.
 *
 * @param license - License identifier.
 * @returns Formatted license section.
 */
export function generateLicenseSection(license?: string): string {
  if (!license) {
    return "## License\n\nSee [LICENSE](./LICENSE) for details.";
  }
  return `## License\n\nThis project is licensed under the ${license} License.`;
}

/**
 * Generates a table of contents from section headers.
 *
 * @param content - Full README content.
 * @returns Table of contents markdown.
 */
export function generateToc(content: string): string {
  const headers = content.match(/^## .+$/gm) ?? [];
  const tocLines: string[] = ["## Table of Contents", ""];

  for (const header of headers) {
    const text = header.replace(/^## /, "");
    const anchor = text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
    tocLines.push(`- [${text}](#${anchor})`);
  }

  return tocLines.join("\n");
}

/**
 * Generates a complete README from project information.
 *
 * @param info - Project information.
 * @param apiMembers - Exported API members.
 * @param config - README generation configuration.
 * @returns Complete README markdown content.
 */
export function generateReadme(
  info: ProjectInfo,
  apiMembers: readonly ApiMember[] = [],
  config: ReadmeConfig = DEFAULT_README_CONFIG
): string {
  const parts: string[] = [generateTitleSection(info, config)];

  const sectionGenerators: Record<ReadmeSection, () => string> = {
    description: () => generateDescriptionSection(info),
    installation: () => generateInstallationSection(info),
    usage: () => generateUsageSection(info, apiMembers),
    api: () => generateApiSection(apiMembers),
    scripts: () => generateScriptsSection(info.scripts),
    dependencies: () => {
      const deps = info.dependencies;
      if (deps.length === 0) return "";
      return "## Dependencies\n\n" + deps.map((d) => `- \`${d}\``).join("\n");
    },
    contributing: () =>
      "## Contributing\n\nContributions are welcome! Please open an issue or submit a pull request.",
    license: () => generateLicenseSection(info.license),
  };

  for (const section of config.sections) {
    const generator = sectionGenerators[section];
    const content = generator();
    if (content) {
      parts.push(content);
    }
  }

  let readme = parts.join("\n\n");

  if (config.includeToc) {
    const toc = generateToc(readme);
    const titleEnd = readme.indexOf("\n\n") + 2;
    readme = readme.slice(0, titleEnd) + toc + "\n\n" + readme.slice(titleEnd);
  }

  return readme;
}
