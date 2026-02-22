import React from "react";

/** Props for ErrorMessage component */
interface ErrorMessageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  fullPage?: boolean;
}

/**
 * Error display component with optional retry button.
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  title = "Something went wrong",
  onRetry,
  fullPage = false,
}) => {
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: fullPage ? "48px 24px" : "24px",
    minHeight: fullPage ? "50vh" : "auto",
    textAlign: "center",
  };

  const iconStyle: React.CSSProperties = {
    fontSize: "48px",
    marginBottom: "16px",
    color: "var(--accent-red)",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "8px",
  };

  const messageStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "var(--text-secondary)",
    maxWidth: "400px",
    lineHeight: "1.5",
    marginBottom: onRetry ? "16px" : "0",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "8px 20px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#fff",
    backgroundColor: "var(--accent-blue)",
    border: "none",
    borderRadius: "var(--radius)",
    cursor: "pointer",
  };

  return (
    <div style={containerStyle} role="alert">
      <div style={iconStyle}>⚠</div>
      <h3 style={titleStyle}>{title}</h3>
      <p style={messageStyle}>{message}</p>
      {onRetry && (
        <button style={buttonStyle} onClick={onRetry} type="button">
          Try Again
        </button>
      )}
    </div>
  );
};
