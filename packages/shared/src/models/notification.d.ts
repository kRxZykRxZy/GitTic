/**
 * Notification types for in-app and push notification systems.
 * @module models/notification
 */
/**
 * Channels through which a notification can be delivered.
 */
export type NotificationChannel = "in_app" | "email" | "push" | "sms" | "webhook";
/**
 * Priority levels for notifications.
 */
export type NotificationPriority = "low" | "normal" | "high" | "urgent";
/**
 * Read status of a notification.
 */
export type NotificationStatus = "unread" | "read" | "archived" | "dismissed";
/**
 * A notification delivered to a user.
 */
export interface Notification {
    /** Unique identifier for the notification. */
    id: string;
    /** ID of the user who receives the notification. */
    recipientId: string;
    /** Category of the notification. */
    category: NotificationCategory;
    /** Short title displayed in notification lists. */
    title: string;
    /** Full notification body. */
    body: string;
    /** Priority level. */
    priority: NotificationPriority;
    /** Current read status. */
    status: NotificationStatus;
    /** Channels this notification was sent through. */
    channels: NotificationChannel[];
    /** Optional deep link URL for the notification action. */
    actionUrl?: string;
    /** Optional icon identifier. */
    icon?: string;
    /** Arbitrary metadata attached to the notification. */
    metadata?: Record<string, unknown>;
    /** ISO-8601 creation timestamp. */
    createdAt: string;
    /** ISO-8601 timestamp when the notification was read. */
    readAt?: string;
    /** ISO-8601 timestamp when the notification expires. */
    expiresAt?: string;
}
/**
 * Categories grouping related notification types.
 */
export type NotificationCategory = "system" | "security" | "project" | "pipeline" | "deployment" | "collaboration" | "billing" | "mention" | "review" | "alert";
/**
 * User preferences controlling notification delivery.
 */
export interface NotificationPreferences {
    /** ID of the user these preferences belong to. */
    userId: string;
    /** Whether notifications are globally enabled. */
    enabled: boolean;
    /** Per-category channel preferences. */
    categorySettings: NotificationCategorySetting[];
    /** Quiet hours during which non-urgent notifications are held. */
    quietHours?: QuietHoursConfig;
}
/**
 * Per-category notification channel preferences.
 */
export interface NotificationCategorySetting {
    /** The category these settings apply to. */
    category: NotificationCategory;
    /** Whether this category is enabled. */
    enabled: boolean;
    /** Channels to deliver notifications in this category. */
    channels: NotificationChannel[];
}
/**
 * Configuration for quiet hours when notifications are suppressed.
 */
export interface QuietHoursConfig {
    /** Whether quiet hours are enabled. */
    enabled: boolean;
    /** Start time in HH:mm format (24-hour). */
    startTime: string;
    /** End time in HH:mm format (24-hour). */
    endTime: string;
    /** IANA timezone identifier (e.g., "America/New_York"). */
    timezone: string;
}
//# sourceMappingURL=notification.d.ts.map