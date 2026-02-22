import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Project } from "../../types/api";
import { ProjectCard } from "./ProjectCard";
import { Pagination } from "../common/Pagination";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorMessage } from "../common/ErrorMessage";
import { usePaginatedApi } from "../../hooks/useApi";
import { projectService } from "../../services/project-service";

interface ProjectListProps {
  searchQuery?: string;
  filterType?: "all" | "owned" | "member" | "starred";
}

/**
 * Project cards grid/list with search, sort, and pagination.
 */
export const ProjectList: React.FC<ProjectListProps> = ({ searchQuery = "", filterType = "all" }) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<"updated" | "stars" | "name">("updated");

  const {
    items,
    loading,
    error,
    page,
    perPage,
    total,
    totalPages,
    hasNext,
    hasPrev,
    goToPage,
    setPerPage,
    refetch,
  } = usePaginatedApi(
    (pg, pp) =>
      projectService.list({
        page: pg,
        perPage: pp,
        sort: sortBy,
        search: searchQuery || undefined,
        filter: filterType,
      }),
    25,
  );

  const handleProjectClick = useCallback(
    (project: Project) => {
      navigate(`/projects/${project.id}`);
    },
    [navigate],
  );

  const controlsStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  };

  const selectStyle: React.CSSProperties = {
    padding: "6px 12px",
    fontSize: "14px",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    color: "var(--text-primary)",
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "16px",
  };

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />;
  }

  return (
    <div>
      <div style={controlsStyle}>
        <select
          style={selectStyle}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          aria-label="Sort by"
        >
          <option value="updated">Last updated</option>
          <option value="stars">Stars</option>
          <option value="name">Name</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading projects…" />
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
          No projects found. Create your first project!
        </div>
      ) : (
        <>
          <div style={gridStyle}>
            {items.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={handleProjectClick}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            perPage={perPage}
            total={total}
            hasNext={hasNext}
            hasPrev={hasPrev}
            onPageChange={goToPage}
            onPerPageChange={setPerPage}
          />
        </>
      )}
    </div>
  );
};
