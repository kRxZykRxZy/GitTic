import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api-client";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { Badge } from "../components/common/Badge";
import { DataTable } from "../components/common/DataTable";
import { Icon } from "../components/common/Icon";
import { formatRelativeTime } from "../utils/format";

interface SecurityAdvisory {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  package: string;
  vulnerableVersions: string;
  patchedVersions: string;
  publishedAt: string;
  status: "open" | "resolved" | "dismissed";
}

interface ScanResult {
  id: string;
  type: "code" | "dependency" | "secret";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  file: string;
  line?: number;
  createdAt: string;
  status: "open" | "fixed" | "dismissed";
}

interface SecurityData {
  advisories: SecurityAdvisory[];
  codeScanning: ScanResult[];
  dependencyScanning: ScanResult[];
  secretScanning: ScanResult[];
  stats: {
    totalAdvisories: number;
    openAdvisories: number;
    totalVulnerabilities: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

type SecurityTab = "overview" | "advisories" | "code-scanning" | "dependencies" | "secrets";

/**
 * Security page showing advisories, code scanning, dependency scanning,
 * and secret scanning results.
 */
export const SecurityPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<SecurityTab>("overview");

  const { data, loading, error } = useApi<SecurityData>(
    () => api.get<SecurityData>(`/repositories/${owner}/${repo}/security`),
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
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  };

  const statCard: React.CSSProperties = {
    padding: "16px",
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    textAlign: "center",
  };

  const statValue: React.CSSProperties = {
    fontSize: "28px",
    fontWeight: 700,
    marginBottom: "4px",
  };

  const statLabel: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--text-secondary)",
    textTransform: "uppercase",
  };

  const tabsStyle: React.CSSProperties = {
    display: "flex",
    gap: "8px",
    borderBottom: "1px solid var(--border-color)",
    marginBottom: "24px",
    flexWrap: "wrap",
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

  const alertsList: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const alertCard: React.CSSProperties = {
    padding: "16px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
  };

  const alertHeader: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "8px",
  };

  const alertTitle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 600,
    flex: 1,
  };

  const alertMeta: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--text-secondary)",
    marginBottom: "8px",
  };

  const alertDescription: React.CSSProperties = {
    fontSize: "13px",
    color: "var(--text-secondary)",
    lineHeight: "1.5",
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "48px 24px",
    color: "var(--text-muted)",
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "danger" | "warning" | "info" | "default"> = {
      critical: "danger",
      high: "danger",
      medium: "warning",
      low: "info",
    };
    return <Badge label={severity} variant={variants[severity] || "default"} />;
  };

  const getSeverityColor = (severity: string): string => {
    const colors: Record<string, string> = {
      critical: "var(--accent-red)",
      high: "var(--accent-orange)",
      medium: "var(--accent-yellow)",
      low: "var(--accent-blue)",
    };
    return colors[severity] || "var(--text-secondary)";
  };

  if (loading) return <LoadingSpinner message="Loading security information..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <ErrorMessage message="No security data available" />;

  return (
    <div style={pageStyle}>
      <div style={breadcrumbStyle}>
        <Link to={`/${owner}`} style={breadcrumbLink}>{owner}</Link>
        {" / "}
        <Link to={`/${owner}/${repo}`} style={breadcrumbLink}>{repo}</Link>
        {" / Security"}
      </div>

      <div style={headerStyle}>
        <div style={titleStyle}>
          <Icon name="lock" size={20} style={{ marginRight: "8px" }} />
          Security
        </div>
      </div>

      {activeTab === "overview" && (
        <div style={statsGrid}>
          <div style={statCard}>
            <div style={{ ...statValue, color: getSeverityColor("critical") }}>
              {data.stats.critical}
            </div>
            <div style={statLabel}>Critical</div>
          </div>
          <div style={statCard}>
            <div style={{ ...statValue, color: getSeverityColor("high") }}>
              {data.stats.high}
            </div>
            <div style={statLabel}>High</div>
          </div>
          <div style={statCard}>
            <div style={{ ...statValue, color: getSeverityColor("medium") }}>
              {data.stats.medium}
            </div>
            <div style={statLabel}>Medium</div>
          </div>
          <div style={statCard}>
            <div style={{ ...statValue, color: getSeverityColor("low") }}>
              {data.stats.low}
            </div>
            <div style={statLabel}>Low</div>
          </div>
        </div>
      )}

      <div style={tabsStyle}>
        <button
          style={getTabStyle(activeTab === "overview")}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          style={getTabStyle(activeTab === "advisories")}
          onClick={() => setActiveTab("advisories")}
        >
          ⚠️ Advisories ({data.stats.totalAdvisories})
        </button>
        <button
          style={getTabStyle(activeTab === "code-scanning")}
          onClick={() => setActiveTab("code-scanning")}
        >
          🔍 Code Scanning
        </button>
        <button
          style={getTabStyle(activeTab === "dependencies")}
          onClick={() => setActiveTab("dependencies")}
        >
          📦 Dependencies
        </button>
        <button
          style={getTabStyle(activeTab === "secrets")}
          onClick={() => setActiveTab("secrets")}
        >
          🔑 Secrets
        </button>
      </div>

      <div style={contentArea}>
        {activeTab === "advisories" && (
          <>
            {data.advisories.length > 0 ? (
              <div style={alertsList}>
                {data.advisories.map((advisory) => (
                  <div key={advisory.id} style={alertCard}>
                    <div style={alertHeader}>
                      <div style={alertTitle}>{advisory.title}</div>
                      {getSeverityBadge(advisory.severity)}
                    </div>
                    <div style={alertMeta}>
                      {advisory.package} • {advisory.vulnerableVersions} → {advisory.patchedVersions} • {formatRelativeTime(advisory.publishedAt)}
                    </div>
                    <div style={alertDescription}>{advisory.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={emptyStateStyle}>
                <div style={{ marginBottom: "16px" }}>
                  <Icon name="celebration" size={48} color="var(--accent-green)" />
                </div>
                <div style={{ fontSize: "16px", fontWeight: 500 }}>No security advisories</div>
              </div>
            )}
          </>
        )}

        {activeTab === "code-scanning" && (
          <>
            {data.codeScanning.length > 0 ? (
              <div style={alertsList}>
                {data.codeScanning.map((scan) => (
                  <div key={scan.id} style={alertCard}>
                    <div style={alertHeader}>
                      <div style={alertTitle}>{scan.title}</div>
                      {getSeverityBadge(scan.severity)}
                    </div>
                    <div style={alertMeta}>
                      {scan.file}:{scan.line} • {formatRelativeTime(scan.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={emptyStateStyle}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
                <div style={{ fontSize: "16px", fontWeight: 500 }}>No code scanning alerts</div>
              </div>
            )}
          </>
        )}

        {activeTab === "dependencies" && (
          <>
            {data.dependencyScanning.length > 0 ? (
              <div style={alertsList}>
                {data.dependencyScanning.map((scan) => (
                  <div key={scan.id} style={alertCard}>
                    <div style={alertHeader}>
                      <div style={alertTitle}>{scan.title}</div>
                      {getSeverityBadge(scan.severity)}
                    </div>
                    <div style={alertMeta}>
                      {scan.file} • {formatRelativeTime(scan.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={emptyStateStyle}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
                <div style={{ fontSize: "16px", fontWeight: 500 }}>No dependency vulnerabilities</div>
              </div>
            )}
          </>
        )}

        {activeTab === "secrets" && (
          <>
            {data.secretScanning.length > 0 ? (
              <div style={alertsList}>
                {data.secretScanning.map((scan) => (
                  <div key={scan.id} style={alertCard}>
                    <div style={alertHeader}>
                      <div style={alertTitle}>{scan.title}</div>
                      {getSeverityBadge(scan.severity)}
                    </div>
                    <div style={alertMeta}>
                      {scan.file}:{scan.line} • {formatRelativeTime(scan.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={emptyStateStyle}>
                <div style={{ marginBottom: "16px" }}>
                  <Icon name="celebration" size={48} color="var(--accent-green)" />
                </div>
                <div style={{ fontSize: "16px", fontWeight: 500 }}>No secrets detected</div>
              </div>
            )}
          </>
        )}

        {activeTab === "overview" && (
          <div style={emptyStateStyle}>
            <div style={{ marginBottom: "16px" }}>
              <Icon name="lock" size={48} color="var(--text-secondary)" />
            </div>
            <div style={{ fontSize: "16px", fontWeight: 500, marginBottom: "8px" }}>
              Security Overview
            </div>
            <div style={{ fontSize: "14px" }}>
              {data.stats.totalVulnerabilities === 0
                ? "No security vulnerabilities detected. Your repository is secure!"
                : `Found ${data.stats.totalVulnerabilities} security issue(s). Check the tabs above for details.`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
