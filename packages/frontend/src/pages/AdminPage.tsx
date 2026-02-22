import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { AdminDashboard } from "../components/admin/AdminDashboard";
import { UserManagement } from "../components/admin/UserManagement";
import { AnalyticsPanel } from "../components/admin/AnalyticsPanel";
import { FeatureFlags } from "../components/admin/FeatureFlags";
import { ClusterPanel } from "../components/admin/ClusterPanel";
import { AnnouncementManager } from "../components/admin/AnnouncementManager";
import { Icon, type IconName } from "../components/common/Icon";

/** Tab definitions */
const adminTabs: Array<{ key: string; label: string; icon: IconName }> = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "users", label: "Users", icon: "users" },
  { key: "analytics", label: "Analytics", icon: "analytics" },
  { key: "features", label: "Feature Flags", icon: "flag" },
  { key: "clusters", label: "Clusters", icon: "server" },
  { key: "announcements", label: "Announcements", icon: "megaphone" },
];

/**
 * Admin page with tab navigation between admin sub-panels.
 */
export const AdminPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const headerStyle: React.CSSProperties = {
    marginBottom: "24px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: 600,
    marginBottom: "16px",
  };

  const tabsRow: React.CSSProperties = {
    display: "flex",
    gap: "4px",
    borderBottom: "1px solid var(--border-color)",
    marginBottom: "24px",
    flexWrap: "wrap",
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: 500,
    background: "none",
    border: "none",
    borderBottom: active
      ? "2px solid var(--accent-blue)"
      : "2px solid transparent",
    color: active ? "var(--text-primary)" : "var(--text-secondary)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "color 0.15s, border-color 0.15s",
  });

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboard />;
      case "users":
        return <UserManagement />;
      case "analytics":
        return <AnalyticsPanel />;
      case "features":
        return <FeatureFlags />;
      case "clusters":
        return <ClusterPanel />;
      case "announcements":
        return <AnnouncementManager />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Admin Panel</h1>
      </div>

      <div style={tabsRow}>
        {adminTabs.map((tab) => (
          <button
            key={tab.key}
            style={tabStyle(activeTab === tab.key)}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            <Icon name={tab.icon} size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {renderContent()}
    </div>
  );
};
