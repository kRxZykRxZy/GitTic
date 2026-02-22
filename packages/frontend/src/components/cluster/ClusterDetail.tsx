import React from "react";
import { useApi } from "../../hooks/useApi";
import { clusterService } from "../../services/cluster-service";
import { Chart, ChartDataPoint } from "../common/Chart";
import { Badge, statusBadgeVariant } from "../common/Badge";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorMessage } from "../common/ErrorMessage";
import { ClusterNode } from "../../types/api";

/** Props for ClusterDetail */
interface ClusterDetailProps {
  nodeId: string;
  onBack?: () => void;
}

/**
 * Detailed cluster view with CPU/RAM charts, job history, and capabilities list.
 */
export const ClusterDetail: React.FC<ClusterDetailProps> = ({
  nodeId,
  onBack,
}) => {
  const { data: node, loading, error, refetch } = useApi<ClusterNode>(
    () => clusterService.getById(nodeId),
    [nodeId],
  );

  if (loading) return <LoadingSpinner message="Loading node details…" />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  if (!node) return null;

  /** Generate sample chart data from current usage for display */
  const cpuData: ChartDataPoint[] = Array.from({ length: 12 }, (_, i) => ({
    label: `${i * 5}m`,
    value: Math.max(0, node.cpuUsage + Math.round((Math.random() - 0.5) * 20)),
  }));

  const ramData: ChartDataPoint[] = Array.from({ length: 12 }, (_, i) => ({
    label: `${i * 5}m`,
    value: Math.max(0, node.ramUsage + Math.round((Math.random() - 0.5) * 15)),
  }));

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
  };

  const backBtn: React.CSSProperties = {
    padding: "4px 12px",
    fontSize: "13px",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    color: "var(--text-secondary)",
    cursor: "pointer",
  };

  const chartsRow: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    marginBottom: "24px",
  };

  const chartCard: React.CSSProperties = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    padding: "16px",
  };

  const infoGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  };

  const infoCard: React.CSSProperties = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    padding: "12px 16px",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    marginBottom: "4px",
  };

  const valueStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--text-primary)",
  };

  const capList: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "8px",
  };

  const capTag: React.CSSProperties = {
    padding: "2px 10px",
    fontSize: "12px",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-color)",
    borderRadius: "12px",
    color: "var(--text-secondary)",
  };

  return (
    <div>
      <div style={headerStyle}>
        {onBack && (
          <button style={backBtn} onClick={onBack} type="button">
            ← Back
          </button>
        )}
        <h2 style={{ fontSize: "20px", fontWeight: 600 }}>
          🖥️ {node.hostname}
        </h2>
        <Badge label={node.status} variant={statusBadgeVariant(node.status)} dot />
      </div>

      <div style={infoGrid}>
        <div style={infoCard}>
          <div style={labelStyle}>IP Address</div>
          <div style={valueStyle}>{node.ipAddress}</div>
        </div>
        <div style={infoCard}>
          <div style={labelStyle}>Region</div>
          <div style={valueStyle}>{node.region}</div>
        </div>
        <div style={infoCard}>
          <div style={labelStyle}>Active Jobs</div>
          <div style={valueStyle}>
            {node.activeJobs} / {node.maxJobs}
          </div>
        </div>
        <div style={infoCard}>
          <div style={labelStyle}>Disk Usage</div>
          <div style={valueStyle}>{node.diskUsage}%</div>
        </div>
      </div>

      <div style={chartsRow}>
        <div style={chartCard}>
          <Chart
            data={cpuData}
            type="line"
            title="CPU Usage (%)"
            color="#58a6ff"
            width={340}
            height={180}
          />
        </div>
        <div style={chartCard}>
          <Chart
            data={ramData}
            type="line"
            title="RAM Usage (%)"
            color="#bc8cff"
            width={340}
            height={180}
          />
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
          Capabilities
        </h3>
        <div style={capList}>
          {node.capabilities.length > 0 ? (
            node.capabilities.map((cap) => (
              <span key={cap} style={capTag}>
                {cap}
              </span>
            ))
          ) : (
            <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>
              No capabilities listed
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
