import React from "react";

/** Props for LoadingSpinner */
interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  inline?: boolean;
}

/** Size map for the spinner */
const sizeMap: Record<string, number> = {
  sm: 20,
  md: 36,
  lg: 56,
};

/**
 * CSS-based loading spinner with optional message.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = "md",
  inline = false,
}) => {
  const dimension = sizeMap[size];
  const borderWidth = size === "sm" ? 2 : size === "md" ? 3 : 4;

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: inline ? "row" : "column",
    alignItems: "center",
    justifyContent: "center",
    gap: inline ? "8px" : "12px",
    padding: inline ? "0" : "24px",
  };

  const spinnerStyle: React.CSSProperties = {
    width: dimension,
    height: dimension,
    border: `${borderWidth}px solid var(--border-color)`,
    borderTopColor: "var(--accent-blue)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  };

  const messageStyle: React.CSSProperties = {
    color: "var(--text-secondary)",
    fontSize: size === "sm" ? "12px" : "14px",
  };

  return (
    <>
      <style>
        {`@keyframes spin {
          to { transform: rotate(360deg); }
        }`}
      </style>
      <div style={containerStyle} role="status" aria-label="Loading">
        <div style={spinnerStyle} />
        {message && <span style={messageStyle}>{message}</span>}
      </div>
    </>
  );
};
