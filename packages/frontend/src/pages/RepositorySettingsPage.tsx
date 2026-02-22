import React, { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api-client";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { RepositorySettings } from "../components/settings/RepositorySettings";
import { CollaboratorManager } from "../components/settings/CollaboratorManager";
import { WebhookConfig } from "../components/settings/WebhookConfig";
import { DeployKeys } from "../components/settings/DeployKeys";
import { BranchProtection } from "../components/settings/BranchProtection";

interface Repository {
  id: string;
  name: string;
  owner: string;
  isOwner: boolean;
}

type SettingsTab = "general" | "collaborators" | "webhooks" | "keys" | "branches";

/**
 * Repository settings page with tabs for general settings, collaborators,
 * webhooks, deploy keys, and branch protection.
 */
export const RepositorySettingsPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const { data, loading, error } = useApi<Repository>(
    () => api.get<Repository>(`/repositories/${owner}/${repo}/settings`),
    [owner, repo],
  );

  const pageStyle: React.CSSProperties = {
    maxWidth: "1200px",
    margin: "0 auto",
  };

  const headerStyle: React.CSSProperties = {
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "16px",
    marginBottom: "24px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: 600,
    marginBottom: "8px",
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "var(--text-secondary)",
  };

  const layoutStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "200px 1fr",
    gap: "32px",
  };

  const navStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  };

  const getNavItemStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "8px 12px",
    fontSize: "14px",
    textAlign: "left",
    background: isActive ? "var(--bg-tertiary)" : "transparent",
    border: "none",
    borderLeft: isActive ? "2px solid var(--accent-blue)" : "2px solid transparent",
    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
    cursor: "pointer",
    transition: "all 0.15s",
    fontWeight: isActive ? 600 : 400,
  });

  const contentStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    padding: "24px",
    minHeight: "400px",
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (loading) return <LoadingSpinner message="Loading settings..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <ErrorMessage message="Repository not found" />;

  if (!data.isOwner) {
    return <ErrorMessage message="You don't have permission to access repository settings" />;
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>
          {owner}/{repo} Settings
        </div>
        <div style={subtitleStyle}>
          Manage repository settings, collaborators, and integrations
        </div>
      </div>

      <div style={layoutStyle}>
        <nav style={navStyle}>
          <button
            style={getNavItemStyle(activeTab === "general")}
            onClick={() => setActiveTab("general")}
          >
            ⚙️ General
          </button>
          <button
            style={getNavItemStyle(activeTab === "collaborators")}
            onClick={() => setActiveTab("collaborators")}
          >
            👥 Collaborators
          </button>
          <button
            style={getNavItemStyle(activeTab === "webhooks")}
            onClick={() => setActiveTab("webhooks")}
          >
            🔗 Webhooks
          </button>
          <button
            style={getNavItemStyle(activeTab === "keys")}
            onClick={() => setActiveTab("keys")}
          >
            🔑 Deploy Keys
          </button>
          <button
            style={getNavItemStyle(activeTab === "branches")}
            onClick={() => setActiveTab("branches")}
          >
            🌿 Branch Protection
          </button>
        </nav>

        <div style={contentStyle}>
          {activeTab === "general" && (
            <RepositorySettings owner={owner!} repo={repo!} />
          )}
          {activeTab === "collaborators" && (
            <CollaboratorManager owner={owner!} repo={repo!} />
          )}
          {activeTab === "webhooks" && (
            <WebhookConfig owner={owner!} repo={repo!} />
          )}
          {activeTab === "keys" && (
            <DeployKeys owner={owner!} repo={repo!} />
          )}
          {activeTab === "branches" && (
            <BranchProtection owner={owner!} repo={repo!} />
          )}
        </div>
      </div>
    </div>
  );
};
