import React from "react";
import { Project } from "../../types/api";
import { formatRelativeTime, formatNumber } from "../../utils/format";

/** Props for ProjectCard */
interface ProjectCardProps {
  project: Project;
  onClick?: (project: Project) => void;
}

/** Language color map */
const languageColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572a5",
  Go: "#00add8",
  Rust: "#dea584",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  Ruby: "#701516",
  Swift: "#F05138",
};

/**
 * Individual project card with hover state, star/fork count, language indicator.
 */
export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onClick,
}) => {
  const cardStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    padding: "16px",
    cursor: onClick ? "pointer" : "default",
    transition: "border-color 0.15s, box-shadow 0.15s",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    height: "100%",
  };

  const nameStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--accent-blue)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  };

  const ownerStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "var(--text-secondary)",
    fontWeight: 400,
  };

  const descStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
    flex: 1,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
  };

  const metaRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    fontSize: "12px",
    color: "var(--text-muted)",
    flexWrap: "wrap",
  };

  const metaItem: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  };

  const langDot: React.CSSProperties = {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor:
      languageColors[project.language ?? ""] ?? "var(--text-muted)",
  };

  const visibilityBadge: React.CSSProperties = {
    fontSize: "11px",
    padding: "1px 6px",
    border: "1px solid var(--border-color)",
    borderRadius: "12px",
    color: "var(--text-muted)",
    textTransform: "capitalize",
  };

  return (
    <div
      style={cardStyle}
      onClick={() => onClick?.(project)}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-blue)";
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)";
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div style={nameStyle}>
        <span style={ownerStyle}>{project.ownerUsername} /</span>
        <span>{project.name}</span>
        <span style={visibilityBadge}>{project.visibility}</span>
      </div>

      {project.description && (
        <div style={descStyle}>{project.description}</div>
      )}

      <div style={metaRow}>
        {project.language && (
          <span style={metaItem}>
            <span style={langDot} />
            {project.language}
          </span>
        )}
        <span style={metaItem}>⭐ {formatNumber(project.stars, true)}</span>
        <span style={metaItem}>🍴 {formatNumber(project.forks, true)}</span>
        <span style={metaItem}>
          Updated {formatRelativeTime(project.updatedAt)}
        </span>
      </div>
    </div>
  );
};
