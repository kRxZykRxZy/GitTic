import React from "react";

/** Available icon names */
export type IconName =
    | "dashboard"
    | "users"
    | "analytics"
    | "flag"
    | "server"
    | "megaphone"
    | "folder"
    | "link"
    | "thumbs-up"
    | "celebration"
    | "smile"
    | "heart"
    | "rocket"
    | "thinking"
    | "lightbulb"
    | "search"
    | "check"
    | "plus"
    | "minus"
    | "x"
    | "arrow-right"
    | "arrow-left"
    | "arrow-up"
    | "arrow-down"
    | "git-branch"
    | "git-commit"
    | "git-pull-request"
    | "git-merge"
    | "code"
    | "file"
    | "settings"
    | "lock"
    | "unlock"
    | "eye"
    | "eye-off"
    | "star"
    | "issue"
    | "comment";

/** Props for Icon component */
interface IconProps {
    /** Icon name */
    name: IconName;
    /** Icon size in pixels (default: 20) */
    size?: number;
    /** Icon color (default: currentColor) */
    color?: string;
    /** Additional CSS class */
    className?: string;
    /** Additional inline styles */
    style?: React.CSSProperties;
}

/**
 * Icon component - Renders SVG icons
 * Replaces emoji usage with proper SVG icons
 */
export const Icon: React.FC<IconProps> = ({
    name,
    size = 20,
    color = "currentColor",
    className = "",
    style = {},
}) => {
    const iconStyle: React.CSSProperties = {
        width: size,
        height: size,
        display: "inline-block",
        verticalAlign: "middle",
        ...style,
    };

    const getPath = (): React.ReactNode => {
        switch (name) {
            case "dashboard":
                return (
                    <>
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                    </>
                );
            case "users":
                return (
                    <>
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </>
                );
            case "analytics":
                return (
                    <>
                        <path d="M3 3v18h18" />
                        <path d="m19 9-5 5-4-4-3 3" />
                    </>
                );
            case "flag":
                return (
                    <>
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                        <line x1="4" y1="22" x2="4" y2="15" />
                    </>
                );
            case "server":
                return (
                    <>
                        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                        <line x1="6" y1="6" x2="6.01" y2="6" />
                        <line x1="6" y1="18" x2="6.01" y2="18" />
                    </>
                );
            case "megaphone":
                return (
                    <>
                        <path d="m3 11 18-5v12L3 14v-3z" />
                        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
                    </>
                );
            case "folder":
                return (
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                );
            case "link":
                return (
                    <>
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </>
                );
            case "thumbs-up":
                return (
                    <path d="M7 10v12m8-16.12L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                );
            case "celebration":
                return (
                    <>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                        <line x1="9" y1="9" x2="9.01" y2="9" />
                        <line x1="15" y1="9" x2="15.01" y2="9" />
                    </>
                );
            case "smile":
                return (
                    <>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                        <line x1="9" y1="9" x2="9.01" y2="9" />
                        <line x1="15" y1="9" x2="15.01" y2="9" />
                    </>
                );
            case "heart":
                return (
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                );
            case "rocket":
                return (
                    <>
                        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                    </>
                );
            case "thinking":
                return (
                    <>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </>
                );
            case "lightbulb":
                return (
                    <>
                        <line x1="9" y1="18" x2="15" y2="18" />
                        <line x1="10" y1="22" x2="14" y2="22" />
                        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                    </>
                );
            case "search":
                return (
                    <>
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </>
                );
            case "check":
                return <polyline points="20 6 9 17 4 12" />;
            case "plus":
                return (
                    <>
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </>
                );
            case "minus":
                return <line x1="5" y1="12" x2="19" y2="12" />;
            case "x":
                return (
                    <>
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </>
                );
            case "arrow-right":
                return (
                    <>
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </>
                );
            case "arrow-left":
                return (
                    <>
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </>
                );
            case "arrow-up":
                return (
                    <>
                        <line x1="12" y1="19" x2="12" y2="5" />
                        <polyline points="5 12 12 5 19 12" />
                    </>
                );
            case "arrow-down":
                return (
                    <>
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <polyline points="19 12 12 19 5 12" />
                    </>
                );
            case "git-branch":
                return (
                    <>
                        <line x1="6" y1="3" x2="6" y2="15" />
                        <circle cx="18" cy="6" r="3" />
                        <circle cx="6" cy="18" r="3" />
                        <path d="M18 9a9 9 0 0 1-9 9" />
                    </>
                );
            case "git-commit":
                return (
                    <>
                        <circle cx="12" cy="12" r="4" />
                        <line x1="1.05" y1="12" x2="7" y2="12" />
                        <line x1="17.01" y1="12" x2="22.96" y2="12" />
                    </>
                );
            case "git-pull-request":
                return (
                    <>
                        <circle cx="18" cy="18" r="3" />
                        <circle cx="6" cy="6" r="3" />
                        <path d="M13 6h3a2 2 0 0 1 2 2v7" />
                        <line x1="6" y1="9" x2="6" y2="21" />
                    </>
                );
            case "git-merge":
                return (
                    <>
                        <circle cx="18" cy="18" r="3" />
                        <circle cx="6" cy="6" r="3" />
                        <path d="M6 21V9a9 9 0 0 0 9 9" />
                    </>
                );
            case "code":
                return (
                    <>
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                    </>
                );
            case "file":
                return (
                    <>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </>
                );
            case "settings":
                return (
                    <>
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
                    </>
                );
            case "lock":
                return (
                    <>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </>
                );
            case "unlock":
                return (
                    <>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                    </>
                );
            case "eye":
                return (
                    <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                    </>
                );
            case "eye-off":
                return (
                    <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                );
            case "star":
                return (
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                );
            case "issue":
                return (
                    <>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </>
                );
            case "comment":
                return (
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                );
            default:
                return <circle cx="12" cy="12" r="10" />;
        }
    };

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={iconStyle}
            className={className}
        >
            {getPath()}
        </svg>
    );
};

export default Icon;
