import React, { useState } from 'react';
import {
  PullRequestFormProps,
  CreatePullRequestData,
  PRBranch,
} from './types';

/**
 * PullRequestForm Component
 *
 * Form component for creating a new pull request.
 * Includes base/head branch selection, title, description, and optional settings.
 *
 * Features:
 * - Title and description input fields
 * - Base and head branch selection dropdowns
 * - Draft mode toggle
 * - Label selection
 * - Assignee selection
 * - Reviewer selection
 * - Form validation
 * - Loading and error states
 * - Cancel and submit buttons
 *
 * @example
 * ```tsx
 * <PullRequestForm
 *   branches={branches}
 *   onSubmit={handleCreatePR}
 *   onCancel={handleCancel}
 * />
 * ```
 */
const PullRequestForm: React.FC<PullRequestFormProps> = ({
  defaultTitle = '',
  defaultDescription = '',
  baseBranch: defaultBaseBranch = 'main',
  headBranch: defaultHeadBranch = '',
  branches = [],
  isLoading = false,
  error = null,
  onSubmit,
  onCancel,
  className = '',
}) => {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [baseBranch, setBaseBranch] = useState(defaultBaseBranch);
  const [headBranch, setHeadBranch] = useState(defaultHeadBranch);
  const [isDraft, setIsDraft] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [reviewers, setReviewers] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(error);

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    if (!title.trim()) {
      setFormError('Title is required');
      return false;
    }
    if (!baseBranch) {
      setFormError('Base branch is required');
      return false;
    }
    if (!headBranch) {
      setFormError('Head branch is required');
      return false;
    }
    if (baseBranch === headBranch) {
      setFormError('Base and head branches must be different');
      return false;
    }
    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!validateForm()) {
      return;
    }

    try {
      const data: CreatePullRequestData = {
        title: title.trim(),
        description: description.trim(),
        baseBranch,
        headBranch,
        isDraft,
        labels: labels.length > 0 ? labels : undefined,
        assignees: assignees.length > 0 ? assignees : undefined,
        reviewers: reviewers.length > 0 ? reviewers : undefined,
      };

      await onSubmit(data);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to create pull request'
      );
    }
  };

  /**
   * Handle label addition
   */
  const addLabel = (label: string) => {
    if (!labels.includes(label)) {
      setLabels([...labels, label]);
    }
  };

  /**
   * Handle label removal
   */
  const removeLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label));
  };

  const availableLabels = [
    'bug',
    'feature',
    'enhancement',
    'documentation',
    'wontfix',
  ];

  const suggestedReviewers = ['alice', 'bob', 'charlie'];

  const suggestedAssignees = ['alice', 'bob', 'charlie', 'diana'];

  return (
    <div className={`pr-form ${className}`}>
      <h2 className="form-title">Create Pull Request</h2>

      {formError && (
        <div className="form-error-banner">
          <strong>Error</strong>
          <p>{formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-content">
        {/* Branch Selection Section */}
        <div className="form-section">
          <h3 className="section-title">Branches</h3>
          <div className="form-row branches-row">
            <div className="form-group">
              <label htmlFor="base-branch" className="form-label">
                Base Branch
              </label>
              <select
                id="base-branch"
                value={baseBranch}
                onChange={(e) => setBaseBranch(e.target.value)}
                className="form-input select-input"
                disabled={isLoading}
              >
                <option value="">Select base branch</option>
                {branches.map((branch) => (
                  <option key={branch.sha} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="branch-arrow">→</div>

            <div className="form-group">
              <label htmlFor="head-branch" className="form-label">
                Head Branch
              </label>
              <select
                id="head-branch"
                value={headBranch}
                onChange={(e) => setHeadBranch(e.target.value)}
                className="form-input select-input"
                disabled={isLoading}
              >
                <option value="">Select head branch</option>
                {branches.map((branch) => (
                  <option key={branch.sha} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Title and Description Section */}
        <div className="form-section">
          <h3 className="section-title">Details</h3>

          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Title <span className="required">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a title for your pull request"
              className="form-input text-input"
              disabled={isLoading}
              maxLength={256}
            />
            <span className="char-count">
              {title.length}/256
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description of your changes (supports markdown)"
              className="form-input textarea-input"
              disabled={isLoading}
              rows={6}
            />
            <span className="form-hint">
              Tip: Use markdown formatting for better readability
            </span>
          </div>
        </div>

        {/* Labels Section */}
        <div className="form-section">
          <h3 className="section-title">Labels</h3>
          <div className="label-selector">
            <div className="label-options">
              {availableLabels.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => addLabel(label)}
                  disabled={labels.includes(label) || isLoading}
                  className={`label-option ${labels.includes(label) ? 'selected' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {labels.length > 0 && (
              <div className="selected-labels">
                {labels.map((label) => (
                  <span key={label} className="selected-label">
                    {label}
                    <button
                      type="button"
                      onClick={() => removeLabel(label)}
                      className="remove-label"
                      disabled={isLoading}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assignees Section */}
        <div className="form-section">
          <h3 className="section-title">Assignees</h3>
          <div className="user-selector">
            {suggestedAssignees.map((user) => (
              <button
                key={user}
                type="button"
                onClick={() => {
                  if (assignees.includes(user)) {
                    setAssignees(assignees.filter((a) => a !== user));
                  } else {
                    setAssignees([...assignees, user]);
                  }
                }}
                disabled={isLoading}
                className={`user-option ${assignees.includes(user) ? 'selected' : ''}`}
              >
                {user}
              </button>
            ))}
          </div>
        </div>

        {/* Reviewers Section */}
        <div className="form-section">
          <h3 className="section-title">Reviewers</h3>
          <div className="user-selector">
            {suggestedReviewers.map((user) => (
              <button
                key={user}
                type="button"
                onClick={() => {
                  if (reviewers.includes(user)) {
                    setReviewers(reviewers.filter((r) => r !== user));
                  } else {
                    setReviewers([...reviewers, user]);
                  }
                }}
                disabled={isLoading}
                className={`user-option ${reviewers.includes(user) ? 'selected' : ''}`}
              >
                {user}
              </button>
            ))}
          </div>
        </div>

        {/* Draft Mode Section */}
        <div className="form-section">
          <div className="form-checkbox-group">
            <input
              id="draft-mode"
              type="checkbox"
              checked={isDraft}
              onChange={(e) => setIsDraft(e.target.checked)}
              disabled={isLoading}
              className="form-checkbox"
            />
            <label htmlFor="draft-mode" className="checkbox-label">
              Mark as draft
            </label>
            <span className="checkbox-hint">
              Drafts cannot be merged and are not fully visible to reviewers
            </span>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-lg"
          >
            {isLoading ? 'Creating...' : 'Create Pull Request'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn btn-secondary btn-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PullRequestForm;
