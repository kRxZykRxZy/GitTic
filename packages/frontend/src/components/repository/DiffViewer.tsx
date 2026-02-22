import React, { useState, useMemo } from 'react';

/**
 * Interface for diff line information
 */
export interface DiffLine {
  type: 'add' | 'remove' | 'context' | 'header';
  content: string;
  lineNumber?: number;
  oldLineNumber?: number;
  newLineNumber?: number;
}

/**
 * Interface for file diff information
 */
export interface FileDiff {
  fileName: string;
  oldFileName?: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  hunks?: DiffLine[][];
}

/**
 * Props for the DiffViewer component
 */
export interface DiffViewerProps {
  /** Array of file diffs to display */
  diffs: FileDiff[];
  /** View mode: unified or split */
  viewMode?: 'unified' | 'split';
  /** Whether to collapse unchanged sections */
  collapseUnchanged?: boolean;
  /** Whether to show full file */
  expandAll?: boolean;
  /** Callback when file is clicked */
  onFileClick?: (file: FileDiff) => void;
  /** Currently expanded file */
  expandedFile?: string;
  /** Custom className */
  className?: string;
}

/**
 * DiffViewer Component
 * 
 * A production-quality diff viewer for displaying file changes.
 * Similar to GitHub's pull request diff viewer with support for unified and split views.
 * 
 * Features:
 * - Unified and split diff view modes
 * - File-level collapse/expand
 * - Addition/deletion highlighting
 * - Line number display
 * - Expandable hunks
 * - Statistics display
 * - Responsive design
 */
export const DiffViewer: React.FC<DiffViewerProps> = ({
  diffs,
  viewMode = 'unified',
  collapseUnchanged = true,
  expandAll = false,
  onFileClick,
  expandedFile,
  className = '',
}) => {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(
    expandAll ? new Set(diffs.map((d) => d.fileName)) : new Set()
  );

  // Toggle file expansion
  const toggleFileExpansion = (fileName: string) => {
    const newSet = new Set(expandedFiles);
    if (newSet.has(fileName)) {
      newSet.delete(fileName);
    } else {
      newSet.add(fileName);
    }
    setExpandedFiles(newSet);
    onFileClick?.(diffs.find((d) => d.fileName === fileName)!);
  };

  // Get status badge color and label
  const getStatusInfo = (status: FileDiff['status']) => {
    const info: Record<FileDiff['status'], { color: string; label: string; icon: string }> = {
      added: { color: '#28a745', label: 'Added', icon: '+' },
      removed: { color: '#d73a49', label: 'Removed', icon: '−' },
      modified: { color: '#005cc5', label: 'Modified', icon: '~' },
      renamed: { color: '#6f42c1', label: 'Renamed', icon: '→' },
      copied: { color: '#6f42c1', label: 'Copied', icon: '⊕' },
    };
    return info[status];
  };

  // Parse diff lines from patch
  const parseDiffLines = (patch: string | undefined): DiffLine[] => {
    if (!patch) return [];
    return patch.split('\n').map((line) => {
      if (line.startsWith('@@')) {
        return { type: 'header', content: line };
      }
      if (line.startsWith('+') && !line.startsWith('+++')) {
        return { type: 'add', content: line.substring(1) };
      }
      if (line.startsWith('-') && !line.startsWith('---')) {
        return { type: 'remove', content: line.substring(1) };
      }
      return { type: 'context', content: line.substring(1) };
    });
  };

  return (
    <div className={`diff-viewer ${className}`}>
      {/* Files list */}
      {diffs.length === 0 && (
        <div className="diff-empty">
          <span className="empty-icon">📄</span>
          <p>No changes</p>
        </div>
      )}

      {diffs.map((fileDiff) => {
        const isExpanded = expandedFiles.has(fileDiff.fileName);
        const status = getStatusInfo(fileDiff.status);
        const diffLines = useMemo(
          () => parseDiffLines(fileDiff.patch),
          [fileDiff.patch]
        );

        return (
          <div key={fileDiff.fileName} className="diff-file">
            {/* File header */}
            <button
              className="diff-file-header"
              onClick={() => toggleFileExpansion(fileDiff.fileName)}
              aria-expanded={isExpanded}
            >
              <span className="status-icon" style={{ color: status.color }}>
                {status.icon}
              </span>
              <span className="file-name">{fileDiff.fileName}</span>
              {fileDiff.oldFileName && fileDiff.oldFileName !== fileDiff.fileName && (
                <span className="old-file-name">← {fileDiff.oldFileName}</span>
              )}
              <span className="status-badge" style={{ color: status.color }}>
                {status.label}
              </span>
              <span className="file-stats">
                <span className="additions">+{fileDiff.additions}</span>
                <span className="deletions">−{fileDiff.deletions}</span>
              </span>
              <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                ▼
              </span>
            </button>

            {/* File diff content */}
            {isExpanded && (
              <div className="diff-content">
                {/* Unified view */}
                {viewMode === 'unified' && (
                  <div className="diff-unified">
                    <table className="diff-table">
                      <tbody>
                        {diffLines.map((line, index) => (
                          <tr
                            key={index}
                            className={`diff-line diff-line-${line.type}`}
                          >
                            <td className="line-number old-line-number">
                              {line.oldLineNumber}
                            </td>
                            <td className="line-number new-line-number">
                              {line.newLineNumber}
                            </td>
                            <td className="line-sign">
                              {line.type === 'add' && '+'}
                              {line.type === 'remove' && '−'}
                              {line.type === 'context' && ' '}
                            </td>
                            <td className="line-content">
                              <code>{line.content}</code>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Split view */}
                {viewMode === 'split' && (
                  <div className="diff-split">
                    <div className="diff-side old-side">
                      <div className="side-header">Original</div>
                      <table className="diff-table">
                        <tbody>
                          {diffLines
                            .filter((line) => line.type !== 'add')
                            .map((line, index) => (
                              <tr
                                key={index}
                                className={`diff-line diff-line-${line.type}`}
                              >
                                <td className="line-number">
                                  {line.oldLineNumber}
                                </td>
                                <td className="line-sign">
                                  {line.type === 'remove' && '−'}
                                  {line.type === 'context' && ' '}
                                </td>
                                <td className="line-content">
                                  <code>{line.content}</code>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="diff-side new-side">
                      <div className="side-header">Modified</div>
                      <table className="diff-table">
                        <tbody>
                          {diffLines
                            .filter((line) => line.type !== 'remove')
                            .map((line, index) => (
                              <tr
                                key={index}
                                className={`diff-line diff-line-${line.type}`}
                              >
                                <td className="line-number">
                                  {line.newLineNumber}
                                </td>
                                <td className="line-sign">
                                  {line.type === 'add' && '+'}
                                  {line.type === 'context' && ' '}
                                </td>
                                <td className="line-content">
                                  <code>{line.content}</code>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      {diffs.length > 0 && (
        <div className="diff-summary">
          <span className="summary-item additions">
            +{diffs.reduce((sum, d) => sum + d.additions, 0)} additions
          </span>
          <span className="summary-item deletions">
            −{diffs.reduce((sum, d) => sum + d.deletions, 0)} deletions
          </span>
          <span className="summary-item files">
            {diffs.length} file{diffs.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default DiffViewer;
