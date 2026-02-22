import React from "react";
import { APP_VERSION } from "../../utils/constants";

/**
 * Simple footer with version info and links.
 */
export const Footer: React.FC = () => {
  const footerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 24px",
    borderTop: "1px solid var(--border-color)",
    background: "var(--bg-secondary)",
    fontSize: "12px",
    color: "var(--text-muted)",
    flexWrap: "wrap",
    gap: "8px",
  };

  const linksStyle: React.CSSProperties = {
    display: "flex",
    gap: "16px",
  };

  const linkStyle: React.CSSProperties = {
    color: "var(--text-secondary)",
    textDecoration: "none",
    fontSize: "12px",
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer style={footerStyle}>
      <span>
        © {currentYear} Platform &middot; v{APP_VERSION}
      </span>
      <div style={linksStyle}>
        <a href="/docs" style={linkStyle}>
          Documentation
        </a>
        <a href="/api" style={linkStyle}>
          API
        </a>
        <a href="/status" style={linkStyle}>
          Status
        </a>
        <a href="/terms" style={linkStyle}>
          Terms
        </a>
        <a href="/privacy" style={linkStyle}>
          Privacy
        </a>
      </div>
    </footer>
  );
};
