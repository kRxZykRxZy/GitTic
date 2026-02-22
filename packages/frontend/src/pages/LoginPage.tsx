import React from "react";
import { LoginForm } from "../components/auth/LoginForm";

/**
 * Login page layout with centered card containing LoginForm.
 */
export const LoginPage: React.FC = () => {
  const pageStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "var(--bg-primary)",
    padding: "16px",
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    padding: "32px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "var(--shadow)",
  };

  const logoStyle: React.CSSProperties = {
    textAlign: "center",
    marginBottom: "24px",
  };

  const logoText: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: 700,
    color: "var(--text-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  };

  const subtitle: React.CSSProperties = {
    fontSize: "14px",
    color: "var(--text-secondary)",
    marginTop: "4px",
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={logoStyle}>
          <div style={logoText}>
            <span>🚀</span>
            <span>Platform</span>
          </div>
          <div style={subtitle}>Sign in to your account</div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
};
