import React, { useState } from 'react';
import { User } from './IssueList';

/**
 * Interface for comment data
 */
export interface Comment {
  id: string;
  author: User;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  reactions: {
    emoji: string;
    count: number;
    userReacted: boolean;
  }[];
  replies?: Comment[];
}

/**
 * Props interface for IssueComments component
 */
interface IssueCommentsProps {
  /** Issue ID for context */
  issueId: string;
  /** List of comments */
  comments: Comment[];
  /** Current user */
  currentUser?: User;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Callback when comment is submitted */
  onCommentSubmit: (content: string) => Promise<void>;
  /** Callback when comment is edited */
  onCommentEdit?: (commentId: string, content: string) => Promise<void>;
  /** Callback when comment is deleted */
  onCommentDelete?: (commentId: string) => Promise<void>;
  /** Callback when reaction is added */
  onReactionAdd?: (commentId: string, emoji: string) => Promise<void>;
  /** Callback when comment is replied to */
  onReply?: (commentId: string, content: string) => Promise<void>;
  /** Allow editing own comments */
  allowEdit?: boolean;
  /** Allow deleting own comments */
  allowDelete?: boolean;
}

/**
 * IssueComments Component
 * 
 * Displays a thread of comments on an issue with support for:
 * - Comment submission and editing
 * - Comment deletion
 * - Reactions (emoji)
 * - Reply threads
 * - User avatars and timestamps
 * 
 * @component
 * @example
 * ```tsx
 * <IssueComments 
 *   issueId="123"
 *   comments={comments}
 *   currentUser={user}
 *   onCommentSubmit={handleSubmit}
 * />
 * ```
 */
const IssueComments: React.FC<IssueCommentsProps> = ({
  issueId,
  comments,
  currentUser,
  isLoading = false,
  error = null,
  onCommentSubmit,
  onCommentEdit,
  onCommentDelete,
  onReactionAdd,
  onReply,
  allowEdit = true,
  allowDelete = true,
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  /**
   * Handle comment submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      setSubmitError('Comment cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onCommentSubmit(newComment);
      setNewComment('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle comment edit
   */
  const handleEdit = async (commentId: string) => {
    if (!editingContent.trim()) {
      setSubmitError('Comment cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onCommentEdit?.(commentId, editingContent);
      setEditingCommentId(null);
      setEditingContent('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to edit comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle comment deletion
   */
  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onCommentDelete?.(commentId);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to delete comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle reply submission
   */
  const handleReplySubmit = async (parentId: string) => {
    if (!replyContent.trim()) {
      setSubmitError('Reply cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onReply?.(parentId, replyContent);
      setReplyingToId(null);
      setReplyContent('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Render a single comment
   */
  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 mt-4' : 'mt-6'}`}>
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.author.avatar ? (
            <img src={comment.author.avatar} alt={comment.author.name} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              {comment.author.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Comment content */}
        <div className="flex-grow">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-gray-900">{comment.author.name}</span>
            <span className="text-sm text-gray-600">
              {formatRelativeDate(comment.createdAt)}
            </span>
            {comment.updatedAt !== comment.createdAt && (
              <span className="text-xs text-gray-500">(edited)</span>
            )}
          </div>

          {/* Comment text or edit form */}
          {editingCommentId === comment.id ? (
            <div className="space-y-2">
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(comment.id)}
                  disabled={isSubmitting}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingCommentId(null);
                    setEditingContent('');
                  }}
                  className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 mb-2">
              <p className="text-gray-900 whitespace-pre-wrap">{comment.content}</p>
            </div>
          )}

          {/* Reactions */}
          {comment.reactions && comment.reactions.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {comment.reactions.map((reaction, idx) => (
                <button
                  key={idx}
                  onClick={() => onReactionAdd?.(comment.id, reaction.emoji)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                    reaction.userReacted
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Comment actions */}
          {!editingCommentId && (
            <div className="flex gap-3 text-sm">
              {onReactionAdd && (
                <button className="text-gray-600 hover:text-gray-900">
                  😊 React
                </button>
              )}
              {onReply && (
                <button
                  onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Reply
                </button>
              )}
              {allowEdit && currentUser?.id === comment.author.id && (
                <button
                  onClick={() => {
                    setEditingCommentId(comment.id);
                    setEditingContent(comment.content);
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Edit
                </button>
              )}
              {allowDelete && currentUser?.id === comment.author.id && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-gray-600 hover:text-red-600"
                >
                  Delete
                </button>
              )}
            </div>
          )}

          {/* Reply form */}
          {replyingToId === comment.id && onReply && (
            <div className="mt-3 space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleReplySubmit(comment.id)}
                  disabled={isSubmitting}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  Reply
                </button>
                <button
                  onClick={() => {
                    setReplyingToId(null);
                    setReplyContent('');
                  }}
                  className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Error message */}
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {submitError}
        </div>
      )}

      {/* Comments section header */}
      <div>
        <h2 className="font-semibold text-lg text-gray-900 mb-4">
          {comments.length} Comments
        </h2>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading comments...</p>
        </div>
      )}

      {/* Error loading comments */}
      {error && !isLoading && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          Failed to load comments: {error}
        </div>
      )}

      {/* Comments list */}
      {!isLoading && comments.length > 0 && (
        <div className="space-y-0 border-t border-gray-200 pt-6">
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}

      {/* No comments state */}
      {!isLoading && comments.length === 0 && !error && (
        <div className="text-center py-8 text-gray-600">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}

      {/* New comment form */}
      {currentUser && (
        <div className="border-t border-gray-200 pt-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-4">
              {/* User avatar */}
              <div className="flex-shrink-0">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Comment input */}
              <div className="flex-grow">
                <div className="mb-2">
                  <label htmlFor={`comment-${issueId}`} className="block text-sm font-semibold text-gray-900 mb-1">
                    Add a comment
                  </label>
                  <textarea
                    id={`comment-${issueId}`}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts, ask questions, or report issues..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Form actions */}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    Preview
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                    Comment
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Not logged in state */}
      {!currentUser && (
        <div className="border-t border-gray-200 pt-6 text-center">
          <p className="text-gray-600 mb-3">Sign in to join the conversation</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
            Sign In
          </button>
        </div>
      )}
    </div>
  );
};

export default IssueComments;
