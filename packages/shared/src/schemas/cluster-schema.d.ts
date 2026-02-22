/**
 * Cluster schema types for validation and API contracts.
 * @module schemas/cluster-schema
 */
/**
 * Schema for registering a new cluster node.
 */
export interface RegisterNodeSchema {
    /** Hostname of the node. */
    hostname: string;
    /** IP address of the node. */
    ipAddress: string;
    /** Port the node agent is listening on. */
    port: number;
    /** Region / availability zone. */
    region: string;
    /** Node capacity. */
    capacity: NodeCapacitySchema;
    /** Labels for node selection. */
    labels?: Record<string, string>;
    /** Tags for grouping. */
    tags?: string[];
}
/**
 * Node capacity information.
 */
export interface NodeCapacitySchema {
    /** Number of CPU cores. */
    cpuCores: number;
    /** Memory in megabytes. */
    memoryMb: number;
    /** Disk space in megabytes. */
    diskMb: number;
    /** Maximum concurrent jobs. */
    maxConcurrentJobs: number;
}
/**
 * Schema for updating a cluster node.
 */
export interface UpdateNodeSchema {
    /** Updated labels. */
    labels?: Record<string, string>;
    /** Updated tags. */
    tags?: string[];
    /** Updated capacity. */
    capacity?: NodeCapacitySchema;
    /** Whether the node accepts new jobs. */
    schedulable?: boolean;
}
/**
 * Schema for submitting a job to the cluster.
 */
export interface SubmitJobSchema {
    /** Name of the job. */
    name: string;
    /** Container image to run. */
    image: string;
    /** Commands to execute. */
    commands: string[];
    /** Resource requirements. */
    resources: JobResourcesSchema;
    /** Environment variables. */
    variables?: Record<string, string>;
    /** Timeout in seconds. */
    timeoutSeconds?: number;
    /** Priority of the job (higher = more important). */
    priority?: number;
    /** Node label selectors for scheduling. */
    nodeSelector?: Record<string, string>;
    /** Secret references to mount. */
    secrets?: JobSecretRefSchema[];
}
/**
 * Resource requirements for a job.
 */
export interface JobResourcesSchema {
    /** CPU cores requested. */
    cpuCores: number;
    /** Memory requested in megabytes. */
    memoryMb: number;
    /** Disk space requested in megabytes. */
    diskMb?: number;
    /** Whether GPU access is required. */
    gpu?: boolean;
}
/**
 * Secret reference to mount in a job.
 */
export interface JobSecretRefSchema {
    /** ID of the secret to mount. */
    secretId: string;
    /** Environment variable name. */
    envVarName: string;
}
/**
 * Schema for cluster scaling configuration.
 */
export interface ClusterScalingConfigSchema {
    /** Whether auto-scaling is enabled. */
    enabled: boolean;
    /** Minimum number of nodes. */
    minNodes: number;
    /** Maximum number of nodes. */
    maxNodes: number;
    /** CPU threshold to scale up (0-100). */
    scaleUpCpuThreshold: number;
    /** CPU threshold to scale down (0-100). */
    scaleDownCpuThreshold: number;
    /** Cooldown period in seconds after scaling. */
    cooldownSeconds: number;
}
/**
 * Schema for cluster health query parameters.
 */
export interface ClusterHealthQuerySchema {
    /** Filter by node region. */
    region?: string;
    /** Filter by node labels. */
    labels?: Record<string, string>;
    /** Include offline nodes. */
    includeOffline?: boolean;
}
/**
 * Schema for job search / filtering.
 */
export interface JobSearchSchema {
    /** Filter by job status. */
    status?: JobStatusFilter;
    /** Filter by node ID. */
    nodeId?: string;
    /** Filter by priority (minimum). */
    minPriority?: number;
    /** Start of the date range. */
    from?: string;
    /** End of the date range. */
    to?: string;
    /** Page number. */
    page?: number;
    /** Items per page. */
    perPage?: number;
}
/**
 * Job status values for filtering.
 */
export type JobStatusFilter = "pending" | "running" | "completed" | "failed" | "canceled" | "timed_out";
//# sourceMappingURL=cluster-schema.d.ts.map