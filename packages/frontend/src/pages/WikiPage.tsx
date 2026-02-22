import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api-client";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";

interface WikiPage {
  title: string;
  slug: string;
  content: string;
  updatedAt: string;
  updatedBy: string;
}

interface WikiData {
  pages: WikiPage[];
  currentPage: WikiPage | null;
}

/**
 * Wiki page with sidebar navigation and markdown editor.
 */
export const WikiPage: React.FC = () => {
  const { owner, repo, page: pageSlug } = useParams<{ owner: string; repo: string; page?: string }>();
  const { isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  const currentPageSlug = pageSlug || "home";

  const { data, loading, error, refetch } = useApi<WikiData>(
    () => api.get<WikiData>(`/repositories/${owner}/${repo}/wiki/${currentPageSlug}`),
    [owner, repo, currentPageSlug],
  );

  const pageStyle: React.CSSProperties = {
    maxWidth: "1200px",
    margin: "0 auto",
  };

  const breadcrumbStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "var(--text-secondary)",
    marginBottom: "16px",
  };

  const breadcrumbLink: React.CSSProperties = {
    color: "var(--accent-blue)",
    textDecoration: "none",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: 600,
  };

  const actionsStyle: React.CSSProperties = {
    display: "flex",
    gap: "8px",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "6px 12px",
    fontSize: "13px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border-color)",
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    cursor: "pointer",
    transition: "background 0.15s",
  };

  const primaryButton: React.CSSProperties = {
    ...buttonStyle,
    background: "var(--accent-blue)",
    color: "white",
    border: "none",
  };

  const layoutStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "240px 1fr",
    gap: "24px",
  };

  const sidebar: React.CSSProperties = {
    position: "sticky" as const,
    top: "80px",
    alignSelf: "start",
  };

  const sidebarTitle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "12px",
    color: "var(--text-secondary)",
  };

  const pagesList: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  };

  const getPageLinkStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "6px 10px",
    fontSize: "14px",
    textDecoration: "none",
    color: isActive ? "var(--accent-blue)" : "var(--text-primary)",
    background: isActive ? "var(--bg-tertiary)" : "transparent",
    borderRadius: "var(--radius)",
    transition: "background 0.15s",
    fontWeight: isActive ? 600 : 400,
  });

  const contentArea: React.CSSProperties = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    padding: "24px",
    minHeight: "500px",
  };

  const markdownContent: React.CSSProperties = {
    fontSize: "15px",
    lineHeight: "1.7",
    color: "var(--text-primary)",
  };

  const editorStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "400px",
    padding: "12px",
    fontSize: "14px",
    fontFamily: "monospace",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    resize: "vertical",
  };

  const metaInfo: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--text-secondary)",
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid var(--border-color)",
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "64px 24px",
    color: "var(--text-muted)",
  };

  const handleEdit = () => {
    if (data?.currentPage) {
      setEditContent(data.currentPage.content);
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      await api.put(`/repositories/${owner}/${repo}/wiki/${currentPageSlug}`, {
        content: editContent,
      });
      setIsEditing(false);
      refetch();
    } catch (err) {
      console.error("Failed to save wiki page", err);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent("");
  };

  if (loading) return <LoadingSpinner message="Loading wiki..." />;
  if (error) return <ErrorMessage message={error} />;

  const pages = data?.pages || [];
  const currentPage = data?.currentPage;

  return (
    <div style={pageStyle}>
      <div style={breadcrumbStyle}>
        <Link to={`/${owner}`} style={breadcrumbLink}>{owner}</Link>
        {" / "}
        <Link to={`/${owner}/${repo}`} style={breadcrumbLink}>{repo}</Link>
        {" / Wiki"}
      </div>

      <div style={headerStyle}>
        <div style={titleStyle}>Wiki</div>
        {isAuthenticated && !isEditing && (
          <div style={actionsStyle}>
            {currentPage && (
              <button style={buttonStyle} onClick={handleEdit}>
                ✏️ Edit
              </button>
            )}
            <Link to={`/${owner}/${repo}/wiki/_new`} style={buttonStyle}>
              ➕ New Page
            </Link>
          </div>
        )}
        {isEditing && (
          <div style={actionsStyle}>
            <button style={primaryButton} onClick={handleSave}>
              💾 Save
            </button>
            <button style={buttonStyle} onClick={handleCancel}>
              Cancel
            </button>
          </div>
        )}
      </div>

      <div style={layoutStyle}>
        <div style={sidebar}>
          <div style={sidebarTitle}>Pages</div>
          <div style={pagesList}>
            {pages.map((p) => (
              <Link
                key={p.slug}
                to={`/${owner}/${repo}/wiki/${p.slug}`}
                style={getPageLinkStyle(p.slug === currentPageSlug)}
              >
                📄 {p.title}
              </Link>
            ))}
            {pages.length === 0 && (
              <div style={{ fontSize: "13px", color: "var(--text-muted)", padding: "8px" }}>
                No pages yet
              </div>
            )}
          </div>
        </div>

        <div style={contentArea}>
          {isEditing ? (
            <textarea
              style={editorStyle}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Write your wiki page content in Markdown..."
            />
          ) : currentPage ? (
            <>
              <div style={markdownContent}>
                <h1>{currentPage.title}</h1>
                <div dangerouslySetInnerHTML={{ __html: currentPage.content }} />
              </div>
              <div style={metaInfo}>
                Last updated by {currentPage.updatedBy} • {currentPage.updatedAt}
              </div>
            </>
          ) : (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                📚
              </div>
              <div style={{ fontSize: "16px", fontWeight: 500, marginBottom: "8px" }}>
                This page doesn't exist yet
              </div>
              <div style={{ fontSize: "14px", marginBottom: "16px" }}>
                Create it to start documenting your project.
              </div>
              {isAuthenticated && (
                <button style={primaryButton}>
                  Create Page
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
