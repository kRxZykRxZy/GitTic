import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi";
import { api } from "../../services/api-client";
import { Announcement } from "../../types/api";

interface AnnouncementsResponse {
    announcements: Announcement[];
}

/**
 * Banner at the top of the app that displays active announcements
 * to logged-in users. Auto-dismisses after 10 seconds or on manual close.
 */
export const AnnouncementsBar: React.FC = () => {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const [autoHideTimer, setAutoHideTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    const { data, loading } = useApi<AnnouncementsResponse>(
        () => api.get<AnnouncementsResponse>("/announcements"),
        [],
    );

    const announcements = data?.announcements ?? [];
    const activeAnnouncements = announcements.filter((a) => !dismissed.has(a.id));

    // Auto-hide after 10 seconds
    useEffect(() => {
        if (activeAnnouncements.length > 0) {
            const timer = setTimeout(() => {
                setDismissed((prev) => {
                    const newSet = new Set(prev);
                    activeAnnouncements.forEach((a) => newSet.add(a.id));
                    return newSet;
                });
            }, 10000);
            setAutoHideTimer(timer);
            return () => clearTimeout(timer);
        }
    }, [activeAnnouncements]);

    const handleDismiss = (id: string) => {
        setDismissed((prev) => new Set(prev).add(id));
        if (autoHideTimer) clearTimeout(autoHideTimer);
    };

    if (loading || activeAnnouncements.length === 0) return null;

    const containerStyle: React.CSSProperties = {
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backgroundColor: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-color)",
        padding: "12px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    };

    const announcementStyle = (type: string): React.CSSProperties => {
        let bgColor = "var(--bg-secondary)";
        let borderColor = "var(--border-color)";
        let textColor = "var(--text-primary)";

        switch (type) {
            case "critical":
                bgColor = "rgba(248, 81, 73, 0.1)";
                borderColor = "var(--accent-red)";
                textColor = "var(--accent-red)";
                break;
            case "warning":
                bgColor = "rgba(255, 192, 0, 0.1)";
                borderColor = "var(--accent-yellow)";
                textColor = "var(--accent-yellow)";
                break;
            case "info":
            default:
                bgColor = "rgba(88, 166, 255, 0.1)";
                borderColor = "var(--accent-blue)";
                textColor = "var(--accent-blue)";
        }

        return {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "12px 16px",
            backgroundColor: bgColor,
            border: `1px solid ${borderColor}`,
            borderRadius: "var(--radius)",
            fontSize: "14px",
            color: textColor,
        };
    };

    const messageStyle: React.CSSProperties = {
        flex: 1,
    };

    const closeButtonStyle: React.CSSProperties = {
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "18px",
        color: "inherit",
        padding: "0",
        display: "flex",
        alignItems: "center",
        opacity: 0.7,
        transition: "opacity 0.15s",
    };

    return (
        <div style={containerStyle}>
            {activeAnnouncements.map((announcement) => (
                <div key={announcement.id} style={announcementStyle(announcement.type)}>
                    <div style={messageStyle}>
                        <strong>{announcement.title}</strong>
                        {announcement.message && (
                            <>
                                {" "}
                                –{" "}
                                <span style={{ fontSize: "13px", opacity: 0.9 }}>
                                    {announcement.message}
                                </span>
                            </>
                        )}
                    </div>
                    <button
                        style={closeButtonStyle}
                        onClick={() => handleDismiss(announcement.id)}
                        aria-label="Dismiss announcement"
                        type="button"
                        onMouseEnter={(e) =>
                            ((e.target as HTMLButtonElement).style.opacity = "1")
                        }
                        onMouseLeave={(e) =>
                            ((e.target as HTMLButtonElement).style.opacity = "0.7")
                        }
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
};
