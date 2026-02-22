/**
 * File tree builder for the editor sidebar.
 * Scans directories recursively and builds a tree of FileTreeNode objects.
 */

import { basename, extname, join } from "node:path";
import type { FileTreeNode } from "../editor-config.js";

/**
 * Options for building a file tree.
 */
export interface FileTreeOptions {
  /** Maximum depth to recurse into subdirectories. */
  maxDepth: number;
  /** Patterns to exclude from the tree. */
  excludePatterns: string[];
  /** Whether to sort folders before files. */
  foldersFirst: boolean;
  /** Whether to include hidden files (starting with dot). */
  showHidden: boolean;
  /** Maximum number of children to include per directory before truncation. */
  maxChildrenPerDir: number;
}

/** Default file tree builder options. */
export const DEFAULT_FILE_TREE_OPTIONS: FileTreeOptions = {
  maxDepth: 20,
  excludePatterns: ["node_modules", ".git", "dist", "__pycache__", ".DS_Store"],
  foldersFirst: true,
  showHidden: false,
  maxChildrenPerDir: 500,
};

/**
 * A directory entry returned by directory scanning callbacks.
 */
export interface DirectoryEntry {
  /** File or directory name. */
  name: string;
  /** Whether this entry is a directory. */
  isDirectory: boolean;
  /** File size in bytes (0 for directories). */
  size: number;
  /** Last modification timestamp. */
  lastModified: number;
}

/**
 * Callback type for reading directory entries.
 * Implementors should return the entries in the given directory path.
 */
export type ReadDirFn = (dirPath: string) => Promise<DirectoryEntry[]>;

/**
 * Builds a file tree from a root directory path.
 * Uses an injected directory reader for testability and platform abstraction.
 */
export class FileTreeBuilder {
  private options: FileTreeOptions;
  private readDir: ReadDirFn;
  private compiledExcludes: RegExp[];

  constructor(readDir: ReadDirFn, options: Partial<FileTreeOptions> = {}) {
    this.readDir = readDir;
    this.options = { ...DEFAULT_FILE_TREE_OPTIONS, ...options };
    this.compiledExcludes = this.options.excludePatterns.map((p) =>
      this.patternToRegex(p)
    );
  }

  /**
   * Build a complete file tree starting from the given root path.
   */
  async buildTree(rootPath: string): Promise<FileTreeNode> {
    const rootName = basename(rootPath) || rootPath;
    const root: FileTreeNode = {
      name: rootName,
      path: rootPath,
      type: "directory",
      children: [],
    };

    await this.populateChildren(root, 0);
    return root;
  }

  /**
   * Recursively populate the children of a directory node.
   */
  private async populateChildren(node: FileTreeNode, depth: number): Promise<void> {
    if (depth >= this.options.maxDepth) return;
    if (node.type !== "directory") return;

    let entries: DirectoryEntry[];
    try {
      entries = await this.readDir(node.path);
    } catch {
      node.children = [];
      return;
    }

    const filtered = entries.filter((entry) => this.shouldInclude(entry.name));
    const sorted = this.sortEntries(filtered);
    const limited = sorted.slice(0, this.options.maxChildrenPerDir);

    node.children = limited.map((entry) => this.entryToNode(entry, node.path));

    for (const child of node.children) {
      if (child.type === "directory") {
        await this.populateChildren(child, depth + 1);
      }
    }
  }

  /**
   * Convert a directory entry to a FileTreeNode.
   */
  private entryToNode(entry: DirectoryEntry, parentPath: string): FileTreeNode {
    const fullPath = join(parentPath, entry.name);
    const node: FileTreeNode = {
      name: entry.name,
      path: fullPath,
      type: entry.isDirectory ? "directory" : "file",
      size: entry.size,
      lastModified: entry.lastModified,
    };

    if (!entry.isDirectory) {
      node.language = this.detectLanguage(entry.name);
    }

    if (entry.isDirectory) {
      node.children = [];
    }

    return node;
  }

  /**
   * Check whether a file or directory name should be included.
   */
  private shouldInclude(name: string): boolean {
    if (!this.options.showHidden && name.startsWith(".")) return false;
    for (const regex of this.compiledExcludes) {
      if (regex.test(name)) return false;
    }
    return true;
  }

  /**
   * Sort entries with folders first (if configured), then alphabetically.
   */
  private sortEntries(entries: DirectoryEntry[]): DirectoryEntry[] {
    return entries.sort((a, b) => {
      if (this.options.foldersFirst) {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  }

  /**
   * Detect the programming language from a filename extension.
   */
  private detectLanguage(filename: string): string {
    const ext = extname(filename).toLowerCase().replace(".", "");
    const langMap: Record<string, string> = {
      ts: "typescript", tsx: "typescript",
      js: "javascript", jsx: "javascript",
      py: "python", rb: "ruby",
      go: "go", rs: "rust",
      java: "java", json: "json",
      md: "markdown", css: "css",
      html: "html", yml: "yaml",
      yaml: "yaml", sql: "sql",
      sh: "shell", bash: "shell",
    };
    return langMap[ext] || "plaintext";
  }

  /**
   * Convert a glob-like pattern to a regular expression.
   */
  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    return new RegExp(`^${escaped}$`);
  }
}

/**
 * Count the total number of nodes in a file tree.
 */
export function countTreeNodes(node: FileTreeNode): number {
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countTreeNodes(child);
    }
  }
  return count;
}

/**
 * Find a node in the tree by its full path.
 */
export function findNodeByPath(
  root: FileTreeNode,
  targetPath: string
): FileTreeNode | null {
  if (root.path === targetPath) return root;
  if (!root.children) return null;
  for (const child of root.children) {
    const found = findNodeByPath(child, targetPath);
    if (found) return found;
  }
  return null;
}

/**
 * Flatten a file tree into a list of file nodes (excludes directories).
 */
export function flattenFiles(root: FileTreeNode): FileTreeNode[] {
  const files: FileTreeNode[] = [];
  const visit = (node: FileTreeNode): void => {
    if (node.type === "file") {
      files.push(node);
    }
    if (node.children) {
      for (const child of node.children) {
        visit(child);
      }
    }
  };
  visit(root);
  return files;
}
