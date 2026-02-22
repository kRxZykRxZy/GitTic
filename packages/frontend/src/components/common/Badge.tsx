import React from "react";

/** Badge variant types */
export type BadgeVariant =
  | "default"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "purple";

/** Props for Badge component */
interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
}

/** Color mapping for badge variants */
const variantColors: Record<
  BadgeVariant,
  { bg: string; text: string; border: string }
> = {
  default: {
    bg: "var(--bg-tertiary)",
    text: "var(--text-secondary)",
    border: "var(--border-color)",
  },
  success: {
    bg: "rgba(63, 185, 80, 0.15)",
    text: "var(--accent-green)",
    border: "rgba(63, 185, 80, 0.3)",
  },
  danger: {
    bg: "rgba(248, 81, 73, 0.15)",
    text: "var(--accent-red)",
    border: "rgba(248, 81, 73, 0.3)",
  },
  warning: {
    bg: "rgba(210, 153, 34, 0.15)",
    text: "var(--accent-yellow)",
    border: "rgba(210, 153, 34, 0.3)",
  },
  info: {
    bg: "rgba(88, 166, 255, 0.15)",
    text: "var(--accent-blue)",
    border: "rgba(88, 166, 255, 0.3)",
  },
  purple: {
    bg: "rgba(188, 140, 255, 0.15)",
    text: "var(--accent-purple)",
    border: "rgba(188, 140, 255, 0.3)",
  },
};

/**
 * Badge / tag component for status indicators, role badges, etc.
 */
export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "default",
  size = "sm",
  dot = false,
}) => {
  const colors = variantColors[variant];
  const isSmall = size === "sm";

  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: isSmall ? "2px 8px" : "4px 12px",
    fontSize: isSmall ? "12px" : "13px",
    fontWeight: 500,
    borderRadius: "12px",
    backgroundColor: colors.bg,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    lineHeight: 1.5,
    whiteSpace: "nowrap",
  };

  const dotStyle: React.CSSProperties = {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: colors.text,
    flexShrink: 0,
  };

  return (
    <span style={badgeStyle}>
      {dot && <span style={dotStyle} />}
      {label}
    </span>
  );
};

/** Helper to get a badge variant from a role string */
export function roleBadgeVariant(role: string): BadgeVariant {
  switch (role) {
    case "admin":
      return "danger";
    case "moderator":
      return "warning";
    default:
      return "default";
  }
}

/** Helper to get a badge variant from a status string */
export function statusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "online":
    case "active":
    case "success":
    case "resolved":
      return "success";
    case "offline":
    case "banned":
    case "failure":
      return "danger";
    case "draining":
    case "suspended":
    case "warning":
    case "reviewing":
      return "warning";
    case "pending":
    case "open":
      return "info";
    default:
      return "default";
  }
}
