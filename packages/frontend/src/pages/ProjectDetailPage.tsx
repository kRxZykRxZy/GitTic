import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { useToast } from "../hooks/useToast";
import { projectService } from "../services/project-service";
import { ProjectHeader } from "../components/projects/ProjectHeader";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { Project } from "../types/api";

/**
 * Project detail page with ProjectHeader, file browser placeholder, and README display.
 */
export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("code");

  const { data: project, loading, error, refetch } = useApi<Project>(
    () => projectService.getById(id!),
    [id],
  );

  const handleStar = async () => {
    toast.info("Star functionality coming soon!");
  };

  const handleFork = async () => {
    if (!project) return;
    try {
      await projectService.fork(project.id);
      toast.success("Project forked successfully!");
    } catch {
      toast.error("Failed to fork project");
    }
  };

  if (loading) return <LoadingSpinner message="Loading project…" />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} fullPage />;
  if (!project) return null;

  const contentStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    padding: "20px",
    minHeight: "300px",
  };

  const fileItem: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderBottom: "1px solid var(--border-color)",
    fontSize: "14px",
    color: "var(--text-primary)",
  };

  const readmeStyle: React.CSSProperties = {
    marginTop: "24px",
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    padding: "24px",
  };

  const readmeHeader: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: 600,
    paddingBottom: "12px",
    borderBottom: "1px solid var(--border-color)",
    marginBottom: "16px",
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "code":
        return (
          <>
            <div style={contentStyle}>
              <div style={fileItem}>
                <span>📄</span> README.md
              </div>
              <div style={fileItem}>
                <span>📁</span> src/
              </div>
              <div style={fileItem}>
                <span>📄</span> package.json
              </div>
              <div style={fileItem}>
                <span>📄</span> tsconfig.json
              </div>
              <div style={fileItem}>
                <span>📄</span> .gitignore
              </div>
            </div>

            {project.hasReadme && (
              <div style={readmeStyle}>
                <div style={readmeHeader}>
                  <span>📖</span> README.md
                </div>
                <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>
                  {project.name}
                </h1>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {project.description || "No description provided."}
                </p>
              </div>
            )}
          </>
        );
      case "issues":
        return (
          <div style={{ ...contentStyle, textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ padding: "48px" }}>Issues view coming soon</p>
          </div>
        );
      case "prs":
        return (
          <div style={{ ...contentStyle, textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ padding: "48px" }}>Pull Requests view coming soon</p>
          </div>
        );
      case "pipelines":
        return (
          <div style={{ ...contentStyle, textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ padding: "48px" }}>Pipelines view coming soon</p>
          </div>
        );
      case "settings":
        return (
          <div style={{ ...contentStyle, textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ padding: "48px" }}>Project settings coming soon</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <ProjectHeader
        project={project}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onStar={handleStar}
        onFork={handleFork}
      />
      {renderTabContent()}
    </div>
  );
};
