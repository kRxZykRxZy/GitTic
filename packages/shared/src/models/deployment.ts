/**
 * Deployment types for tracking application releases.
 * @module models/deployment
 */

/**
 * Status of a deployment.
 */
export type DeploymentStatus =
  | "pending"
  | "queued"
  | "in_progress"
  | "success"
  | "failure"
  | "canceled"
  | "rolled_back"
  | "skipped";

/**
 * Strategy used to roll out the deployment.
 */
export type DeploymentStrategy =
  | "rolling"
  | "blue_green"
  | "canary"
  | "recreate"
  | "manual";

/**
 * A deployment of an application to a target environment.
 */
export interface Deployment {
  /** Unique identifier for the deployment. */
  id: string;
  /** ID of the project being deployed. */
  projectId: string;
  /** ID of the target environment. */
  environmentId: string;
  /** ID of the pipeline run that triggered this deployment. */
  pipelineRunId?: string;
  /** Git commit SHA being deployed. */
  commitSha: string;
  /** Git ref (branch or tag) being deployed. */
  ref: string;
  /** Deployment status. */
  status: DeploymentStatus;
  /** Deployment strategy used. */
  strategy: DeploymentStrategy;
  /** ID of the user who initiated the deployment. */
  initiatedBy: string;
  /** Version label (e.g., semver or build number). */
  version?: string;
  /** Release notes or description. */
  description?: string;
  /** Deployment configuration. */
  config: DeploymentConfig;
  /** Timing information. */
  timing: DeploymentTiming;
  /** Rollback information if the deployment was rolled back. */
  rollback?: DeploymentRollback;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601 last-updated timestamp. */
  updatedAt: string;
}

/**
 * Configuration options for a deployment.
 */
export interface DeploymentConfig {
  /** Number of replicas to deploy. */
  replicas: number;
  /** Timeout in seconds for the deployment to complete. */
  timeoutSeconds: number;
  /** Whether to automatically rollback on failure. */
  autoRollback: boolean;
  /** Health check configuration. */
  healthCheck?: HealthCheckConfig;
  /** Environment variables to set during deployment. */
  envVars?: Record<string, string>;
}

/**
 * Health check configuration for deployed services.
 */
export interface HealthCheckConfig {
  /** HTTP path to check. */
  path: string;
  /** Port to send health check requests to. */
  port: number;
  /** Interval between checks in seconds. */
  intervalSeconds: number;
  /** Timeout for each check in seconds. */
  timeoutSeconds: number;
  /** Number of consecutive successes required. */
  healthyThreshold: number;
  /** Number of consecutive failures before marking unhealthy. */
  unhealthyThreshold: number;
}

/**
 * Timing information for a deployment lifecycle.
 */
export interface DeploymentTiming {
  /** ISO-8601 timestamp when the deployment was queued. */
  queuedAt?: string;
  /** ISO-8601 timestamp when deployment started. */
  startedAt?: string;
  /** ISO-8601 timestamp when deployment completed. */
  completedAt?: string;
  /** Duration in seconds from start to completion. */
  durationSeconds?: number;
}

/**
 * Rollback information for a deployment that was reverted.
 */
export interface DeploymentRollback {
  /** ID of the deployment that was rolled back to. */
  targetDeploymentId: string;
  /** Reason for the rollback. */
  reason: string;
  /** ID of the user who initiated the rollback. */
  initiatedBy: string;
  /** ISO-8601 timestamp of the rollback. */
  rolledBackAt: string;
}
