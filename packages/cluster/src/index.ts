// Existing modules
export { ClusterAgent } from "./agent.js";
export type { AgentConfig } from "./agent.js";
export { ClusterDiscovery } from "./discovery.js";
export type { DiscoveryMethod, DiscoveryOptions } from "./discovery.js";
export { Scheduler } from "./scheduler.js";
export type { LoadBalanceStrategy } from "./scheduler.js";
export { executeInSandbox, spawnTerminal } from "./sandbox.js";
export type { SandboxOptions, SandboxResult } from "./sandbox.js";

// Core Cluster Management
export {
  createClusterConfig,
  detectCapabilities,
  validateClusterConfig,
  mergeConfigs,
} from "./config.js";
export type {
  ClusterConfig,
  ClusterConfigInput,
  ResourceLimits,
  GeoPlacement,
} from "./config.js";

export { NodeRegistry } from "./registry.js";
export type { RegisteredNode, RegistryEvents } from "./registry.js";

export { checkNodeHealth, aggregateClusterHealth, HealthStatus } from "./health.js";
export type {
  ComponentHealth,
  NodeHealthReport,
  HealthThresholds,
} from "./health.js";

export { MetricsCollector } from "./metrics.js";
export type { NodeMetrics, ClusterMetrics } from "./metrics.js";

export { StatusManager } from "./status.js";
export type {
  NodeStatus,
  StatusTransition,
  NodeStatusEntry,
  StatusManagerEvents,
} from "./status.js";

// Load Management
export { LoadMonitor } from "./load/load-monitor.js";
export type {
  LoadThresholds,
  LoadSnapshot,
  LoadAlert,
  AlertSeverity as LoadAlertSeverity,
} from "./load/load-monitor.js";

export { LoadBalancer } from "./load/load-balancer.js";
export type {
  BalancerNode,
  BalancerStrategy,
  LoadBalancerConfig,
} from "./load/load-balancer.js";

export { RequestForwarder } from "./load/request-forwarder.js";
export type {
  ForwardOptions,
  ForwardResult,
  FallbackNode,
} from "./load/request-forwarder.js";

export { CircuitBreakerManager, CircuitState } from "./load/circuit-breaker.js";
export type {
  CircuitBreakerConfig,
  CircuitInfo,
} from "./load/circuit-breaker.js";

export { ClusterRateLimiter } from "./load/rate-limiter.js";
export type {
  RateLimitRule,
  RateLimitResult,
} from "./load/rate-limiter.js";

// Job Management
export { JobQueue, JobPriority } from "./jobs/job-queue.js";
export type {
  QueuedJobStatus,
  QueuedJob,
  EnqueueOptions,
} from "./jobs/job-queue.js";

export { JobRunner } from "./jobs/job-runner.js";
export type {
  JobRunConfig,
  JobRunResult,
} from "./jobs/job-runner.js";

export { JobTracker } from "./jobs/job-tracker.js";
export type {
  TrackedJobStatus,
  JobResourceUsage,
  TrackedJob,
  JobNotification,
} from "./jobs/job-tracker.js";

export { PriorityManager } from "./jobs/job-priority.js";
export type {
  PriorityTier,
  PriorityJobEntry,
  PriorityStats,
} from "./jobs/job-priority.js";

export { ArtifactStore } from "./jobs/artifact-store.js";
export type {
  ArtifactMetadata,
  StoredArtifact,
  CleanupPolicy,
} from "./jobs/artifact-store.js";

// Geo and Routing
export { RegionManager } from "./geo/region-manager.js";
export type {
  Region,
  RegionNodeAssignment,
  RegionCapacity,
} from "./geo/region-manager.js";

export { GeoRouter } from "./geo/geo-router.js";
export type {
  LatencyEntry,
  RoutingDecision,
  RegionHealthStatus,
  GeoRouterConfig,
} from "./geo/geo-router.js";

export { FailoverManager, FailoverState } from "./geo/failover.js";
export type {
  FailoverConfig,
  HealthCheckResult,
  FailoverEvent,
} from "./geo/failover.js";

// Resource Management
export { ResourceTracker } from "./resources/resource-tracker.js";
export type {
  ResourceUsage,
  CostRates,
} from "./resources/resource-tracker.js";

export { QuotaManager } from "./resources/quota-manager.js";
export type {
  QuotaDefinition,
  QuotaCheckResult,
  QuotaUsageSnapshot,
} from "./resources/quota-manager.js";

export { GpuManager } from "./resources/gpu-support.js";
export type {
  GpuDevice,
  GpuCapabilities,
  GpuJobAssignment,
  GpuUtilizationSnapshot,
} from "./resources/gpu-support.js";

// Auto-scaling and Lifecycle
export { AutoScaler } from "./scaling/auto-scaler.js";
export type {
  ScalingMetrics,
  AutoScalerConfig,
  ScalingAction,
  ScalingDecision,
} from "./scaling/auto-scaler.js";

export { DrainManager, DrainStatus } from "./scaling/drain-manager.js";
export type { DrainEntry } from "./scaling/drain-manager.js";

export { IdleManager, IdleState } from "./scaling/idle-manager.js";
export type {
  IdleNodeEntry,
  IdleManagerConfig,
} from "./scaling/idle-manager.js";

// Security
export { TokenAuthManager } from "./security/token-auth.js";
export type {
  TokenScope,
  ClusterToken,
  TokenValidationResult,
} from "./security/token-auth.js";

export { SignedCommunication } from "./security/signed-communication.js";
export type {
  SignedMessage,
  VerificationResult,
  SignedCommConfig,
} from "./security/signed-communication.js";

export { NetworkPolicyManager } from "./security/network-policy.js";
export type {
  IpAllowlistEntry,
  PortRule,
  TlsPolicy,
  PolicyCheckResult,
  ConnectionInfo,
} from "./security/network-policy.js";

// Monitoring
export { AlertManager } from "./monitoring/alerting.js";
export type {
  AlertSeverity as MonitoringAlertSeverity,
  AlertState,
  AlertOperator,
  AlertRule,
  AlertChannel,
  AlertInstance,
} from "./monitoring/alerting.js";

export { CostTracker } from "./monitoring/cost-tracker.js";
export type {
  NodeCostEntry,
  JobCostEntry,
  Budget,
  CostReport,
  TierPricing,
} from "./monitoring/cost-tracker.js";

export { TelemetryCollector } from "./monitoring/telemetry.js";
export type {
  TelemetrySeverity,
  TelemetryEvent,
  TelemetryConfig,
  TelemetryBatch,
} from "./monitoring/telemetry.js";

// Utilities
export {
  ClusterError,
  NodeNotFoundError,
  QuotaExceededError,
  DrainInProgressError,
  RegionUnavailableError,
  CircuitOpenError,
  JobNotFoundError,
  RateLimitError,
  AuthenticationError,
} from "./utils/cluster-errors.js";
