import React from "react";

export interface RepositoryFile {
  name: string;
  path: string;
  type: "file" | "dir" | "symlink";
  size?: number;
  sha?: string;
  lastCommit?: {
    message: string;
    author: string;
    date: string;
    sha: string;
  };
}

export interface RepositoryTreeProps {
  files: RepositoryFile[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onFileClick: (file: RepositoryFile) => void;
  loading?: boolean;
}

/**
 * Repository file tree browser component
 */
export const RepositoryTree: React.FC<RepositoryTreeProps> = ({
  files,
  currentPath,
  onNavigate,
  onFileClick,
  loading = false,
}) => {
  const formatSize = (bytes?: number): string => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: RepositoryFile): string => {
    if (file.type === "dir") return "/static/icons/folder.svg";
    if (file.type === "symlink") return "/static/icons/symlink.svg";
    
    const ext = file.name.split(".").pop()?.toLowerCase();
    const filename = file.name.toLowerCase();
    
    const iconMap: Record<string, string> = {
      // TypeScript/JavaScript
      ts: "/static/icons/typescript.svg",
      tsx: "/static/icons/react.svg",
      js: "/static/icons/javascript.svg",
      jsx: "/static/icons/react.svg",
      
      // Web
      html: "/static/icons/html.svg",
      css: "/static/icons/css.svg",
      scss: "/static/icons/css.svg",
      
      // Data
      json: "/static/icons/json.svg",
      yml: "/static/icons/yaml.svg",
      yaml: "/static/icons/yaml.svg",
      xml: "/static/icons/xml.svg",
      
      // Documentation
      md: "/static/icons/markdown.svg",
      markdown: "/static/icons/markdown.svg",
      
      // Programming Languages
      py: "/static/icons/python.svg",
      java: "/static/icons/java.svg",
      go: "/static/icons/go.svg",
      rs: "/static/icons/rust.svg",
      rb: "/static/icons/ruby.svg",
      php: "/static/icons/php.svg",
      c: "/static/icons/c.svg",
      cpp: "/static/icons/cpp.svg",
      cc: "/static/icons/cpp.svg",
      h: "/static/icons/c.svg",
      hpp: "/static/icons/cpp.svg",
    };
    
    // Special files
    if (filename === "dockerfile" || filename.startsWith("dockerfile.")) {
      return "/static/icons/docker.svg";
    }
    if (filename.includes(".git")) {
      return "/static/icons/git.svg";
    }
    
    return iconMap[ext || ""] || "/static/icons/file.svg";
  };

  if (loading) {
    return (
      <div className="repository-tree loading">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="repository-tree">
      <table className="file-list">
        <thead>
          <tr>
            <th>Name</th>
            <th>Last commit</th>
            <th>Author</th>
            <th>Size</th>
          </tr>
        </thead>
        <tbody>
          {currentPath !== "" && (
            <tr
              className="file-row parent-dir"
              onClick={() => {
                const parentPath = currentPath.split("/").slice(0, -1).join("/");
                onNavigate(parentPath);
              }}
            >
              <td colSpan={4}>
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  style={{ marginRight: '8px', verticalAlign: 'middle' }}
                >
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
                <span className="file-name">..</span>
              </td>
            </tr>
          )}
          {files.map((file) => (
            <tr
              key={file.path}
              className={`file-row ${file.type}`}
              onClick={() => {
                if (file.type === "dir") {
                  onNavigate(file.path);
                } else {
                  onFileClick(file);
                }
              }}
            >
              <td>
                <img 
                  src={getFileIcon(file)} 
                  alt={file.type} 
                  className="file-icon"
                  style={{ width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle' }}
                />
                <span className="file-name">{file.name}</span>
              </td>
              <td className="commit-message">
                {file.lastCommit?.message || "-"}
              </td>
              <td className="commit-author">
                {file.lastCommit?.author || "-"}
              </td>
              <td className="file-size">{formatSize(file.size)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
