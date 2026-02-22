import React, { useState } from 'react';
import {
  PullRequestDetailProps,
  PRDetailTab,
  PullRequest,
} from './types';
import PullRequestConversation from './PullRequestConversation';
import PullRequestFiles from './PullRequestFiles';
import PullRequestCommits from './PullRequestCommits';
import PullRequestChecks from './PullRequestChecks';

/**
 * PullRequestDetail Component
 *
 * Renders the detailed view of a pull request with multiple tabs for different aspects.
 * Similar to GitHub's PR detail page with conversation, files, commits, and checks tabs.
 *
 * Features:
 * - Tabbed interface (conversation, files, commits, checks)
 * - Full PR metadata and author information
 * - Status and merge indicators
 * - Description with markdown support (basic)
 * - Integration with review, file, commit, and check components
 * - Loading and error states
 * - Responsive layout
 *
 * @example
 * ```tsx
 * <PullRequestDetail
 *   pullRequest={pr}
 *   onAddComment={handleAddComment}
 *   onApprove={handleApprove}
 * />
 * ```
 */
const PullRequestDetail: React.FC<PullRequestDetailProps> = ({
  pullRequest,
  isLoading = false,
  error = null,
  onUpdatePR,
  onAddComment,
  onApprove,
  onRequestChanges,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<PRDetailTab>('conversation');

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
   * Get status label and styling
   */
  const getStatusDisplay = () => {
    const statusConfig = {
      open: { label: 'Open', color: 'success', icon: '🟢' },
      closed: { label: 'Closed', color: 'danger', icon: '🔴' },
      merged: { label: 'Merged', color: 'purple', icon: '🟣' },
      draft: { label: 'Draft', color: 'secondary', icon: '⚫' },
    };
    return statusConfig[pullRequest.status];
  };

  /**
   * Render the appropriate tab content
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'conversation':
        return (
          <PullRequestConversation
            comments={pullRequest.comments || []}
            currentUserId={pullRequest.author.id}
            isLoading={isLoading}
            onAddComment={onAddComment}
          />
        );
      case 'files':
        return (
          <PullRequestFiles
            files={pullRequest.fileChanges || []}
            inlineComments={pullRequest.inlineComments}
            isLoading={isLoading}
          />
        );
      case 'commits':
        return (
          <PullRequestCommits
            commits={pullRequest.commits_list || []}
            isLoading={isLoading}
          />
        );
      case 'checks':
        return (
          <PullRequestChecks
            checkRuns={pullRequest.checks || []}
            statusChecks={pullRequest.statusChecks}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className={`pr-detail error-state ${className}`}>
        <div className="error-banner">
          <strong>Error loading pull request</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`pr-detail loading-state ${className}`}>
        <div className="skeleton-content">
          <div className="skeleton-line" style={{ width: '80%' }} />
          <div className="skeleton-line" style={{ width: '60%' }} />
          <div className="skeleton-line" style={{ width: '100%' }} />
        </div>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay();

  return (
    <div className={`pr-detail ${className}`}>
      <div className="pr-detail-header">
        <div className="pr-detail-title-section">
          <h1 className="pr-detail-title">{pullRequest.title}</h1>
          <span className="pr-detail-number">#{pullRequest.number}</span>
        </div>

        <div className="pr-detail-status">
          <span className={`status-badge status-${pullRequest.status}`}>
            {statusDisplay.icon} {statusDisplay.label}
          </span>
        </div>
      </div>

      <div className="pr-detail-meta">
        <div className="meta-row">
          <div className="meta-item">
            <img
              src={pullRequest.author.avatarUrl}
              alt={pullRequest.author.username}
              className="meta-avatar"
            />
            <div className="meta-info">
              <strong>{pullRequest.author.username}</strong>
              <span className="meta-action">wants to merge</span>
            </div>
          </div>
          <div className="meta-branches">
            <span className="branch-badge">
              <span className="branch-name">{pullRequest.head.name}</span>
              <span className="arrow">→</span>
              <span className="branch-name">{pullRequest.base.name}</span>
            </span>
          </div>
        </div>

        <div className="meta-timeline">
          <span className="timeline-item">
            Created {formatDate(pullRequest.createdAt)}
          </span>
          {pullRequest.mergedAt && (
            <span className="timeline-item">
              Merged {formatDate(pullRequest.mergedAt)} by{' '}
              <strong>{pullRequest.mergedBy?.username || 'Unknown'}</strong>
            </span>
          )}
          {pullRequest.closedAt && pullRequest.status === 'closed' && (
            <span className="timeline-item">
              Closed {formatDate(pullRequest.closedAt)}
            </span>
          )}
        </div>
      </div>

      {pullRequest.description && (
        <div className="pr-detail-description">
          <div className="description-header">Description</div>
          <div className="description-body">{pullRequest.description}</div>
        </div>
      )}

      <div className="pr-detail-stats">
        <div className="stat-item">
          <span className="stat-label">Commits</span>
          <span className="stat-value">{pullRequest.commits}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Files Changed</span>
          <span className="stat-value">{pullRequest.changedFiles}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label additions">
            Additions
          </span>
          <span className="stat-value additions">+{pullRequest.additions}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label deletions">
            Deletions
          </span>
          <span className="stat-value deletions">-{pullRequest.deletions}</span>
        </div>
      </div>

      <div className="pr-detail-tabs">
        <div className="tabs-nav">
          <button
            className={`tab-button ${activeTab === 'conversation' ? 'active' : ''}`}
            onClick={() => setActiveTab('conversation')}
          >
            💬 Conversation
            {pullRequest.comments && pullRequest.comments.length > 0 && (
              <span className="tab-count">{pullRequest.comments.length}</span>
            )}
          </button>
          <button
            className={`tab-button ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            📝 Files Changed
            <span className="tab-count">{pullRequest.changedFiles}</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'commits' ? 'active' : ''}`}
            onClick={() => setActiveTab('commits')}
          >
            📍 Commits
            <span className="tab-count">{pullRequest.commits}</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'checks' ? 'active' : ''}`}
            onClick={() => setActiveTab('checks')}
          >
            ✓ Checks
            {pullRequest.checks && pullRequest.checks.length > 0 && (
              <span className="tab-count">{pullRequest.checks.length}</span>
            )}
          </button>
        </div>

        <div className="tabs-content">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default PullRequestDetail;
