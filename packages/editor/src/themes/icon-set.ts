/**
 * File icon mapping for the editor file tree and tab bar.
 * Maps file extensions, filenames, and folder names to icon identifiers.
 */

/**
 * Types of icons available.
 */
export type IconKind = "file" | "folder" | "folder-open";

/**
 * An icon definition with identifier and optional color.
 */
export interface FileIcon {
  /** Unique icon identifier (e.g., "typescript", "folder-node-modules"). */
  id: string;
  /** Display-friendly icon label. */
  label: string;
  /** Kind of icon. */
  kind: IconKind;
  /** Suggested icon color (hex). */
  color: string;
}

/**
 * An icon mapping rule that matches files/folders to icons.
 */
export interface IconRule {
  /** Pattern type to match against. */
  matchType: "extension" | "filename" | "foldername";
  /** The pattern to match (e.g., ".ts", "package.json", "node_modules"). */
  pattern: string;
  /** The icon to use when matched. */
  icon: FileIcon;
}

/** Default file icon for unrecognized files. */
export const DEFAULT_FILE_ICON: FileIcon = {
  id: "file-default",
  label: "File",
  kind: "file",
  color: "#cccccc",
};

/** Default folder icon. */
export const DEFAULT_FOLDER_ICON: FileIcon = {
  id: "folder-default",
  label: "Folder",
  kind: "folder",
  color: "#dcb67a",
};

/** Default open folder icon. */
export const DEFAULT_FOLDER_OPEN_ICON: FileIcon = {
  id: "folder-open-default",
  label: "Folder (Open)",
  kind: "folder-open",
  color: "#dcb67a",
};

/**
 * Built-in icon mappings for common file extensions.
 */
const EXTENSION_ICONS: Record<string, FileIcon> = {
  ".ts": { id: "typescript", label: "TypeScript", kind: "file", color: "#3178c6" },
  ".tsx": { id: "typescript-react", label: "TypeScript React", kind: "file", color: "#3178c6" },
  ".js": { id: "javascript", label: "JavaScript", kind: "file", color: "#f7df1e" },
  ".jsx": { id: "javascript-react", label: "JavaScript React", kind: "file", color: "#61dafb" },
  ".json": { id: "json", label: "JSON", kind: "file", color: "#cbcb41" },
  ".md": { id: "markdown", label: "Markdown", kind: "file", color: "#519aba" },
  ".py": { id: "python", label: "Python", kind: "file", color: "#3776ab" },
  ".rb": { id: "ruby", label: "Ruby", kind: "file", color: "#cc342d" },
  ".go": { id: "go", label: "Go", kind: "file", color: "#00add8" },
  ".rs": { id: "rust", label: "Rust", kind: "file", color: "#dea584" },
  ".java": { id: "java", label: "Java", kind: "file", color: "#ea2d2e" },
  ".css": { id: "css", label: "CSS", kind: "file", color: "#563d7c" },
  ".scss": { id: "scss", label: "SCSS", kind: "file", color: "#cd6799" },
  ".html": { id: "html", label: "HTML", kind: "file", color: "#e34c26" },
  ".vue": { id: "vue", label: "Vue", kind: "file", color: "#41b883" },
  ".svelte": { id: "svelte", label: "Svelte", kind: "file", color: "#ff3e00" },
  ".yaml": { id: "yaml", label: "YAML", kind: "file", color: "#cb171e" },
  ".yml": { id: "yaml", label: "YAML", kind: "file", color: "#cb171e" },
  ".toml": { id: "toml", label: "TOML", kind: "file", color: "#9c4121" },
  ".sql": { id: "sql", label: "SQL", kind: "file", color: "#e38c00" },
  ".sh": { id: "shell", label: "Shell Script", kind: "file", color: "#89e051" },
  ".bash": { id: "shell", label: "Bash Script", kind: "file", color: "#89e051" },
  ".xml": { id: "xml", label: "XML", kind: "file", color: "#e37933" },
  ".svg": { id: "svg", label: "SVG", kind: "file", color: "#ffb13b" },
  ".png": { id: "image", label: "PNG Image", kind: "file", color: "#a074c4" },
  ".jpg": { id: "image", label: "JPEG Image", kind: "file", color: "#a074c4" },
  ".gif": { id: "image", label: "GIF Image", kind: "file", color: "#a074c4" },
  ".lock": { id: "lock", label: "Lock File", kind: "file", color: "#776d6a" },
  ".env": { id: "env", label: "Environment", kind: "file", color: "#ecd53f" },
  ".graphql": { id: "graphql", label: "GraphQL", kind: "file", color: "#e535ab" },
  ".proto": { id: "protobuf", label: "Protocol Buffers", kind: "file", color: "#4285f4" },
};

/**
 * Built-in icon mappings for special file names.
 */
const FILENAME_ICONS: Record<string, FileIcon> = {
  "package.json": { id: "npm", label: "npm Package", kind: "file", color: "#cb3837" },
  "tsconfig.json": { id: "tsconfig", label: "TypeScript Config", kind: "file", color: "#3178c6" },
  "dockerfile": { id: "docker", label: "Dockerfile", kind: "file", color: "#2496ed" },
  "docker-compose.yml": { id: "docker-compose", label: "Docker Compose", kind: "file", color: "#2496ed" },
  "docker-compose.yaml": { id: "docker-compose", label: "Docker Compose", kind: "file", color: "#2496ed" },
  ".gitignore": { id: "git", label: "Git Ignore", kind: "file", color: "#f05032" },
  ".eslintrc.json": { id: "eslint", label: "ESLint Config", kind: "file", color: "#4b32c3" },
  ".prettierrc": { id: "prettier", label: "Prettier Config", kind: "file", color: "#56b3b4" },
  "readme.md": { id: "readme", label: "README", kind: "file", color: "#519aba" },
  "license": { id: "license", label: "License", kind: "file", color: "#d0bf41" },
  "makefile": { id: "makefile", label: "Makefile", kind: "file", color: "#6d8086" },
  ".env.local": { id: "env", label: "Local Environment", kind: "file", color: "#ecd53f" },
  "vite.config.ts": { id: "vite", label: "Vite Config", kind: "file", color: "#646cff" },
  "vitest.config.ts": { id: "vitest", label: "Vitest Config", kind: "file", color: "#729b1b" },
};

/**
 * Built-in icon mappings for special folder names.
 */
const FOLDER_ICONS: Record<string, FileIcon> = {
  "node_modules": { id: "folder-node", label: "Node Modules", kind: "folder", color: "#8bc34a" },
  ".git": { id: "folder-git", label: "Git", kind: "folder", color: "#f05032" },
  "src": { id: "folder-src", label: "Source", kind: "folder", color: "#42a5f5" },
  "dist": { id: "folder-dist", label: "Distribution", kind: "folder", color: "#ff9800" },
  "test": { id: "folder-test", label: "Tests", kind: "folder", color: "#66bb6a" },
  "tests": { id: "folder-test", label: "Tests", kind: "folder", color: "#66bb6a" },
  "__tests__": { id: "folder-test", label: "Tests", kind: "folder", color: "#66bb6a" },
  "public": { id: "folder-public", label: "Public", kind: "folder", color: "#42a5f5" },
  "assets": { id: "folder-assets", label: "Assets", kind: "folder", color: "#7e57c2" },
  "config": { id: "folder-config", label: "Config", kind: "folder", color: "#78909c" },
  "docs": { id: "folder-docs", label: "Documentation", kind: "folder", color: "#42a5f5" },
  "scripts": { id: "folder-scripts", label: "Scripts", kind: "folder", color: "#66bb6a" },
  ".github": { id: "folder-github", label: "GitHub", kind: "folder", color: "#24292e" },
  "packages": { id: "folder-packages", label: "Packages", kind: "folder", color: "#f44336" },
  "components": { id: "folder-components", label: "Components", kind: "folder", color: "#42a5f5" },
  "hooks": { id: "folder-hooks", label: "Hooks", kind: "folder", color: "#7b1fa2" },
  "utils": { id: "folder-utils", label: "Utilities", kind: "folder", color: "#78909c" },
  "types": { id: "folder-types", label: "Types", kind: "folder", color: "#3178c6" },
};

/**
 * Icon set manager for resolving file and folder icons.
 */
export class IconSet {
  private extensionOverrides = new Map<string, FileIcon>();
  private filenameOverrides = new Map<string, FileIcon>();
  private folderOverrides = new Map<string, FileIcon>();

  /**
   * Get the icon for a file based on its name and extension.
   */
  getFileIcon(fileName: string): FileIcon {
    const lowerName = fileName.toLowerCase();

    // Check filename overrides first
    const nameOverride = this.filenameOverrides.get(lowerName);
    if (nameOverride) return nameOverride;

    // Check built-in filename icons
    const builtinName = FILENAME_ICONS[lowerName];
    if (builtinName) return builtinName;

    // Check extension
    const ext = this.extractExtension(lowerName);
    if (ext) {
      const extOverride = this.extensionOverrides.get(ext);
      if (extOverride) return extOverride;

      const builtinExt = EXTENSION_ICONS[ext];
      if (builtinExt) return builtinExt;
    }

    return DEFAULT_FILE_ICON;
  }

  /**
   * Get the icon for a folder based on its name.
   */
  getFolderIcon(folderName: string, isOpen: boolean = false): FileIcon {
    const lowerName = folderName.toLowerCase();

    const override = this.folderOverrides.get(lowerName);
    if (override) {
      return isOpen ? { ...override, kind: "folder-open" } : override;
    }

    const builtin = FOLDER_ICONS[lowerName];
    if (builtin) {
      return isOpen ? { ...builtin, kind: "folder-open" } : builtin;
    }

    return isOpen ? DEFAULT_FOLDER_OPEN_ICON : DEFAULT_FOLDER_ICON;
  }

  /**
   * Register a custom icon for a file extension.
   */
  setExtensionIcon(extension: string, icon: FileIcon): void {
    const ext = extension.startsWith(".") ? extension : `.${extension}`;
    this.extensionOverrides.set(ext.toLowerCase(), icon);
  }

  /**
   * Register a custom icon for a specific filename.
   */
  setFilenameIcon(filename: string, icon: FileIcon): void {
    this.filenameOverrides.set(filename.toLowerCase(), icon);
  }

  /**
   * Register a custom icon for a folder name.
   */
  setFolderIcon(folderName: string, icon: FileIcon): void {
    this.folderOverrides.set(folderName.toLowerCase(), icon);
  }

  /**
   * Get all known file extension to icon mappings.
   */
  getAllExtensionIcons(): Record<string, FileIcon> {
    const merged = { ...EXTENSION_ICONS };
    for (const [ext, icon] of this.extensionOverrides) {
      merged[ext] = icon;
    }
    return merged;
  }

  /**
   * Extract the file extension including the dot.
   */
  private extractExtension(fileName: string): string | null {
    const lastDot = fileName.lastIndexOf(".");
    if (lastDot <= 0) return null;
    return fileName.substring(lastDot);
  }
}
