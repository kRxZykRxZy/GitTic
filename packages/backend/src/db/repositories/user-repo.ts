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

/** Pagination options. */
export interface PaginationOpts {
  page: number;
  perPage: number;
}

/**
 * Create a new user.
 */
export function createUser(input: CreateUserInput): User {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO users (id, username, email, password_hash, role, display_name, country, age_verified, terms_accepted, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

  return findById(id)!;
}

/**
 * Find a user by ID.
 */
export function findById(id: string): User | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  return row ? toUser(row) : null;
}

/**
 * Find a user by username (case-insensitive).
 */
export function findByUsername(username: string): User | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)")
    .get(username) as UserRow | undefined;
  return row ? toUser(row) : null;
}

/**
 * Find a user by email (case-insensitive).
 */
export function findByEmail(email: string): User | null {
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

  if (sets.length === 0) return findById(id);

  sets.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return findById(id);
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
 * List users with pagination.
 */
export function listUsers(opts: PaginationOpts): User[] {
  const db = getDb();
  const offset = (opts.page - 1) * opts.perPage;
  const rows = db
    .prepare("SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .all(opts.perPage, offset) as UserRow[];
  return rows.map(toUser);
}

/**
 * Search users by username or display name.
 */
export function searchUsers(query: string, opts: PaginationOpts): User[] {
  const db = getDb();
  const offset = (opts.page - 1) * opts.perPage;
  const pattern = `%${query}%`;
  const rows = db
    .prepare(
      `SELECT * FROM users
       WHERE username LIKE ? OR display_name LIKE ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
    .all(pattern, pattern, opts.perPage, offset) as UserRow[];
  return rows.map(toUser);
}

/**
 * Count total number of users.
 */
export function countUsers(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) AS cnt FROM users").get() as { cnt: number };
  return row.cnt;
}

/**
 * Update a user's role.
 */
export function updateRole(id: string, role: UserRole): boolean {
  const db = getDb();
  const result = db
    .prepare("UPDATE users SET role = ?, updated_at = ? WHERE id = ?")
    .run(role, new Date().toISOString(), id);
  return result.changes > 0;
}

/**
 * Suspend a user until a given date (or indefinitely).
 */
export function suspendUser(id: string, until?: string): boolean {
  const db = getDb();
  const result = db
    .prepare("UPDATE users SET suspended = 1, suspended_until = ?, updated_at = ? WHERE id = ?")
    .run(until || null, new Date().toISOString(), id);
  return result.changes > 0;
}

/**
 * Ban a user (permanent suspension with no end date).
 */
export function banUser(id: string): boolean {
  return suspendUser(id);
}

/**
 * Returns true if no users exist in the database.
 * Used to determine if the first registered user should be admin.
 */
export function isFirstUser(): boolean {
  return countUsers() === 0;
}

export function addFollow(currentUserId: string, id: string) {
    throw new Error("Function not implemented.");
}
export function removeFollow(currentUserId: string, id: string) {
    throw new Error("Function not implemented.");
}

