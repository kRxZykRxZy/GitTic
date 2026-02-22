/**
 * Custom error classes for cluster operations.
 * Provides specific error types for common failure scenarios
 * to enable proper error handling and reporting.
 * @module
 */

/**
 * Base class for all cluster-related errors.
 * Includes an error code and optional metadata for structured error handling.
 */
export class ClusterError extends Error {
  /** Machine-readable error code */
  readonly code: string;
  /** Additional context about the error */
  readonly metadata: Record<string, unknown>;

  constructor(message: string, code: string, metadata: Record<string, unknown> = {}) {
    super(message);
    this.name = "ClusterError";
    this.code = code;
    this.metadata = metadata;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Serialize the error to a plain object for logging or API responses.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      metadata: this.metadata,
    };
  }
}

/**
 * Thrown when a referenced cluster node cannot be found in the registry.
 */
export class NodeNotFoundError extends ClusterError {
  /** The ID of the node that was not found */
  readonly nodeId: string;

  constructor(nodeId: string) {
    super(`Node not found: ${nodeId}`, "NODE_NOT_FOUND", { nodeId });
    this.name = "NodeNotFoundError";
    this.nodeId = nodeId;
  }
}

/**
 * Thrown when a user or organization exceeds their resource quota.
 */
export class QuotaExceededError extends ClusterError {
  /** The type of quota that was exceeded */
  readonly quotaType: string;
  /** Current usage at time of the error */
  readonly currentUsage: number;
  /** Maximum allowed value */
  readonly limit: number;

  constructor(quotaType: string, currentUsage: number, limit: number) {
    super(
      `Quota exceeded for ${quotaType}: ${currentUsage}/${limit}`,
      "QUOTA_EXCEEDED",
      { quotaType, currentUsage, limit }
    );
    this.name = "QuotaExceededError";
    this.quotaType = quotaType;
    this.currentUsage = currentUsage;
    this.limit = limit;
  }
}

/**
 * Thrown when an operation is attempted on a node that is currently draining.
 */
export class DrainInProgressError extends ClusterError {
  /** The ID of the node that is draining */
  readonly nodeId: string;
  /** Number of jobs still running on the draining node */
  readonly remainingJobs: number;

  constructor(nodeId: string, remainingJobs: number) {
    super(
      `Node ${nodeId} is draining with ${remainingJobs} remaining jobs`,
      "DRAIN_IN_PROGRESS",
      { nodeId, remainingJobs }
    );
    this.name = "DrainInProgressError";
    this.nodeId = nodeId;
    this.remainingJobs = remainingJobs;
  }
}

/**
 * Thrown when a requested region is unavailable or has no healthy nodes.
 */
export class RegionUnavailableError extends ClusterError {
  /** The region identifier that is unavailable */
  readonly region: string;
  /** Optional fallback region that could be used */
  readonly fallbackRegion: string | null;

  constructor(region: string, fallbackRegion: string | null = null) {
    super(
      `Region unavailable: ${region}${fallbackRegion ? ` (fallback: ${fallbackRegion})` : ""}`,
      "REGION_UNAVAILABLE",
      { region, fallbackRegion }
    );
    this.name = "RegionUnavailableError";
    this.region = region;
    this.fallbackRegion = fallbackRegion;
  }
}

/**
 * Thrown when the circuit breaker for a node is in the open state.
 */
export class CircuitOpenError extends ClusterError {
  /** The ID of the node whose circuit is open */
  readonly nodeId: string;
  /** Timestamp when the circuit may transition to half-open */
  readonly retryAfter: number;

  constructor(nodeId: string, retryAfter: number) {
    super(
      `Circuit breaker open for node ${nodeId}, retry after ${new Date(retryAfter).toISOString()}`,
      "CIRCUIT_OPEN",
      { nodeId, retryAfter }
    );
    this.name = "CircuitOpenError";
    this.nodeId = nodeId;
    this.retryAfter = retryAfter;
  }
}

/**
 * Thrown when a job is not found in the job queue or tracker.
 */
export class JobNotFoundError extends ClusterError {
  /** The ID of the job that was not found */
  readonly jobId: string;

  constructor(jobId: string) {
    super(`Job not found: ${jobId}`, "JOB_NOT_FOUND", { jobId });
    this.name = "JobNotFoundError";
    this.jobId = jobId;
  }
}

/**
 * Thrown when a request is rejected due to rate limiting.
 */
export class RateLimitError extends ClusterError {
  /** The rate limit key (e.g., user ID or endpoint) */
  readonly key: string;
  /** Milliseconds until the rate limit resets */
  readonly retryAfterMs: number;

  constructor(key: string, retryAfterMs: number) {
    super(
      `Rate limit exceeded for ${key}, retry after ${retryAfterMs}ms`,
      "RATE_LIMITED",
      { key, retryAfterMs }
    );
    this.name = "RateLimitError";
    this.key = key;
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Thrown when token authentication or verification fails.
 */
export class AuthenticationError extends ClusterError {
  /** The reason for the authentication failure */
  readonly reason: string;

  constructor(reason: string) {
    super(`Authentication failed: ${reason}`, "AUTH_FAILED", { reason });
    this.name = "AuthenticationError";
    this.reason = reason;
  }
}
