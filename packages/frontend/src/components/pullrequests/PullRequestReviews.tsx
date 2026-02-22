import React, { useState } from 'react';
import { PullRequestReviewsProps, ReviewDecision } from './types';

/**
 * PullRequestReviews Component
 *
 * Displays pull request reviews and provides interface for approving or requesting changes.
 * Shows review decisions with author information and comments.
 *
 * Features:
 * - Display reviews with decision status
 * - Approve/Request changes buttons
 * - Review comments with author details
 * - Review state indicators (approved, changes requested, commented)
 * - Loading and error states
 * - Current user review capability check
 *
 * @example
 * ```tsx
 * <PullRequestReviews
 *   reviews={reviews}
 *   currentUserCanReview={true}
 *   onApprove={handleApprove}
 * />
 * ```
 */
const PullRequestReviews: React.FC<PullRequestReviewsProps> = ({
  reviews,
  currentUserCanReview = false,
  reviewDecision,
  isLoading = false,
  onApprove,
  onRequestChanges,
  onComment,
  className = '',
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAction, setReviewAction] = useState<
    'approve' | 'changes' | 'comment' | null
  >(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * Get decision badge styling and label
   */
  const getDecisionBadge = (decision: ReviewDecision) => {
    const badges = {
      approved: {
        class: 'decision-approved',
        label: '✓ Approved',
        icon: '✓',
      },
      changes_requested: {
        class: 'decision-changes',
        label: '⚠ Changes Requested',
        icon: '⚠',
      },
      commented: {
        class: 'decision-commented',
        label: '💬 Commented',
        icon: '💬',
      },
      pending: {
        class: 'decision-pending',
        label: '⏳ Pending Review',
        icon: '⏳',
      },
    };

    const badge = badges[decision];
    return badge;
  };

  /**
   * Handle approve action
   */
  const handleApprove = async () => {
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      await onApprove?.();
      setShowReviewForm(false);
      setReviewComment('');
      setReviewAction(null);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to approve'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  /**
   * Handle request changes action
   */
  const handleRequestChanges = async () => {
    if (!reviewComment.trim()) {
      setSubmitError('Please provide feedback for requesting changes');
      return;
    }

    setSubmitError(null);
    setSubmitLoading(true);
    try {
      await onRequestChanges?.(reviewComment);
      setShowReviewForm(false);
      setReviewComment('');
      setReviewAction(null);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Failed to request changes'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  /**
   * Handle comment action
   */
  const handleComment = async () => {
    if (!reviewComment.trim()) {
      setSubmitError('Please enter a comment');
      return;
    }

    setSubmitError(null);
    setSubmitLoading(true);
    try {
      await onComment?.(reviewComment);
      setShowReviewForm(false);
      setReviewComment('');
      setReviewAction(null);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to add comment'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`pr-reviews loading-state ${className}`}>
        <div className="skeleton-content">
          <div className="skeleton-line" style={{ width: '80%' }} />
          <div className="skeleton-line" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  const decisionCounts = {
    approved: reviews.filter((r) => r.decision === 'approved').length,
    changes_requested: reviews.filter(
      (r) => r.decision === 'changes_requested'
    ).length,
    commented: reviews.filter((r) => r.decision === 'commented').length,
  };

  return (
    <div className={`pr-reviews ${className}`}>
      <div className="reviews-header">
        <h3 className="reviews-title">Reviews</h3>
        <div className="reviews-summary">
          {decisionCounts.approved > 0 && (
            <span className="summary-badge approved">
              ✓ {decisionCounts.approved} approved
            </span>
          )}
          {decisionCounts.changes_requested > 0 && (
            <span className="summary-badge changes">
              ⚠ {decisionCounts.changes_requested} changes requested
            </span>
          )}
          {decisionCounts.commented > 0 && (
            <span className="summary-badge commented">
              💬 {decisionCounts.commented} commented
            </span>
          )}
        </div>
      </div>

      {currentUserCanReview && !showReviewForm && (
        <div className="review-actions">
          <button
            onClick={() => {
              setShowReviewForm(true);
              setReviewAction('approve');
            }}
            disabled={submitLoading}
            className="btn btn-success"
          >
            ✓ Approve
          </button>
          <button
            onClick={() => {
              setShowReviewForm(true);
              setReviewAction('changes');
            }}
            disabled={submitLoading}
            className="btn btn-warning"
          >
            ⚠ Request Changes
          </button>
          <button
            onClick={() => {
              setShowReviewForm(true);
              setReviewAction('comment');
            }}
            disabled={submitLoading}
            className="btn btn-secondary"
          >
            💬 Comment
          </button>
        </div>
      )}

      {showReviewForm && (
        <div className="review-form">
          {submitError && (
            <div className="form-error">
              <strong>Error</strong>
              <p>{submitError}</p>
            </div>
          )}

          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Add a comment to your review..."
            className="review-textarea"
            rows={4}
            disabled={submitLoading || reviewAction === 'approve'}
          />

          <div className="review-form-actions">
            {reviewAction === 'approve' && (
              <button
                onClick={handleApprove}
                disabled={submitLoading}
                className="btn btn-success"
              >
                {submitLoading ? 'Approving...' : 'Approve'}
              </button>
            )}
            {reviewAction === 'changes' && (
              <button
                onClick={handleRequestChanges}
                disabled={submitLoading || !reviewComment.trim()}
                className="btn btn-warning"
              >
                {submitLoading ? 'Requesting...' : 'Request Changes'}
              </button>
            )}
            {reviewAction === 'comment' && (
              <button
                onClick={handleComment}
                disabled={submitLoading || !reviewComment.trim()}
                className="btn btn-secondary"
              >
                {submitLoading ? 'Commenting...' : 'Comment'}
              </button>
            )}
            <button
              onClick={() => {
                setShowReviewForm(false);
                setReviewComment('');
                setReviewAction(null);
                setSubmitError(null);
              }}
              disabled={submitLoading}
              className="btn btn-outline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="empty-reviews">
          <p>No reviews yet</p>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => {
            const badge = getDecisionBadge(review.decision);
            return (
              <div key={review.id} className={`review-item ${badge.class}`}>
                <div className="review-header">
                  <div className="review-author">
                    <strong>{review.author.username}</strong>
                    <span className={`review-decision ${badge.class}`}>
                      {badge.label}
                    </span>
                  </div>
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {review.comment && (
                  <div className="review-comment">
                    <p>{review.comment}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PullRequestReviews;
