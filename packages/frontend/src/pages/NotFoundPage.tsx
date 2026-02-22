import React from "react";
import { Link } from "react-router-dom";

/**
 * 404 Not Found page with illustration and link back to home.
 */
export const NotFoundPage: React.FC = () => {
  const pageStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "var(--bg-primary)",
    padding: "24px",
    textAlign: "center",
  };

  const illustrationStyle: React.CSSProperties = {
    fontSize: "120px",
    lineHeight: 1,
    marginBottom: "24px",
    filter: "grayscale(0.3)",
  };

  const codeStyle: React.CSSProperties = {
    fontSize: "72px",
    fontWeight: 800,
    color: "var(--text-muted)",
    letterSpacing: "-2px",
    marginBottom: "8px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "8px",
  };

  const descStyle: React.CSSProperties = {
    fontSize: "15px",
    color: "var(--text-secondary)",
    maxWidth: "420px",
    lineHeight: 1.6,
    marginBottom: "32px",
  };

  const linkStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 24px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#fff",
    backgroundColor: "#238636",
    borderRadius: "var(--radius)",
    textDecoration: "none",
    border: "1px solid rgba(240,246,252,0.1)",
    transition: "background 0.15s",
  };

  const footerNote: React.CSSProperties = {
    marginTop: "48px",
    fontSize: "13px",
    color: "var(--text-muted)",
  };

  return (
    <div style={pageStyle}>
      <div style={illustrationStyle}>🌌</div>
      <div style={codeStyle}>404</div>
      <h1 style={titleStyle}>Page Not Found</h1>
      <p style={descStyle}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        It might have been deleted, or the URL may be incorrect.
      </p>
      <Link to="/" style={linkStyle}>
        ← Back to Home
      </Link>
      <p style={footerNote}>
        If you believe this is an error, please contact support.
      </p>
    </div>
  );
};
