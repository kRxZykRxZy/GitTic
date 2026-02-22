/**
 * Notification repository - manages user notifications using SQLite
 */

import { randomUUID } from "node:crypto";
import { getDb } from "../connection.js";

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  read: boolean;
  resourceType: string;
  resourceId: string;
  actorId?: string;
  createdAt: string;
}

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  read: number;
  resource_type: string;
  resource_id: string;
  actor_id: string | null;
  created_at: string;
}

/**
 * Map notification row to Notification
 */
function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body || undefined,
    read: row.read === 1,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    actorId: row.actor_id || undefined,
    createdAt: row.created_at,
  };
}

/**
 * Create a new notification
 */
export function createNotification(
  userId: string,
  type: string,
  title: string,
  resourceType: string,
  resourceId: string,
  body?: string,
  actorId?: string
): Notification {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  
  db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, body, resource_type, resource_id, actor_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, type, title, body || null, resourceType, resourceId, actorId || null, now);
  
  return getNotification(id)!;
}

/**
 * Get a notification by ID
 */
export function getNotification(id: string): Notification | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM notifications WHERE id = ?")
    .get(id) as NotificationRow | undefined;
  return row ? toNotification(row) : null;
}

/**
 * List notifications for a user
 */
export function listNotifications(
  userId: string,
  options: { unreadOnly?: boolean; limit?: number; offset?: number } = {}
): Notification[] {
  const db = getDb();
  const { unreadOnly = false, limit = 50, offset = 0 } = options;
  
  let query = "SELECT * FROM notifications WHERE user_id = ?";
  const params: unknown[] = [userId];
  
  if (unreadOnly) {
    query += " AND read = 0";
  }
  
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  
  const rows = db.prepare(query).all(...params) as NotificationRow[];
  return rows.map(toNotification);
}

/**
 * Count unread notifications for a user
 */
export function countUnreadNotifications(userId: string): number {
  const db = getDb();
  const result = db
    .prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0")
    .get(userId) as { count: number };
  return result.count;
}

/**
 * Mark a notification as read
 */
export function markAsRead(id: string): boolean {
  const db = getDb();
  const result = db.prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(id);
  return result.changes > 0;
}

/**
 * Mark all notifications as read for a user
 */
export function markAllAsRead(userId: string): number {
  const db = getDb();
  const result = db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0").run(userId);
  return result.changes;
}

/**
 * Delete a notification
 */
export function deleteNotification(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM notifications WHERE id = ?").run(id);
  return result.changes > 0;
}

/**
 * Delete all read notifications for a user
 */
export function deleteReadNotifications(userId: string): number {
  const db = getDb();
  const result = db.prepare("DELETE FROM notifications WHERE user_id = ? AND read = 1").run(userId);
  return result.changes;
}

/**
 * Parse @mentions from text and return unique usernames
 */
export function parseMentions(text: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const mentions = new Set<string>();
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.add(match[1]);
  }
  
  return Array.from(mentions);
}

/**
 * Create mention notifications for users mentioned in a comment
 */
export function createMentionNotifications(
  text: string,
  actorId: string,
  resourceType: string,
  resourceId: string,
  resourceTitle: string,
  getUserIdByUsername: (username: string) => string | null
): Notification[] {
  const mentions = parseMentions(text);
  const notifications: Notification[] = [];
  
  for (const username of mentions) {
    const userId = getUserIdByUsername(username);
    if (userId && userId !== actorId) {
      const notification = createNotification(
        userId,
        "mention",
        `You were mentioned in ${resourceType}`,
        resourceType,
        resourceId,
        `@${username} was mentioned in "${resourceTitle}"`,
        actorId
      );
      notifications.push(notification);
    }
  }
  
  return notifications;
}

export type { Notification };
