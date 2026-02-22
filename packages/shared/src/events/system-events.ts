/**
 * System-level event types for platform health and operations.
 * @module events/system-events
 */

import type { BaseEvent } from "./event-types.js";

/**
 * Payload for system maintenance window events.
 */
export interface MaintenanceWindowPayload {
  /** Unique identifier for the maintenance window. */
  windowId: string;
  /** Human-readable title of the maintenance. */
  title: string;
  /** Detailed description of the maintenance. */
  description: string;
  /** ISO-8601 scheduled start time. */
  scheduledStart: string;
  /** ISO-8601 scheduled end time. */
  scheduledEnd: string;
  /** Services affected by the maintenance. */
  affectedServices: string[];
  /** Expected impact level. */
  impact: MaintenanceImpact;
  /** Current status of the maintenance window. */
  status: MaintenanceStatus;
}

/**
 * Event emitted when a maintenance window is scheduled or updated.
 */
export type MaintenanceWindowEvent = BaseEvent<MaintenanceWindowPayload>;

/**
 * Impact levels for maintenance windows.
 */
export type MaintenanceImpact = "none" | "minor" | "major" | "critical";

/**
 * Status of a maintenance window.
 */
export type MaintenanceStatus = "scheduled" | "in_progress" | "completed" | "canceled";

/**
 * Payload for system health check events.
 */
export interface SystemHealthCheckPayload {
  /** Name of the service being checked. */
  serviceName: string;
  /** Health check result. */
  status: SystemServiceStatus;
  /** Response time of the health check in milliseconds. */
  responseTimeMs: number;
  /** Error message if the check failed. */
  errorMessage?: string;
  /** Additional diagnostic details. */
  diagnostics?: Record<string, unknown>;
}

/**
 * Event emitted on system health check results.
 */
export type SystemHealthCheckEvent = BaseEvent<SystemHealthCheckPayload>;

/**
 * Service health statuses.
 */
export type SystemServiceStatus = "operational" | "degraded" | "outage" | "maintenance";

/**
 * Payload for rate limit exceeded events.
 */
export interface RateLimitExceededPayload {
  /** ID of the user or API key that exceeded the limit. */
  identityId: string;
  /** Type of identity. */
  identityType: RateLimitIdentityType;
  /** The endpoint or resource that was rate-limited. */
  endpoint: string;
  /** Maximum allowed requests in the window. */
  limit: number;
  /** Number of requests made in the window. */
  requestCount: number;
  /** Window duration in seconds. */
  windowSeconds: number;
  /** ISO-8601 timestamp when the window resets. */
  resetAt: string;
}

/**
 * Event emitted when a rate limit is exceeded.
 */
export type RateLimitExceededEvent = BaseEvent<RateLimitExceededPayload>;

/**
 * Types of identities that can be rate-limited.
 */
export type RateLimitIdentityType = "user" | "api_key" | "ip_address" | "organization";

/**
 * Payload for configuration change events.
 */
export interface ConfigChangePayload {
  /** Name of the configuration that changed. */
  configKey: string;
  /** Previous value (may be redacted for secrets). */
  previousValue?: string;
  /** New value (may be redacted for secrets). */
  newValue?: string;
  /** Who made the change. */
  changedBy: string;
  /** Reason for the change. */
  reason?: string;
}

/**
 * Event emitted when a system configuration value changes.
 */
export type ConfigChangeEvent = BaseEvent<ConfigChangePayload>;

/**
 * Payload for system alert events.
 */
export interface SystemAlertPayload {
  /** Alert identifier. */
  alertId: string;
  /** Alert name / title. */
  name: string;
  /** Detailed alert message. */
  message: string;
  /** Severity of the alert. */
  severity: SystemAlertSeverity;
  /** Service that triggered the alert. */
  service: string;
  /** Current alert state. */
  state: SystemAlertState;
}

/**
 * Event emitted when a system alert fires or resolves.
 */
export type SystemAlertEvent = BaseEvent<SystemAlertPayload>;

/**
 * Severity levels for system alerts.
 */
export type SystemAlertSeverity = "info" | "warning" | "error" | "critical";

/**
 * State of a system alert.
 */
export type SystemAlertState = "firing" | "resolved" | "acknowledged" | "silenced";
