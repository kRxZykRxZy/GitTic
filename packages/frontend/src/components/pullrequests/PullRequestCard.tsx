import React from 'react';
import { PullRequestCardProps, ReviewDecision } from './types';

/**
 * PullRequestCard Component
 *
 * Renders a single pull request card with compact metadata display.
 * Shows PR status, author info, branch details, check status, and review status.
 *
 * Features:
 * - Status badge with color coding
 * - Author avatar and name
 * - Source and target branch information
 * - Commit count and file changes
 * - Review decision badge
 * - Check status indicators
 * - Responsive design
 *
 * @example
 * ```tsx
 * <PullRequestCard
 *   pullRequest={pr}
 *   isSelected={true}
 *   onClick={handleSelect}
 * />
 * ```
 */
const PullRequestCard: React.FC<PullRequestCardProps> = ({
  pullRequest,
  isSelected = false,
  onClick,
  className = '',
  showDetails = true,
}) => {
  /**
   * Get status badge styling
   */
  const getStatusBadgeClass = (status: string) => {
    const baseClass = 'pr-status-badge';
    switch (status) {
      case 'open':
        return `${baseClass} status-open`;
      case 'closed':
        return `${baseClass} status-closed`;
      case 'merged':
        return `${baseClass} status-merged`;
      case 'draft':
        return `${baseClass} status-draft`;
      default:
        return baseClass;
    }
  };

  /**
   * Get review decision badge styling and label
   */
  const getReviewBadge = (decision?: ReviewDecision) => {
    if (!decision) return null;

    const badges = {
      approved: { class: 'review-approved', label: '✓ Approved' },
      changes_requested: {
        class: 'review-changes',
        label: '⚠ Changes Requested',
      },
      commented: { class: 'review-commented', label: '💬 Commented' },
      pending: { class: 'review-pending', label: '⏳ Pending Review' },
    };

    const badge = badges[decision];
    return badge ? (
      <span className={`pr-review-badge ${badge.class}`}>{badge.label}</span>
    ) : null;
  };

  /**
   * Get check status indicator
   */
  const getCheckStatus = () => {
    if (!pullRequest.checks || pullRequest.checks.length === 0) {
      return null;
    }

    const completed = pullRequest.checks.filter(
      (check) => check.status === 'completed'
    );
    const successful = completed.filter(
      (check) => check.conclusion === 'success'
    );

    return (
      <div className="pr-checks-status">
        <span className="check-indicator">
          {successful.length === completed.length ? '✓' : '✗'} {successful.length}/
          {completed.length}
        </span>
      </div>
    );
  };

  /**
   * Format date to relative time
   */
  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return then.toLocaleDateString();
  };

  return (
    <div
      className={`pr-card ${isSelected ? 'selected' : ''} ${className}`}
      onClick={onClick}
      role="article"
    >
      <div className="pr-card-header">
        <div className="pr-card-title-section">
          <div className={getStatusBadgeClass(pullRequest.status)}>
            {pullRequest.status.toUpperCase()}
          </div>
          <h3 className="pr-card-title">
            {pullRequest.title}
            <span className="pr-number">#{pullRequest.number}</span>
          </h3>
        </div>
        {showDetails && getCheckStatus()}
      </div>

      <div className="pr-card-meta">
        <div className="pr-author-section">
          {pullRequest.author.avatarUrl && (
            <img
              src={pullRequest.author.avatarUrl}
              alt={pullRequest.author.username}
              className="pr-author-avatar"
              title={pullRequest.author.displayName || pullRequest.author.username}
            />
          )}
          <span className="pr-author-name">{pullRequest.author.username}</span>
        </div>

        <div className="pr-branches-section">
          <span className="branch-info">
            {pullRequest.head.name} → {pullRequest.base.name}
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="pr-card-details">
          <div className="pr-stats">
            <span className="stat">
              <strong>{pullRequest.commits}</strong> commits
            </span>
            <span className="stat">
              <strong className="additions">+{pullRequest.additions}</strong>
            </span>
            <span className="stat">
              <strong className="deletions">-{pullRequest.deletions}</strong>
            </span>
            <span className="stat">
              <strong>{pullRequest.changedFiles}</strong> files
            </span>
          </div>

          <div className="pr-badges-section">
            {pullRequest.isDraft && (
              <span className="draft-badge">Draft</span>
            )}
            {getReviewBadge(pullRequest.reviewDecision)}
            {pullRequest.labels && pullRequest.labels.length > 0 && (
              <div className="pr-labels">
                {pullRequest.labels.slice(0, 3).map((label) => (
                  <span key={label} className="pr-label">
                    {label}
                  </span>
                ))}
                {pullRequest.labels.length > 3 && (
                  <span className="pr-label-more">
                    +{pullRequest.labels.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="pr-footer">
            <span className="pr-timestamp">
              {pullRequest.status === 'merged'
                ? `merged ${formatRelativeTime(pullRequest.mergedAt!)}`
                : pullRequest.status === 'closed'
                  ? `closed ${formatRelativeTime(pullRequest.closedAt!)}`
                  : `opened ${formatRelativeTime(pullRequest.createdAt)}`}
            </span>
            {pullRequest.comments && pullRequest.comments.length > 0 && (
              <span className="pr-comments-count">
                💬 {pullRequest.comments.length}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PullRequestCard;
