import React from "react";
import { usePaginatedApi } from "../../hooks/useApi";
import { clusterService } from "../../services/cluster-service";
import { Badge, statusBadgeVariant } from "../common/Badge";
import { Pagination } from "../common/Pagination";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorMessage } from "../common/ErrorMessage";
import { ClusterNode } from "../../types/api";
import { formatRelativeTime } from "../../utils/format";

/**
 * List of cluster nodes with real-time status indicators and resource usage bars.
 */
export const ClusterList: React.FC<{
  onSelect?: (node: ClusterNode) => void;
}> = ({ onSelect }) => {
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
    (pg, pp) => clusterService.list({ page: pg, perPage: pp }),
    25,
  );

  if (loading) return <LoadingSpinner message="Loading clusters…" />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  const listStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "16px",
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    padding: "16px",
    cursor: onSelect ? "pointer" : "default",
    transition: "border-color 0.15s",
  };

  const headerRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
  };

  const usageBarContainer: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "12px",
  };

  const renderBar = (label: string, value: number): React.ReactElement => {
    const color =
      value > 80
        ? "var(--accent-red)"
        : value > 60
          ? "var(--accent-yellow)"
          : "var(--accent-green)";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", width: "36px" }}>
          {label}
        </span>
        <div
          style={{
            flex: 1,
            height: "8px",
            background: "var(--bg-tertiary)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${value}%`,
              height: "100%",
              background: color,
              borderRadius: "4px",
              transition: "width 0.3s",
            }}
          />
        </div>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", width: "36px", textAlign: "right" }}>
          {value}%
        </span>
      </div>
    );
  };

  const metaStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    color: "var(--text-muted)",
  };

  return (
    <div>
      <div style={listStyle}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", gridColumn: "1/-1" }}>
            No cluster nodes registered.
          </div>
        ) : (
          items.map((node) => (
            <div
              key={node.id}
              style={cardStyle}
              onClick={() => onSelect?.(node)}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-blue)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)";
              }}
            >
              <div style={headerRow}>
                <span style={{ fontWeight: 600, fontSize: "14px" }}>
                  🖥️ {node.hostname}
                </span>
                <Badge label={node.status} variant={statusBadgeVariant(node.status)} dot />
              </div>

              <div style={usageBarContainer}>
                {renderBar("CPU", node.cpuUsage)}
                {renderBar("RAM", node.ramUsage)}
                {renderBar("Disk", node.diskUsage)}
              </div>

              <div style={metaStyle}>
                <span>Jobs: {node.activeJobs}/{node.maxJobs}</span>
                <span>Region: {node.region}</span>
              </div>
              <div style={{ ...metaStyle, marginTop: "4px" }}>
                <span>Heartbeat: {formatRelativeTime(node.lastHeartbeat)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
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
      )}
    </div>
  );
};
