/**
 * Cluster configuration management.
 * Defines the shape of cluster configuration and provides
 * validation, defaults, and merging utilities.
 * @module
 */

import os from "node:os";
import { randomUUID } from "node:crypto";

/** Resource limits for a cluster node */
export interface ResourceLimits {
  /** Maximum CPU cores available for jobs */
  maxCpuCores: number;
  /** Maximum RAM in megabytes available for jobs */
  maxRamMb: number;
  /** Maximum disk space in megabytes */
  maxDiskMb: number;
  /** Maximum concurrent jobs */
  maxConcurrentJobs: number;
  /** Maximum single job duration in milliseconds */
  maxJobDurationMs: number;
}

/** Geographic placement for a node */
export interface GeoPlacement {
  /** Region identifier (e.g., "us-east", "eu-west", "apac") */
  region: string;
  /** Availability zone within the region */
  zone: string;
}

/** Full cluster node configuration */
export interface ClusterConfig {
  /** Unique node identifier */
  nodeId: string;
  /** Display name for this node */
  nodeName: string;
  /** URL of the platform coordination server */
  serverUrl: string;
  /** Heartbeat interval in milliseconds */
  heartbeatIntervalMs: number;
  /** Node capabilities (e.g., ["docker", "gpu", "arm64"]) */
  capabilities: string[];
  /** Resource limits for this node */
  resourceLimits: ResourceLimits;
  /** Geographic placement */
  geo: GeoPlacement;
  /** Authentication token for the cluster */
  clusterToken: string;
  /** Node software version */
  version: string;
  /** Additional labels for node selection */
  labels: Record<string, string>;
  /** Whether this node accepts new jobs */
  acceptingJobs: boolean;
  /** For backward compatibility with agent registration */
  clusterId: string;
}

/** Partial config used when creating with defaults */
export type ClusterConfigInput = Partial<ClusterConfig> & {
  serverUrl: string;
  clusterToken: string;
};

/** Default resource limits based on the current machine */
const DEFAULT_RESOURCE_LIMITS: ResourceLimits = {
  maxCpuCores: os.cpus().length,
  maxRamMb: Math.floor(os.totalmem() / (1024 * 1024)),
  maxDiskMb: 50_000,
  maxConcurrentJobs: Math.max(2, os.cpus().length),
  maxJobDurationMs: 30 * 60 * 1000,
};

/** Default geographic placement */
const DEFAULT_GEO: GeoPlacement = {
  region: "default",
  zone: "default-1",
};

/**
 * Create a full ClusterConfig by merging provided values with sensible defaults.
 * Uses the machine's hostname and hardware for automatic configuration.
 * @param input - Partial configuration with required serverUrl and clusterToken
 * @returns Complete cluster configuration
 */
export function createClusterConfig(input: ClusterConfigInput): ClusterConfig {
  return {
    nodeId: input.nodeId ?? randomUUID(),
    nodeName: input.nodeName ?? os.hostname(),
    serverUrl: input.serverUrl,
    heartbeatIntervalMs: input.heartbeatIntervalMs ?? 15_000,
    capabilities: input.capabilities ?? detectCapabilities(),
    resourceLimits: input.resourceLimits ?? { ...DEFAULT_RESOURCE_LIMITS },
    geo: input.geo ?? { ...DEFAULT_GEO },
    clusterToken: input.clusterToken,
    version: input.version ?? "1.0.0",
    labels: input.labels ?? {},
    acceptingJobs: input.acceptingJobs ?? true,
    clusterId: input.nodeId ?? randomUUID(), // For backward compatibility with agent registration
  };
}

/**
 * Detect basic capabilities of the current machine.
 * Inspects the OS, architecture, and CPU count.
 * @returns Array of capability strings
 */
export function detectCapabilities(): string[] {
  const caps: string[] = [];
  const arch = os.arch();
  const platform = os.platform();

  caps.push(`arch:${arch}`);
  caps.push(`os:${platform}`);

  if (os.cpus().length >= 8) {
    caps.push("high-cpu");
  }

  const totalRamGb = os.totalmem() / (1024 * 1024 * 1024);
  if (totalRamGb >= 16) {
    caps.push("high-memory");
  }

  return caps;
}

/**
 * Validate that a cluster configuration has all required fields
 * and values within acceptable ranges.
 * @param config - Configuration to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateClusterConfig(config: ClusterConfig): string[] {
  const errors: string[] = [];

  if (!config.nodeId || config.nodeId.length === 0) {
    errors.push("nodeId is required");
  }

  if (!config.serverUrl || !config.serverUrl.startsWith("http")) {
    errors.push("serverUrl must be a valid HTTP(S) URL");
  }

  if (config.heartbeatIntervalMs < 1000) {
    errors.push("heartbeatIntervalMs must be at least 1000ms");
  }

  if (config.heartbeatIntervalMs > 300_000) {
    errors.push("heartbeatIntervalMs must not exceed 300000ms");
  }

  if (config.resourceLimits.maxConcurrentJobs < 1) {
    errors.push("maxConcurrentJobs must be at least 1");
  }

  if (config.resourceLimits.maxJobDurationMs < 10_000) {
    errors.push("maxJobDurationMs must be at least 10000ms");
  }

  if (!config.clusterToken || config.clusterToken.length < 8) {
    errors.push("clusterToken must be at least 8 characters");
  }

  if (!config.geo.region || config.geo.region.length === 0) {
    errors.push("geo.region is required");
  }

  return errors;
}

/**
 * Merge two configs, with the override taking precedence.
 * @param base - Base configuration
 * @param override - Partial override values
 * @returns Merged configuration
 */
export function mergeConfigs(
  base: ClusterConfig,
  override: Partial<ClusterConfig>
): ClusterConfig {
  return {
    ...base,
    ...override,
    resourceLimits: override.resourceLimits
      ? { ...base.resourceLimits, ...override.resourceLimits }
      : base.resourceLimits,
    geo: override.geo ? { ...base.geo, ...override.geo } : base.geo,
    labels: override.labels
      ? { ...base.labels, ...override.labels }
      : base.labels,
    capabilities: override.capabilities ?? base.capabilities,
  };
}
