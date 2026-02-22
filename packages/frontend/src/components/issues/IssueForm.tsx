import React, { useState } from 'react';
import { Issue, Label, User, Milestone } from './IssueList';

/**
 * Props interface for IssueForm component
 */
interface IssueFormProps {
  /** Existing issue to edit (if null, form is in create mode) */
  issue?: Issue | null;
  /** Available users for assignees */
  availableUsers?: User[];
  /** Available labels */
  availableLabels?: Label[];
  /** Available milestones */
  availableMilestones?: Milestone[];
  /** Form submission handler */
  onSubmit: (formData: IssueFormData) => Promise<void>;
  /** Callback on cancel */
  onCancel?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Submission error */
  error?: string | null;
}

/**
 * Interface for form data
 */
export interface IssueFormData {
  title: string;
  description: string;
  status: Issue['status'];
  priority: Issue['priority'];
  labels: Label[];
  assignees: User[];
  milestone?: Milestone;
}

/**
 * Validation error interface
 */
interface ValidationErrors {
  title?: string;
  description?: string;
}

/**
 * IssueForm Component
 * 
 * Form for creating and editing issues with full validation.
 * Supports assignees, labels, milestone, priority, and description.
 * Handles both create and edit modes.
 * 
 * @component
 * @example
 * ```tsx
 * <IssueForm 
 *   onSubmit={handleSubmit}
 *   availableUsers={users}
 *   availableLabels={labels}
 * />
 * ```
 */
const IssueForm: React.FC<IssueFormProps> = ({
  issue = null,
  availableUsers = [],
  availableLabels = [],
  availableMilestones = [],
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
}) => {
  const [formData, setFormData] = useState<IssueFormData>({
    title: issue?.title || '',
    description: issue?.description || '',
    status: issue?.status || 'open',
    priority: issue?.priority || 'medium',
    labels: issue?.labels || [],
    assignees: issue?.assignees || [],
    milestone: issue?.milestone,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMilestoneDropdown, setShowMilestoneDropdown] = useState(false);
  const [labelSearchTerm, setLabelSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must be less than 255 characters';
    }

    if (formData.description.length > 10000) {
      newErrors.description = 'Description must be less than 10000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      // Error is handled by parent component
    }
  };

  /**
   * Handle label selection
   */
  const handleLabelToggle = (label: Label) => {
    setFormData((prev) => {
      const isSelected = prev.labels.some((l) => l.id === label.id);
      return {
        ...prev,
        labels: isSelected
          ? prev.labels.filter((l) => l.id !== label.id)
          : [...prev.labels, label],
      };
    });
  };

  /**
   * Handle assignee selection
   */
  const handleAssigneeToggle = (user: User) => {
    setFormData((prev) => {
      const isSelected = prev.assignees.some((a) => a.id === user.id);
      return {
        ...prev,
        assignees: isSelected
          ? prev.assignees.filter((a) => a.id !== user.id)
          : [...prev.assignees, user],
      };
    });
  };

  /**
   * Handle assignee removal
   */
  const handleRemoveAssignee = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignees: prev.assignees.filter((a) => a.id !== userId),
    }));
  };

  /**
   * Handle label removal
   */
  const handleRemoveLabel = (labelId: string) => {
    setFormData((prev) => ({
      ...prev,
      labels: prev.labels.filter((l) => l.id !== labelId),
    }));
  };

  /**
   * Filter labels based on search term
   */
  const filteredLabels = availableLabels.filter((label) =>
    label.name.toLowerCase().includes(labelSearchTerm.toLowerCase())
  );

  /**
   * Filter users based on search term
   */
  const filteredUsers = availableUsers.filter((user) =>
    user.name.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <h3 className="font-semibold mb-1">Error</h3>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Title input */}
      <div className="mb-6">
        <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
          Title *
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Describe the issue in one sentence"
          className={`w-full px-4 py-3 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.title ? 'border-red-300' : 'border-gray-300'
          }`}
          maxLength={255}
          disabled={isLoading}
        />
        {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
        <div className="text-xs text-gray-500 mt-1">{formData.title.length}/255</div>
      </div>

      {/* Description input */}
      <div className="mb-6">
        <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Provide detailed information about the issue..."
          rows={8}
          className={`w-full px-4 py-3 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description ? 'border-red-300' : 'border-gray-300'
          }`}
          maxLength={10000}
          disabled={isLoading}
        />
        {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
        <div className="text-xs text-gray-500 mt-1">{formData.description.length}/10000</div>
      </div>

      {/* Status and Priority row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-semibold text-gray-900 mb-2">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Issue['status'] })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block text-sm font-semibold text-gray-900 mb-2">
            Priority
          </label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as Issue['priority'] })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Milestone selector */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-2">Milestone</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMilestoneDropdown(!showMilestoneDropdown)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            {formData.milestone ? formData.milestone.title : 'Select a milestone...'}
          </button>

          {showMilestoneDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, milestone: undefined });
                  setShowMilestoneDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-600"
              >
                None
              </button>
              {availableMilestones.map((milestone) => (
                <button
                  key={milestone.id}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, milestone });
                    setShowMilestoneDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center justify-between"
                >
                  <span>{milestone.title}</span>
                  {formData.milestone?.id === milestone.id && (
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assignees selector */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-2">Assignees</label>
        
        {/* Selected assignees */}
        {formData.assignees.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.assignees.map((assignee) => (
              <span
                key={assignee.id}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {assignee.name}
                <button
                  type="button"
                  onClick={() => handleRemoveAssignee(assignee.id)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Assignee search and dropdown */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={userSearchTerm}
            onChange={(e) => setUserSearchTerm(e.target.value)}
            onFocus={() => setShowUserDropdown(true)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />

          {showUserDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-600">No users found</div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      handleAssigneeToggle(user);
                      setUserSearchTerm('');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center justify-between"
                  >
                    <span>{user.name}</span>
                    {formData.assignees.some((a) => a.id === user.id) && (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Labels selector */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-2">Labels</label>
        
        {/* Selected labels */}
        {formData.labels.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.labels.map((label) => (
              <span
                key={label.id}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: label.color + '30', color: label.color }}
              >
                {label.name}
                <button
                  type="button"
                  onClick={() => handleRemoveLabel(label.id)}
                  className="hover:opacity-70"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Label search and dropdown */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search labels..."
            value={labelSearchTerm}
            onChange={(e) => setLabelSearchTerm(e.target.value)}
            onFocus={() => setShowLabelDropdown(true)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />

          {showLabelDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {filteredLabels.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-600">No labels found</div>
              ) : (
                filteredLabels.map((label) => (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => {
                      handleLabelToggle(label);
                      setLabelSearchTerm('');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <span>{label.name}</span>
                    </div>
                    {formData.labels.some((l) => l.id === label.id) && (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Form actions */}
      <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
          {issue ? 'Update Issue' : 'Create Issue'}
        </button>
      </div>
    </form>
  );
};

export default IssueForm;
