import React from 'react';
import {
  PullRequestListProps,
  PullRequest,
  PRStatus,
} from './types';
import PullRequestCard from './PullRequestCard';

/**
 * PullRequestList Component
 *
 * Renders a list of pull requests with filtering, sorting, and pagination capabilities.
 * Similar to GitHub's pull request list view with status indicators, review status, and checks.
 *
 * Features:
 * - Display multiple PRs with status badges
 * - Filter by PR status (open, closed, merged, draft)
 * - Sort by updated, created, or popularity
 * - Pagination support
 * - Selection and click handling
 * - Loading and error states
 * - Empty state handling
 *
 * @example
 * ```tsx
 * <PullRequestList
 *   pullRequests={prs}
 *   filterStatus="open"
 *   sortBy="updated"
 *   onSelectPR={handleSelect}
 * />
 * ```
 */
const PullRequestList: React.FC<PullRequestListProps> = ({
  pullRequests,
  isLoading = false,
  error = null,
  onSelectPR,
  selectedPRId,
  filterStatus,
  sortBy = 'updated',
  pagination,
  onPageChange,
  className = '',
}) => {
  /**
   * Filter PRs by status if filterStatus is provided
   */
  const filteredPRs = filterStatus
    ? pullRequests.filter((pr) => pr.status === filterStatus)
    : pullRequests;

  /**
   * Sort PRs based on sortBy parameter
   */
  const sortedPRs = [...filteredPRs].sort((a, b) => {
    switch (sortBy) {
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'popularity':
        return (b.comments?.length || 0) - (a.comments?.length || 0);
      default:
        return 0;
    }
  });

  /**
   * Get status badge color and label
   */
  const getStatusDisplay = (status: PRStatus) => {
    const statusConfig = {
      open: { color: 'success', label: 'Open', icon: '🟢' },
      closed: { color: 'danger', label: 'Closed', icon: '🔴' },
      merged: { color: 'purple', label: 'Merged', icon: '🟣' },
      draft: { color: 'secondary', label: 'Draft', icon: '⚫' },
    };
    return statusConfig[status];
  };

  if (error) {
    return (
      <div className={`pr-list error-state ${className}`}>
        <div className="error-message">
          <strong>Error loading pull requests</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`pr-list loading-state ${className}`}>
        <div className="loading-placeholder">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-line" style={{ width: '80%' }} />
              <div className="skeleton-line" style={{ width: '60%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sortedPRs.length === 0) {
    return (
      <div className={`pr-list empty-state ${className}`}>
        <div className="empty-message">
          <h3>No pull requests found</h3>
          <p>There are no pull requests to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`pr-list ${className}`}>
      <div className="pr-list-header">
        <div className="pr-list-info">
          <span className="pr-count">{sortedPRs.length} pull requests</span>
          {filterStatus && <span className="filter-badge">{filterStatus}</span>}
        </div>
      </div>

      <div className="pr-list-container">
        {sortedPRs.map((pr) => {
          const statusDisplay = getStatusDisplay(pr.status);
          return (
            <div
              key={pr.id}
              className={`pr-list-item ${selectedPRId === pr.id ? 'selected' : ''}`}
              onClick={() => onSelectPR?.(pr)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSelectPR?.(pr);
                }
              }}
            >
              <PullRequestCard
                pullRequest={pr}
                isSelected={selectedPRId === pr.id}
                showDetails={true}
              />
            </div>
          );
        })}
      </div>

      {pagination && (
        <div className="pr-pagination">
          {(() => {
            const totalPages = Math.ceil(pagination.total / pagination.perPage);
            return (
              <>
                <button
                  disabled={pagination.page === 1}
                  onClick={() => onPageChange?.(pagination.page - 1)}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.page} of {totalPages}
                </span>
                <button
                  disabled={pagination.page === totalPages}
                  onClick={() => onPageChange?.(pagination.page + 1)}
                  className="pagination-btn"
                >
                  Next
                </button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default PullRequestList;
