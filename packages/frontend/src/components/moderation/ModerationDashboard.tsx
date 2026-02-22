import React from "react";
import { useApi } from "../../hooks/useApi";
import { api } from "../../services/api-client";
import { ModerationReport } from "../../types/api";
import { Badge, statusBadgeVariant } from "../common/Badge";
import { StatCard } from "../common/StatCard";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorMessage } from "../common/ErrorMessage";

/** Dashboard data shape */
interface ModerationData {
  openCount: number;
  reviewingCount: number;
  resolvedCount: number;
  recentReports: ModerationReport[];
}

/**
 * Moderation overview with open reports count, recent reports list, and quick actions.
 */
export const ModerationDashboard: React.FC = () => {
  const { data, loading, error, refetch } = useApi<ModerationData>(
    () => api.get<ModerationData>("/moderation/dashboard"),
    [],
  );

  if (loading) return <LoadingSpinner message="Loading moderation data…" />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  if (!data) return null;

  const statsRow: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: 600,
    marginBottom: "12px",
    color: "var(--text-primary)",
  };

  const reportCard: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    marginBottom: "8px",
    gap: "12px",
  };

  const reportInfo: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  };

  const reasonStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--text-primary)",
  };

  const metaStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--text-muted)",
  };

  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "20px" }}>
        Moderation Overview
      </h2>

      <div style={statsRow}>
        <StatCard label="Open Reports" value={data.openCount} icon="📋" format="number" />
        <StatCard label="Under Review" value={data.reviewingCount} icon="🔍" format="number" />
        <StatCard label="Resolved" value={data.resolvedCount} icon="✅" format="number" />
      </div>

      <h3 style={sectionTitle}>Recent Reports</h3>

      {data.recentReports.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
          No recent reports.
        </div>
      ) : (
        data.recentReports.map((report) => (
          <div key={report.id} style={reportCard}>
            <div style={reportInfo}>
              <span style={reasonStyle}>{report.reason}</span>
              <span style={metaStyle}>
                {report.targetType} &middot; reported by {report.reporterUsername}
              </span>
            </div>
            <Badge
              label={report.status}
              variant={statusBadgeVariant(report.status)}
            />
          </div>
        ))
      )}
    </div>
  );
};
