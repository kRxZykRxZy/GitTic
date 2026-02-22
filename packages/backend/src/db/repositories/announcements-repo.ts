import { randomUUID } from "node:crypto";
import { getDb } from "../connection.js";

/** Announcement type */
export type AnnouncementType = "info" | "warning" | "critical";

/** Announcement entity */
export interface Announcement {
    id: string;
    title: string;
    body: string;
    type: AnnouncementType;
    active: boolean;
    createdBy: string;
    createdAt: string;
    expiresAt?: string;
}

/**
 * Get all active announcements.
 */
export function getActiveAnnouncements(): Announcement[] {
    const db = getDb();
    const now = new Date().toISOString();

    const rows = db
        .prepare(
            `
      SELECT 
        id, title, body, type, active, 
        created_by as createdBy, created_at as createdAt, expires_at as expiresAt
      FROM announcements
      WHERE active = 1 
        AND (expires_at IS NULL OR expires_at > ?)
      ORDER BY created_at DESC
    `,
        )
        .all(now) as Announcement[];

    return rows;
}

/**
 * Get an announcement by ID.
 */
export function getAnnouncementById(id: string): Announcement | null {
    const db = getDb();

    const row = db
        .prepare(
            `
      SELECT 
        id, title, body, type, active, 
        created_by as createdBy, created_at as createdAt, expires_at as expiresAt
      FROM announcements
      WHERE id = ?
    `,
        )
        .get(id) as Announcement | undefined;

    return row || null;
}

/**
 * Create a new announcement.
 */
export function createAnnouncement(
    title: string,
    body: string,
    type: AnnouncementType,
    createdBy: string,
    expiresAt?: string,
): Announcement {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
        `
    INSERT INTO announcements (id, title, body, type, active, created_by, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    ).run(id, title, body, type, 1, createdBy, now, expiresAt || null);

    return {
        id,
        title,
        body,
        type,
        active: true,
        createdBy,
        createdAt: now,
        expiresAt,
    };
}

/**
 * Update an announcement.
 */
export function updateAnnouncement(
    id: string,
    updates: Partial<Omit<Announcement, "id" | "createdAt" | "createdBy">>,
): boolean {
    const db = getDb();

    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (updates.title !== undefined) {
        setClauses.push("title = ?");
        values.push(updates.title);
    }
    if (updates.body !== undefined) {
        setClauses.push("body = ?");
        values.push(updates.body);
    }
    if (updates.type !== undefined) {
        setClauses.push("type = ?");
        values.push(updates.type);
    }
    if (updates.active !== undefined) {
        setClauses.push("active = ?");
        values.push(updates.active ? 1 : 0);
    }
    if (updates.expiresAt !== undefined) {
        setClauses.push("expires_at = ?");
        values.push(updates.expiresAt);
    }

    if (setClauses.length === 0) return false;

    values.push(id);

    const stmt = db.prepare(`
    UPDATE announcements
    SET ${setClauses.join(", ")}
    WHERE id = ?
  `);

    const result = stmt.run(...values);
    return result.changes > 0;
}

/**
 * Delete (deactivate) an announcement.
 */
export function deleteAnnouncement(id: string): boolean {
    const db = getDb();

    const result = db.prepare("UPDATE announcements SET active = 0 WHERE id = ?").run(id);

    return result.changes > 0;
}

/**
 * Count active announcements.
 */
export function countActiveAnnouncements(): number {
    const db = getDb();
    const now = new Date().toISOString();

    const result = db
        .prepare(
            `
    SELECT COUNT(*) as count
    FROM announcements
    WHERE active = 1 
      AND (expires_at IS NULL OR expires_at > ?)
  `,
        )
        .get(now) as { count: number };

    return result.count;
}

/**
 * Get all announcements (including inactive) for admin views.
 */
export function getAllAnnouncements(): Announcement[] {
    const db = getDb();

    const rows = db
        .prepare(
            `
      SELECT 
        id, title, body, type, active, 
        created_by as createdBy, created_at as createdAt, expires_at as expiresAt
      FROM announcements
      ORDER BY created_at DESC
    `,
        )
        .all() as Announcement[];

    return rows;
}
