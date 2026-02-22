import * as analyticsRepo from "../db/repositories/analytics-repo.js";

/**
 * Audit trail service.
 *
 * Provides a structured, GDPR-compliant audit logging layer on
 * top of the analytics repository. Logs all admin and moderator
 * actions with full context for accountability and compliance.
 */

/**
 * Recognised audit event categories.
 * Each maps to a group of related actions.
 */
export type AuditCategory =
  | "auth"
  | "user"
  | "project"
  | "organization"
  | "moderation"
  | "cluster"
  | "admin"
  | "system"
  | "data";

/**
 * Structured audit event input.
 */
export interface AuditEvent {
  /** The user who performed the action. */
  userId: string;
  /** Category of the action. */
  category: AuditCategory;
  /** Machine-readable action name (e.g. "user.suspend"). */
  action: string;
  /** The type of resource affected (e.g. "user", "project"). */
  resource: string;
  /** The ID of the affected resource. */
  resourceId: string;
  /** Human-readable description of what happened. */
  description?: string;
  /** Additional structured metadata. */
  metadata?: Record<string, unknown>;
  /** IP address of the actor. */
  ipAddress?: string;
  /** User agent of the actor. */
  userAgent?: string;
}

/**
 * Audit log entry returned from queries.
 */
export interface AuditEntry extends AuditEvent {
  /** Unique entry ID. */
  id: string;
  /** ISO timestamp of the event. */
  timestamp: string;
}

/**
 * Log an audit event.
 *
 * Wraps the analytics repository's `logAudit` function with
 * structured event typing and serialisation.
 *
 * @param event - The audit event to log.
 * @returns The persisted audit log entry.
 */
export function logAuditEvent(event: AuditEvent): AuditEntry {
  const details = JSON.stringify({
    category: event.category,
    description: event.description ?? "",
    metadata: event.metadata ?? {},
    userAgent: event.userAgent ?? "",
  });

  const result = analyticsRepo.logAudit({
    userId: event.userId,
    action: event.action,
    resource: event.resource,
    resourceId: event.resourceId,
    details,
    ipAddress: event.ipAddress,
  });

  return {
    id: result.id,
    userId: event.userId,
    category: event.category,
    action: event.action,
    resource: event.resource,
    resourceId: event.resourceId,
    description: event.description,
    metadata: event.metadata,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    timestamp: result.timestamp,
  };
}

/* ── Convenience helpers for common audit events ─────────── */

/**
 * Log a user authentication event.
 */
export function logAuthEvent(
  userId: string,
  action: "login" | "logout" | "register" | "password_change" | "token_refresh",
  ipAddress?: string,
  userAgent?: string,
): AuditEntry {
  return logAuditEvent({
    userId,
    category: "auth",
    action: `auth.${action}`,
    resource: "session",
    resourceId: userId,
    description: `User ${action}`,
    ipAddress,
    userAgent,
  });
}

/**
 * Log an admin action on a user account.
 */
export function logUserAdminAction(
  adminUserId: string,
  targetUserId: string,
  action: "role_change" | "suspend" | "ban" | "unsuspend" | "delete",
  metadata?: Record<string, unknown>,
  ipAddress?: string,
): AuditEntry {
  return logAuditEvent({
    userId: adminUserId,
    category: "admin",
    action: `user.${action}`,
    resource: "user",
    resourceId: targetUserId,
    description: `Admin ${action} on user ${targetUserId}`,
    metadata,
    ipAddress,
  });
}

/**
 * Log a moderation action on a report.
 */
export function logModerationAction(
  moderatorId: string,
  reportId: string,
  action: "review" | "resolve" | "dismiss" | "escalate",
  metadata?: Record<string, unknown>,
  ipAddress?: string,
): AuditEntry {
  return logAuditEvent({
    userId: moderatorId,
    category: "moderation",
    action: `moderation.${action}`,
    resource: "moderation_report",
    resourceId: reportId,
    description: `Moderator ${action} on report ${reportId}`,
    metadata,
    ipAddress,
  });
}

/**
 * Log a data access event (for GDPR audit trail).
 *
 * Records when user data is exported, accessed, or deleted.
 */
export function logDataAccess(
  userId: string,
  action: "export" | "view" | "delete" | "anonymize",
  targetUserId: string,
  ipAddress?: string,
): AuditEntry {
  return logAuditEvent({
    userId,
    category: "data",
    action: `data.${action}`,
    resource: "user_data",
    resourceId: targetUserId,
    description: `Data ${action} for user ${targetUserId}`,
    metadata: {
      gdprRelevant: true,
      targetUserId,
    },
    ipAddress,
  });
}

/**
 * Log a cluster management action.
 */
export function logClusterAction(
  adminUserId: string,
  nodeId: string,
  action: "register" | "drain" | "update" | "remove" | "force_update",
  metadata?: Record<string, unknown>,
  ipAddress?: string,
): AuditEntry {
  return logAuditEvent({
    userId: adminUserId,
    category: "cluster",
    action: `cluster.${action}`,
    resource: "cluster_node",
    resourceId: nodeId,
    description: `Cluster ${action} on node ${nodeId}`,
    metadata,
    ipAddress,
  });
}

/**
 * Log a system-level event (config changes, feature flag toggles, etc.).
 */
export function logSystemEvent(
  userId: string,
  action: string,
  description: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string,
): AuditEntry {
  return logAuditEvent({
    userId,
    category: "system",
    action: `system.${action}`,
    resource: "system",
    resourceId: "platform",
    description,
    metadata,
    ipAddress,
  });
}
