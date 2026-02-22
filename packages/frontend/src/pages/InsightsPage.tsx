import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api-client";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { Chart } from "../components/common/Chart";
import { StatCard } from "../components/common/StatCard";

interface Contributor {
  username: string;
  avatarUrl?: string;
  commits: number;
  additions: number;
  deletions: number;
}

interface TrafficData {
  views: { date: string; count: number }[];
  clones: { date: string; count: number }[];
  visitors: { date: string; count: number }[];
}

interface CodeFrequency {
  week: string;
  additions: number;
  deletions: number;
}

interface InsightsData {
  contributors: Contributor[];
  traffic: TrafficData;
  codeFrequency: CodeFrequency[];
  languages: { name: string; percentage: number; color: string }[];
  stats: {
    totalCommits: number;
    totalContributors: number;
    totalViews: number;
    totalClones: number;
  };
}

type InsightsTab = "contributors" | "traffic" | "code-frequency" | "languages";

/**
 * Repository insights page with analytics, charts for contributors,
 * traffic, and code frequency.
 */
export const InsightsPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<InsightsTab>("contributors");

  const { data, loading, error } = useApi<InsightsData>(
    () => api.get<InsightsData>(`/repositories/${owner}/${repo}/insights`),
    [owner, repo],
  );

  const pageStyle: React.CSSProperties = {
    maxWidth: "1200px",
    margin: "0 auto",
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

  const headerStyle: React.CSSProperties = {
    marginBottom: "24px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: 600,
    marginBottom: "16px",
  };

  const statsGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  };

  const tabsStyle: React.CSSProperties = {
    display: "flex",
    gap: "8px",
    borderBottom: "1px solid var(--border-color)",
    marginBottom: "24px",
  };

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "8px 16px",
    background: "transparent",
    border: "none",
    borderBottom: isActive ? "2px solid var(--accent-blue)" : "2px solid transparent",
    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: isActive ? 600 : 400,
    transition: "all 0.15s",
  });

  const contentArea: React.CSSProperties = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    padding: "24px",
  };

  const contributorsList: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const contributorCard: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "12px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
  };

  const avatar: React.CSSProperties = {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "var(--bg-tertiary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  };

  const contributorInfo: React.CSSProperties = {
    flex: 1,
  };

  const contributorName: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "4px",
  };

  const contributorStats: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--text-secondary)",
    display: "flex",
    gap: "12px",
  };

  const languagesList: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const languageItem: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };

  const languageBar: React.CSSProperties = {
    flex: 1,
    height: "8px",
    background: "var(--bg-primary)",
    borderRadius: "4px",
    overflow: "hidden",
  };

  const languageLabel: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 500,
    minWidth: "100px",
  };

  const percentage: React.CSSProperties = {
    fontSize: "13px",
    color: "var(--text-secondary)",
    minWidth: "50px",
    textAlign: "right",
  };

  if (loading) return <LoadingSpinner message="Loading insights..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <ErrorMessage message="No insights data available" />;

  return (
    <div style={pageStyle}>
      <div style={breadcrumbStyle}>
        <Link to={`/${owner}`} style={breadcrumbLink}>{owner}</Link>
        {" / "}
        <Link to={`/${owner}/${repo}`} style={breadcrumbLink}>{repo}</Link>
        {" / Insights"}
      </div>

      <div style={headerStyle}>
        <div style={titleStyle}>Insights</div>
      </div>

      <div style={statsGrid}>
        <StatCard
          label="Total Commits"
          value={data.stats.totalCommits}
          icon="📝"
        />
        <StatCard
          label="Contributors"
          value={data.stats.totalContributors}
          icon="👥"
        />
        <StatCard
          label="Views"
          value={data.stats.totalViews}
          icon="👁️"
        />
        <StatCard
          label="Clones"
          value={data.stats.totalClones}
          icon="📥"
        />
      </div>

      <div style={tabsStyle}>
        <button
          style={getTabStyle(activeTab === "contributors")}
          onClick={() => setActiveTab("contributors")}
        >
          👥 Contributors
        </button>
        <button
          style={getTabStyle(activeTab === "traffic")}
          onClick={() => setActiveTab("traffic")}
        >
          📊 Traffic
        </button>
        <button
          style={getTabStyle(activeTab === "code-frequency")}
          onClick={() => setActiveTab("code-frequency")}
        >
          📈 Code Frequency
        </button>
        <button
          style={getTabStyle(activeTab === "languages")}
          onClick={() => setActiveTab("languages")}
        >
          🔤 Languages
        </button>
      </div>

      <div style={contentArea}>
        {activeTab === "contributors" && (
          <div style={contributorsList}>
            {data.contributors.map((contributor) => (
              <div key={contributor.username} style={contributorCard}>
                <div style={avatar}>
                  {contributor.avatarUrl ? (
                    <img src={contributor.avatarUrl} alt={contributor.username} style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
                  ) : (
                    "👤"
                  )}
                </div>
                <div style={contributorInfo}>
                  <div style={contributorName}>{contributor.username}</div>
                  <div style={contributorStats}>
                    <span>📝 {contributor.commits} commits</span>
                    <span>➕ {contributor.additions.toLocaleString()} ++</span>
                    <span>➖ {contributor.deletions.toLocaleString()} --</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "traffic" && (
          <div>
            <Chart
              type="line"
              data={data.traffic.views.map(v => ({ label: v.date, value: v.count }))}
              title="Repository Views"
            />
            <div style={{ marginTop: "24px" }}>
              <Chart
                type="line"
                data={data.traffic.clones.map(c => ({ label: c.date, value: c.count }))}
                title="Repository Clones"
              />
            </div>
          </div>
        )}

        {activeTab === "code-frequency" && (
          <Chart
            type="bar"
            data={data.codeFrequency.map(cf => ({ label: cf.week, value: cf.additions }))}
            title="Code Additions and Deletions by Week"
          />
        )}

        {activeTab === "languages" && (
          <div style={languagesList}>
            {data.languages.map((lang) => (
              <div key={lang.name} style={languageItem}>
                <div style={languageLabel}>{lang.name}</div>
                <div style={languageBar}>
                  <div
                    style={{
                      width: `${lang.percentage}%`,
                      height: "100%",
                      background: lang.color,
                    }}
                  />
                </div>
                <div style={percentage}>{lang.percentage.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
