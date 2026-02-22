import React, { useState } from 'react';
import {
  PullRequestMergeProps,
  MergeStrategy,
  PullRequest,
} from './types';

/**
 * PullRequestMerge Component
 *
 * Displays the merge panel for a pull request with merge strategy options and conflict detection.
 * Similar to GitHub's merge interface with multiple merge strategies and merge status indicators.
 *
 * Features:
 * - Merge status indicators (can merge, conflicted, blocked)
 * - Multiple merge strategies (merge commit, squash, rebase)
 * - Conflict detection and display
 * - Custom commit message input
 * - Merge button with loading states
 * - Delete branch after merge option
 * - Close PR without merging
 * - Merge history/timeline
 *
 * @example
 * ```tsx
 * <PullRequestMerge
 *   pullRequest={pr}
 *   onMerge={handleMerge}
 *   onClosePR={handleClose}
 * />
 * ```
 */
const PullRequestMerge: React.FC<PullRequestMergeProps> = ({
  pullRequest,
  isLoading = false,
  error = null,
  onMerge,
  onSquashMerge,
  onRebaseMerge,
  onClosePR,
  className = '',
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<MergeStrategy>(
    'create_a_merge_commit'
  );
  const [customMessage, setCustomMessage] = useState('');
  const [deleteBranchAfterMerge, setDeleteBranchAfterMerge] = useState(true);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(error);

  /**
   * Determine merge status styling and message
   */
  const getMergeStatusDisplay = () => {
    if (pullRequest.status === 'merged') {
      return {
        status: 'merged',
        label: 'Pull request successfully merged',
        icon: '✓',
        color: 'success',
      };
    }

    if (pullRequest.status === 'closed') {
      return {
        status: 'closed',
        label: 'Pull request is closed',
        icon: '✗',
        color: 'danger',
      };
    }

    if (pullRequest.mergeConflict) {
      return {
        status: 'conflict',
        label: 'This branch has conflicts that must be resolved',
        icon: '⚠',
        color: 'danger',
      };
    }

    if (pullRequest.mergeStatus === 'dirty') {
      return {
        status: 'dirty',
        label: 'Branch is out of date',
        icon: '↻',
        color: 'warning',
      };
    }

    if (pullRequest.mergeStatus === 'unknown') {
      return {
        status: 'unknown',
        label: 'Merge status is unknown',
        icon: '?',
        color: 'secondary',
      };
    }

    if (pullRequest.mergeStatus === 'blocked') {
      return {
        status: 'blocked',
        label: 'This pull request is blocked from merging',
        icon: '🚫',
        color: 'danger',
      };
    }

    return {
      status: 'can_merge',
      label: 'This branch has no conflicts with the base branch',
      icon: '✓',
      color: 'success',
    };
  };

  /**
   * Handle merge action
   */
  const handleMergeClick = async () => {
    setActionLoading('merge');
    setActionError(null);

    try {
      if (selectedStrategy === 'create_a_merge_commit') {
        await onMerge?.(selectedStrategy, customMessage || undefined);
      } else if (selectedStrategy === 'squash_and_merge') {
        await onSquashMerge?.(customMessage || undefined);
      } else if (selectedStrategy === 'rebase_and_merge') {
        await onRebaseMerge?.(customMessage || undefined);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to merge pull request'
      );
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Handle close PR action
   */
  const handleCloseClick = async () => {
    if (!confirm('Are you sure you want to close this pull request?')) {
      return;
    }

    setActionLoading('close');
    setActionError(null);

    try {
      await onClosePR?.();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to close pull request'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const mergeStatus = getMergeStatusDisplay();
  const canMerge =
    pullRequest.status === 'open' && !pullRequest.mergeConflict && pullRequest.mergeable;

  return (
    <div className={`pr-merge ${className}`}>
      <div className="merge-panel">
        <h3 className="merge-title">Merge pull request</h3>

        {/* Merge Status */}
        <div className={`merge-status merge-status-${mergeStatus.color}`}>
          <span className="status-icon">{mergeStatus.icon}</span>
          <p className="status-message">{mergeStatus.label}</p>
        </div>

        {actionError && (
          <div className="merge-error">
            <strong>Error</strong>
            <p>{actionError}</p>
          </div>
        )}

        {/* Merge Strategies */}
        {canMerge && (
          <div className="merge-strategies">
            <div className="strategy-selector">
              <label className="strategy-option">
                <input
                  type="radio"
                  name="merge-strategy"
                  value="create_a_merge_commit"
                  checked={selectedStrategy === 'create_a_merge_commit'}
                  onChange={(e) =>
                    setSelectedStrategy(e.target.value as MergeStrategy)
                  }
                  disabled={isLoading || actionLoading !== null}
                />
                <span className="strategy-label">
                  <strong>Create a merge commit</strong>
                  <span className="strategy-description">
                    All commits from this branch will be added to the base branch via a merge commit.
                  </span>
                </span>
              </label>

              {pullRequest.allowSquashMerge && (
                <label className="strategy-option">
                  <input
                    type="radio"
                    name="merge-strategy"
                    value="squash_and_merge"
                    checked={selectedStrategy === 'squash_and_merge'}
                    onChange={(e) =>
                      setSelectedStrategy(e.target.value as MergeStrategy)
                    }
                    disabled={isLoading || actionLoading !== null}
                  />
                  <span className="strategy-label">
                    <strong>Squash and merge</strong>
                    <span className="strategy-description">
                      The {pullRequest.commits} commits from this branch will be combined into one commit on the base branch.
                    </span>
                  </span>
                </label>
              )}

              {pullRequest.allowRebaseMerge && (
                <label className="strategy-option">
                  <input
                    type="radio"
                    name="merge-strategy"
                    value="rebase_and_merge"
                    checked={selectedStrategy === 'rebase_and_merge'}
                    onChange={(e) =>
                      setSelectedStrategy(e.target.value as MergeStrategy)
                    }
                    disabled={isLoading || actionLoading !== null}
                  />
                  <span className="strategy-label">
                    <strong>Rebase and merge</strong>
                    <span className="strategy-description">
                      The {pullRequest.commits} commits from this branch will be rebased and merged into the base branch.
                    </span>
                  </span>
                </label>
              )}
            </div>

            {/* Custom Message Input */}
            <div className="merge-message-section">
              <label htmlFor="merge-message" className="label">
                Commit message
              </label>
              <textarea
                id="merge-message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add an optional extended description..."
                className="merge-message-input"
                rows={3}
                disabled={isLoading || actionLoading !== null}
              />
            </div>

            {/* Advanced Options */}
            <div className="merge-options">
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="btn-toggle-advanced"
              >
                {showAdvancedOptions ? '▼' : '▶'} Advanced options
              </button>

              {showAdvancedOptions && (
                <div className="advanced-options">
                  <label className="option-checkbox">
                    <input
                      type="checkbox"
                      checked={deleteBranchAfterMerge}
                      onChange={(e) =>
                        setDeleteBranchAfterMerge(e.target.checked)
                      }
                      disabled={isLoading || actionLoading !== null}
                    />
                    <span>Delete branch after merge</span>
                  </label>
                </div>
              )}
            </div>

            {/* Merge Actions */}
            <div className="merge-actions">
              <button
                onClick={handleMergeClick}
                disabled={isLoading || actionLoading !== null || !canMerge}
                className={`btn btn-lg btn-merge ${
                  selectedStrategy === 'create_a_merge_commit'
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                {actionLoading === 'merge' ? (
                  <>⏳ Merging...</>
                ) : (
                  <>✓ Merge pull request</>
                )}
              </button>

              <button
                onClick={handleCloseClick}
                disabled={isLoading || actionLoading !== null}
                className="btn btn-lg btn-outline"
              >
                {actionLoading === 'close' ? (
                  <>⏳ Closing...</>
                ) : (
                  <>✗ Close pull request</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Already Merged/Closed State */}
        {!canMerge && (
          <div className="merge-finished">
            {pullRequest.status === 'merged' && (
              <div className="finished-info">
                <p>
                  This pull request was merged on{' '}
                  <strong>
                    {new Date(pullRequest.mergedAt!).toLocaleDateString()}
                  </strong>
                  {pullRequest.mergedBy && (
                    <>
                      {' '}
                      by <strong>{pullRequest.mergedBy.username}</strong>
                    </>
                  )}
                </p>
                {deleteBranchAfterMerge && (
                  <p className="branch-deleted">
                    The {pullRequest.head.name} branch has been deleted.
                  </p>
                )}
              </div>
            )}

            {pullRequest.status === 'closed' && (
              <div className="finished-info">
                <p>
                  This pull request was closed on{' '}
                  <strong>
                    {new Date(pullRequest.closedAt!).toLocaleDateString()}
                  </strong>
                  {pullRequest.mergedBy && (
                    <>
                      {' '}
                      by <strong>{pullRequest.mergedBy.username}</strong>
                    </>
                  )}
                </p>
              </div>
            )}

            {pullRequest.mergeConflict && (
              <div className="merge-conflict-info">
                <p>
                  ⚠️ This branch has conflicts with the base branch that must be resolved
                  before merging.
                </p>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    /* Handle conflict resolution */
                  }}
                >
                  Resolve conflicts
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Merge Timeline */}
      {pullRequest.status === 'merged' && (
        <div className="merge-timeline">
          <h4 className="timeline-title">Merge History</h4>
          <div className="timeline-events">
            <div className="timeline-event">
              <span className="event-marker">✓</span>
              <div className="event-content">
                <p className="event-title">Pull request merged</p>
                <p className="event-details">
                  {pullRequest.mergedBy?.username} merged {pullRequest.commits} commits
                  into {pullRequest.base.name}
                </p>
                <span className="event-time">
                  {new Date(pullRequest.mergedAt!).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PullRequestMerge;
