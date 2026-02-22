import { broadcastAll } from "./websocket-gateway.js";

/**
 * In-app notification service.
 *
 * Creates, stores, and delivers notifications for platform events
 * such as build completions, mentions, pull request activity, and
 * system announcements. Supports real-time delivery via WebSocket
 * and polling via REST API.
 */

/** Notification priority levels. */
export type NotificationLevel = "info" | "success" | "warning" | "error";

/** Notification event types. */
export type NotificationEvent =
  | "build.complete"
  | "build.failed"
  | "pr.opened"
  | "pr.merged"
  | "pr.review_requested"
  | "mention"
  | "org.invite"
  | "system.announcement"
  | "report.resolved"
  | "project.forked"
  | "project.starred";

/** A single notification entry. */
export interface Notification {
  id: string;
  userId: string;
  event: NotificationEvent;
  level: NotificationLevel;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

/** Input for creating a notification. */
export interface CreateNotificationInput {
  userId: string;
  event: NotificationEvent;
  level?: NotificationLevel;
  title: string;
  message: string;
  link?: string;
}

/** In-memory notification store (keyed by user ID). */
const _store = new Map<string, Notification[]>();

/** Auto-incrementing ID counter. */
let _nextId = 1;

/** Maximum notifications kept per user. */
const MAX_PER_USER = 500;

/**
 * Create a new notification and optionally push it in real-time
 * via the WebSocket gateway.
 *
 * @param input - Notification details.
 * @returns The created notification.
 */
export function createNotification(input: CreateNotificationInput): Notification {
  const notification: Notification = {
    id: String(_nextId++),
    userId: input.userId,
    event: input.event,
    level: input.level ?? "info",
    title: input.title,
    message: input.message,
    link: input.link,
    read: false,
    createdAt: new Date().toISOString(),
  };

  // Store in memory
  if (!_store.has(input.userId)) {
    _store.set(input.userId, []);
  }

  const userNotifications = _store.get(input.userId)!;
  userNotifications.unshift(notification);

  // Evict old notifications
  if (userNotifications.length > MAX_PER_USER) {
    userNotifications.splice(MAX_PER_USER);
  }

  // Push via WebSocket (fire-and-forget)
  try {
    broadcastAll({
      type: "notification",
      targetUserId: input.userId,
      notification,
    });
  } catch {
    // WebSocket may not be initialised during startup
  }

  return notification;
}

/**
 * List notifications for a user with optional pagination
 * and unread-only filtering.
 *
 * @param userId  - The user to list notifications for.
 * @param options - Filtering and pagination options.
 * @returns Array of notifications.
 */
export function listNotifications(
  userId: string,
  options: {
    page?: number;
    perPage?: number;
    unreadOnly?: boolean;
  } = {},
): Notification[] {
  const all = _store.get(userId) ?? [];
  const page = options.page ?? 1;
  const perPage = options.perPage ?? 20;

  let filtered = all;
  if (options.unreadOnly) {
    filtered = all.filter((n) => !n.read);
  }

  const start = (page - 1) * perPage;
  return filtered.slice(start, start + perPage);
}

/**
 * Get the count of unread notifications for a user.
 *
 * @param userId - The user ID.
 * @returns Number of unread notifications.
 */
export function getUnreadCount(userId: string): number {
  const all = _store.get(userId) ?? [];
  return all.filter((n) => !n.read).length;
}

/**
 * Mark a specific notification as read.
 *
 * @param userId         - The user who owns the notification.
 * @param notificationId - The notification ID to mark.
 * @returns true if the notification was found and marked.
 */
export function markAsRead(userId: string, notificationId: string): boolean {
  const all = _store.get(userId);
  if (!all) return false;

  const notification = all.find((n) => n.id === notificationId);
  if (!notification) return false;

  notification.read = true;
  return true;
}

/**
 * Mark all notifications as read for a user.
 *
 * @param userId - The user ID.
 * @returns Number of notifications marked as read.
 */
export function markAllAsRead(userId: string): number {
  const all = _store.get(userId);
  if (!all) return 0;

  let count = 0;
  for (const n of all) {
    if (!n.read) {
      n.read = true;
      count++;
    }
  }
  return count;
}

/**
 * Delete a specific notification.
 *
 * @param userId         - The user who owns the notification.
 * @param notificationId - The notification ID to delete.
 * @returns true if the notification was found and deleted.
 */
export function deleteNotification(userId: string, notificationId: string): boolean {
  const all = _store.get(userId);
  if (!all) return false;

  const idx = all.findIndex((n) => n.id === notificationId);
  if (idx === -1) return false;

  all.splice(idx, 1);
  return true;
}

/**
 * Convenience: send a build completion notification.
 */
export function notifyBuildComplete(
  userId: string,
  projectName: string,
  success: boolean,
  runId: string,
): Notification {
  return createNotification({
    userId,
    event: success ? "build.complete" : "build.failed",
    level: success ? "success" : "error",
    title: success ? "Build Succeeded" : "Build Failed",
    message: `Pipeline run for ${projectName} ${success ? "completed successfully" : "failed"}.`,
    link: `/pipelines/${runId}`,
  });
}

/**
 * Convenience: send a mention notification.
 */
export function notifyMention(
  userId: string,
  mentionedBy: string,
  context: string,
  link: string,
): Notification {
  return createNotification({
    userId,
    event: "mention",
    level: "info",
    title: "You were mentioned",
    message: `${mentionedBy} mentioned you in ${context}.`,
    link,
  });
}
