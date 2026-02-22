import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePaginatedApi } from "../hooks/useApi";
import { api } from "../services/api-client";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { Badge } from "../components/common/Badge";
import { Pagination } from "../components/common/Pagination";
import { formatRelativeTime } from "../utils/format";

interface WorkflowRun {
  id: string;
  workflowName: string;
  status: "queued" | "in_progress" | "completed";
  conclusion?: "success" | "failure" | "cancelled" | "skipped";
  branch: string;
  commitMessage: string;
  commitSha: string;
  triggeredBy: string;
  createdAt: string;
  completedAt?: string;
  duration?: number;
}

interface Workflow {
  id: string;
  name: string;
  path: string;
  state: "active" | "disabled";
  badge?: string;
}

interface ActionsData {
  workflows: Workflow[];
  runs: WorkflowRun[];
}

/**
 * GitHub Actions page showing workflow runs, jobs, and logs.
 */
export const ActionsPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const { isAuthenticated } = useAuth();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const {
    items: runs,
    loading,
    error,
    page,
    total,
    perPage,
    totalPages,
    hasNext,
    hasPrev,
    goToPage,
  } = usePaginatedApi<WorkflowRun>(
    (page, perPage) =>
      api.get(`/repositories/${owner}/${repo}/actions/runs`, {
        params: {
          page,
          perPage,
          workflow: selectedWorkflow || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
      }),
    20,
  );

  const pageStyle: React.CSSProperties = {
    maxWidth: "1200px",
    margin: "0 auto",
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: "24px",
  };

  const titleRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "8px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: 600,
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

  const filterBar: React.CSSProperties = {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
    padding: "12px",
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    flexWrap: "wrap",
    alignItems: "center",
  };

  const filterGroup: React.CSSProperties = {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  };

  const filterLabel: React.CSSProperties = {
    fontSize: "13px",
    color: "var(--text-secondary)",
    fontWeight: 500,
  };

  const getFilterButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "4px 12px",
    fontSize: "13px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border-color)",
    background: isActive ? "var(--accent-blue)" : "var(--bg-primary)",
    color: isActive ? "white" : "var(--text-primary)",
    cursor: "pointer",
    transition: "all 0.15s",
  });

  const runsList: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  };

  const runCard: React.CSSProperties = {
    padding: "16px",
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    textDecoration: "none",
    color: "var(--text-primary)",
    transition: "border-color 0.15s",
  };

  const statusIcon = (run: WorkflowRun): string => {
    if (run.status === "queued") return "⏳";
    if (run.status === "in_progress") return "🔄";
    if (run.conclusion === "success") return "✅";
    if (run.conclusion === "failure") return "❌";
    if (run.conclusion === "cancelled") return "🚫";
    return "⚪";
  };

  const statusColor = (run: WorkflowRun): string => {
    if (run.status === "in_progress") return "var(--accent-blue)";
    if (run.conclusion === "success") return "var(--accent-green)";
    if (run.conclusion === "failure") return "var(--accent-red)";
    return "var(--text-secondary)";
  };

  const runInfo: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const runTitle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 500,
    marginBottom: "4px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const runMeta: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--text-secondary)",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "64px 24px",
    color: "var(--text-muted)",
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
  };

  if (loading && page === 1) return <LoadingSpinner message="Loading workflow runs..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div style={pageStyle}>
      <div style={breadcrumbStyle}>
        <Link to={`/${owner}`} style={breadcrumbLink}>{owner}</Link>
        {" / "}
        <Link to={`/${owner}/${repo}`} style={breadcrumbLink}>{repo}</Link>
        {" / Actions"}
      </div>

      <div style={headerStyle}>
        <div style={titleRow}>
          <div style={titleStyle}>Actions</div>
        </div>
      </div>

      <div style={filterBar}>
        <div style={filterGroup}>
          <span style={filterLabel}>Status:</span>
          <button
            style={getFilterButtonStyle(statusFilter === "all")}
            onClick={() => setStatusFilter("all")}
          >
            All
          </button>
          <button
            style={getFilterButtonStyle(statusFilter === "success")}
            onClick={() => setStatusFilter("success")}
          >
            ✅ Success
          </button>
          <button
            style={getFilterButtonStyle(statusFilter === "failure")}
            onClick={() => setStatusFilter("failure")}
          >
            ❌ Failure
          </button>
          <button
            style={getFilterButtonStyle(statusFilter === "in_progress")}
            onClick={() => setStatusFilter("in_progress")}
          >
            🔄 In Progress
          </button>
        </div>
      </div>

      {runs.length > 0 ? (
        <>
          <div style={runsList}>
            {runs.map((run) => (
              <Link
                key={run.id}
                to={`/${owner}/${repo}/actions/runs/${run.id}`}
                style={runCard}
              >
                <div style={{ fontSize: "24px" }}>
                  {statusIcon(run)}
                </div>
                <div style={runInfo}>
                  <div style={runTitle}>
                    {run.workflowName}
                  </div>
                  <div style={runMeta}>
                    <span>{run.commitMessage}</span>
                    <span>•</span>
                    <span>
                      <Badge 
                        label={run.branch} 
                        variant="default"
                      />
                    </span>
                    <span>•</span>
                    <span>{run.triggeredBy}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(run.createdAt)}</span>
                    {run.duration && (
                      <>
                        <span>•</span>
                        <span>{Math.round(run.duration / 1000)}s</span>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: "13px", color: statusColor(run), fontWeight: 600 }}>
                  {run.status === "completed" ? run.conclusion : run.status}
                </div>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div style={{ marginTop: "24px" }}>
              <Pagination
                page={page}
                totalPages={totalPages}
                perPage={perPage}
                total={total}
                onPageChange={goToPage}
                hasNext={hasNext}
                hasPrev={hasPrev}
              />
            </div>
          )}
        </>
      ) : (
        <div style={emptyStateStyle}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>
            ⚙️
          </div>
          <div style={{ fontSize: "16px", fontWeight: 500, marginBottom: "8px" }}>
            Get started with DevForge Actions
          </div>
          <div style={{ fontSize: "14px", marginBottom: "24px" }}>
            Create a workflow file in your repository to automate builds, tests, and deployments.
          </div>
          <div style={{ 
            textAlign: "left", 
            maxWidth: "600px", 
            margin: "0 auto",
            padding: "16px",
            background: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius)",
            fontSize: "13px",
          }}>
            <div style={{ fontWeight: 600, marginBottom: "12px", color: "var(--accent-blue)" }}>
              📁 Create a workflow file:
            </div>
            <div style={{ marginBottom: "16px" }}>
              <code style={{ 
                background: "var(--bg-tertiary)",
                padding: "2px 6px",
                borderRadius: "3px",
                fontSize: "12px"
              }}>
                .devforge/workflows/ci.yml
              </code>
            </div>
            <div style={{ fontWeight: 600, marginBottom: "12px", color: "var(--accent-blue)" }}>
              📝 Example workflow template:
            </div>
            <pre style={{ 
              background: "var(--bg-tertiary)",
              padding: "12px",
              borderRadius: "var(--radius)",
              overflow: "auto",
              fontSize: "11px",
              lineHeight: "1.5",
              margin: 0,
            }}>
{`name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
