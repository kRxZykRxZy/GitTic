/**
 * File tree node structure for the editor sidebar.
 */
export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
  size?: number;
  lastModified?: number;
  language?: string;
}

/**
 * Determine language from file extension for Monaco editor.
 */
export function getLanguageFromExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    md: "markdown",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
    cs: "csharp",
    css: "css",
    scss: "scss",
    less: "less",
    html: "html",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    sql: "sql",
    sh: "shell",
    bash: "shell",
    dockerfile: "dockerfile",
    makefile: "makefile",
    graphql: "graphql",
    vue: "vue",
    svelte: "svelte",
    php: "php",
    swift: "swift",
    kt: "kotlin",
    lua: "lua",
    r: "r",
    dart: "dart",
    ex: "elixir",
    erl: "erlang",
    hs: "haskell",
    scala: "scala",
    clj: "clojure",
  };
  return languageMap[ext || ""] || "plaintext";
}

/**
 * Monaco editor configuration for the platform.
 */
export interface EditorConfig {
  theme: "vs-dark" | "vs-light" | "hc-black";
  fontSize: number;
  tabSize: number;
  wordWrap: "on" | "off" | "wordWrapColumn";
  minimap: boolean;
  lineNumbers: "on" | "off" | "relative";
  autoSave: boolean;
  autoSaveDelay: number;
  formatOnSave: boolean;
}

export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  theme: "vs-dark",
  fontSize: 14,
  tabSize: 2,
  wordWrap: "on",
  minimap: true,
  lineNumbers: "on",
  autoSave: true,
  autoSaveDelay: 1000,
  formatOnSave: true,
};

/**
 * Editor panel types for the IDE layout.
 */
export type EditorPanel = "fileTree" | "gitPanel" | "terminalPanel" | "aiChat" | "search";

export interface EditorLayout {
  sidebarPanel: EditorPanel | null;
  sidebarWidth: number;
  terminalHeight: number;
  terminalVisible: boolean;
}

export const DEFAULT_EDITOR_LAYOUT: EditorLayout = {
  sidebarPanel: "fileTree",
  sidebarWidth: 260,
  terminalHeight: 200,
  terminalVisible: false,
};
