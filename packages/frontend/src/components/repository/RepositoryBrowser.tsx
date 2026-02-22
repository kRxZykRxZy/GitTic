import React, { useState, useCallback, useMemo } from 'react';
import { BranchSelector, Branch } from './BranchSelector';
import { RepositoryBreadcrumb, BreadcrumbItem } from './RepositoryBreadcrumb';
import { CodeViewer } from './CodeViewer';

/**
 * Interface for file tree node
 */
export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: string;
  children?: FileTreeNode[];
  isLoading?: boolean;
}

/**
 * Props for the RepositoryBrowser component
 */
export interface RepositoryBrowserProps {
  /** Repository name */
  repositoryName: string;
  /** Array of branches */
  branches: Branch[];
  /** Currently selected branch */
  selectedBranch: string;
  /** Callback when branch is changed */
  onBranchChange: (branchName: string) => void;
  /** File tree structure */
  fileTree: FileTreeNode[];
  /** Callback when a file is selected */
  onFileSelect?: (file: FileTreeNode) => void;
  /** Callback to load file content */
  onLoadFile?: (path: string, branch: string) => Promise<string>;
  /** Currently selected file path */
  selectedFilePath?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Show file tree panel */
  showFileTree?: boolean;
  /** Show branch selector */
  showBranchSelector?: boolean;
  /** Callback to load directory */
  onLoadDirectory?: (path: string, branch: string) => Promise<FileTreeNode[]>;
  /** Custom className */
  className?: string;
}

/**
 * RepositoryBrowser Component
 * 
 * A complete, production-quality repository browser component.
 * Combines file tree navigation, branch selection, breadcrumb navigation, and code viewing.
 * Similar to GitHub's repository browser with full file navigation and viewing capabilities.
 * 
 * Features:
 * - File tree navigation with expand/collapse
 * - Branch selector dropdown
 * - Breadcrumb navigation for current path
 * - Code viewer for selected files
 * - Lazy loading of directories
 * - Responsive layout (sidebar + main content)
 * - Search within file tree
 * - File icons and metadata
 * - Loading and error states
 * - Keyboard navigation support
 */
export const RepositoryBrowser: React.FC<RepositoryBrowserProps> = ({
  repositoryName,
  branches,
  selectedBranch,
  onBranchChange,
  fileTree,
  onFileSelect,
  onLoadFile,
  selectedFilePath,
  isLoading = false,
  error = null,
  showFileTree = true,
  showBranchSelector = true,
  onLoadDirectory,
  className = '',
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileContentLoading, setFileContentLoading] = useState(false);
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());

  // Get current breadcrumb items from selected file path
  const breadcrumbItems = useMemo(() => {
    if (!selectedFilePath) return [];

    return selectedFilePath
      .split('/')
      .filter(Boolean)
      .map((segment, index, arr) => ({
        label: segment,
        path: '/' + arr.slice(0, index + 1).join('/'),
        icon: index === arr.length - 1 ? '📄' : '📁',
        isActive: index === arr.length - 1,
      }));
  }, [selectedFilePath]);

  // Filter file tree based on search term
  const filteredFileTree = useMemo(() => {
    if (!searchTerm) return fileTree;

    const filterNode = (node: FileTreeNode): FileTreeNode | null => {
      const nameMatches = node.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const filteredChildren = node.children
        ?.map(filterNode)
        .filter((child): child is FileTreeNode => child !== null);

      if (nameMatches || (filteredChildren && filteredChildren.length > 0)) {
        return {
          ...node,
          children: filteredChildren || node.children,
        };
      }

      return null;
    };

    return fileTree
      .map(filterNode)
      .filter((node): node is FileTreeNode => node !== null);
  }, [fileTree, searchTerm]);

  // Handle file/directory click
  const handleNodeClick = useCallback(
    async (node: FileTreeNode) => {
      if (node.type === 'file') {
        // Load file content
        setFileContentLoading(true);
        try {
          if (onLoadFile) {
            const content = await onLoadFile(node.path, selectedBranch);
            setFileContent(content);
          }
          onFileSelect?.(node);
        } catch (err) {
          console.error('Failed to load file:', err);
        } finally {
          setFileContentLoading(false);
        }
      } else if (node.type === 'directory') {
        // Toggle directory expansion
        const newSet = new Set(expandedPaths);
        if (newSet.has(node.path)) {
          newSet.delete(node.path);
        } else {
          // Load directory contents if not already expanded
          if (!node.children || node.children.length === 0) {
            loadDirectory(node.path);
          }
          newSet.add(node.path);
        }
        setExpandedPaths(newSet);
      }
    },
    [expandedPaths, onLoadFile, selectedBranch, onFileSelect]
  );

  // Load directory contents
  const loadDirectory = useCallback(
    async (path: string) => {
      setLoadingPaths((prev) => new Set([...prev, path]));
      try {
        if (onLoadDirectory) {
          await onLoadDirectory(path, selectedBranch);
        }
      } catch (err) {
        console.error('Failed to load directory:', err);
      } finally {
        setLoadingPaths((prev) => {
          const newSet = new Set(prev);
          newSet.delete(path);
          return newSet;
        });
      }
    },
    [selectedBranch, onLoadDirectory]
  );

  // Detect file language from extension
  const getFileLanguage = (filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      go: 'go',
      rs: 'rust',
      rb: 'ruby',
      php: 'php',
      swift: 'swift',
      kt: 'kotlin',
      cs: 'csharp',
      html: 'html',
      css: 'css',
      json: 'json',
      xml: 'xml',
      yml: 'yaml',
      yaml: 'yaml',
      md: 'markdown',
      sh: 'bash',
      sql: 'sql',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  // Get file icon
  const getFileIcon = (path: string, type: 'file' | 'directory'): string => {
    if (type === 'directory') return '📁';

    const ext = path.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      js: '📜',
      jsx: '⚛️',
      ts: '📘',
      tsx: '⚛️',
      py: '🐍',
      java: '☕',
      cpp: '➕',
      go: '🐹',
      rs: '🦀',
      rb: '💎',
      php: '🐘',
      html: '🌐',
      css: '🎨',
      json: '{ }',
      md: '📝',
      git: '🌳',
      lock: '🔒',
    };
    return iconMap[ext || ''] || '📄';
  };

  // Render file tree recursively
  const renderFileTree = (nodes: FileTreeNode[], depth: number = 0): React.ReactNode => {
    return (
      <ul className="file-tree-list" role="list">
        {nodes.map((node) => {
          const isExpanded = expandedPaths.has(node.path);
          const isSelected = node.path === selectedFilePath;
          const isLoading = loadingPaths.has(node.path);

          return (
            <li
              key={node.path}
              className={`file-tree-item ${isSelected ? 'selected' : ''}`}
            >
              <button
                className={`file-tree-button ${node.type === 'directory' ? 'directory' : 'file'}`}
                onClick={() => handleNodeClick(node)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNodeClick(node);
                  }
                }}
                style={{ paddingLeft: `${depth * 16}px` }}
                title={node.path}
              >
                {node.type === 'directory' && (
                  <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                    {isLoading ? '⏳' : '▶️'}
                  </span>
                )}
                <span className="file-icon">
                  {getFileIcon(node.path, node.type)}
                </span>
                <span className="file-name">{node.name}</span>
                {node.size && node.type === 'file' && (
                  <span className="file-size">
                    {(node.size / 1024).toFixed(1)}KB
                  </span>
                )}
              </button>

              {/* Nested items */}
              {node.type === 'directory' &&
                isExpanded &&
                node.children &&
                node.children.length > 0 && (
                  <div className="file-tree-nested">
                    {renderFileTree(node.children, depth + 1)}
                  </div>
                )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className={`repository-browser ${className}`}>
      {/* Header */}
      <div className="browser-header">
        <div className="header-title">
          <span className="repo-icon">🏢</span>
          <h1>{repositoryName}</h1>
        </div>
        {showBranchSelector && (
          <BranchSelector
            branches={branches}
            selectedBranch={selectedBranch}
            onBranchChange={onBranchChange}
          />
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="browser-error" role="alert">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Main content */}
      <div className="browser-content">
        {/* File tree sidebar */}
        {showFileTree && (
          <aside className="file-tree-sidebar">
            <div className="file-tree-header">
              <h2>Files</h2>
              <input
                type="text"
                className="file-search-input"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search files"
              />
            </div>

            {isLoading ? (
              <div className="file-tree-loading">
                <span className="loading-spinner">⏳</span> Loading...
              </div>
            ) : filteredFileTree.length > 0 ? (
              <div className="file-tree-container">
                {renderFileTree(filteredFileTree)}
              </div>
            ) : (
              <div className="file-tree-empty">
                {searchTerm ? `No files match "${searchTerm}"` : 'No files found'}
              </div>
            )}
          </aside>
        )}

        {/* Main editor/viewer area */}
        <main className="browser-main">
          {selectedFilePath ? (
            <>
              {/* Breadcrumb */}
              <RepositoryBreadcrumb items={breadcrumbItems} />

              {/* File viewer */}
              {fileContentLoading ? (
                <div className="file-loading">
                  <span className="loading-spinner">⏳</span> Loading file...
                </div>
              ) : (
                <CodeViewer
                  code={fileContent}
                  language={getFileLanguage(selectedFilePath)}
                  filePath={selectedFilePath}
                  showLineNumbers={true}
                  showCopyButton={true}
                />
              )}
            </>
          ) : (
            <div className="browser-empty">
              <span className="empty-icon">📂</span>
              <h2>Select a file to view</h2>
              <p>Choose a file from the tree to display its contents</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default RepositoryBrowser;
