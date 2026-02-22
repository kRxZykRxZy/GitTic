import React, { useState, useCallback } from "react";
import { useApi } from "../../hooks/useApi";
import { adminService, TimeRange } from "../../services/admin-service";
import { Chart, ChartDataPoint } from "../common/Chart";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorMessage } from "../common/ErrorMessage";
import { Metric } from "../../types/api";
import { TIME_RANGES } from "../../utils/constants";

/**
 * Analytics dashboard with charts and time range selector.
 */
export const AnalyticsPanel: React.FC = () => {
  const [range, setRange] = useState<TimeRange>("30d");

  const { data, loading, error, refetch } = useApi<Metric[]>(
    () => adminService.getAnalytics({ range }),
    [range],
  );

  const handleRangeChange = useCallback((newRange: TimeRange) => {
    setRange(newRange);
  }, []);

  if (loading) return <LoadingSpinner message="Loading analytics…" />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  const metrics = data || [];

  /** Group metrics by unit for different charts */
  const userMetrics: ChartDataPoint[] = metrics
    .filter((m) => m.unit === "users" || m.label.toLowerCase().includes("user"))
    .map((m) => ({ label: m.label, value: m.value }));

  const viewMetrics: ChartDataPoint[] = metrics
    .filter(
      (m) =>
        m.unit === "views" || m.label.toLowerCase().includes("view") ||
        m.label.toLowerCase().includes("page"),
    )
    .map((m) => ({ label: m.label, value: m.value }));

  const buildMetrics: ChartDataPoint[] = metrics
    .filter(
      (m) =>
        m.unit === "builds" || m.label.toLowerCase().includes("build") ||
        m.label.toLowerCase().includes("clone"),
    )
    .map((m) => ({ label: m.label, value: m.value }));

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "12px",
  };

  const rangeRow: React.CSSProperties = {
    display: "flex",
    gap: "4px",
  };

  const rangeBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: "4px 12px",
    fontSize: "13px",
    fontWeight: 500,
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    background: active ? "var(--accent-blue)" : "var(--bg-tertiary)",
    color: active ? "#fff" : "var(--text-secondary)",
    cursor: "pointer",
  });

  const chartsGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
    gap: "24px",
  };

  const chartCard: React.CSSProperties = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    padding: "20px",
  };

  return (
    <div>
      <div style={headerStyle}>
        <h2 style={{ fontSize: "20px", fontWeight: 600 }}>Analytics</h2>
        <div style={rangeRow}>
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.value}
              style={rangeBtnStyle(range === tr.value)}
              onClick={() => handleRangeChange(tr.value as TimeRange)}
              type="button"
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>

      <div style={chartsGrid}>
        <div style={chartCard}>
          <Chart
            data={userMetrics.length > 0 ? userMetrics : [{ label: "No data", value: 0 }]}
            type="line"
            title="User Growth & Active Users"
            color="#58a6ff"
            width={380}
            height={220}
          />
        </div>

        <div style={chartCard}>
          <Chart
            data={viewMetrics.length > 0 ? viewMetrics : [{ label: "No data", value: 0 }]}
            type="bar"
            title="Page Views"
            color="#bc8cff"
            width={380}
            height={220}
          />
        </div>

        <div style={chartCard}>
          <Chart
            data={buildMetrics.length > 0 ? buildMetrics : [{ label: "No data", value: 0 }]}
            type="line"
            title="Clones & Build Success"
            color="#3fb950"
            width={380}
            height={220}
          />
        </div>
      </div>
    </div>
  );
};
