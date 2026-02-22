/**
 * Cluster-related event types for distributed infrastructure management.
 * @module events/cluster-events
 */

import type { BaseEvent } from "./event-types.js";

/**
 * Payload for cluster node registration events.
 */
export interface ClusterNodeRegisteredPayload {
  /** ID of the cluster node. */
  nodeId: string;
  /** Hostname of the node. */
  hostname: string;
  /** IP address of the node. */
  ipAddress: string;
  /** Region or availability zone. */
  region: string;
  /** Node capacity information. */
  capacity: ClusterNodeCapacity;
  /** Labels assigned to the node. */
  labels: Record<string, string>;
}

/**
 * Event emitted when a node joins the cluster.
 */
export type ClusterNodeRegisteredEvent = BaseEvent<ClusterNodeRegisteredPayload>;

/**
 * Payload for cluster node deregistration events.
 */
export interface ClusterNodeDeregisteredPayload {
  /** ID of the node being removed. */
  nodeId: string;
  /** Hostname of the node. */
  hostname: string;
  /** Reason for deregistration. */
  reason: NodeDeregistrationReason;
  /** Number of jobs that were rescheduled. */
  rescheduledJobs: number;
}

/**
 * Event emitted when a node leaves the cluster.
 */
export type ClusterNodeDeregisteredEvent = BaseEvent<ClusterNodeDeregisteredPayload>;

/**
 * Reason a node was removed from the cluster.
 */
export type NodeDeregistrationReason =
  | "graceful_shutdown"
  | "heartbeat_timeout"
  | "admin_action"
  | "scaling_down"
  | "maintenance";

/**
 * Capacity information for a cluster node.
 */
export interface ClusterNodeCapacity {
  /** Number of CPU cores available. */
  cpuCores: number;
  /** Memory available in megabytes. */
  memoryMb: number;
  /** Disk space available in megabytes. */
  diskMb: number;
  /** Maximum number of concurrent jobs. */
  maxConcurrentJobs: number;
}

/**
 * Payload for cluster scaling events.
 */
export interface ClusterScalingPayload {
  /** Scaling direction. */
  direction: ScalingDirection;
  /** Previous node count. */
  previousNodeCount: number;
  /** New node count after scaling. */
  newNodeCount: number;
  /** Reason for scaling. */
  reason: ScalingReason;
  /** Metric values that triggered the scaling decision. */
  metrics: ClusterScalingMetrics;
}

/**
 * Event emitted when the cluster scales up or down.
 */
export type ClusterScalingEvent = BaseEvent<ClusterScalingPayload>;

/**
 * Scaling direction.
 */
export type ScalingDirection = "up" | "down";

/**
 * Reason for a scaling decision.
 */
export type ScalingReason =
  | "cpu_threshold"
  | "memory_threshold"
  | "queue_depth"
  | "schedule"
  | "manual"
  | "cooldown_expired";

/**
 * Metrics that informed a scaling decision.
 */
export interface ClusterScalingMetrics {
  /** Average CPU utilization across nodes (0-100). */
  avgCpuPercent: number;
  /** Average memory utilization across nodes (0-100). */
  avgMemoryPercent: number;
  /** Number of jobs waiting in the queue. */
  queueDepth: number;
  /** Number of currently running jobs. */
  runningJobs: number;
}

/**
 * Payload for cluster health status change events.
 */
export interface ClusterHealthChangedPayload {
  /** Previous health status. */
  previousStatus: ClusterHealthStatus;
  /** New health status. */
  newStatus: ClusterHealthStatus;
  /** Number of healthy nodes. */
  healthyNodes: number;
  /** Total number of nodes. */
  totalNodes: number;
  /** Optional message describing the status change. */
  message?: string;
}

/**
 * Event emitted when overall cluster health status changes.
 */
export type ClusterHealthChangedEvent = BaseEvent<ClusterHealthChangedPayload>;

/**
 * Overall health status of the cluster.
 */
export type ClusterHealthStatus = "healthy" | "degraded" | "critical" | "unknown";
