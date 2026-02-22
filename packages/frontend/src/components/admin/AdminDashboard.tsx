import React from "react";
import { useApi } from "../../hooks/useApi";
import { adminService } from "../../services/admin-service";
import { StatCard } from "../common/StatCard";
import { Chart, ChartDataPoint } from "../common/Chart";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorMessage } from "../common/ErrorMessage";
import { Icon } from "../common/Icon";
import { DashboardStats } from "../../types/api";

/**
 * Admin overview with stat cards and charts for user growth and project trends.
 */
export const AdminDashboard: React.FC = () => {
  const { data, loading, error, refetch } = useApi<DashboardStats>(
    () => adminService.getDashboard(),
    [],
  );

  if (loading) return <LoadingSpinner message="Loading admin dashboard…" />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  if (!data) return null;

  const statsRow: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "32px",
  };

  const chartsRow: React.CSSProperties = {
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

  const userGrowthData: ChartDataPoint[] = (data.userGrowth || []).map(
    (m) => ({ label: m.label, value: m.value }),
  );

  const projectTrendsData: ChartDataPoint[] = (data.projectTrends || []).map(
    (m) => ({ label: m.label, value: m.value }),
  );

  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "20px" }}>
        Admin Overview
      </h2>

      <div style={statsRow}>
        <StatCard 
          label="Total Users" 
          value={data.totalUsers ?? null} 
          icon={<Icon name="users" size={24} />} 
        />
        <StatCard 
          label="Total Projects" 
          value={data.totalProjects ?? null} 
          icon={<Icon name="folder" size={24} />} 
        />
        <StatCard 
          label="Clusters" 
          value={data.totalClusters ?? null} 
          icon={<Icon name="server" size={24} />} 
        />
        <StatCard
          label="Active Connections"
          value={data.activeConnections ?? null}
          icon={<Icon name="link" size={24} />}
        />
      </div>

      <div style={chartsRow}>
        <div style={chartCard}>
          <Chart
            data={userGrowthData}
            type="line"
            title="User Growth"
            color="#58a6ff"
            width={380}
            height={200}
          />
        </div>
        <div style={chartCard}>
          <Chart
            data={projectTrendsData}
            type="bar"
            title="Project Trends"
            color="#3fb950"
            width={380}
            height={200}
          />
        </div>
      </div>
    </div>
  );
};
