/**
 * Backup recovery codes for multi-factor authentication.
 * Generates, hashes, validates, and tracks consumption of one-time
 * recovery codes that can be used when TOTP devices are unavailable.
 * @module mfa/backup-codes
 */

import { randomBytes, createHash } from "node:crypto";

/**
 * A single backup code entry with usage tracking.
 */
export interface BackupCodeEntry {
  /** SHA-256 hash of the backup code */
  codeHash: string;
  /** Whether this code has been used */
  used: boolean;
  /** Timestamp when the code was used, or null */
  usedAt: number | null;
}

/**
 * Result of generating backup codes.
 */
export interface BackupCodeGenerationResult {
  /** Plain-text codes to display to the user (shown only once) */
  plainCodes: string[];
  /** Hashed code entries for secure storage */
  hashedEntries: BackupCodeEntry[];
}

/**
 * Configuration for backup code generation.
 */
export interface BackupCodeConfig {
  /** Number of backup codes to generate (default: 10) */
  count?: number;
  /** Length of each code in characters (default: 8) */
  codeLength?: number;
  /** Character set to use for code generation */
  charset?: string;
  /** Whether to format codes with dashes for readability */
  formatWithDashes?: boolean;
  /** Group size for dash formatting (default: 4) */
  dashGroupSize?: number;
}

/**
 * Default backup code configuration.
 */
const DEFAULT_CONFIG: Required<BackupCodeConfig> = {
  count: 10,
  codeLength: 8,
  charset: "abcdefghjkmnpqrstuvwxyz23456789",
  formatWithDashes: true,
  dashGroupSize: 4,
};

/**
 * Hash a backup code using SHA-256 for secure storage.
 * @param code - Plain-text backup code (dashes are stripped before hashing)
 * @returns SHA-256 hex digest of the normalized code
 */
export function hashBackupCode(code: string): string {
  const normalized = code.replace(/-/g, "").toLowerCase().trim();
  return createHash("sha256").update(normalized).digest("hex");
}

/**
 * Generate a single random backup code.
 * @param length - Number of characters in the code
 * @param charset - Character set to use
 * @returns Random backup code string
 */
function generateSingleCode(length: number, charset: string): string {
  // Use rejection sampling to avoid modulo bias
  const charsetLen = charset.length;
  const maxValid = 256 - (256 % charsetLen);
  let code = "";
  let offset = 0;
  let bytes = randomBytes(length * 2);

  for (let i = 0; i < length; ) {
    if (offset >= bytes.length) {
      bytes = randomBytes(length * 2);
      offset = 0;
    }
    const byte = bytes[offset++];
    if (byte < maxValid) {
      code += charset[byte % charsetLen];
      i++;
    }
  }
  return code;
}

/**
 * Format a backup code with dashes for readability.
 * @param code - Raw backup code
 * @param groupSize - Number of characters per group
 * @returns Dash-formatted code (e.g., "abcd-efgh")
 */
export function formatBackupCode(code: string, groupSize: number = 4): string {
  const groups: string[] = [];
  for (let i = 0; i < code.length; i += groupSize) {
    groups.push(code.substring(i, i + groupSize));
  }
  return groups.join("-");
}

/**
 * Generate a set of backup recovery codes.
 * Returns both plain-text codes (to display to the user) and
 * hashed entries (for secure storage in the database).
 * @param config - Backup code configuration options
 * @returns Generation result with plain-text and hashed codes
 */
export function generateBackupCodes(
  config: BackupCodeConfig = {}
): BackupCodeGenerationResult {
  const {
    count = DEFAULT_CONFIG.count,
    codeLength = DEFAULT_CONFIG.codeLength,
    charset = DEFAULT_CONFIG.charset,
    formatWithDashes = DEFAULT_CONFIG.formatWithDashes,
    dashGroupSize = DEFAULT_CONFIG.dashGroupSize,
  } = config;

  const plainCodes: string[] = [];
  const hashedEntries: BackupCodeEntry[] = [];
  const seenHashes = new Set<string>();

  let generated = 0;
  while (generated < count) {
    const rawCode = generateSingleCode(codeLength, charset);
    const hash = hashBackupCode(rawCode);

    // Ensure uniqueness
    if (seenHashes.has(hash)) {
      continue;
    }
    seenHashes.add(hash);

    const displayCode = formatWithDashes
      ? formatBackupCode(rawCode, dashGroupSize)
      : rawCode;

    plainCodes.push(displayCode);
    hashedEntries.push({
      codeHash: hash,
      used: false,
      usedAt: null,
    });
    generated++;
  }

  return { plainCodes, hashedEntries };
}

/**
 * Validate a backup code against stored hashed entries.
 * If valid, marks the code as used (consumed).
 * @param code - Plain-text backup code entered by the user
 * @param entries - Array of stored backup code entries
 * @returns True if the code was valid and has been consumed
 */
export function validateBackupCode(
  code: string,
  entries: BackupCodeEntry[]
): boolean {
  const inputHash = hashBackupCode(code);

  for (const entry of entries) {
    if (entry.used) {
      continue;
    }

    // Constant-time comparison
    if (entry.codeHash.length !== inputHash.length) {
      continue;
    }
    let mismatch = 0;
    for (let i = 0; i < inputHash.length; i++) {
      mismatch |= entry.codeHash.charCodeAt(i) ^ inputHash.charCodeAt(i);
    }
    if (mismatch === 0) {
      entry.used = true;
      entry.usedAt = Date.now();
      return true;
    }
  }

  return false;
}

/**
 * Get the number of remaining (unused) backup codes.
 * @param entries - Array of stored backup code entries
 * @returns Count of unused codes
 */
export function getRemainingCodeCount(entries: BackupCodeEntry[]): number {
  return entries.filter((e) => !e.used).length;
}

/**
 * Check if the user should be warned about low backup code count.
 * @param entries - Array of stored backup code entries
 * @param threshold - Warning threshold (default: 3)
 * @returns True if remaining codes are at or below threshold
 */
export function shouldWarnLowCodes(
  entries: BackupCodeEntry[],
  threshold: number = 3
): boolean {
  return getRemainingCodeCount(entries) <= threshold;
}

/**
 * Check if all backup codes have been consumed.
 * @param entries - Array of stored backup code entries
 * @returns True if no unused codes remain
 */
export function allCodesConsumed(entries: BackupCodeEntry[]): boolean {
  return getRemainingCodeCount(entries) === 0;
}

/**
 * Get usage statistics for backup codes.
 * @param entries - Array of stored backup code entries
 * @returns Statistics object with total, used, remaining, and last used timestamp
 */
export function getBackupCodeStats(entries: BackupCodeEntry[]): {
  total: number;
  used: number;
  remaining: number;
  lastUsedAt: number | null;
} {
  const used = entries.filter((e) => e.used);
  const lastUsed = used.reduce<number | null>((latest, entry) => {
    if (entry.usedAt === null) return latest;
    if (latest === null) return entry.usedAt;
    return entry.usedAt > latest ? entry.usedAt : latest;
  }, null);

  return {
    total: entries.length,
    used: used.length,
    remaining: entries.length - used.length,
    lastUsedAt: lastUsed,
  };
}
