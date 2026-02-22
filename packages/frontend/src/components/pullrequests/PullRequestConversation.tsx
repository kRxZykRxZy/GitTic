import React, { useState } from 'react';
import { PullRequestConversationProps, PRComment } from './types';

/**
 * PullRequestConversation Component
 *
 * Renders a conversation thread of comments on a pull request.
 * Similar to GitHub's conversation tab with comment threading and editing capabilities.
 *
 * Features:
 * - Display comment threads chronologically
 * - Author avatars and information
 * - Comment timestamps
 * - Edit and delete actions for own comments
 * - Reply functionality with nesting
 * - Comment reactions
 * - Loading states
 * - Add new comment form
 *
 * @example
 * ```tsx
 * <PullRequestConversation
 *   comments={comments}
 *   currentUserId={userId}
 *   onAddComment={handleAddComment}
 * />
 * ```
 */
const PullRequestConversation: React.FC<PullRequestConversationProps> = ({
  comments,
  currentUserId,
  isLoading = false,
  onAddComment,
  onEditComment,
  onDeleteComment,
  className = '',
}) => {
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * Format date to relative time
   */
  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const then = new Date(dateString);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return then.toLocaleDateString();
  };

  /**
   * Handle adding a new comment
   */
  const handleAddComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!newComment.trim()) {
      setSubmitError('Comment cannot be empty');
      return;
    }

    setSubmitError(null);
    setSubmitLoading(true);

    try {
      await onAddComment?.(newComment);
      setNewComment('');
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to add comment'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  /**
   * Handle editing a comment
   */
  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) {
      setSubmitError('Comment cannot be empty');
      return;
    }

    setSubmitError(null);
    setSubmitLoading(true);

    try {
      await onEditComment?.(commentId, editContent);
      setEditingCommentId(null);
      setEditContent('');
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to edit comment'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  /**
   * Handle deleting a comment
   */
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setSubmitError(null);
    setSubmitLoading(true);

    try {
      await onDeleteComment?.(commentId);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to delete comment'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  /**
   * Render a single comment
   */
  const renderComment = (comment: PRComment, depth = 0) => {
    const isOwn = comment.author.id === currentUserId;
    const isEditing = editingCommentId === comment.id;

    return (
      <div
        key={comment.id}
        className={`comment-item depth-${depth} ${isOwn ? 'own-comment' : ''}`}
      >
        <div className="comment-header">
          {comment.author.avatarUrl && (
            <img
              src={comment.author.avatarUrl}
              alt={comment.author.username}
              className="comment-avatar"
            />
          )}
          <div className="comment-meta">
            <strong className="comment-author">
              {comment.author.displayName || comment.author.username}
            </strong>
            <span className="comment-username">@{comment.author.username}</span>
            <span className="comment-timestamp">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="comment-edited">(edited)</span>
            )}
          </div>

          {isOwn && (
            <div className="comment-actions">
              <button
                onClick={() => {
                  setEditingCommentId(comment.id);
                  setEditContent(comment.body);
                }}
                disabled={submitLoading}
                className="comment-action-btn edit-btn"
                title="Edit comment"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDeleteComment(comment.id)}
                disabled={submitLoading}
                className="comment-action-btn delete-btn"
                title="Delete comment"
              >
                🗑️
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="comment-edit-form">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="edit-textarea"
              rows={3}
              disabled={submitLoading}
            />
            <div className="edit-actions">
              <button
                onClick={() => handleEditComment(comment.id)}
                disabled={submitLoading || !editContent.trim()}
                className="btn btn-primary btn-sm"
              >
                {submitLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditingCommentId(null);
                  setEditContent('');
                }}
                disabled={submitLoading}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="comment-body">
            <p>{comment.body}</p>
          </div>
        )}

        {comment.reactions && Object.keys(comment.reactions).length > 0 && (
          <div className="comment-reactions">
            {Object.entries(comment.reactions).map(([emoji, count]) => {
              if (count === 0) return null;
              const emojiMap = {
                thumbsUp: '👍',
                thumbsDown: '👎',
                laugh: '😄',
                hooray: '🎉',
                confused: '😕',
                heart: '❤️',
              };
              return (
                <span
                  key={emoji}
                  className="reaction-badge"
                  title={`${emoji}: ${count}`}
                >
                  {emojiMap[emoji as keyof typeof emojiMap]} {count}
                </span>
              );
            })}
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="comment-replies">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`pr-conversation ${className}`}>
      {isLoading && (
        <div className="loading-state">
          <div className="skeleton-content">
            <div className="skeleton-line" style={{ width: '100%' }} />
            <div className="skeleton-line" style={{ width: '90%' }} />
          </div>
        </div>
      )}

      {!isLoading && (
        <>
          {comments.length === 0 ? (
            <div className="empty-conversation">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="comments-list">
              {comments.map((comment) => renderComment(comment))}
            </div>
          )}

          <div className="comment-form-section">
            <h4 className="form-title">Add a comment</h4>

            {submitError && (
              <div className="form-error">
                <strong>Error</strong>
                <p>{submitError}</p>
              </div>
            )}

            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Leave a comment..."
                className="comment-textarea"
                rows={4}
                disabled={submitLoading}
              />

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={submitLoading || !newComment.trim()}
                  className="btn btn-primary"
                >
                  {submitLoading ? 'Posting...' : 'Comment'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default PullRequestConversation;
