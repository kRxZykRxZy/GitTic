import React from "react";
import { formatNumber, formatPercentChange } from "../../utils/format";

/** Props for StatCard component */
interface StatCardProps {
    label: string;
    value: number | null | undefined;
    change?: number | null | undefined;
    icon?: React.ReactNode;
    compact?: boolean;
    format?: "number" | "compact" | "percent";
}

/**
 * Statistics card showing a label, value, change percentage, and optional icon.
 */
export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    change,
    icon,
    compact = false,
    format = "compact",
}) => {
    const cardStyle: React.CSSProperties = {
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius)",
        padding: compact ? "12px 16px" : "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        minWidth: compact ? "140px" : "180px",
    };

    const headerStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    };

    const labelStyle: React.CSSProperties = {
        fontSize: "13px",
        color: "var(--text-secondary)",
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.3px",
    };

    const iconStyle: React.CSSProperties = {
        fontSize: compact ? "18px" : "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    };

    const valueStyle: React.CSSProperties = {
        fontSize: compact ? "24px" : "32px",
        fontWeight: 700,
        color: "var(--text-primary)",
        lineHeight: 1.2,
    };

    const changeStyle: React.CSSProperties = {
        fontSize: "13px",
        fontWeight: 500,
        color:
            change !== undefined && change !== null && change > 0
                ? "var(--accent-green)"
                : change !== undefined && change !== null && change < 0
                    ? "var(--accent-red)"
                    : "var(--text-muted)",
    };

    const formattedValue = (): string => {
        // Handle null/undefined values - show 0 as fallback
        if (value === null || value === undefined) {
            return "0";
        }

        switch (format) {
            case "compact":
                return formatNumber(value, true);
            case "percent":
                return `${value.toFixed(1)}%`;
            case "number":
            default:
                return formatNumber(value);
        }
    };

    return (
        <div style={cardStyle}>
            <div style={headerStyle}>
                <span style={labelStyle}>{label}</span>
                {icon && <span style={iconStyle}>{icon}</span>}
            </div>
            <div style={valueStyle}>{formattedValue()}</div>
            {change !== undefined && change !== null && (
                <div style={changeStyle}>
                    {formatPercentChange(change)} from previous period
                </div>
            )}
        </div>
    );
};
