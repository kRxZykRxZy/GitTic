import React, { useState, useCallback } from 'react';

/**
 * Interface for commit information
 */
export interface Commit {
  sha: string;
  shortSha: string;
  message: string;
  author: {
    name: string;
    email?: string;
    date: string;
  };
  committer?: {
    name: string;
    email?: string;
    date: string;
  };
  parentShas?: string[];
  stats?: {
    total: number;
    additions: number;
    deletions: number;
  };
}

/**
 * Props for the CommitList component
 */
export interface CommitListProps {
  /** Array of commits to display */
  commits: Commit[];
  /** Callback when a commit is clicked */
  onCommitClick?: (commit: Commit) => void;
  /** Currently selected commit SHA */
  selectedCommitSha?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Whether to show statistics */
  showStats?: boolean;
  /** Whether to show avatar placeholders */
  showAvatars?: boolean;
  /** Maximum number of commits to display initially */
  pageSize?: number;
  /** Custom className */
  className?: string;
}

/**
 * CommitList Component
 * 
 * A production-quality commit history list component.
 * Similar to GitHub's commit list with support for pagination and detailed information.
 * 
 * Features:
 * - Scrollable commit list
 * - Commit statistics display
 * - Author avatars
 * - Expandable commit details
 * - Keyboard navigation
 * - Responsive design
 * - Copy SHA functionality
 */
export const CommitList: React.FC<CommitListProps> = ({
  commits,
  onCommitClick,
  selectedCommitSha,
  isLoading = false,
  error = null,
  showStats = true,
  showAvatars = true,
  pageSize = 25,
  className = '',
}) => {
  const [displayedCount, setDisplayedCount] = useState(pageSize);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);
  const [expandedSha, setExpandedSha] = useState<string | null>(null);

  // Handle copy SHA to clipboard
  const handleCopySha = useCallback(async (sha: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(sha);
      setCopiedSha(sha);
      setTimeout(() => setCopiedSha(null), 2000);
    } catch (err) {
      console.error('Failed to copy SHA:', err);
    }
  }, []);

  // Handle commit click
  const handleCommitClick = useCallback((commit: Commit) => {
    onCommitClick?.(commit);
  }, [onCommitClick]);

  // Load more commits
  const handleLoadMore = useCallback(() => {
    setDisplayedCount((prev) => prev + pageSize);
  }, [pageSize]);

  // Display commits
  const displayedCommits = commits.slice(0, displayedCount);
  const hasMore = displayedCount < commits.length;

  // Format relative time
  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  // Get initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar color from name
  const getAvatarColor = (name: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#C5E1A5',
    ];
    const hash = name
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className={`commit-list ${className}`}>
      {/* Error state */}
      {error && (
        <div className="commit-list-error" role="alert">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="commit-list-loading">
          <span className="loading-spinner">⏳</span> Loading commits...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && commits.length === 0 && (
        <div className="commit-list-empty">
          <span className="empty-icon">📝</span>
          <p>No commits found</p>
        </div>
      )}

      {/* Commits list */}
      {!isLoading && !error && commits.length > 0 && (
        <div className="commit-list-container">
          <ul className="commit-list-items" role="list">
            {displayedCommits.map((commit) => {
              const isSelected = commit.sha === selectedCommitSha;
              const isExpanded = commit.sha === expandedSha;

              return (
                <li
                  key={commit.sha}
                  className={`commit-item ${isSelected ? 'selected' : ''} ${
                    isExpanded ? 'expanded' : ''
                  }`}
                  onClick={() => handleCommitClick(commit)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCommitClick(commit);
                    }
                  }}
                >
                  {/* Author Avatar */}
                  {showAvatars && (
                    <div
                      className="commit-avatar"
                      style={{
                        backgroundColor: getAvatarColor(commit.author.name),
                      }}
                      title={commit.author.name}
                    >
                      {getInitials(commit.author.name)}
                    </div>
                  )}

                  {/* Commit info */}
                  <div className="commit-info">
                    <div className="commit-header">
                      <span className="commit-message">{commit.message}</span>
                      <button
                        className={`commit-sha ${
                          copiedSha === commit.sha ? 'copied' : ''
                        }`}
                        onClick={(e) => handleCopySha(commit.shortSha, e)}
                        title="Copy commit SHA"
                        aria-label={`Copy commit ${commit.shortSha}`}
                      >
                        {copiedSha === commit.sha ? '✓' : commit.shortSha}
                      </button>
                    </div>

                    <div className="commit-meta">
                      <span className="commit-author">{commit.author.name}</span>
                      <span className="commit-date">
                        {getRelativeTime(commit.author.date)}
                      </span>
                    </div>
                  </div>

                  {/* Statistics */}
                  {showStats && commit.stats && (
                    <div className="commit-stats">
                      <span className="stat additions">
                        +{commit.stats.additions}
                      </span>
                      <span className="stat deletions">
                        -{commit.stats.deletions}
                      </span>
                    </div>
                  )}

                  {/* Expand button */}
                  <button
                    className="expand-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedSha(isExpanded ? null : commit.sha);
                    }}
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    ▼
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Load more button */}
          {hasMore && (
            <button className="load-more-button" onClick={handleLoadMore}>
              Load {Math.min(pageSize, commits.length - displayedCount)} more commits
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CommitList;
