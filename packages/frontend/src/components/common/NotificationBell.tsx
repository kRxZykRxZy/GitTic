import React, { useState, useEffect, useRef } from "react";
import { api } from "../../services/api-client";
import { useNavigate } from "react-router-dom";
import "./NotificationBell.css";

interface Notification {
  id: string;
  type: string;
  actorId: string;
  resourceType: string;
  resourceId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Close panel when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowPanel(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await api.get<{ items: Notification[]; unreadCount: number }>(
        "/api/v1/notifications",
        { params: { perPage: 20 } }
      );
      setNotifications(response.data?.items || []);
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/api/v1/notifications/${notificationId}`, {
        isRead: true,
      });
      await loadNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await api.post("/api/v1/notifications/mark-all-read");
      await loadNotifications();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    setShowPanel(false);
    
    // Navigate based on resource type
    // You can enhance this based on your routing structure
    if (notification.resourceType === "issue" || notification.resourceType === "pr") {
      // Navigate to the resource
      console.log("Navigate to:", notification.resourceType, notification.resourceId);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-bell" ref={panelRef}>
      <button
        className="bell-button"
        onClick={() => setShowPanel(!showPanel)}
        aria-label="Notifications"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16zM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A.75.75 0 0 1 14.122 12H1.878a.75.75 0 0 1-.623-1.359l1.703-2.555A.25.25 0 0 0 3 7.947V5z" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {showPanel && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
                disabled={loading}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.isRead ? "read" : "unread"}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {!notification.isRead && <div className="unread-indicator" />}
                  <div className="notification-content">
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{formatTimestamp(notification.createdAt)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-notifications">
                <p>No notifications</p>
              </div>
            )}
          </div>

          <div className="notification-footer">
            <button
              className="view-all-btn"
              onClick={() => {
                setShowPanel(false);
                navigate("/notifications");
              }}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
