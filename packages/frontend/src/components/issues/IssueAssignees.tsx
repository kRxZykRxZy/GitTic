import React, { useState } from 'react';
import { User } from './IssueList';

/**
 * Props interface for IssueAssignees component
 */
interface IssueAssigneesProps {
  /** List of available users for assignment */
  availableUsers: User[];
  /** Currently assigned users */
  assignedUsers: User[];
  /** Callback when user is assigned */
  onAssignUser?: (user: User) => void;
  /** Callback when user is unassigned */
  onUnassignUser?: (userId: string) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Compact view (display only) */
  compact?: boolean;
  /** Allow self-assignment */
  canSelfAssign?: boolean;
  /** Current user for self-assignment */
  currentUser?: User;
  /** Callback when search term changes */
  onSearch?: (term: string) => void;
}

/**
 * IssueAssignees Component
 * 
 * Allows assignment and unassignment of users to an issue.
 * Supports user search, self-assignment, and bulk assignment.
 * Can be used in compact mode for display-only.
 * 
 * @component
 * @example
 * ```tsx
 * <IssueAssignees 
 *   availableUsers={users}
 *   assignedUsers={issue.assignees}
 *   onAssignUser={handleAssign}
 *   currentUser={currentUser}
 * />
 * ```
 */
const IssueAssignees: React.FC<IssueAssigneesProps> = ({
  availableUsers,
  assignedUsers,
  onAssignUser,
  onUnassignUser,
  isLoading = false,
  error = null,
  compact = false,
  canSelfAssign = true,
  currentUser,
  onSearch,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Filter users based on search and current assignees
   */
  const filteredUsers = availableUsers.filter(
    (user) =>
      !assignedUsers.some((au) => au.id === user.id) &&
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  /**
   * Check if user is assigned
   */
  const isUserAssigned = (userId: string) => {
    return assignedUsers.some((user) => user.id === userId);
  };

  /**
   * Handle search term change
   */
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    onSearch?.(term);
  };

  /**
   * Get user initials
   */
  const getUserInitials = (user: User) => {
    return user.name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  /**
   * Render compact mode
   */
  if (compact) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">Assignees</h3>
        {assignedUsers.length === 0 ? (
          <p className="text-sm text-gray-500">No assignees</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assignedUsers.map((user) => (
              <div
                key={user.id}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                title={user.email}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {getUserInitials(user)}
                  </div>
                )}
                {user.name}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <h2 className="text-lg font-semibold text-gray-900">Assignees</h2>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Self-assign button */}
      {canSelfAssign && currentUser && !isUserAssigned(currentUser.id) && (
        <button
          onClick={() => onAssignUser?.(currentUser)}
          className="w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50 transition font-medium"
        >
          Assign to me
        </button>
      )}

      {/* Assigned users list */}
      {assignedUsers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Assigned to ({assignedUsers.length})</h3>
          <div className="space-y-2">
            {assignedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition"
              >
                {/* Avatar */}
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {getUserInitials(user)}
                  </div>
                )}

                {/* User info */}
                <div className="flex-grow min-w-0">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  {user.email && (
                    <div className="text-xs text-gray-600 truncate">{user.email}</div>
                  )}
                </div>

                {/* Remove button */}
                {onUnassignUser && (
                  <button
                    onClick={() => onUnassignUser(user.id)}
                    className="text-gray-400 hover:text-red-600 transition"
                    title="Remove assignee"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add assignee button and dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          disabled={isLoading}
        >
          <span className="flex items-center justify-between">
            <span>Add assignee</span>
            <svg
              className={`w-4 h-4 transition ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </span>
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
            {/* Search input */}
            <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
              </div>
            )}

            {/* Users list */}
            {!isLoading && filteredUsers.length > 0 && (
              <div className="max-h-72 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      onAssignUser?.(user);
                      setSearchTerm('');
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition flex items-center gap-3"
                  >
                    {/* Avatar */}
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {getUserInitials(user)}
                      </div>
                    )}

                    {/* User info */}
                    <div className="flex-grow min-w-0">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      {user.email && (
                        <div className="text-xs text-gray-600 truncate">{user.email}</div>
                      )}
                    </div>

                    {/* Check icon */}
                    {isUserAssigned(user.id) && (
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* No results state */}
            {!isLoading && filteredUsers.length === 0 && availableUsers.length > 0 && (
              <div className="p-4 text-center text-sm text-gray-600">
                {searchTerm ? 'No users match your search' : 'All available users are already assigned'}
              </div>
            )}

            {/* No users state */}
            {!isLoading && availableUsers.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-600">
                No users available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty state */}
      {assignedUsers.length === 0 && !isDropdownOpen && (
        <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center">
          <p className="text-sm text-gray-600">No assignees yet</p>
          <p className="text-xs text-gray-500 mt-1">Assign users to collaborate on this issue</p>
        </div>
      )}
    </div>
  );
};

export default IssueAssignees;
