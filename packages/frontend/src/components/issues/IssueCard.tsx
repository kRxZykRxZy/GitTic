import React from 'react';
import { Issue, Label, User, Milestone } from './IssueList';

/**
 * Props interface for IssueCard component
 */
interface IssueCardProps {
  /** The issue data to display */
  issue: Issue;
  /** Callback when card is clicked */
  onClick?: (issue: Issue) => void;
  /** Show compact view */
  compact?: boolean;
  /** Custom className for styling */
  className?: string;
  /** Callback when status is changed */
  onStatusChange?: (issue: Issue, newStatus: Issue['status']) => void;
  /** Callback when assignee is added */
  onAssigneeChange?: (issue: Issue, assignees: User[]) => void;
  /** Callback when label is added/removed */
  onLabelChange?: (issue: Issue, labels: Label[]) => void;
}

/**
 * IssueCard Component
 * 
 * Displays a compact card representation of an issue with status, labels, and assignees.
 * Used in list views and board layouts. Supports click actions and quick edits.
 * 
 * @component
 * @example
 * ```tsx
 * <IssueCard 
 *   issue={issue}
 *   onClick={handleClick}
 *   onStatusChange={handleStatusChange}
 * />
 * ```
 */
const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onClick,
  compact = false,
  className = '',
  onStatusChange,
  onAssigneeChange,
  onLabelChange,
}) => {
  /**
   * Get status icon and color
   */
  const getStatusIcon = () => {
    switch (issue.status) {
      case 'open':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'closed':
        return (
          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
        );
      case 'draft':
        return (
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  /**
   * Get priority color
   */
  const getPriorityColor = () => {
    const colors = {
      low: 'bg-blue-50 border-blue-200',
      medium: 'bg-yellow-50 border-yellow-200',
      high: 'bg-orange-50 border-orange-200',
      critical: 'bg-red-50 border-red-200',
    };
    return colors[issue.priority];
  };

  /**
   * Get priority text color
   */
  const getPriorityTextColor = () => {
    const colors = {
      low: 'text-blue-700',
      medium: 'text-yellow-700',
      high: 'text-orange-700',
      critical: 'text-red-700',
    };
    return colors[issue.priority];
  };

  /**
   * Format date to relative time
   */
  const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(date).toLocaleDateString();
  };

  if (compact) {
    return (
      <div
        onClick={() => onClick?.(issue)}
        className={`p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer ${className}`}
      >
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-1">{getStatusIcon()}</div>
          <div className="flex-grow min-w-0">
            <h4 className="font-medium text-sm text-gray-900 truncate">{issue.title}</h4>
            <p className="text-xs text-gray-600 mt-1 truncate">#{issue.id}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick?.(issue)}
      className={`border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition cursor-pointer ${getPriorityColor()} ${className}`}
    >
      {/* Header with status and priority */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-semibold text-gray-900">#{issue.id}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityTextColor()}`}>
          {issue.priority}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{issue.title}</h3>

      {/* Description preview */}
      {issue.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{issue.description}</p>
      )}

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {issue.labels.slice(0, 3).map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: label.color + '20', color: label.color }}
              title={label.description}
            >
              {label.name}
            </span>
          ))}
          {issue.labels.length > 3 && (
            <span className="text-xs text-gray-500 px-2 py-1">+{issue.labels.length - 3}</span>
          )}
        </div>
      )}

      {/* Milestone */}
      {issue.milestone && (
        <div className="mb-3 p-2 bg-white bg-opacity-50 rounded text-xs">
          <div className="font-medium text-gray-700 mb-1">{issue.milestone.title}</div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition"
              style={{ width: `${issue.milestone.progress}%` }}
            />
          </div>
          <div className="text-gray-600 mt-1">{issue.milestone.progress}% complete</div>
        </div>
      )}

      {/* Assignees and metadata */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          {issue.assignees.length > 0 ? (
            <div className="flex -space-x-2">
              {issue.assignees.slice(0, 2).map((assignee) => (
                <div
                  key={assignee.id}
                  className="w-5 h-5 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs text-white font-semibold"
                  title={assignee.name}
                >
                  {assignee.avatar ? (
                    <img src={assignee.avatar} alt={assignee.name} className="w-full h-full rounded-full" />
                  ) : (
                    assignee.name.charAt(0).toUpperCase()
                  )}
                </div>
              ))}
              {issue.assignees.length > 2 && (
                <div className="w-5 h-5 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs text-white font-semibold">
                  +{issue.assignees.length - 2}
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-500">No assignees</span>
          )}
        </div>
        <div className="text-xs text-gray-600">
          <div>{issue.commentCount} comments</div>
          <div>Updated {formatRelativeDate(issue.updatedAt)}</div>
        </div>
      </div>

      {/* Status badge */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            issue.status === 'open'
              ? 'bg-green-100 text-green-800'
              : issue.status === 'closed'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {issue.status}
        </span>
      </div>
    </div>
  );
};

export default IssueCard;
