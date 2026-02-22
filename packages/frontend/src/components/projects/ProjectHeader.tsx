import React from "react";
import { Project } from "../../types/api";
import { Badge, statusBadgeVariant } from "../common/Badge";
import { formatNumber } from "../../utils/format";

/** Props for ProjectHeader */
interface ProjectHeaderProps {
  project: Project;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onStar?: () => void;
  onFork?: () => void;
}

/** Tab definitions */
const tabs = [
  { key: "code", label: "Code", icon: "📄" },
  { key: "issues", label: "Issues", icon: "🐛" },
  { key: "prs", label: "Pull Requests", icon: "🔀" },
  { key: "pipelines", label: "Pipelines", icon: "🔧" },
  { key: "settings", label: "Settings", icon: "⚙️" },
];

/**
 * Project detail header with name, description, owner info,
 * star/fork buttons, and navigation tabs.
 */
export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  activeTab = "code",
  onTabChange,
  onStar,
  onFork,
}) => {
  const headerStyle: React.CSSProperties = {
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "0",
    marginBottom: "24px",
  };

  const topRow: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "12px",
  };

  const titleRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "20px",
    fontWeight: 600,
  };

  const ownerLink: React.CSSProperties = {
    color: "var(--accent-blue)",
    fontWeight: 400,
  };

  const descStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "var(--text-secondary)",
    marginBottom: "16px",
    maxWidth: "700px",
  };

  const actionsRow: React.CSSProperties = {
    display: "flex",
    gap: "8px",
  };

  const actionBtnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 12px",
    fontSize: "13px",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    background: "var(--bg-tertiary)",
    color: "var(--text-primary)",
    cursor: "pointer",
  };

  const countBadge: React.CSSProperties = {
    background: "var(--bg-primary)",
    padding: "0 6px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: 600,
  };

  const tabsRow: React.CSSProperties = {
    display: "flex",
    gap: "0",
    borderBottom: "none",
    marginTop: "8px",
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: 500,
    color: active ? "var(--text-primary)" : "var(--text-secondary)",
    background: "none",
    border: "none",
    borderBottom: active ? "2px solid var(--accent-blue)" : "2px solid transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "color 0.15s",
  });

  return (
    <div style={headerStyle}>
      <div style={topRow}>
        <div>
          <div style={titleRow}>
            <span>📁</span>
            <span style={ownerLink}>{project.ownerUsername}</span>
            <span style={{ color: "var(--text-muted)" }}>/</span>
            <span>{project.name}</span>
            <Badge label={project.visibility} variant="default" />
          </div>
        </div>
        <div style={actionsRow}>
          <button style={actionBtnStyle} onClick={onStar} type="button">
            ⭐ Star <span style={countBadge}>{formatNumber(project.stars, true)}</span>
          </button>
          <button style={actionBtnStyle} onClick={onFork} type="button">
            🍴 Fork <span style={countBadge}>{formatNumber(project.forks, true)}</span>
          </button>
        </div>
      </div>

      {project.description && (
        <p style={descStyle}>{project.description}</p>
      )}

      <div style={tabsRow}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            style={tabStyle(activeTab === tab.key)}
            onClick={() => onTabChange?.(tab.key)}
            type="button"
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
