import React, { useState } from 'react';
import { Label } from './IssueList';

/**
 * Props interface for IssueLabels component
 */
interface IssueLabelsProps {
  /** List of available labels */
  labels: Label[];
  /** Currently selected labels */
  selectedLabels: Label[];
  /** Callback when label is added */
  onLabelAdd?: (label: Label) => void;
  /** Callback when label is removed */
  onLabelRemove?: (labelId: string) => void;
  /** Allow creating new labels */
  canCreateLabel?: boolean;
  /** Callback when new label is created */
  onCreateLabel?: (label: Omit<Label, 'id'>) => Promise<Label>;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Compact view (tag display only) */
  compact?: boolean;
  /** Callback when search term changes */
  onSearch?: (term: string) => void;
}

/**
 * IssueLabels Component
 * 
 * Displays available labels and allows selection/deselection of labels for an issue.
 * Supports label creation, filtering, and color-coded display.
 * Can be used in compact mode to just display selected labels.
 * 
 * @component
 * @example
 * ```tsx
 * <IssueLabels 
 *   labels={availableLabels}
 *   selectedLabels={issueLabels}
 *   onLabelAdd={handleAdd}
 *   onLabelRemove={handleRemove}
 * />
 * ```
 */
const IssueLabels: React.FC<IssueLabelsProps> = ({
  labels,
  selectedLabels,
  onLabelAdd,
  onLabelRemove,
  canCreateLabel = false,
  onCreateLabel,
  isLoading = false,
  error = null,
  compact = false,
  onSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState({ name: '', color: '#0366d6', description: '' });
  const [createError, setCreateError] = useState<string | null>(null);

  /**
   * Filter labels based on search term
   */
  const filteredLabels = labels.filter((label) =>
    label.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    label.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Check if label is selected
   */
  const isLabelSelected = (labelId: string) => {
    return selectedLabels.some((label) => label.id === labelId);
  };

  /**
   * Handle label creation
   */
  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newLabel.name.trim()) {
      setCreateError('Label name is required');
      return;
    }

    if (labels.some((l) => l.name.toLowerCase() === newLabel.name.toLowerCase())) {
      setCreateError('Label with this name already exists');
      return;
    }

    try {
      setCreateError(null);
      const createdLabel = await onCreateLabel?.({
        name: newLabel.name,
        color: newLabel.color,
        description: newLabel.description,
      });

      if (createdLabel && onLabelAdd) {
        onLabelAdd(createdLabel);
      }

      setNewLabel({ name: '', color: '#0366d6', description: '' });
      setIsCreating(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create label');
    }
  };

  /**
   * Validate color format
   */
  const isValidColor = (color: string) => /^#[0-9A-F]{6}$/i.test(color);

  /**
   * Get contrasting text color
   */
  const getContrastingTextColor = (hexColor: string) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  /**
   * Render compact mode (tag display only)
   */
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {selectedLabels.length === 0 ? (
          <span className="text-sm text-gray-500">No labels</span>
        ) : (
          selectedLabels.map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: label.color + '20', color: label.color }}
            >
              {label.name}
              {onLabelRemove && (
                <button
                  onClick={() => onLabelRemove(label.id)}
                  className="hover:opacity-70"
                  title="Remove label"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </span>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Labels</h2>
        {canCreateLabel && !isCreating && (
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

      {/* Create label form */}
      {isCreating && canCreateLabel && (
        <form onSubmit={handleCreateLabel} className="border border-gray-300 rounded-lg p-4 space-y-3 bg-gray-50">
          <div>
            <label htmlFor="label-name" className="block text-sm font-medium text-gray-900 mb-1">
              Label name *
            </label>
            <input
              id="label-name"
              type="text"
              value={newLabel.name}
              onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
              placeholder="e.g., bug, feature, documentation"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="label-color" className="block text-sm font-medium text-gray-900 mb-1">
                Color *
              </label>
              <div className="flex gap-2">
                <input
                  id="label-color"
                  type="color"
                  value={newLabel.color}
                  onChange={(e) => setNewLabel({ ...newLabel, color: e.target.value })}
                  className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={newLabel.color}
                  onChange={(e) => {
                    if (isValidColor(e.target.value)) {
                      setNewLabel({ ...newLabel, color: e.target.value });
                    }
                  }}
                  placeholder="#0366d6"
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Preview</label>
              <div
                className="w-full h-10 rounded-lg flex items-center justify-center text-sm font-medium"
                style={{
                  backgroundColor: newLabel.color,
                  color: getContrastingTextColor(newLabel.color),
                }}
              >
                {newLabel.name || 'Label'}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="label-description" className="block text-sm font-medium text-gray-900 mb-1">
              Description
            </label>
            <input
              id="label-description"
              type="text"
              value={newLabel.description}
              onChange={(e) => setNewLabel({ ...newLabel, description: e.target.value })}
              placeholder="Optional description"
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
                setNewLabel({ name: '', color: '#0366d6', description: '' });
                setCreateError(null);
              }}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Search input */}
      <div>
        <input
          type="text"
          placeholder="Search labels..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onSearch?.(e.target.value);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading labels...</p>
        </div>
      )}

      {/* Labels list */}
      {!isLoading && filteredLabels.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredLabels.map((label) => {
            const isSelected = isLabelSelected(label.id);
            return (
              <div
                key={label.id}
                className={`p-3 border rounded-lg cursor-pointer transition ${
                  isSelected
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => {
                  if (isSelected && onLabelRemove) {
                    onLabelRemove(label.id);
                  } else if (!isSelected && onLabelAdd) {
                    onLabelAdd(label);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Label preview */}
                  <div
                    className="px-3 py-1 rounded-full text-sm font-semibold text-white flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </div>

                  {/* Label details */}
                  <div className="flex-grow">
                    <div className="font-medium text-gray-900">{label.name}</div>
                    {label.description && (
                      <div className="text-sm text-gray-600 mt-1">{label.description}</div>
                    )}
                  </div>

                  {/* Checkbox */}
                  {isSelected && (
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No labels state */}
      {!isLoading && filteredLabels.length === 0 && labels.length === 0 && !isCreating && (
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="text-gray-600">No labels found</p>
          {canCreateLabel && (
            <p className="text-sm text-gray-500 mt-2">Create the first label to get started</p>
          )}
        </div>
      )}

      {/* No search results state */}
      {!isLoading && searchTerm && filteredLabels.length === 0 && labels.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No labels match your search</p>
          <p className="text-sm text-gray-500 mt-1">Try a different search term</p>
        </div>
      )}

      {/* Selected labels summary */}
      {!compact && selectedLabels.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Selected ({selectedLabels.length})</h3>
          <div className="flex flex-wrap gap-2">
            {selectedLabels.map((label) => (
              <div
                key={label.id}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: label.color + '20', color: label.color }}
              >
                {label.name}
                {onLabelRemove && (
                  <button
                    onClick={() => onLabelRemove(label.id)}
                    className="hover:opacity-70"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueLabels;
