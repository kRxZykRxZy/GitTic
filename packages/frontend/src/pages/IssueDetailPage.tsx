import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api-client";
import "./IssueDetailPage.css";

interface Issue {
  id: string;
  number: number;
  title: string;
  body?: string;
  state: "open" | "closed";
  authorId: string;
  assignees: string[];
  labels: string[];
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export const IssueDetailPage: React.FC = () => {
  const { owner, repo, number } = useParams<{ owner: string; repo: string; number: string }>();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadIssue();
    loadComments();
  }, [owner, repo, number]);

  const loadIssue = async () => {
    try {
      setLoading(true);
      const response = await api.get<Issue>(`/api/v1/${owner}/${repo}/issues/${number}`);
      setIssue(response.data || null);
      setError(null);
    } catch (err) {
      console.error("Failed to load issue:", err);
      setError("Failed to load issue");
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await api.get<Comment[]>(`/api/v1/${owner}/${repo}/issues/${number}/comments`);
      setComments(response.data || []);
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim() || submitting) return;

    try {
      setSubmitting(true);
      await api.post(`/api/v1/${owner}/${repo}/issues/${number}/comments`, {
        body: commentBody,
      });
      setCommentBody("");
      await loadComments();
    } catch (err) {
      console.error("Failed to post comment:", err);
      alert("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStateChange = async (newState: "open" | "closed") => {
    try {
      await api.patch(`/api/v1/${owner}/${repo}/issues/${number}`, {
        state: newState,
      });
      await loadIssue();
    } catch (err) {
      console.error("Failed to update issue state:", err);
      alert("Failed to update issue");
    }
  };

  if (loading) {
    return (
      <div className="issue-detail-page">
        <div className="loading">Loading issue...</div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="issue-detail-page">
        <div className="error">{error || "Issue not found"}</div>
      </div>
    );
  }

  return (
    <div className="issue-detail-page">
      <div className="issue-header">
        <div className="issue-title-row">
          <h1 className="issue-title">
            {issue.title}
            <span className="issue-number">#{issue.number}</span>
          </h1>
          <div className="issue-actions">
            {issue.state === "open" ? (
              <button
                className="btn btn-danger"
                onClick={() => handleStateChange("closed")}
              >
                Close issue
              </button>
            ) : (
              <button
                className="btn btn-success"
                onClick={() => handleStateChange("open")}
              >
                Reopen issue
              </button>
            )}
          </div>
        </div>
        <div className="issue-meta">
          <span className={`issue-state state-${issue.state}`}>
            {issue.state === "open" ? "🟢 Open" : "🔴 Closed"}
          </span>
          <span className="issue-info">
            Opened {new Date(issue.createdAt).toLocaleDateString()}
          </span>
          <span className="issue-info">{issue.commentCount} comments</span>
        </div>
      </div>

      {issue.body && (
        <div className="issue-body">
          <div className="comment-card">
            <div className="comment-header">
              <span className="comment-author">Author</span>
              <span className="comment-date">
                {new Date(issue.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="comment-body">{issue.body}</div>
          </div>
        </div>
      )}

      <div className="issue-sidebar">
        <div className="sidebar-section">
          <h3>Labels</h3>
          <div className="labels-list">
            {issue.labels.length > 0 ? (
              issue.labels.map((label) => (
                <span key={label} className="label">
                  {label}
                </span>
              ))
            ) : (
              <span className="empty">No labels</span>
            )}
          </div>
        </div>

        <div className="sidebar-section">
          <h3>Assignees</h3>
          <div className="assignees-list">
            {issue.assignees.length > 0 ? (
              issue.assignees.map((assignee) => (
                <div key={assignee} className="assignee">
                  {assignee}
                </div>
              ))
            ) : (
              <span className="empty">No assignees</span>
            )}
          </div>
        </div>
      </div>

      <div className="comments-section">
        <h2>Comments ({comments.length})</h2>
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-card">
              <div className="comment-header">
                <span className="comment-author">User</span>
                <span className="comment-date">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="comment-body">{comment.body}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmitComment} className="comment-form">
          <h3>Add a comment</h3>
          <textarea
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Leave a comment (use @username to mention someone)"
            rows={5}
            required
          />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Posting..." : "Comment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
