/** Cluster node registered with the platform */
export interface ClusterNode {
    id: string;
    name: string;
    token: string;
    url: string;
    status: "online" | "offline" | "draining" | "updating";
    version: string;
    capabilities: string[];
    cpuUsage: number;
    memoryUsage: number;
    activeJobs: number;
    maxJobs: number;
    lastHeartbeat: string;
    registeredAt: string;
    updatedAt: string;
}
/** Job assigned to a cluster node */
export interface ClusterJob {
    id: string;
    clusterId: string;
    projectId: string;
    pipelineId: string;
    stage: string;
    status: "queued" | "running" | "success" | "failed" | "cancelled";
    command: string;
    workDir: string;
    output?: string;
    exitCode?: number;
    startedAt?: string;
    finishedAt?: string;
    createdAt: string;
}
/** Heartbeat payload from cluster agent */
export interface HeartbeatPayload {
    clusterId: string;
    cpuUsage: number;
    memoryUsage: number;
    activeJobs: number;
    version: string;
    capabilities: string[];
    timestamp: string;
}
//# sourceMappingURL=cluster.d.ts.map