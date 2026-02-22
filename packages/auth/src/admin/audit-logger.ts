/**
 * Auth audit logging for security-relevant events.
 * Records login, logout, role changes, suspensions, and other
 * authentication events with IP, user agent, and timestamps.
 * @module admin/audit-logger
 */

import type { UserRole } from "@platform/shared";

/**
 * Types of auditable authentication events.
 */
export type AuditEventType =
  | "login_success"
  | "login_failure"
  | "logout"
  | "token_refresh"
  | "password_change"
  | "password_reset_request"
  | "password_reset_complete"
  | "mfa_enabled"
  | "mfa_disabled"
  | "mfa_verified"
  | "mfa_failed"
  | "role_changed"
  | "user_suspended"
  | "user_unsuspended"
  | "user_banned"
  | "user_unbanned"
  | "user_deleted"
  | "user_created"
  | "api_token_created"
  | "api_token_revoked"
  | "session_invalidated"
  | "oauth_login"
  | "oauth_link"
  | "account_locked"
  | "account_unlocked";

/**
 * Severity level for audit events.
 */
export type AuditSeverity = "info" | "warning" | "critical";

/**
 * An audit log entry.
 */
export interface AuditEntry {
  /** Unique entry ID */
  id: string;
  /** Type of event */
  eventType: AuditEventType;
  /** Severity level */
  severity: AuditSeverity;
  /** User ID that performed or was affected by the action */
  userId: string;
  /** User ID of the actor (admin who performed the action, if different) */
  actorId: string | null;
  /** IP address of the client */
  ipAddress: string;
  /** User agent string */
  userAgent: string;
  /** Event timestamp */
  timestamp: number;
  /** Additional details about the event */
  details: Record<string, unknown>;
  /** Resource type affected */
  resource: string;
  /** Resource ID affected */
  resourceId: string;
}

/**
 * Audit log query options.
 */
export interface AuditQueryOptions {
  /** Filter by user ID */
  userId?: string;
  /** Filter by actor ID */
  actorId?: string;
  /** Filter by event type */
  eventType?: AuditEventType;
  /** Filter by severity */
  severity?: AuditSeverity;
  /** Filter events after this timestamp */
  after?: number;
  /** Filter events before this timestamp */
  before?: number;
  /** Filter by IP address */
  ipAddress?: string;
  /** Maximum number of entries to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Sort order */
  sortOrder?: "asc" | "desc";
}

/**
 * Audit log statistics.
 */
export interface AuditStats {
  /** Total entries */
  totalEntries: number;
  /** Entries by event type */
  byEventType: Record<string, number>;
  /** Entries by severity */
  bySeverity: Record<string, number>;
  /** Most recent entry timestamp */
  lastEntryAt: number | null;
  /** Unique users in the log */
  uniqueUsers: number;
  /** Unique IP addresses */
  uniqueIps: number;
}

/**
 * Map event types to their default severity.
 */
const EVENT_SEVERITY: Record<AuditEventType, AuditSeverity> = {
  login_success: "info",
  login_failure: "warning",
  logout: "info",
  token_refresh: "info",
  password_change: "info",
  password_reset_request: "info",
  password_reset_complete: "info",
  mfa_enabled: "info",
  mfa_disabled: "warning",
  mfa_verified: "info",
  mfa_failed: "warning",
  role_changed: "warning",
  user_suspended: "warning",
  user_unsuspended: "info",
  user_banned: "critical",
  user_unbanned: "warning",
  user_deleted: "critical",
  user_created: "info",
  api_token_created: "info",
  api_token_revoked: "info",
  session_invalidated: "info",
  oauth_login: "info",
  oauth_link: "info",
  account_locked: "critical",
  account_unlocked: "warning",
};

/**
 * Counter for generating unique audit entry IDs.
 */
let entryCounter = 0;

/**
 * Generate a unique audit entry ID.
 * @returns Unique ID string
 */
function generateEntryId(): string {
  entryCounter++;
  return `audit_${Date.now().toString(36)}_${entryCounter.toString(36)}`;
}

/**
 * Auth audit logger that records security-relevant events.
 */
export class AuditLogger {
  private readonly entries: AuditEntry[] = [];
  private readonly maxEntries: number;

  /**
   * Create a new audit logger.
   * @param maxEntries - Maximum number of entries to retain in memory
   */
  constructor(maxEntries: number = 10000) {
    this.maxEntries = maxEntries;
  }

  /**
   * Log an audit event.
   * @param eventType - Type of event
   * @param userId - Affected user ID
   * @param ipAddress - Client IP address
   * @param userAgent - Client user agent
   * @param details - Additional event details
   * @param actorId - Admin/actor who performed the action (if different)
   * @returns The created audit entry
   */
  log(
    eventType: AuditEventType,
    userId: string,
    ipAddress: string,
    userAgent: string,
    details: Record<string, unknown> = {},
    actorId?: string
  ): AuditEntry {
    const entry: AuditEntry = {
      id: generateEntryId(),
      eventType,
      severity: EVENT_SEVERITY[eventType] ?? "info",
      userId,
      actorId: actorId ?? null,
      ipAddress,
      userAgent,
      timestamp: Date.now(),
      details,
      resource: "user",
      resourceId: userId,
    };

    this.entries.push(entry);

    // Enforce max entries
    while (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    return entry;
  }

  /**
   * Log a successful login event.
   * @param userId - User ID
   * @param ipAddress - Client IP
   * @param userAgent - Client user agent
   * @param method - Login method (e.g., "password", "oauth", "api_token")
   * @returns Audit entry
   */
  logLogin(
    userId: string,
    ipAddress: string,
    userAgent: string,
    method: string = "password"
  ): AuditEntry {
    return this.log("login_success", userId, ipAddress, userAgent, {
      method,
    });
  }

  /**
   * Log a failed login attempt.
   * @param userId - Attempted user ID (may not exist)
   * @param ipAddress - Client IP
   * @param userAgent - Client user agent
   * @param reason - Failure reason
   * @returns Audit entry
   */
  logFailedLogin(
    userId: string,
    ipAddress: string,
    userAgent: string,
    reason: string
  ): AuditEntry {
    return this.log("login_failure", userId, ipAddress, userAgent, {
      reason,
    });
  }

  /**
   * Log a role change event.
   * @param userId - Affected user ID
   * @param oldRole - Previous role
   * @param newRole - New role
   * @param actorId - Admin who changed the role
   * @param ipAddress - Admin's IP
   * @param userAgent - Admin's user agent
   * @returns Audit entry
   */
  logRoleChange(
    userId: string,
    oldRole: UserRole,
    newRole: UserRole,
    actorId: string,
    ipAddress: string,
    userAgent: string
  ): AuditEntry {
    return this.log(
      "role_changed",
      userId,
      ipAddress,
      userAgent,
      { oldRole, newRole },
      actorId
    );
  }

  /**
   * Log a user suspension event.
   * @param userId - Suspended user ID
   * @param reason - Suspension reason
   * @param actorId - Admin who suspended
   * @param ipAddress - Admin's IP
   * @param userAgent - Admin's user agent
   * @returns Audit entry
   */
  logSuspension(
    userId: string,
    reason: string,
    actorId: string,
    ipAddress: string,
    userAgent: string
  ): AuditEntry {
    return this.log(
      "user_suspended",
      userId,
      ipAddress,
      userAgent,
      { reason },
      actorId
    );
  }

  /**
   * Query audit log entries with filters.
   * @param options - Query options
   * @returns Matching audit entries
   */
  query(options: AuditQueryOptions = {}): AuditEntry[] {
    let results = [...this.entries];

    if (options.userId) {
      results = results.filter((e) => e.userId === options.userId);
    }
    if (options.actorId) {
      results = results.filter((e) => e.actorId === options.actorId);
    }
    if (options.eventType) {
      results = results.filter(
        (e) => e.eventType === options.eventType
      );
    }
    if (options.severity) {
      results = results.filter(
        (e) => e.severity === options.severity
      );
    }
    if (options.after) {
      results = results.filter((e) => e.timestamp >= options.after!);
    }
    if (options.before) {
      results = results.filter((e) => e.timestamp <= options.before!);
    }
    if (options.ipAddress) {
      results = results.filter(
        (e) => e.ipAddress === options.ipAddress
      );
    }

    // Sort
    const order = options.sortOrder ?? "desc";
    results.sort((a, b) =>
      order === "desc"
        ? b.timestamp - a.timestamp
        : a.timestamp - b.timestamp
    );

    // Pagination
    const offset = options.offset ?? 0;
    const limit = options.limit ?? 100;
    return results.slice(offset, offset + limit);
  }

  /**
   * Get audit statistics.
   * @returns Audit log statistics
   */
  getStats(): AuditStats {
    const byEventType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const users = new Set<string>();
    const ips = new Set<string>();
    let lastEntryAt: number | null = null;

    for (const entry of this.entries) {
      byEventType[entry.eventType] =
        (byEventType[entry.eventType] ?? 0) + 1;
      bySeverity[entry.severity] =
        (bySeverity[entry.severity] ?? 0) + 1;
      users.add(entry.userId);
      ips.add(entry.ipAddress);

      if (lastEntryAt === null || entry.timestamp > lastEntryAt) {
        lastEntryAt = entry.timestamp;
      }
    }

    return {
      totalEntries: this.entries.length,
      byEventType,
      bySeverity,
      lastEntryAt,
      uniqueUsers: users.size,
      uniqueIps: ips.size,
    };
  }

  /**
   * Clear all audit entries (for testing).
   */
  clear(): void {
    this.entries.length = 0;
  }
}
