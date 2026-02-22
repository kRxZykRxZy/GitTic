/**
 * Refresh token management with rotation and reuse detection.
 * Implements refresh token families for detecting token theft via
 * automatic reuse detection.
 * @module tokens/refresh-token
 */

import { randomBytes, createHash } from "node:crypto";

/**
 * Stored refresh token record.
 */
export interface RefreshTokenRecord {
  /** Unique token ID */
  id: string;
  /** SHA-256 hash of the token string */
  tokenHash: string;
  /** User ID this token belongs to */
  userId: string;
  /** Token family ID for rotation tracking */
  familyId: string;
  /** Generation number within the family (increments on rotation) */
  generation: number;
  /** Creation timestamp */
  createdAt: number;
  /** Expiration timestamp */
  expiresAt: number;
  /** Whether this token has been used (rotated) */
  used: boolean;
  /** When this token was used */
  usedAt: number | null;
  /** Whether this token has been revoked */
  revoked: boolean;
  /** IP address that created/used this token */
  ipAddress: string | null;
  /** User agent that created/used this token */
  userAgent: string | null;
}

/**
 * Result of generating a new refresh token.
 */
export interface RefreshTokenResult {
  /** Plain-text token (sent to client) */
  plainToken: string;
  /** Token record for storage */
  record: RefreshTokenRecord;
}

/**
 * Result of rotating a refresh token.
 */
export interface RefreshTokenRotationResult {
  /** New plain-text refresh token */
  newPlainToken: string;
  /** New token record */
  newRecord: RefreshTokenRecord;
  /** Whether reuse was detected (old token already used) */
  reuseDetected: boolean;
}

/**
 * Configuration for refresh token management.
 */
export interface RefreshTokenConfig {
  /** Token lifetime in milliseconds (default: 30 days) */
  lifetimeMs?: number;
  /** Maximum number of tokens per family before forced rotation */
  maxGenerations?: number;
  /** Prefix for token strings */
  tokenPrefix?: string;
}

/**
 * Default refresh token configuration.
 */
const DEFAULTS: Required<RefreshTokenConfig> = {
  lifetimeMs: 30 * 24 * 60 * 60 * 1000,
  maxGenerations: 50,
  tokenPrefix: "rt_",
};

/**
 * Hash a refresh token for secure storage.
 * @param token - Plain-text refresh token
 * @returns SHA-256 hex hash
 */
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Generate a new token family ID.
 * @returns Random family ID
 */
export function generateFamilyId(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Generate a new refresh token.
 * @param userId - User ID the token belongs to
 * @param config - Token configuration
 * @param ipAddress - Optional IP address
 * @param userAgent - Optional user agent
 * @returns Plain-text token and record for storage
 */
export function generateRefreshToken(
  userId: string,
  config: RefreshTokenConfig = {},
  ipAddress?: string,
  userAgent?: string
): RefreshTokenResult {
  const prefix = config.tokenPrefix ?? DEFAULTS.tokenPrefix;
  const lifetime = config.lifetimeMs ?? DEFAULTS.lifetimeMs;
  const plainToken = `${prefix}${randomBytes(32).toString("hex")}`;
  const now = Date.now();

  const record: RefreshTokenRecord = {
    id: randomBytes(16).toString("hex"),
    tokenHash: hashRefreshToken(plainToken),
    userId,
    familyId: generateFamilyId(),
    generation: 1,
    createdAt: now,
    expiresAt: now + lifetime,
    used: false,
    usedAt: null,
    revoked: false,
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
  };

  return { plainToken, record };
}

/**
 * Rotate a refresh token: consume the old one and issue a new one.
 * If the old token has already been used (reuse detected), all tokens
 * in the family should be revoked as a security measure.
 * @param plainToken - The current refresh token being presented
 * @param records - All stored refresh token records
 * @param config - Token configuration
 * @param ipAddress - Optional IP address of the requester
 * @param userAgent - Optional user agent of the requester
 * @returns Rotation result or null if token is invalid
 */
export function rotateRefreshToken(
  plainToken: string,
  records: RefreshTokenRecord[],
  config: RefreshTokenConfig = {},
  ipAddress?: string,
  userAgent?: string
): RefreshTokenRotationResult | null {
  const inputHash = hashRefreshToken(plainToken);
  const prefix = config.tokenPrefix ?? DEFAULTS.tokenPrefix;
  const lifetime = config.lifetimeMs ?? DEFAULTS.lifetimeMs;
  const maxGen = config.maxGenerations ?? DEFAULTS.maxGenerations;

  // Find the matching record
  const currentRecord = records.find((r) => {
    if (r.tokenHash.length !== inputHash.length) return false;
    let mismatch = 0;
    for (let i = 0; i < inputHash.length; i++) {
      mismatch |= r.tokenHash.charCodeAt(i) ^ inputHash.charCodeAt(i);
    }
    return mismatch === 0;
  });

  if (!currentRecord) {
    return null;
  }

  // Check if revoked
  if (currentRecord.revoked) {
    return null;
  }

  // Check if expired
  if (Date.now() > currentRecord.expiresAt) {
    return null;
  }

  // Detect reuse: if this token was already used, it's a potential theft
  const reuseDetected = currentRecord.used;

  if (reuseDetected) {
    // Revoke entire family
    revokeFamilyTokens(records, currentRecord.familyId);
    return {
      newPlainToken: "",
      newRecord: currentRecord,
      reuseDetected: true,
    };
  }

  // Mark current token as used
  currentRecord.used = true;
  currentRecord.usedAt = Date.now();

  // Check max generations
  if (currentRecord.generation >= maxGen) {
    revokeFamilyTokens(records, currentRecord.familyId);
    return null;
  }

  // Generate new token in the same family
  const now = Date.now();
  const newPlainToken = `${prefix}${randomBytes(32).toString("hex")}`;
  const newRecord: RefreshTokenRecord = {
    id: randomBytes(16).toString("hex"),
    tokenHash: hashRefreshToken(newPlainToken),
    userId: currentRecord.userId,
    familyId: currentRecord.familyId,
    generation: currentRecord.generation + 1,
    createdAt: now,
    expiresAt: now + lifetime,
    used: false,
    usedAt: null,
    revoked: false,
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
  };

  return { newPlainToken, newRecord, reuseDetected: false };
}

/**
 * Revoke all tokens in a token family.
 * @param records - All stored refresh token records
 * @param familyId - Family ID to revoke
 * @returns Number of tokens revoked
 */
export function revokeFamilyTokens(
  records: RefreshTokenRecord[],
  familyId: string
): number {
  let count = 0;
  for (const record of records) {
    if (record.familyId === familyId && !record.revoked) {
      record.revoked = true;
      count++;
    }
  }
  return count;
}

/**
 * Revoke all refresh tokens for a user.
 * @param records - All stored refresh token records
 * @param userId - User ID to revoke tokens for
 * @returns Number of tokens revoked
 */
export function revokeUserRefreshTokens(
  records: RefreshTokenRecord[],
  userId: string
): number {
  let count = 0;
  for (const record of records) {
    if (record.userId === userId && !record.revoked) {
      record.revoked = true;
      count++;
    }
  }
  return count;
}

/**
 * Clean up expired refresh tokens.
 * @param records - All stored refresh token records
 * @returns Array of records with expired ones removed
 */
export function cleanupExpiredRefreshTokens(
  records: RefreshTokenRecord[]
): RefreshTokenRecord[] {
  const now = Date.now();
  return records.filter((r) => r.expiresAt > now && !r.revoked);
}

/**
 * Get active refresh token families for a user.
 * @param records - All stored refresh token records
 * @param userId - User ID to look up
 * @returns Map of family IDs to their latest generation record
 */
export function getActiveTokenFamilies(
  records: RefreshTokenRecord[],
  userId: string
): Map<string, RefreshTokenRecord> {
  const families = new Map<string, RefreshTokenRecord>();
  const now = Date.now();

  for (const record of records) {
    if (
      record.userId === userId &&
      !record.revoked &&
      record.expiresAt > now
    ) {
      const existing = families.get(record.familyId);
      if (!existing || record.generation > existing.generation) {
        families.set(record.familyId, record);
      }
    }
  }

  return families;
}
