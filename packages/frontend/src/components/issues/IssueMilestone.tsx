import React, { useState } from 'react';
import { Milestone } from './IssueList';

/**
 * Props interface for IssueMilestone component
 */
interface IssueMilestoneProps {
  /** List of available milestones */
  milestones: Milestone[];
  /** Currently selected milestone */
  selectedMilestone?: Milestone | null;
  /** Callback when milestone is selected */
  onMilestoneSelect?: (milestone: Milestone | null) => void;
  /** Allow creating new milestones */
  canCreateMilestone?: boolean;
  /** Callback when new milestone is created */
  onCreateMilestone?: (milestone: Omit<Milestone, 'id'>) => Promise<Milestone>;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Compact view (display only) */
  compact?: boolean;
  /** Show progress bar */
  showProgress?: boolean;
}

/**
 * IssueMilestone Component
 * 
 * Displays and manages milestones for issues. Allows selection of milestones,
 * creation of new ones, and visualization of milestone progress.
 * Can be used in compact mode for read-only display.
 * 
 * @component
 * @example
 * ```tsx
 * <IssueMilestone 
 *   milestones={availableMilestones}
 *   selectedMilestone={issueMilestone}
 *   onMilestoneSelect={handleSelect}
 * />
 * ```
 */
const IssueMilestone: React.FC<IssueMilestoneProps> = ({
  milestones,
  selectedMilestone = null,
  onMilestoneSelect,
  canCreateMilestone = false,
  onCreateMilestone,
  isLoading = false,
  error = null,
  compact = false,
  showProgress = true,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    dueDate: '',
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Filter milestones based on search term
   */
  const filteredMilestones = milestones.filter((milestone) =>
    milestone.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    milestone.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Format date for display
   */
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Handle milestone creation
   */
  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMilestone.title.trim()) {
      setCreateError('Title is required');
      return;
    }

    if (milestones.some((m) => m.title.toLowerCase() === newMilestone.title.toLowerCase())) {
      setCreateError('Milestone with this title already exists');
      return;
    }

    try {
      setCreateError(null);
      setIsSubmitting(true);

      const dueDate = newMilestone.dueDate ? new Date(newMilestone.dueDate) : undefined;
      const createdMilestone = await onCreateMilestone?.({
        title: newMilestone.title,
        description: newMilestone.description,
        dueDate,
        progress: 0,
      });

      if (createdMilestone && onMilestoneSelect) {
        onMilestoneSelect(createdMilestone);
      }

      setNewMilestone({ title: '', description: '', dueDate: '' });
      setIsCreating(false);
      setIsDropdownOpen(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create milestone');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Get status color based on progress
   */
  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  /**
   * Get days until due date
   */
  const getDaysUntilDue = (dueDate: Date | undefined) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { days: Math.abs(diffDays), overdue: true };
    if (diffDays === 0) return { days: 0, overdue: false, today: true };
    return { days: diffDays, overdue: false };
  };

  /**
   * Render compact mode
   */
  if (compact && selectedMilestone) {
    return (
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <h3 className="font-semibold text-blue-900 text-sm">{selectedMilestone.title}</h3>
        {selectedMilestone.dueDate && (
          <p className="text-xs text-blue-700 mt-1">
            Due: {formatDate(selectedMilestone.dueDate)}
          </p>
        )}
        {showProgress && (
          <div className="mt-2">
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition ${getProgressColor(selectedMilestone.progress)}`}
                style={{ width: `${selectedMilestone.progress}%` }}
              />
            </div>
            <p className="text-xs text-blue-700 mt-1">{selectedMilestone.progress}% complete</p>
          </div>
        )}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="text-gray-600 text-sm">
        <p>No milestone selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Milestone</h2>
        {canCreateMilestone && !isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Create new
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Create milestone form */}
      {isCreating && canCreateMilestone && (
        <form onSubmit={handleCreateMilestone} className="border border-gray-300 rounded-lg p-4 space-y-3 bg-gray-50">
          <div>
            <label htmlFor="milestone-title" className="block text-sm font-medium text-gray-900 mb-1">
              Title *
            </label>
            <input
              id="milestone-title"
              type="text"
              value={newMilestone.title}
              onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
              placeholder="e.g., Version 1.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="milestone-description" className="block text-sm font-medium text-gray-900 mb-1">
              Description
            </label>
            <textarea
              id="milestone-description"
              value={newMilestone.description}
              onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
              placeholder="Describe what this milestone includes..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="milestone-dueDate" className="block text-sm font-medium text-gray-900 mb-1">
              Due Date
            </label>
            <input
              id="milestone-dueDate"
              type="date"
              value={newMilestone.dueDate}
              onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {createError && (
            <p className="text-sm text-red-600">{createError}</p>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewMilestone({ title: '', description: '', dueDate: '' });
                setCreateError(null);
              }}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* Milestone selector dropdown */}
      {!isCreating && (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition flex items-center justify-between"
            disabled={isLoading}
          >
            <div>
              {selectedMilestone ? (
                <div>
                  <div className="font-semibold text-gray-900">{selectedMilestone.title}</div>
                  {selectedMilestone.dueDate && (
                    <div className="text-sm text-gray-600 mt-1">
                      Due: {formatDate(selectedMilestone.dueDate)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-600">Select a milestone...</div>
              )}
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
              {/* Search input */}
              <div className="p-3 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Search milestones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* None option */}
              <button
                onClick={() => {
                  onMilestoneSelect?.(null);
                  setIsDropdownOpen(false);
                  setSearchTerm('');
                }}
                className={`w-full text-left px-4 py-3 text-sm border-b border-gray-200 hover:bg-gray-50 transition ${
                  !selectedMilestone ? 'bg-blue-50 text-blue-600 font-medium' : ''
                }`}
              >
                No milestone
              </button>

              {/* Loading state */}
              {isLoading && (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                </div>
              )}

              {/* Milestones list */}
              {!isLoading && filteredMilestones.length > 0 && (
                <div className="max-h-96 overflow-y-auto">
                  {filteredMilestones.map((milestone) => {
                    const daysInfo = getDaysUntilDue(milestone.dueDate);
                    return (
                      <button
                        key={milestone.id}
                        onClick={() => {
                          onMilestoneSelect?.(milestone);
                          setIsDropdownOpen(false);
                          setSearchTerm('');
                        }}
                        className={`w-full text-left px-4 py-3 text-sm border-b border-gray-200 hover:bg-gray-50 transition ${
                          selectedMilestone?.id === milestone.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-grow">
                            <div className="font-medium text-gray-900">{milestone.title}</div>
                            {milestone.description && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{milestone.description}</p>
                            )}
                            {milestone.dueDate && (
                              <div className="text-xs text-gray-600 mt-2">
                                Due: {formatDate(milestone.dueDate)}
                                {daysInfo && (
                                  <span className={daysInfo.overdue ? 'text-red-600 ml-2' : ''}>
                                    {daysInfo.today ? '(Today)' : `(${daysInfo.days} days)`}
                                  </span>
                                )}
                              </div>
                            )}
                            {showProgress && (
                              <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition ${getProgressColor(milestone.progress)}`}
                                    style={{ width: `${milestone.progress}%` }}
                                  />
                                </div>
                                <div className="text-xs text-gray-600 mt-1">{milestone.progress}% complete</div>
                              </div>
                            )}
                          </div>
                          {selectedMilestone?.id === milestone.id && (
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Empty state */}
              {!isLoading && filteredMilestones.length === 0 && (
                <div className="p-4 text-center text-gray-600 text-sm">
                  {searchTerm ? 'No milestones match your search' : 'No milestones available'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selected milestone details */}
      {selectedMilestone && !isCreating && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-3">
          <div>
            <h3 className="font-semibold text-blue-900">{selectedMilestone.title}</h3>
            {selectedMilestone.description && (
              <p className="text-sm text-blue-800 mt-2">{selectedMilestone.description}</p>
            )}
          </div>

          {selectedMilestone.dueDate && (
            <div>
              <p className="text-sm text-blue-700">
                <span className="font-medium">Due Date:</span> {formatDate(selectedMilestone.dueDate)}
              </p>
              {getDaysUntilDue(selectedMilestone.dueDate) && (
                <p className={`text-sm mt-1 ${getDaysUntilDue(selectedMilestone.dueDate)?.overdue ? 'text-red-600 font-medium' : 'text-blue-700'}`}>
                  {getDaysUntilDue(selectedMilestone.dueDate)?.today
                    ? '📅 Due today!'
                    : getDaysUntilDue(selectedMilestone.dueDate)?.overdue
                    ? `⚠️ Overdue by ${getDaysUntilDue(selectedMilestone.dueDate)?.days} days`
                    : `📅 ${getDaysUntilDue(selectedMilestone.dueDate)?.days} days remaining`}
                </p>
              )}
            </div>
          )}

          {showProgress && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Progress</span>
                <span className="text-sm font-semibold text-blue-900">{selectedMilestone.progress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition ${getProgressColor(selectedMilestone.progress)}`}
                  style={{ width: `${selectedMilestone.progress}%` }}
                />
              </div>
            </div>
          )}

          {onMilestoneSelect && (
            <button
              onClick={() => onMilestoneSelect(null)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Remove milestone
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default IssueMilestone;
