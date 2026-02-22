import React, { useState } from 'react';
import { Issue, Label, User, Milestone } from './IssueList';

/**
 * Props interface for IssueDetail component
 */
interface IssueDetailProps {
  /** The issue to display */
  issue: Issue | null;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Callback when close button is clicked */
  onClose?: () => void;
  /** Callback when status changes */
  onStatusChange?: (status: Issue['status']) => void;
  /** Callback when assignees change */
  onAssigneeChange?: (assignees: User[]) => void;
  /** Callback when labels change */
  onLabelChange?: (labels: Label[]) => void;
  /** Callback when milestone changes */
  onMilestoneChange?: (milestone: Milestone | undefined) => void;
  /** Callback when description is edited */
  onDescriptionEdit?: (description: string) => void;
}

/**
 * IssueDetail Component
 * 
 * Displays a full-page or modal view of a single issue with all details,
 * including description, status, assignees, labels, and milestone.
 * Supports inline editing of issue properties.
 * 
 * @component
 * @example
 * ```tsx
 * <IssueDetail 
 *   issue={selectedIssue}
 *   onStatusChange={handleStatusChange}
 *   onClose={handleClose}
 * />
 * ```
 */
const IssueDetail: React.FC<IssueDetailProps> = ({
  issue,
  isLoading = false,
  error = null,
  onClose,
  onStatusChange,
  onAssigneeChange,
  onLabelChange,
  onMilestoneChange,
  onDescriptionEdit,
}) => {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(issue?.description || '');

  /**
   * Handle description save
   */
  const handleSaveDescription = () => {
    if (onDescriptionEdit) {
      onDescriptionEdit(editedDescription);
    }
    setIsEditingDescription(false);
  };

  /**
   * Format date with full details
   */
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading issue details...</p>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-gray-900 mb-1">Failed to load issue</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  /**
   * Render empty state
   */
  if (!issue) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p>Select an issue to view details</p>
        </div>
      </div>
    );
  }

  /**
   * Get status badge color
   */
  const getStatusColor = (status: Issue['status']) => {
    const colors = {
      open: 'bg-green-100 text-green-800 border-green-300',
      closed: 'bg-red-100 text-red-800 border-red-300',
      draft: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[status];
  };

  /**
   * Get priority color
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
    <div className="flex-1 bg-white border-l border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm text-gray-600 mb-2">#{issue.id}</div>
          <h1 className="text-2xl font-bold text-gray-900">{issue.title}</h1>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-3 gap-6 p-6">
        {/* Left column - Description and comments */}
        <div className="col-span-2 space-y-6">
          {/* Status and metadata */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(issue.status)}`}>
              {issue.status}
            </span>
            <span className={`text-sm font-semibold ${getPriorityColor(issue.priority)}`}>
              {issue.priority} priority
            </span>
            <span className="text-sm text-gray-600">
              Created {formatDate(issue.createdAt)}
            </span>
          </div>

          {/* Description section */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Description</h2>
              {!isEditingDescription && onDescriptionEdit && (
                <button
                  onClick={() => {
                    setEditedDescription(issue.description);
                    setIsEditingDescription(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditingDescription ? (
              <div className="space-y-2">
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  rows={8}
                  className="w-full border border-gray-300 rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a description..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDescription}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingDescription(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                {issue.description ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{issue.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description provided</p>
                )}
              </div>
            )}
          </div>

          {/* Comments section (placeholder) */}
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-900">{issue.commentCount} Comments</h2>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center text-gray-600">
              <p>Comments section - rendered via separate IssueComments component</p>
            </div>
          </div>
        </div>

        {/* Right column - Issue metadata and controls */}
        <div className="col-span-1 space-y-4">
          {/* Status selector */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Status</h3>
            <select
              value={issue.status}
              onChange={(e) => onStatusChange?.(e.target.value as Issue['status'])}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="open">Open</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Assignees section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Assignees</h3>
            {issue.assignees.length > 0 ? (
              <div className="space-y-2 mb-3">
                {issue.assignees.map((assignee) => (
                  <div key={assignee.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    {assignee.avatar ? (
                      <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        {assignee.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm text-gray-900">{assignee.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-3">No assignees</p>
            )}
            <button className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-gray-300 font-medium">
              Edit assignees
            </button>
          </div>

          {/* Labels section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Labels</h3>
            {issue.labels.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-3">
                {issue.labels.map((label) => (
                  <span
                    key={label.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: label.color + '30', color: label.color }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-3">No labels</p>
            )}
            <button className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-gray-300 font-medium">
              Edit labels
            </button>
          </div>

          {/* Milestone section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Milestone</h3>
            {issue.milestone ? (
              <div className="bg-blue-50 rounded p-3 mb-3">
                <div className="font-medium text-blue-900">{issue.milestone.title}</div>
                <div className="text-sm text-blue-700 mt-2">
                  {issue.milestone.dueDate && `Due ${new Date(issue.milestone.dueDate).toDateString()}`}
                </div>
                <div className="mt-2">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition"
                      style={{ width: `${issue.milestone.progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-blue-700 mt-1">{issue.milestone.progress}% complete</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-3">No milestone</p>
            )}
            <button className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-gray-300 font-medium">
              Edit milestone
            </button>
          </div>

          {/* Created by section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Created by</h3>
            <div className="flex items-center gap-2">
              {issue.createdBy.avatar ? (
                <img src={issue.createdBy.avatar} alt={issue.createdBy.name} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center text-sm font-bold">
                  {issue.createdBy.name.charAt(0)}
                </div>
              )}
              <div className="text-sm text-gray-900">{issue.createdBy.name}</div>
            </div>
          </div>

          {/* Closed date (if applicable) */}
          {issue.closed && (
            <div className="border border-gray-200 rounded-lg p-4 bg-red-50">
              <h3 className="font-semibold text-red-900 mb-2">Closed</h3>
              <p className="text-sm text-red-700">{formatDate(issue.closed)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;
