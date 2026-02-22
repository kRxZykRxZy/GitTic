/**
 * Permission scopes defining granular access rights.
 * @module permissions/scopes
 */

/**
 * A permission scope representing a specific capability.
 */
export interface PermissionScope {
  /** Unique identifier for the scope (e.g., "project:read"). */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Description of what this scope allows. */
  description: string;
  /** Category this scope belongs to. */
  category: ScopeCategory;
  /** Whether this scope is considered sensitive / elevated. */
  isSensitive: boolean;
}

/**
 * Categories for grouping permission scopes.
 */
export type ScopeCategory =
  | "project"
  | "pipeline"
  | "deployment"
  | "cluster"
  | "organization"
  | "user"
  | "billing"
  | "integration"
  | "secret"
  | "admin";

/**
 * Project-level permission scope identifiers.
 */
export type ProjectScope =
  | "project:read"
  | "project:write"
  | "project:delete"
  | "project:settings"
  | "project:members"
  | "project:transfer";

/**
 * Pipeline-level permission scope identifiers.
 */
export type PipelineScope =
  | "pipeline:read"
  | "pipeline:write"
  | "pipeline:run"
  | "pipeline:cancel"
  | "pipeline:delete"
  | "pipeline:approve";

/**
 * Deployment-level permission scope identifiers.
 */
export type DeploymentScope =
  | "deployment:read"
  | "deployment:create"
  | "deployment:rollback"
  | "deployment:approve"
  | "deployment:delete";

/**
 * Organization-level permission scope identifiers.
 */
export type OrganizationScope =
  | "org:read"
  | "org:write"
  | "org:delete"
  | "org:members"
  | "org:teams"
  | "org:billing"
  | "org:settings"
  | "org:integrations";

/**
 * Secret management permission scope identifiers.
 */
export type SecretManagementScope =
  | "secret:read"
  | "secret:write"
  | "secret:delete"
  | "secret:rotate";

/**
 * Admin-level permission scope identifiers.
 */
export type AdminScope =
  | "admin:users"
  | "admin:organizations"
  | "admin:system"
  | "admin:audit"
  | "admin:billing";

/**
 * Union of all possible permission scope identifiers.
 */
export type AnyScope =
  | ProjectScope
  | PipelineScope
  | DeploymentScope
  | OrganizationScope
  | SecretManagementScope
  | AdminScope;

/**
 * A set of scopes assigned to an API token or integration.
 */
export interface ScopeSet {
  /** List of granted scope identifiers. */
  scopes: AnyScope[];
  /** ISO-8601 timestamp when these scopes were granted. */
  grantedAt: string;
  /** ID of the user who granted the scopes. */
  grantedBy: string;
  /** Optional expiration for the scope grant. */
  expiresAt?: string;
}
