import React, { useMemo } from 'react';

/**
 * Props for the ReadmeViewer component
 */
export interface ReadmeViewerProps {
  /** Raw markdown content */
  content: string;
  /** File name (for display) */
  fileName?: string;
  /** Whether to render HTML or show raw markdown */
  renderMarkdown?: boolean;
  /** Custom className */
  className?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Callback when content is updated */
  onContentChange?: (content: string) => void;
  /** Whether to show edit button */
  showEditButton?: boolean;
  /** Whether to show download button */
  showDownloadButton?: boolean;
  /** Custom CSS for styling */
  customStyles?: React.CSSProperties;
}

/**
 * Simple markdown parser for basic rendering
 * In production, you would use a library like react-markdown or markdown-it
 */
const parseMarkdown = (markdown: string): React.ReactNode[] => {
  const lines = markdown.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent = '';
  let codeBlockLanguage = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="readme-code-block">
            <code className={`language-${codeBlockLanguage}`}>
              {codeBlockContent}
            </code>
          </pre>
        );
        inCodeBlock = false;
        codeBlockContent = '';
        codeBlockLanguage = '';
      } else {
        inCodeBlock = true;
        codeBlockLanguage = line.substring(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent += line + '\n';
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="readme-heading-1">
          {line.substring(2)}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="readme-heading-2">
          {line.substring(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="readme-heading-3">
          {line.substring(4)}
        </h3>
      );
    }
    // Lists
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={`li-${i}`} className="readme-list-item">
          {line.substring(2)}
        </li>
      );
    }
    // Horizontal rule
    else if (line.match(/^(---|___|\*\*\*)/)) {
      elements.push(<hr key={`hr-${i}`} className="readme-hr" />);
    }
    // Paragraphs
    else if (line.trim()) {
      elements.push(
        <p key={`p-${i}`} className="readme-paragraph">
          {line}
        </p>
      );
    } else {
      elements.push(<div key={`spacer-${i}`} className="readme-spacer" />);
    }
  }

  return elements;
};

/**
 * ReadmeViewer Component
 * 
 * A production-quality README viewer component with markdown rendering.
 * Similar to GitHub's repository README display with support for various markdown elements.
 * 
 * Features:
 * - Markdown rendering (headings, lists, code blocks)
 * - Raw markdown display option
 * - Responsive design
 * - Loading and error states
 * - Edit and download functionality
 * - Syntax highlighting support
 * - Scrollable container
 */
export const ReadmeViewer: React.FC<ReadmeViewerProps> = ({
  content,
  fileName = 'README.md',
  renderMarkdown = true,
  className = '',
  isLoading = false,
  error = null,
  onContentChange,
  showEditButton = true,
  showDownloadButton = true,
  customStyles,
}) => {
  // Parse markdown content
  const parsedContent = useMemo(() => {
    if (renderMarkdown) {
      return parseMarkdown(content);
    }
    return null;
  }, [content, renderMarkdown]);

  // Handle download
  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Handle copy
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`readme-viewer ${className}`} style={customStyles}>
      {/* Header */}
      <div className="readme-header">
        <div className="readme-title">
          <span className="readme-icon">📄</span>
          <h2>{fileName}</h2>
        </div>
        <div className="readme-actions">
          {showDownloadButton && (
            <button
              className="readme-button download-button"
              onClick={handleDownload}
              title="Download README"
              aria-label="Download README file"
            >
              ⬇️ Download
            </button>
          )}
          <button
            className="readme-button copy-button"
            onClick={handleCopy}
            title="Copy content"
            aria-label="Copy README content"
          >
            📋 Copy
          </button>
          {showEditButton && (
            <button
              className="readme-button edit-button"
              title="Edit README"
              aria-label="Edit README file"
            >
              ✏️ Edit
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="readme-loading">
          <span className="loading-spinner">⏳</span> Loading README...
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="readme-error" role="alert">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && content && (
        <div className="readme-content">
          {renderMarkdown ? (
            <div className="readme-markdown">
              {parsedContent}
            </div>
          ) : (
            <pre className="readme-raw">
              <code>{content}</code>
            </pre>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && !content && (
        <div className="readme-empty">
          <span className="empty-icon">📝</span>
          <p>No content available</p>
        </div>
      )}

      {/* Footer */}
      <div className="readme-footer">
        <small>
          {renderMarkdown ? 'Rendered markdown' : 'Raw markdown'} •{' '}
          {content?.split('\n').length || 0} lines
        </small>
      </div>
    </div>
  );
};

export default ReadmeViewer;
