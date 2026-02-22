import React, { useState } from 'react';
import { Issue, Label, User } from './IssueList';

/**
 * Interface for filter configuration
 */
export interface FilterConfig {
  status: string[];
  labels: string[];
  assignees: string[];
  priority: string[];
  createdBy?: string[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

/**
 * Props interface for IssueFilters component
 */
interface IssueFiltersProps {
  /** Available labels for filtering */
  availableLabels: Label[];
  /** Available users for filtering */
  availableUsers: User[];
  /** Available statuses */
  statuses?: Issue['status'][];
  /** Available priorities */
  priorities?: Issue['priority'][];
  /** Current filter configuration */
  activeFilters: FilterConfig;
  /** Callback when filters change */
  onFiltersChange: (filters: FilterConfig) => void;
  /** Callback when filters are cleared */
  onClearFilters?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Number of results matching current filters */
  resultCount?: number;
  /** Compact mode (sidebar) */
  compact?: boolean;
}

/**
 * IssueFilters Component
 * 
 * Advanced filtering sidebar for issues with support for:
 * - Status filtering
 * - Label filtering
 * - Assignee filtering
 * - Priority filtering
 * - Date range filtering
 * - Filter presets
 * 
 * @component
 * @example
 * ```tsx
 * <IssueFilters 
 *   availableLabels={labels}
 *   availableUsers={users}
 *   activeFilters={filters}
 *   onFiltersChange={handleFilterChange}
 * />
 * ```
 */
const IssueFilters: React.FC<IssueFiltersProps> = ({
  availableLabels,
  availableUsers,
  statuses = ['open', 'closed', 'draft'],
  priorities = ['low', 'medium', 'high', 'critical'],
  activeFilters,
  onFiltersChange,
  onClearFilters,
  isLoading = false,
  resultCount,
  compact = false,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    status: true,
    labels: true,
    assignees: true,
    priority: true,
  });

  /**
   * Toggle filter section expansion
   */
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  /**
   * Handle status filter change
   */
  const handleStatusChange = (status: string) => {
    const newStatuses = activeFilters.status.includes(status)
      ? activeFilters.status.filter((s) => s !== status)
      : [...activeFilters.status, status];

    onFiltersChange({ ...activeFilters, status: newStatuses });
  };

  /**
   * Handle priority filter change
   */
  const handlePriorityChange = (priority: string) => {
    const newPriorities = activeFilters.priority.includes(priority)
      ? activeFilters.priority.filter((p) => p !== priority)
      : [...activeFilters.priority, priority];

    onFiltersChange({ ...activeFilters, priority: newPriorities });
  };

  /**
   * Handle label filter change
   */
  const handleLabelChange = (labelId: string) => {
    const newLabels = activeFilters.labels.includes(labelId)
      ? activeFilters.labels.filter((l) => l !== labelId)
      : [...activeFilters.labels, labelId];

    onFiltersChange({ ...activeFilters, labels: newLabels });
  };

  /**
   * Handle assignee filter change
   */
  const handleAssigneeChange = (userId: string) => {
    const newAssignees = activeFilters.assignees.includes(userId)
      ? activeFilters.assignees.filter((a) => a !== userId)
      : [...activeFilters.assignees, userId];

    onFiltersChange({ ...activeFilters, assignees: newAssignees });
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters =
    activeFilters.status.length > 0 ||
    activeFilters.labels.length > 0 ||
    activeFilters.assignees.length > 0 ||
    activeFilters.priority.length > 0 ||
    activeFilters.createdBy?.length;

  /**
   * Get status badge color
   */
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-green-100 text-green-800 border-green-300',
      closed: 'bg-red-100 text-red-800 border-red-300',
      draft: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  /**
   * Get priority color
   */
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-100 text-blue-800 border-blue-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      critical: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  /**
   * Render filter section header
   */
  const renderSectionHeader = (title: string, count: number) => (
    <div className="flex items-center justify-between">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {count > 0 && (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
          {count}
        </span>
      )}
    </div>
  );

  /**
   * Render filter checkbox
   */
  const renderCheckbox = (
    id: string,
    label: string,
    checked: boolean,
    onChange: () => void,
    color?: string
  ) => (
    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
      {color && (
        <span
          className="inline-block w-3 h-3 rounded-full flex-shrink-0 ml-auto"
          style={{ backgroundColor: color }}
          title="Label color"
        />
      )}
    </label>
  );

  return (
    <div className={`${compact ? 'w-64' : 'max-w-sm'} bg-white border border-gray-200 rounded-lg space-y-4 p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Result count */}
      {resultCount !== undefined && (
        <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">{resultCount}</span> issues match your filters
          </p>
        </div>
      )}

      {/* Status filter */}
      <div className="border-t border-gray-200 pt-4">
        <button
          onClick={() => toggleSection('status')}
          className="w-full flex items-center justify-between mb-3 focus:outline-none group"
        >
          {renderSectionHeader('Status', activeFilters.status.length)}
          <svg
            className={`w-4 h-4 text-gray-600 group-hover:text-gray-900 transition ${
              expandedSections.status ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        {expandedSections.status && (
          <div className="space-y-2">
            {statuses.map((status) => (
              <div key={status}>
                {renderCheckbox(
                  `status-${status}`,
                  status.charAt(0).toUpperCase() + status.slice(1),
                  activeFilters.status.includes(status),
                  () => handleStatusChange(status)
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Priority filter */}
      <div className="border-t border-gray-200 pt-4">
        <button
          onClick={() => toggleSection('priority')}
          className="w-full flex items-center justify-between mb-3 focus:outline-none group"
        >
          {renderSectionHeader('Priority', activeFilters.priority.length)}
          <svg
            className={`w-4 h-4 text-gray-600 group-hover:text-gray-900 transition ${
              expandedSections.priority ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        {expandedSections.priority && (
          <div className="space-y-2">
            {priorities.map((priority) => (
              <label key={priority} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition">
                <input
                  type="checkbox"
                  checked={activeFilters.priority.includes(priority)}
                  onChange={() => handlePriorityChange(priority)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 capitalize">{priority}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Labels filter */}
      <div className="border-t border-gray-200 pt-4">
        <button
          onClick={() => toggleSection('labels')}
          className="w-full flex items-center justify-between mb-3 focus:outline-none group"
        >
          {renderSectionHeader('Labels', activeFilters.labels.length)}
          <svg
            className={`w-4 h-4 text-gray-600 group-hover:text-gray-900 transition ${
              expandedSections.labels ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        {expandedSections.labels && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableLabels.length === 0 ? (
              <p className="text-sm text-gray-600">No labels available</p>
            ) : (
              availableLabels.map((label) => (
                <label
                  key={label.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition"
                >
                  <input
                    type="checkbox"
                    checked={activeFilters.labels.includes(label.id)}
                    onChange={() => handleLabelChange(label.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="text-sm text-gray-700">{label.name}</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      {/* Assignees filter */}
      <div className="border-t border-gray-200 pt-4">
        <button
          onClick={() => toggleSection('assignees')}
          className="w-full flex items-center justify-between mb-3 focus:outline-none group"
        >
          {renderSectionHeader('Assignees', activeFilters.assignees.length)}
          <svg
            className={`w-4 h-4 text-gray-600 group-hover:text-gray-900 transition ${
              expandedSections.assignees ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        {expandedSections.assignees && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableUsers.length === 0 ? (
              <p className="text-sm text-gray-600">No users available</p>
            ) : (
              availableUsers.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition"
                >
                  <input
                    type="checkbox"
                    checked={activeFilters.assignees.includes(user.id)}
                    onChange={() => handleAssigneeChange(user.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-300 flex-shrink-0" />
                  )}
                  <span className="text-sm text-gray-700">{user.name}</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="border-t border-gray-200 pt-4 space-y-2">
          <p className="text-xs font-semibold text-gray-700 uppercase">Active Filters</p>
          <div className="flex flex-wrap gap-2">
            {/* Status tags */}
            {activeFilters.status.map((status) => (
              <span
                key={`status-${status}`}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}
              >
                {status}
                <button
                  onClick={() => handleStatusChange(status)}
                  className="hover:opacity-70"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}

            {/* Priority tags */}
            {activeFilters.priority.map((priority) => (
              <span
                key={`priority-${priority}`}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(priority)}`}
              >
                {priority}
                <button
                  onClick={() => handlePriorityChange(priority)}
                  className="hover:opacity-70"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}

            {/* Label tags */}
            {activeFilters.labels.map((labelId) => {
              const label = availableLabels.find((l) => l.id === labelId);
              return label ? (
                <span
                  key={`label-${labelId}`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border"
                  style={{ backgroundColor: label.color + '20', color: label.color, borderColor: label.color }}
                >
                  {label.name}
                  <button
                    onClick={() => handleLabelChange(labelId)}
                    className="hover:opacity-70"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </span>
              ) : null;
            })}

            {/* Assignee tags */}
            {activeFilters.assignees.map((userId) => {
              const user = availableUsers.find((u) => u.id === userId);
              return user ? (
                <span
                  key={`assignee-${userId}`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300"
                >
                  {user.name}
                  <button
                    onClick={() => handleAssigneeChange(userId)}
                    className="hover:opacity-70"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueFilters;
