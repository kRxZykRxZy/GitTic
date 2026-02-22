import React, { useState, useMemo } from 'react';

/**
 * Interface representing sorting configuration for the issue list
 */
interface SortConfig {
  key: 'created' | 'updated' | 'title' | 'comments';
  direction: 'asc' | 'desc';
}

/**
 * Interface for issue data structure
 */
export interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'closed' | 'draft';
  priority: 'low' | 'medium' | 'high' | 'critical';
  labels: Label[];
  assignees: User[];
  milestone?: Milestone;
  createdAt: Date;
  updatedAt: Date;
  createdBy: User;
  commentCount: number;
  closed?: Date;
}

/**
 * Interface for label data structure
 */
export interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}

/**
 * Interface for user data structure
 */
export interface User {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
}

/**
 * Interface for milestone data structure
 */
export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  progress: number;
}

/**
 * Props interface for IssueList component
 */
interface IssueListProps {
  issues: Issue[];
  isLoading?: boolean;
  error?: string | null;
  onIssueClick: (issue: Issue) => void;
  onCreateIssue?: () => void;
  selectedFilters?: {
    status?: string[];
    labels?: string[];
    assignees?: string[];
    priority?: string[];
  };
  sortConfig?: SortConfig;
  onSortChange?: (config: SortConfig) => void;
}

/**
 * IssueList Component
 * 
 * Displays a paginated list of issues with sorting, filtering, and status indicators.
 * Similar to GitHub's issues list view with support for multiple view modes.
 * 
 * @component
 * @example
 * ```tsx
 * <IssueList 
 *   issues={issues}
 *   onIssueClick={handleIssueClick}
 *   sortConfig={{ key: 'updated', direction: 'desc' }}
 * />
 * ```
 */
const IssueList: React.FC<IssueListProps> = ({
  issues,
  isLoading = false,
  error = null,
  onIssueClick,
  onCreateIssue,
  selectedFilters = {},
  sortConfig = { key: 'updated', direction: 'desc' },
  onSortChange,
}) => {
  const [pageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Filter issues based on selected filters
   */
  const filteredIssues = useMemo(() => {
    let filtered = [...issues];

    if (selectedFilters.status?.length) {
      filtered = filtered.filter(issue =>
        selectedFilters.status!.includes(issue.status)
      );
    }

    if (selectedFilters.labels?.length) {
      filtered = filtered.filter(issue =>
        issue.labels.some(label =>
          selectedFilters.labels!.includes(label.id)
        )
      );
    }

    if (selectedFilters.assignees?.length) {
      filtered = filtered.filter(issue =>
        issue.assignees.some(assignee =>
          selectedFilters.assignees!.includes(assignee.id)
        )
      );
    }

    if (selectedFilters.priority?.length) {
      filtered = filtered.filter(issue =>
        selectedFilters.priority!.includes(issue.priority)
      );
    }

    return filtered;
  }, [issues, selectedFilters]);

  /**
   * Sort filtered issues based on sort configuration
   */
  const sortedIssues = useMemo(() => {
    const sorted = [...filteredIssues];
    
    sorted.sort((a, b) => {
      let compareValue = 0;

      switch (sortConfig.key) {
        case 'created':
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updated':
          compareValue = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'title':
          compareValue = a.title.localeCompare(b.title);
          break;
        case 'comments':
          compareValue = a.commentCount - b.commentCount;
          break;
        default:
          compareValue = 0;
      }

      return sortConfig.direction === 'desc' ? -compareValue : compareValue;
    });

    return sorted;
  }, [filteredIssues, sortConfig]);

  /**
   * Paginate sorted issues
   */
  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedIssues.slice(start, start + pageSize);
  }, [sortedIssues, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedIssues.length / pageSize);

  /**
   * Render loading skeleton
   */
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg" />
        ))}
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <h3 className="font-semibold">Error loading issues</h3>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  /**
   * Render empty state
   */
  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No issues</h3>
        <p className="text-gray-500 mb-4">Get started by creating a new issue</p>
        {onCreateIssue && (
          <button
            onClick={onCreateIssue}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            New Issue
          </button>
        )}
      </div>
    );
  }

  /**
   * Render empty filtered state
   */
  if (filteredIssues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m0 0h-6m0-6H6" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No matching issues</h3>
        <p className="text-gray-500">Try adjusting your filters</p>
      </div>
    );
  }

  /**
   * Get status badge color
   */
  const getStatusColor = (status: Issue['status']) => {
    const colors = {
      open: 'bg-green-100 text-green-800',
      closed: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
    };
    return colors[status];
  };

  /**
   * Get priority badge color
   */
  const getPriorityColor = (priority: Issue['priority']) => {
    const colors = {
      low: 'text-blue-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600',
    };
    return colors[priority];
  };

  return (
    <div className="space-y-4">
      {/* Header with sort options */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <div className="text-sm text-gray-600">
          Showing {paginatedIssues.length} of {sortedIssues.length} issues
        </div>
        {onSortChange && (
          <select
            value={`${sortConfig.key}-${sortConfig.direction}`}
            onChange={(e) => {
              const [key, direction] = e.target.value.split('-');
              onSortChange({ key: key as any, direction: direction as any });
            }}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="updated-desc">Latest updated</option>
            <option value="updated-asc">Oldest updated</option>
            <option value="created-desc">Newest created</option>
            <option value="created-asc">Oldest created</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
            <option value="comments-desc">Most comments</option>
          </select>
        )}
      </div>

      {/* Issues list */}
      <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        {paginatedIssues.map((issue) => (
          <div
            key={issue.id}
            onClick={() => onIssueClick(issue)}
            className="p-4 hover:bg-gray-50 cursor-pointer transition flex items-start gap-4"
          >
            {/* Status indicator */}
            <div className="flex-shrink-0 w-6 h-6 mt-1">
              {issue.status === 'open' ? (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              )}
            </div>

            {/* Issue content */}
            <div className="flex-grow min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{issue.title}</h3>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 flex-wrap">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                  {issue.status}
                </span>
                {issue.labels.length > 0 && (
                  <div className="flex gap-2">
                    {issue.labels.slice(0, 2).map((label) => (
                      <span
                        key={label.id}
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: label.color + '20', color: label.color }}
                      >
                        {label.name}
                      </span>
                    ))}
                    {issue.labels.length > 2 && (
                      <span className="text-xs text-gray-500">+{issue.labels.length - 2} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right side info */}
            <div className="flex-shrink-0 text-right text-sm text-gray-600">
              <div className={`font-semibold mb-2 ${getPriorityColor(issue.priority)}`}>
                {issue.priority}
              </div>
              <div className="text-xs">{issue.commentCount} comments</div>
              {issue.assignees.length > 0 && (
                <div className="flex gap-1 justify-end mt-2">
                  {issue.assignees.slice(0, 3).map((assignee) => (
                    <div
                      key={assignee.id}
                      className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-white"
                      title={assignee.name}
                    >
                      {assignee.avatar ? (
                        <img src={assignee.avatar} alt={assignee.name} className="w-full h-full rounded-full" />
                      ) : (
                        assignee.name.charAt(0)
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-lg text-sm ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default IssueList;
