import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/** Navigation item definition */
interface NavItem {
  label: string;
  path: string;
  icon: string;
  requiredRole?: "admin" | "moderator";
}

/** All navigation items */
const navItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: "📊" },
  { label: "Projects", path: "/projects", icon: "📁" },
  { label: "Search", path: "/search", icon: "🔍" },
  { label: "Clusters", path: "/admin/clusters", icon: "🖥️", requiredRole: "admin" },
  { label: "Moderation", path: "/admin/moderation", icon: "🛡️", requiredRole: "moderator" },
  { label: "Admin", path: "/admin", icon: "⚙️", requiredRole: "admin" },
];

/**
 * Left sidebar navigation with role-based link visibility and active highlighting.
 */
export const Sidebar: React.FC = () => {
  const { isAdmin, isModerator } = useAuth();

  /** Check if a nav item should be visible based on user role */
  const isVisible = (item: NavItem): boolean => {
    if (!item.requiredRole) return true;
    if (item.requiredRole === "admin") return isAdmin;
    if (item.requiredRole === "moderator") return isModerator;
    return false;
  };

  const sidebarStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "0",
  };

  const logoStyle: React.CSSProperties = {
    padding: "16px 20px",
    borderBottom: "1px solid var(--border-color)",
    fontSize: "18px",
    fontWeight: 700,
    color: "var(--text-primary)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const navStyle: React.CSSProperties = {
    flex: 1,
    padding: "12px 8px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  };

  const linkBaseStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 12px",
    fontSize: "14px",
    color: "var(--text-secondary)",
    textDecoration: "none",
    borderRadius: "var(--radius)",
    transition: "background 0.15s, color 0.15s",
    fontWeight: 500,
  };

  const activeLinkStyle: React.CSSProperties = {
    ...linkBaseStyle,
    background: "var(--bg-tertiary)",
    color: "var(--text-primary)",
  };

  const bottomStyle: React.CSSProperties = {
    padding: "12px 20px",
    borderTop: "1px solid var(--border-color)",
  };

  const settingsLink: React.CSSProperties = {
    ...linkBaseStyle,
    padding: "8px 0",
  };

  return (
    <div style={sidebarStyle}>
      <div style={logoStyle}>
        <span>🚀</span>
        <span>Platform</span>
      </div>

      <nav style={navStyle}>
        {navItems.filter(isVisible).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            style={({ isActive }) => (isActive ? activeLinkStyle : linkBaseStyle)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={bottomStyle}>
        <NavLink
          to="/settings"
          style={({ isActive }) =>
            isActive
              ? { ...settingsLink, color: "var(--text-primary)" }
              : settingsLink
          }
        >
          <span>⚙️</span>
          <span>Settings</span>
        </NavLink>
      </div>
    </div>
  );
};
