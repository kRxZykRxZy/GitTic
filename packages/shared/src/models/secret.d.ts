/**
 * Secret management types for securely storing credentials.
 * @module models/secret
 */
/**
 * Scope at which a secret is accessible.
 */
export type SecretScope = "organization" | "project" | "environment" | "pipeline";
/**
 * Type of secret value.
 */
export type SecretType = "generic" | "password" | "ssh_key" | "api_key" | "certificate" | "docker_registry" | "token";
/**
 * Status of a secret.
 */
export type SecretStatus = "active" | "expired" | "revoked" | "rotated";
/**
 * A secret stored in the platform's secret manager.
 */
export interface Secret {
    /** Unique identifier for the secret. */
    id: string;
    /** Human-readable name for the secret. */
    name: string;
    /** Optional description. */
    description?: string;
    /** Type of secret. */
    type: SecretType;
    /** Scope at which this secret is accessible. */
    scope: SecretScope;
    /** ID of the owning resource (org, project, or environment). */
    scopeId: string;
    /** Current status. */
    status: SecretStatus;
    /** Version number, incremented on each rotation. */
    version: number;
    /** ID of the user who created the secret. */
    createdBy: string;
    /** ID of the user who last updated the secret. */
    updatedBy: string;
    /** ISO-8601 creation timestamp. */
    createdAt: string;
    /** ISO-8601 last-updated timestamp. */
    updatedAt: string;
    /** ISO-8601 expiration timestamp (if applicable). */
    expiresAt?: string;
    /** ISO-8601 timestamp of the last rotation. */
    lastRotatedAt?: string;
    /** Rotation policy for automatic rotation. */
    rotationPolicy?: SecretRotationPolicy;
}
/**
 * Policy controlling automatic secret rotation.
 */
export interface SecretRotationPolicy {
    /** Whether automatic rotation is enabled. */
    enabled: boolean;
    /** Rotation interval in days. */
    intervalDays: number;
    /** Whether to notify on rotation. */
    notifyOnRotation: boolean;
    /** User IDs to notify upon rotation. */
    notifyUsers: string[];
}
/**
 * An entry in the secret's audit trail.
 */
export interface SecretAuditEntry {
    /** Unique identifier for the audit entry. */
    id: string;
    /** ID of the secret this entry belongs to. */
    secretId: string;
    /** Action that was performed. */
    action: SecretAuditAction;
    /** ID of the user who performed the action. */
    actorId: string;
    /** IP address from which the action was performed. */
    ipAddress: string;
    /** User agent of the client. */
    userAgent: string;
    /** ISO-8601 timestamp of the action. */
    performedAt: string;
    /** Additional context about the action. */
    details?: Record<string, unknown>;
}
/**
 * Actions that can be performed on a secret.
 */
export type SecretAuditAction = "created" | "updated" | "deleted" | "accessed" | "rotated" | "revoked" | "expired";
/**
 * Reference to a secret used in pipeline or deployment config.
 */
export interface SecretReference {
    /** ID of the secret being referenced. */
    secretId: string;
    /** Name of the secret. */
    secretName: string;
    /** Version of the secret to use (latest if omitted). */
    version?: number;
    /** Environment variable name to inject the secret as. */
    envVarName: string;
}
//# sourceMappingURL=secret.d.ts.map