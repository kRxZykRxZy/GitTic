/**
 * Language server proxy configuration.
 * Handles proxying LSP messages between the Monaco editor and language servers.
 */

export interface LanguageServerConfig {
  language: string;
  command: string;
  args: string[];
  rootUri?: string;
}

export interface LspMessage {
  jsonrpc: "2.0";
  id?: number | string;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

/**
 * Supported language servers and their default configurations.
 */
export const DEFAULT_LANGUAGE_SERVERS: Record<string, Omit<LanguageServerConfig, "rootUri">> = {
  typescript: {
    language: "typescript",
    command: "typescript-language-server",
    args: ["--stdio"],
  },
  python: {
    language: "python",
    command: "pyright-langserver",
    args: ["--stdio"],
  },
  go: {
    language: "go",
    command: "gopls",
    args: ["serve"],
  },
  rust: {
    language: "rust",
    command: "rust-analyzer",
    args: [],
  },
  json: {
    language: "json",
    command: "vscode-json-language-server",
    args: ["--stdio"],
  },
  html: {
    language: "html",
    command: "vscode-html-language-server",
    args: ["--stdio"],
  },
  css: {
    language: "css",
    command: "vscode-css-language-server",
    args: ["--stdio"],
  },
};

/**
 * Get language server config for a given language.
 */
export function getLanguageServerConfig(
  language: string,
  rootUri: string
): LanguageServerConfig | null {
  const config = DEFAULT_LANGUAGE_SERVERS[language];
  if (!config) return null;
  return { ...config, rootUri };
}
