/**
 * Environment types for managing deployment targets.
 * @module models/environment
 */

/**
 * Type of environment.
 */
export type EnvironmentType =
  | "development"
  | "staging"
  | "preview"
  | "production"
  | "testing";

/**
 * Status of an environment.
 */
export type EnvironmentStatus = "active" | "inactive" | "provisioning" | "failed" | "destroying";

/**
 * Protection level for an environment.
 */
export type EnvironmentProtection = "none" | "required_reviewers" | "wait_timer" | "branch_policy";

/**
 * A deployment target environment within a project.
 */
export interface Environment {
  /** Unique identifier for the environment. */
  id: string;
  /** Human-readable name (e.g., "production", "staging"). */
  name: string;
  /** URL slug used in URLs and API paths. */
  slug: string;
  /** Type of environment. */
  type: EnvironmentType;
  /** Current status. */
  status: EnvironmentStatus;
  /** ID of the project this environment belongs to. */
  projectId: string;
  /** Base URL of the deployed application in this environment. */
  url?: string;
  /** Protection rules applied to this environment. */
  protectionRules: EnvironmentProtectionRule[];
  /** Branch restrictions (only certain branches can deploy). */
  branchPolicy?: BranchPolicy;
  /** ID of the last successful deployment. */
  lastDeploymentId?: string;
  /** Display order in the UI. */
  sortOrder: number;
  /** Whether auto-deploy is enabled for this environment. */
  autoDeployEnabled: boolean;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601 last-updated timestamp. */
  updatedAt: string;
}

/**
 * A protection rule that must be satisfied before deploying.
 */
export interface EnvironmentProtectionRule {
  /** Type of protection. */
  type: EnvironmentProtection;
  /** User IDs of required reviewers (for required_reviewers type). */
  reviewers?: string[];
  /** Wait time in minutes (for wait_timer type). */
  waitMinutes?: number;
}

/**
 * Branch restrictions controlling which branches can deploy.
 */
export interface BranchPolicy {
  /** Whether to restrict deployments to specific branches. */
  restrictToNamedBranches: boolean;
  /** Allowed branch name patterns (supports glob patterns). */
  allowedPatterns: string[];
}

/**
 * Variables scoped to a specific environment.
 */
export interface EnvironmentVariable {
  /** Unique identifier. */
  id: string;
  /** ID of the environment this variable belongs to. */
  environmentId: string;
  /** Variable name. */
  name: string;
  /** Variable value (masked for secrets). */
  value: string;
  /** Whether this variable is a secret. */
  isSecret: boolean;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601 last-updated timestamp. */
  updatedAt: string;
}

/**
 * Summary information about an environment's health.
 */
export interface EnvironmentHealthSummary {
  /** ID of the environment. */
  environmentId: string;
  /** Overall health status. */
  health: EnvironmentHealthStatus;
  /** Number of healthy instances. */
  healthyInstances: number;
  /** Total number of instances. */
  totalInstances: number;
  /** Average response time in milliseconds. */
  avgResponseTimeMs: number;
  /** Uptime percentage (0-100). */
  uptimePercentage: number;
  /** ISO-8601 timestamp of the last health check. */
  lastCheckedAt: string;
}

/**
 * Overall health statuses for an environment.
 */
export type EnvironmentHealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";
