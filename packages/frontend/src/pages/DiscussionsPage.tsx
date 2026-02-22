import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api-client";
import "./DiscussionsPage.css";

interface Discussion {
  id: string;
  number: number;
  title: string;
  body?: string;
  category: string;
  state: "open" | "closed";
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export const DiscussionsPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const navigate = useNavigate();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({ title: "", body: "", category: "general" });
  const [submitting, setSubmitting] = useState(false);

  const categories = ["general", "ideas", "q&a", "show-and-tell", "announcements"];

  useEffect(() => {
    loadDiscussions();
  }, [owner, repo]);

  const loadDiscussions = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ items: Discussion[] }>(
        `/api/v1/repositories/${owner}/${repo}/discussions`
      );
      setDiscussions(response.data?.items || []);
      setError(null);
    } catch (err) {
      console.error("Failed to load discussions:", err);
      setError("Failed to load discussions");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscussion.title.trim() || submitting) return;

    try {
      setSubmitting(true);
      const response = await api.post<Discussion>(
        `/api/v1/repositories/${owner}/${repo}/discussions`,
        newDiscussion
      );
      setNewDiscussion({ title: "", body: "", category: "general" });
      setShowCreateModal(false);
      navigate(`/${owner}/${repo}/discussions/${response.data?.number || 1}`);
    } catch (err) {
      console.error("Failed to create discussion:", err);
      alert("Failed to create discussion");
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      general: "💬",
      ideas: "💡",
      "q&a": "❓",
      "show-and-tell": "🎨",
      announcements: "📢",
    };
    return icons[category] || "💬";
  };

  if (loading) {
    return (
      <div className="discussions-page">
        <div className="loading">Loading discussions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="discussions-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="discussions-page">
      <div className="discussions-header">
        <h1>Discussions</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          New Discussion
        </button>
      </div>

      <div className="discussions-categories">
        {categories.map((cat) => (
          <button key={cat} className="category-badge">
            {getCategoryIcon(cat)} {cat}
          </button>
        ))}
      </div>

      <div className="discussions-list">
        {discussions.length > 0 ? (
          discussions.map((discussion) => (
            <Link
              key={discussion.id}
              to={`/${owner}/${repo}/discussions/${discussion.number}`}
              className="discussion-card"
            >
              <div className="discussion-icon">
                {getCategoryIcon(discussion.category)}
              </div>
              <div className="discussion-content">
                <div className="discussion-title-row">
                  <h3 className="discussion-title">{discussion.title}</h3>
                  <span className={`discussion-state state-${discussion.state}`}>
                    {discussion.state}
                  </span>
                </div>
                <div className="discussion-meta">
                  <span className="discussion-category">{discussion.category}</span>
                  <span className="discussion-date">
                    Started {new Date(discussion.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="empty-state">
            <p>No discussions yet. Start one!</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>New Discussion</h2>
            <form onSubmit={handleCreateDiscussion}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newDiscussion.title}
                  onChange={(e) =>
                    setNewDiscussion({ ...newDiscussion, title: e.target.value })
                  }
                  placeholder="Enter a descriptive title"
                  required
                  maxLength={255}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={newDiscussion.category}
                  onChange={(e) =>
                    setNewDiscussion({ ...newDiscussion, category: e.target.value })
                  }
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryIcon(cat)} {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newDiscussion.body}
                  onChange={(e) =>
                    setNewDiscussion({ ...newDiscussion, body: e.target.value })
                  }
                  placeholder="Add more details about this discussion..."
                  rows={6}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Start Discussion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
