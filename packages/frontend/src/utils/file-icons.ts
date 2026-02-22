/**
 * File icon utilities for GitTic
 * Maps file extensions and types to SVG icon paths
 */

export type FileType = "file" | "dir" | "symlink";

export interface FileIconConfig {
    filename: string;
    type?: FileType;
    extension?: string;
}

/**
 * Get the appropriate icon path for a file
 */
export function getFileIcon(config: FileIconConfig): string {
    const { filename, type, extension } = config;

    // Handle directories and symlinks
    if (type === "dir") return "/static/icons/folder.svg";
    if (type === "symlink") return "/static/icons/symlink.svg";

    const ext = (extension || filename.split(".").pop() || "").toLowerCase();
    const name = filename.toLowerCase();

    // TypeScript/JavaScript
    if (ext === "ts") return "/static/icons/typescript.svg";
    if (ext === "tsx") return "/static/icons/react.svg";
    if (ext === "js") return "/static/icons/javascript.svg";
    if (ext === "jsx") return "/static/icons/react.svg";

    // Web
    if (ext === "html" || ext === "htm") return "/static/icons/html.svg";
    if (ext === "css" || ext === "scss" || ext === "sass" || ext === "less") {
        return "/static/icons/css.svg";
    }

    // Data formats
    if (ext === "json") return "/static/icons/json.svg";
    if (ext === "yml" || ext === "yaml") return "/static/icons/yaml.svg";
    if (ext === "xml") return "/static/icons/xml.svg";

    // Documentation
    if (ext === "md" || ext === "markdown") return "/static/icons/markdown.svg";

    // Programming Languages
    if (ext === "py" || ext === "pyw") return "/static/icons/python.svg";
    if (ext === "java" || ext === "class") return "/static/icons/java.svg";
    if (ext === "go") return "/static/icons/go.svg";
    if (ext === "rs") return "/static/icons/rust.svg";
    if (ext === "rb") return "/static/icons/ruby.svg";
    if (ext === "php") return "/static/icons/php.svg";
    if (ext === "c" || ext === "h") return "/static/icons/c.svg";
    if (ext === "cpp" || ext === "cc" || ext === "cxx" || ext === "hpp" || ext === "hxx") {
        return "/static/icons/cpp.svg";
    }

    // Special files by name
    if (name === "dockerfile" || name.startsWith("dockerfile.")) {
        return "/static/icons/docker.svg";
    }
    if (name.startsWith(".git") || name === "gitignore" || name === ".gitignore") {
        return "/static/icons/git.svg";
    }

    // Default
    return "/static/icons/file.svg";
}

/**
 * Get a user-friendly description of the file type
 */
export function getFileTypeDescription(config: FileIconConfig): string {
    const { filename, type } = config;

    if (type === "dir") return "Directory";
    if (type === "symlink") return "Symbolic Link";

    const ext = (filename.split(".").pop() || "").toLowerCase();
    const name = filename.toLowerCase();

    const descriptions: Record<string, string> = {
        // Web & Data
        html: "HTML Document",
        css: "CSS Stylesheet",
        scss: "SCSS Stylesheet",
        js: "JavaScript",
        jsx: "React JavaScript",
        ts: "TypeScript",
        tsx: "React TypeScript",
        json: "JSON Data",
        xml: "XML Document",
        yml: "YAML Configuration",
        yaml: "YAML Configuration",
        md: "Markdown Document",

        // Programming Languages
        py: "Python",
        java: "Java",
        go: "Go",
        rs: "Rust",
        rb: "Ruby",
        php: "PHP",
        c: "C",
        cpp: "C++",
        h: "C Header",
        hpp: "C++ Header",

        // Special
        dockerfile: "Docker Configuration",
    };

    if (name === "dockerfile" || name.startsWith("dockerfile.")) {
        return "Docker Configuration";
    }

    return descriptions[ext] || "File";
}

/**
 * Get the language name for syntax highlighting
 */
export function getLanguageFromExtension(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() || "";

    const languageMap: Record<string, string> = {
        ts: "typescript",
        tsx: "typescript",
        js: "javascript",
        jsx: "javascript",
        py: "python",
        java: "java",
        go: "go",
        rs: "rust",
        rb: "ruby",
        php: "php",
        c: "c",
        cpp: "cpp",
        cc: "cpp",
        h: "c",
        hpp: "cpp",
        html: "html",
        css: "css",
        scss: "scss",
        json: "json",
        xml: "xml",
        yml: "yaml",
        yaml: "yaml",
        md: "markdown",
        sh: "bash",
        bash: "bash",
    };

    return languageMap[ext] || "plaintext";
}
