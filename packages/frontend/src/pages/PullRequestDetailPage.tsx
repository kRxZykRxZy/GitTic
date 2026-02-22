import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api-client";
import "./PullRequestDetailPage.css";

interface PullRequest {
  id: string;
  number: number;
  title: string;
  description?: string;
  state: "open" | "closed" | "merged";
  baseBranch: string;
  headBranch: string;
  authorId: string;
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

interface MergeStatus {
  mergeable: boolean;
  canMerge: boolean;
  canFastForward: boolean;
  conflicts: string[];
  conflictCount: number;
  message: string;
}

export const PullRequestDetailPage: React.FC = () => {
  const { owner, repo, number } = useParams<{ owner: string; repo: string; number: string }>();
  const navigate = useNavigate();
  const [pr, setPR] = useState<PullRequest | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [mergeStatus, setMergeStatus] = useState<MergeStatus | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    loadPR();
    loadComments();
    loadMergeStatus();
  }, [owner, repo, number]);

  const loadPR = async () => {
    try {
      setLoading(true);
      const response = await api.get<PullRequest>(`/api/v1/${owner}/${repo}/pulls/${number}`);
      setPR(response.data || null);
      setError(null);
    } catch (err) {
      console.error("Failed to load PR:", err);
      setError("Failed to load pull request");
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await api.get<Comment[]>(`/api/v1/${owner}/${repo}/pulls/${number}/comments`);
      setComments(response.data || []);
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  };

  const loadMergeStatus = async () => {
    try {
      const response = await api.get<MergeStatus>(`/api/v1/${owner}/${repo}/pulls/${number}/merge-status`);
      setMergeStatus(response.data || null);
    } catch (err) {
      console.error("Failed to load merge status:", err);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim() || submitting) return;

    try {
      setSubmitting(true);
      await api.post(`/api/v1/${owner}/${repo}/pulls/${number}/comments`, {
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

  const handleMerge = async () => {
    if (!mergeStatus?.canMerge || merging) return;

    if (!confirm("Are you sure you want to merge this pull request?")) return;

    try {
      setMerging(true);
      await api.post(`/api/v1/${owner}/${repo}/pulls/${number}/merge`, {
        merge_method: "merge",
      });
      await loadPR();
      await loadMergeStatus();
      alert("Pull request merged successfully!");
    } catch (err) {
      console.error("Failed to merge PR:", err);
      alert("Failed to merge pull request");
    } finally {
      setMerging(false);
    }
  };

  if (loading) {
    return (
      <div className="pr-detail-page">
        <div className="loading">Loading pull request...</div>
      </div>
    );
  }

  if (error || !pr) {
    return (
      <div className="pr-detail-page">
        <div className="error">{error || "Pull request not found"}</div>
      </div>
    );
  }

  return (
    <div className="pr-detail-page">
      <div className="pr-header">
        <div className="pr-title-row">
          <h1 className="pr-title">
            {pr.title}
            <span className="pr-number">#{pr.number}</span>
          </h1>
        </div>
        <div className="pr-meta">
          <span className={`pr-state state-${pr.state}`}>
            {pr.state === "open" && "🟢 Open"}
            {pr.state === "merged" && "🟣 Merged"}
            {pr.state === "closed" && "🔴 Closed"}
          </span>
          <span className="pr-info">
            {pr.headBranch} → {pr.baseBranch}
          </span>
          <span className="pr-info">
            Opened {new Date(pr.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {pr.description && (
        <div className="pr-body">
          <div className="comment-card">
            <div className="comment-header">
              <span className="comment-author">Author</span>
              <span className="comment-date">
                {new Date(pr.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="comment-body">{pr.description}</div>
          </div>
        </div>
      )}

      {mergeStatus && pr.state === "open" && (
        <div className="merge-status">
          <div className={`merge-box ${mergeStatus.canMerge ? "mergeable" : "conflicts"}`}>
            <div className="merge-status-header">
              <h3>
                {mergeStatus.canMerge ? "✓ Ready to merge" : "⚠ Cannot merge"}
              </h3>
              <p>{mergeStatus.message}</p>
            </div>
            
            {mergeStatus.conflicts.length > 0 && (
              <div className="conflicts-list">
                <h4>Conflicting files:</h4>
                <ul>
                  {mergeStatus.conflicts.map((file, idx) => (
                    <li key={idx}>{file}</li>
                  ))}
                </ul>
              </div>
            )}

            {mergeStatus.canMerge && (
              <div className="merge-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleMerge}
                  disabled={merging}
                >
                  {merging ? "Merging..." : "Merge pull request"}
                </button>
                {mergeStatus.canFastForward && (
                  <span className="merge-hint">Fast-forward merge available</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {pr.state === "merged" && (
        <div className="merge-status">
          <div className="merge-box merged">
            <h3>✓ Merged</h3>
            <p>This pull request has been merged</p>
          </div>
        </div>
      )}

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

        {pr.state === "open" && (
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
        )}
      </div>
    </div>
  );
};
