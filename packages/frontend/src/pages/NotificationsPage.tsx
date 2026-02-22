import React, { useState, useEffect } from "react";
import { api } from "../services/api-client";
import { useNavigate } from "react-router-dom";
import "../styles/NotificationsPage.css";

interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string | null;
    read: boolean;
    resourceType: string;
    resourceId: string;
    actorId: string | null;
    createdAt: string;
    actor?: {
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
    };
}

export const NotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const navigate = useNavigate();

    useEffect(() => {
        loadNotifications();
    }, [filter]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const params = filter === "unread" ? "?unread=true" : "";
            const response = await api.get<{ notifications: Notification[] }>(
                `/notifications${params}`
            );
            setNotifications(response.data.notifications || []);
        } catch (error) {
            console.error("Failed to load notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/threads/${id}`, { read: true });
            setNotifications(
                notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unread = notifications.filter((n) => !n.read);
            await Promise.all(
                unread.map((n) => api.patch(`/notifications/threads/${n.id}`, { read: true }))
            );
            setNotifications(notifications.map((n) => ({ ...n, read: true })));
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id);

        // Navigate based on resource type
        if (notification.resourceType === "issue") {
            // Extract owner/repo/number from resourceId
            navigate(`/issues/${notification.resourceId}`);
        } else if (notification.resourceType === "pull_request") {
            navigate(`/pulls/${notification.resourceId}`);
        } else if (notification.resourceType === "discussion") {
            navigate(`/discussions/${notification.resourceId}`);
        }
    };

    const getNotificationIcon = (type: string) => {
        const icons: Record<string, string> = {
            mention: "💬",
            issue_assigned: "📌",
            issue_comment: "💭",
            pr_review_requested: "👀",
            pr_comment: "💬",
            pr_merged: "✅",
            discussion_comment: "💭",
            follow: "👤",
        };
        return icons[type] || "🔔";
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return "just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="notifications-page">
                <div className="loading">Loading notifications...</div>
            </div>
        );
    }

    return (
        <div className="notifications-page">
            <div className="notifications-header">
                <h1>🔔 Notifications</h1>
                <div className="notifications-actions">
                    <div className="filter-tabs">
                        <button
                            className={filter === "all" ? "active" : ""}
                            onClick={() => setFilter("all")}
                        >
                            All
                        </button>
                        <button
                            className={filter === "unread" ? "active" : ""}
                            onClick={() => setFilter("unread")}
                        >
                            Unread
                        </button>
                    </div>
                    {notifications.some((n) => !n.read) && (
                        <button className="mark-all-read" onClick={markAllAsRead}>
                            Mark all as read
                        </button>
                    )}
                </div>
            </div>

            {notifications.length === 0 ? (
                <div className="no-notifications">
                    <p>🎉 You're all caught up!</p>
                    <p className="subtitle">No notifications to show</p>
                </div>
            ) : (
                <div className="notifications-list">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`notification-item ${notification.read ? "read" : "unread"}`}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="notification-icon">
                                {getNotificationIcon(notification.type)}
                            </div>
                            <div className="notification-content">
                                <div className="notification-title">{notification.title}</div>
                                {notification.body && (
                                    <div className="notification-body">{notification.body}</div>
                                )}
                                <div className="notification-meta">
                                    {notification.actor && (
                                        <span className="actor">
                                            {notification.actor.displayName || notification.actor.username}
                                        </span>
                                    )}
                                    <span className="time">{formatTime(notification.createdAt)}</span>
                                </div>
                            </div>
                            {!notification.read && <div className="unread-indicator"></div>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
