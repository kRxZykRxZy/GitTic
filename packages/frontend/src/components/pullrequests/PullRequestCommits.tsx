import React, { useState } from 'react';
import { PullRequestCommitsProps, PRCommit } from './types';

/**
 * PullRequestCommits Component
 *
 * Displays a list of commits included in a pull request.
 * Shows commit messages, authors, dates, and change statistics.
 *
 * Features:
 * - Commit list with chronological ordering
 * - Author information and avatars
 * - Commit message display
 * - Change statistics per commit
 * - Commit selection capability
 * - Expanded commit view with details
 * - Loading states
 * - Search/filter commits
 *
 * @example
 * ```tsx
 * <PullRequestCommits
 *   commits={commits}
 *   onSelectCommit={handleSelectCommit}
 * />
 * ```
 */
const PullRequestCommits: React.FC<PullRequestCommitsProps> = ({
  commits,
  isLoading = false,
  selectedCommitSha,
  onSelectCommit,
  className = '',
}) => {
  const [expandedCommitSha, setExpandedCommitSha] = useState<string | null>(
    selectedCommitSha || null
  );
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Format date to readable string
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Format date to relative time
   */
  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const then = new Date(dateString);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return then.toLocaleDateString();
  };

  /**
   * Get shortened commit SHA
   */
  const getShortSha = (sha: string) => sha.substring(0, 7);

  /**
   * Filter commits based on search term
   */
  const filteredCommits = searchTerm
    ? commits.filter(
        (commit) =>
          commit.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          commit.sha.includes(searchTerm) ||
          commit.author.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : commits;

  if (isLoading) {
    return (
      <div className={`pr-commits loading-state ${className}`}>
        <div className="skeleton-content">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-line" style={{ width: '100%' }} />
          ))}
        </div>
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className={`pr-commits empty-state ${className}`}>
        <p>No commits</p>
      </div>
    );
  }

  return (
    <div className={`pr-commits ${className}`}>
      <div className="commits-header">
        <h3 className="commits-title">
          📍 Commits <span className="count">({commits.length})</span>
        </h3>

        <div className="commits-search">
          <input
            type="text"
            placeholder="Search commits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {filteredCommits.length === 0 ? (
        <div className="no-results">
          <p>No commits match your search</p>
        </div>
      ) : (
        <div className="commits-list">
          {filteredCommits.map((commit, index) => {
            const isExpanded = expandedCommitSha === commit.sha;
            const isSelected = selectedCommitSha === commit.sha;

            return (
              <div
                key={commit.sha}
                className={`commit-item ${isSelected ? 'selected' : ''} ${
                  isExpanded ? 'expanded' : ''
                }`}
              >
                <div
                  className="commit-header"
                  onClick={() => {
                    setExpandedCommitSha(isExpanded ? null : commit.sha);
                    onSelectCommit?.(commit.sha);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="commit-index">
                    {index + 1}
                  </div>

                  <div className="commit-info">
                    <div className="commit-message">{commit.message}</div>
                    <div className="commit-meta">
                      {commit.author.avatarUrl && (
                        <img
                          src={commit.author.avatarUrl}
                          alt={commit.author.username}
                          className="commit-avatar"
                        />
                      )}
                      <span className="commit-author">
                        {commit.author.username}
                      </span>
                      <span className="commit-sha">
                        {getShortSha(commit.sha)}
                      </span>
                      <span className="commit-date">
                        {formatRelativeTime(commit.committedDate)}
                      </span>
                    </div>
                  </div>

                  <div className="commit-stats">
                    <span className="stat additions">
                      +{commit.stats.additions}
                    </span>
                    <span className="stat deletions">
                      -{commit.stats.deletions}
                    </span>
                    <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="commit-details">
                    <div className="details-section">
                      <div className="detail-item">
                        <span className="detail-label">SHA:</span>
                        <code className="detail-value">{commit.sha}</code>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(commit.sha);
                          }}
                          className="copy-btn"
                          title="Copy SHA"
                        >
                          📋
                        </button>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Author:</span>
                        <span className="detail-value">
                          {commit.author.displayName || commit.author.username}
                        </span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Date:</span>
                        <span className="detail-value">
                          {formatDate(commit.committedDate)}
                        </span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Parents:</span>
                        <span className="detail-value">
                          {commit.parentShas.length === 0 ? (
                            'Initial commit'
                          ) : (
                            <div className="parent-shas">
                              {commit.parentShas.map((sha) => (
                                <code key={sha} className="parent-sha">
                                  {getShortSha(sha)}
                                </code>
                              ))}
                            </div>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="details-stats">
                      <div className="stat-card">
                        <div className="stat-label">Additions</div>
                        <div className="stat-value additions">
                          +{commit.stats.additions}
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-label">Deletions</div>
                        <div className="stat-value deletions">
                          -{commit.stats.deletions}
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-label">Changes</div>
                        <div className="stat-value">{commit.stats.total}</div>
                      </div>
                    </div>

                    <div className="details-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(commit.sha);
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        📋 Copy full SHA
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        🔗 View commit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PullRequestCommits;
