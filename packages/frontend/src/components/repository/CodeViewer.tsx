import React, { useState, useMemo } from 'react';

/**
 * Props for the CodeViewer component
 */
export interface CodeViewerProps {
  /** The code content to display */
  code: string;
  /** Programming language for syntax highlighting */
  language?: string;
  /** File path for context */
  filePath?: string;
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
  /** Whether to enable line selection */
  enableLineSelection?: boolean;
  /** Initial line to highlight */
  highlightedLine?: number;
  /** Range of lines to highlight */
  highlightedRange?: [number, number];
  /** Callback when a line is clicked */
  onLineClick?: (lineNumber: number) => void;
  /** Custom className for styling */
  className?: string;
  /** Whether to show copy button */
  showCopyButton?: boolean;
}

/**
 * CodeViewer Component
 * 
 * A production-quality code viewer with syntax highlighting capabilities.
 * Supports line numbers, line selection, and code copying.
 * 
 * Features:
 * - Syntax highlighting for multiple languages
 * - Line number display
 * - Line selection and highlighting
 * - Copy to clipboard functionality
 * - Responsive design
 * - Accessibility support
 */
export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language = 'plaintext',
  filePath,
  showLineNumbers = true,
  enableLineSelection = true,
  highlightedLine,
  highlightedRange,
  onLineClick,
  className = '',
  showCopyButton = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  // Split code into lines
  const lines = useMemo(() => code.split('\n'), [code]);

  // Check if a line is highlighted
  const isLineHighlighted = (lineNumber: number): boolean => {
    if (highlightedLine === lineNumber) return true;
    if (highlightedRange) {
      const [start, end] = highlightedRange;
      return lineNumber >= start && lineNumber <= end;
    }
    return false;
  };

  // Handle line click for selection
  const handleLineClick = (lineNumber: number) => {
    if (enableLineSelection) {
      setSelectedLine(lineNumber);
    }
    onLineClick?.(lineNumber);
  };

  // Handle copy to clipboard
  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className={`code-viewer ${className}`}>
      {/* Header with file info and copy button */}
      {(filePath || showCopyButton) && (
        <div className="code-viewer-header">
          {filePath && (
            <div className="code-viewer-path">
              {filePath}
            </div>
          )}
          <div className="code-viewer-actions">
            {showCopyButton && (
              <button
                className="copy-button"
                onClick={handleCopyClick}
                aria-label="Copy code to clipboard"
                title={copied ? 'Copied!' : 'Copy code'}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Code container */}
      <div className="code-viewer-container">
        <pre className={`code-viewer-pre language-${language}`}>
          <code className={`language-${language}`}>
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              const isSelected = selectedLine === lineNumber;
              const isHighlighted = isLineHighlighted(lineNumber);

              return (
                <div
                  key={lineNumber}
                  className={`code-line ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                  onClick={() => handleLineClick(lineNumber)}
                  role={enableLineSelection ? 'button' : undefined}
                  tabIndex={enableLineSelection ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (enableLineSelection && (e.key === 'Enter' || e.key === ' ')) {
                      handleLineClick(lineNumber);
                    }
                  }}
                >
                  {showLineNumbers && (
                    <span className="line-number" aria-hidden="true">
                      {lineNumber}
                    </span>
                  )}
                  <span className="line-content">{line || '\n'}</span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>

      {/* Footer with language info */}
      {language && language !== 'plaintext' && (
        <div className="code-viewer-footer">
          <span className="language-badge">{language.toUpperCase()}</span>
          <span className="line-count">{lines.length} lines</span>
        </div>
      )}
    </div>
  );
};

export default CodeViewer;
