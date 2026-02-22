/**
 * Scoped API token management.
 * Provides creation, validation, revocation, listing, and
 * scope-based access control for API tokens with expiry support.
 * @module tokens/api-token
 */

import { randomBytes, createHash, createHmac } from "node:crypto";

/**
 * API token scope categories.
 */
export type ApiTokenScope =
  | "read:user"
  | "write:user"
  | "read:repos"
  | "write:repos"
  | "delete:repos"
  | "read:orgs"
  | "write:orgs"
  | "admin:all"
  | "read:pipelines"
  | "write:pipelines"
  | "read:clusters"
  | "write:clusters";

/**
 * Stored API token record.
 */
export interface ApiTokenRecord {
  /** Unique token ID */
  id: string;
  /** User ID that owns this token */
  userId: string;
  /** Human-readable name/label for the token */
  name: string;
  /** SHA-256 hash of the token string */
  tokenHash: string;
  /** First 8 characters of the token for identification */
  tokenPrefix: string;
  /** Scopes granted to this token */
  scopes: ApiTokenScope[];
  /** Creation timestamp */
  createdAt: number;
  /** Expiration timestamp (null for no expiry) */
  expiresAt: number | null;
  /** Last used timestamp */
  lastUsedAt: number | null;
  /** Whether the token has been revoked */
  revoked: boolean;
  /** Revocation timestamp */
  revokedAt: number | null;
}

/**
 * Result of creating a new API token.
 */
export interface ApiTokenCreateResult {
  /** The plain-text token (shown only once) */
  plainToken: string;
  /** The stored token record */
  record: ApiTokenRecord;
}

/**
 * Options for creating an API token.
 */
export interface CreateApiTokenOptions {
  /** User ID that owns the token */
  userId: string;
  /** Human-readable name for the token */
  name: string;
  /** Scopes to grant */
  scopes: ApiTokenScope[];
  /** Expiry duration in milliseconds (null for no expiry) */
  expiresInMs?: number | null;
}

/**
 * Token prefix used to identify API tokens.
 */
const TOKEN_PREFIX = "plat_";

/**
 * Hash an API token for secure storage.
 * @param token - Plain-text token
 * @returns SHA-256 hex hash
 */
export function hashApiToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Generate a new API token string.
 * @returns Randomly generated token with platform prefix
 */
export function generateApiTokenString(): string {
  const random = randomBytes(32).toString("hex");
  return `${TOKEN_PREFIX}${random}`;
}

/**
 * Create a new scoped API token.
 * @param options - Token creation options
 * @returns The plain-text token (shown once) and the record for storage
 */
export function createApiToken(
  options: CreateApiTokenOptions
): ApiTokenCreateResult {
  const plainToken = generateApiTokenString();
  const tokenHash = hashApiToken(plainToken);
  const tokenPrefix = plainToken.substring(0, TOKEN_PREFIX.length + 8);
  const now = Date.now();

  const record: ApiTokenRecord = {
    id: randomBytes(16).toString("hex"),
    userId: options.userId,
    name: options.name,
    tokenHash,
    tokenPrefix,
    scopes: [...options.scopes],
    createdAt: now,
    expiresAt:
      options.expiresInMs != null ? now + options.expiresInMs : null,
    lastUsedAt: null,
    revoked: false,
    revokedAt: null,
  };

  return { plainToken, record };
}

/**
 * Validate an API token against stored records.
 * @param plainToken - The plain-text token to validate
 * @param records - Array of stored token records to check against
 * @returns The matching record or null if invalid
 */
export function validateApiToken(
  plainToken: string,
  records: ApiTokenRecord[]
): ApiTokenRecord | null {
  const inputHash = hashApiToken(plainToken);

  for (const record of records) {
    if (record.revoked) {
      continue;
    }

    // Check expiry
    if (record.expiresAt !== null && Date.now() > record.expiresAt) {
      continue;
    }

    // Constant-time hash comparison
    if (record.tokenHash.length !== inputHash.length) {
      continue;
    }
    let mismatch = 0;
    for (let i = 0; i < inputHash.length; i++) {
      mismatch |= record.tokenHash.charCodeAt(i) ^ inputHash.charCodeAt(i);
    }
    if (mismatch === 0) {
      record.lastUsedAt = Date.now();
      return record;
    }
  }

  return null;
}

/**
 * Check if a token has a specific scope.
 * @param record - API token record
 * @param scope - Scope to check
 * @returns True if the token has the scope or admin:all
 */
export function tokenHasScope(
  record: ApiTokenRecord,
  scope: ApiTokenScope
): boolean {
  if (record.scopes.includes("admin:all")) {
    return true;
  }
  return record.scopes.includes(scope);
}

/**
 * Check if a token has all of the specified scopes.
 * @param record - API token record
 * @param scopes - Array of scopes to check
 * @returns True if the token has all scopes
 */
export function tokenHasAllScopes(
  record: ApiTokenRecord,
  scopes: ApiTokenScope[]
): boolean {
  return scopes.every((scope) => tokenHasScope(record, scope));
}

/**
 * Revoke an API token.
 * @param record - Token record to revoke
 */
export function revokeApiToken(record: ApiTokenRecord): void {
  record.revoked = true;
  record.revokedAt = Date.now();
}

/**
 * List active (non-revoked, non-expired) tokens for a user.
 * @param records - All token records
 * @param userId - User ID to filter by
 * @returns Active tokens for the user
 */
export function listActiveTokens(
  records: ApiTokenRecord[],
  userId: string
): ApiTokenRecord[] {
  const now = Date.now();
  return records.filter(
    (r) =>
      r.userId === userId &&
      !r.revoked &&
      (r.expiresAt === null || r.expiresAt > now)
  );
}

/**
 * Revoke all tokens for a user.
 * @param records - All token records
 * @param userId - User ID whose tokens should be revoked
 * @returns Number of tokens revoked
 */
export function revokeAllUserTokens(
  records: ApiTokenRecord[],
  userId: string
): number {
  let count = 0;
  for (const record of records) {
    if (record.userId === userId && !record.revoked) {
      revokeApiToken(record);
      count++;
    }
  }
  return count;
}

/**
 * Check if a token string looks like a valid API token format.
 * @param token - String to validate
 * @returns True if the token matches the expected format
 */
export function isValidApiTokenFormat(token: string): boolean {
  if (!token.startsWith(TOKEN_PREFIX)) {
    return false;
  }
  const random = token.substring(TOKEN_PREFIX.length);
  return /^[a-f0-9]{64}$/.test(random);
}
