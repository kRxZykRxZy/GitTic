import { randomUUID } from "node:crypto";
import type { User, UserRole } from "@platform/shared";
import { getDb } from "../connection.js";

/** Row shape coming back from SQLite (snake_case). */
interface UserRow {
    id: string;
    username: string;
    email: string;
    password_hash: string;
    role: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    country: string | null;
    age_verified: number;
    terms_accepted: number;
    suspended: number;
    suspended_until: string | null;
    created_at: string;
    updated_at: string;
}

/** SSH key row from database. */
interface SSHKeyRow {
    id: string;
    user_id: string;
    title: string;
    key: string;
    fingerprint: string;
    created_at: string;
    last_used: string | null;
}

/** Email row from database. */
interface EmailRow {
    id: string;
    user_id: string;
    email: string;
    verified: number;
    primary: number;
    created_at: string;
}

/** SSH key data structure. */
export interface SSHKey {
    id: string;
    userId: string;
    title: string;
    key: string;
    fingerprint: string;
    createdAt: string;
    lastUsed?: string;
}

/** Email data structure. */
export interface Email {
    id: string;
    userId: string;
    email: string;
    verified: boolean;
    primary: boolean;
    createdAt: string;
}

/** User profile information. */
export interface UserProfile {
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    country?: string;
}

/** Map a database row to the shared User type. */
function toUser(row: UserRow): User {
    return {
        id: row.id,
        username: row.username,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role as UserRole,
        displayName: row.display_name ?? undefined,
        avatarUrl: row.avatar_url ?? undefined,
        bio: row.bio ?? undefined,
        suspended: row.suspended === 1,
        suspendedUntil: row.suspended_until ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

/** Map SSH key row to SSHKey type. */
function toSSHKey(row: SSHKeyRow): SSHKey {
    return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        key: row.key,
        fingerprint: row.fingerprint,
        createdAt: row.created_at,
        lastUsed: row.last_used ?? undefined,
    };
}

/** Map email row to Email type. */
function toEmail(row: EmailRow): Email {
    return {
        id: row.id,
        userId: row.user_id,
        email: row.email,
        verified: row.verified === 1,
        primary: row.primary === 1,
        createdAt: row.created_at,
    };
}

/** Fields accepted when creating a user. */
export interface CreateUserInput {
    username: string;
    email: string;
    passwordHash: string;
    role?: UserRole;
    displayName?: string;
    country?: string;
    ageVerified?: boolean;
    termsAccepted?: boolean;
}

/** Fields accepted when updating a user. */
export interface UpdateUserInput {
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    email?: string;
    country?: string;
}

/**
 * Create a new user.
 */
export function createUser(input: CreateUserInput): User {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
        `INSERT INTO users (
      id, username, email, password_hash, role, display_name, country, 
      age_verified, terms_accepted, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
        id,
        input.username,
        input.email,
        input.passwordHash,
        input.role || "user",
        input.displayName || null,
        input.country || null,
        input.ageVerified ? 1 : 0,
        input.termsAccepted ? 1 : 0,
        now,
        now,
    );

    return getUser(id)!;
}

/**
 * Get a user by ID.
 */
export function getUser(id: string): User | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
    return row ? toUser(row) : null;
}

/**
 * Find a user by username (case-insensitive).
 */
export function getUserByUsername(username: string): User | null {
    const db = getDb();
    const row = db
        .prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)")
        .get(username) as UserRow | undefined;
    return row ? toUser(row) : null;
}

/**
 * Find a user by email (case-insensitive).
 */
export function getUserByEmail(email: string): User | null {
    const db = getDb();
    const row = db
        .prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)")
        .get(email) as UserRow | undefined;
    return row ? toUser(row) : null;
}

/**
 * Update user fields.
 */
export function updateUser(id: string, input: UpdateUserInput): User | null {
    const db = getDb();
    const sets: string[] = [];
    const values: unknown[] = [];

    if (input.displayName !== undefined) { sets.push("display_name = ?"); values.push(input.displayName); }
    if (input.avatarUrl !== undefined) { sets.push("avatar_url = ?"); values.push(input.avatarUrl); }
    if (input.bio !== undefined) { sets.push("bio = ?"); values.push(input.bio); }
    if (input.email !== undefined) { sets.push("email = ?"); values.push(input.email); }
    if (input.country !== undefined) { sets.push("country = ?"); values.push(input.country); }

    if (sets.length === 0) return getUser(id);

    sets.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...values);
    return getUser(id);
}

/**
 * Delete a user by ID.
 */
export function deleteUser(id: string): boolean {
    const db = getDb();
    const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);
    return result.changes > 0;
}

/**
 * Get user profile information.
 */
export function getUserProfile(id: string): UserProfile | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
    if (!row) return null;

    return {
        displayName: row.display_name ?? undefined,
        avatarUrl: row.avatar_url ?? undefined,
        bio: row.bio ?? undefined,
        country: row.country ?? undefined,
    };
}

/**
 * Update user profile.
 */
export function updateUserProfile(id: string, profile: UserProfile): User | null {
    return updateUser(id, profile);
}

/**
 * Add an SSH key for a user.
 */
export function addSSHKey(userId: string, title: string, key: string, fingerprint: string): SSHKey {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
        `INSERT INTO ssh_keys (id, user_id, title, key, fingerprint, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, userId, title, key, fingerprint, now);

    return getSSHKey(id)!;
}

/**
 * Get an SSH key by ID.
 */
export function getSSHKey(id: string): SSHKey | null {
    const db = getDb();
    const row = db
        .prepare("SELECT * FROM ssh_keys WHERE id = ?")
        .get(id) as SSHKeyRow | undefined;
    return row ? toSSHKey(row) : null;
}

/**
 * List all SSH keys for a user.
 */
export function listSSHKeys(userId: string): SSHKey[] {
    const db = getDb();
    const rows = db
        .prepare("SELECT * FROM ssh_keys WHERE user_id = ? ORDER BY created_at DESC")
        .all(userId) as SSHKeyRow[];
    return rows.map(toSSHKey);
}

/**
 * Delete an SSH key.
 */
export function deleteSSHKey(id: string): boolean {
    const db = getDb();
    const result = db.prepare("DELETE FROM ssh_keys WHERE id = ?").run(id);
    return result.changes > 0;
}

/**
 * Update SSH key last used timestamp.
 */
export function updateSSHKeyLastUsed(id: string): boolean {
    const db = getDb();
    const result = db
        .prepare("UPDATE ssh_keys SET last_used = ? WHERE id = ?")
        .run(new Date().toISOString(), id);
    return result.changes > 0;
}

/**
 * Add an email address for a user.
 */
export function addEmail(userId: string, email: string, verified = false, primary = false): Email {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
        `INSERT INTO user_emails (id, user_id, email, verified, "primary", created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, userId, email, verified ? 1 : 0, primary ? 1 : 0, now);

    return getEmail(id)!;
}

/**
 * Get an email by ID.
 */
export function getEmail(id: string): Email | null {
    const db = getDb();
    const row = db
        .prepare("SELECT * FROM user_emails WHERE id = ?")
        .get(id) as EmailRow | undefined;
    return row ? toEmail(row) : null;
}

/**
 * List all emails for a user.
 */
export function listEmails(userId: string): Email[] {
    const db = getDb();
    const rows = db
        .prepare('SELECT * FROM user_emails WHERE user_id = ? ORDER BY "primary" DESC, created_at ASC')
        .all(userId) as EmailRow[];
    return rows.map(toEmail);
}

/**
 * Delete an email address.
 */
export function deleteEmail(id: string): boolean {
    const db = getDb();
    const result = db.prepare("DELETE FROM user_emails WHERE id = ?").run(id);
    return result.changes > 0;
}

/**
 * Mark an email as verified.
 */
export function verifyEmail(id: string): boolean {
    const db = getDb();
    const result = db
        .prepare("UPDATE user_emails SET verified = 1 WHERE id = ?")
        .run(id);
    return result.changes > 0;
}

/**
 * Set an email as primary.
 */
export function setPrimaryEmail(userId: string, emailId: string): boolean {
    const db = getDb();

    db.prepare('UPDATE user_emails SET "primary" = 0 WHERE user_id = ?').run(userId);

    const result = db
        .prepare('UPDATE user_emails SET "primary" = 1 WHERE id = ? AND user_id = ?')
        .run(emailId, userId);

    return result.changes > 0;
}
