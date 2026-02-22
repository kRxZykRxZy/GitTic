import * as clusterRepo from "../db/repositories/cluster-repo.js";
import type { ClusterNode as SharedClusterNode } from "@platform/shared";

/**
 * Cluster Scheduler
 * 
 * Intelligently selects appropriate clusters based on:
 * - User resource requirements (cores, RAM)
 * - Cluster availability and capacity
 * - Current load across clusters
 * - GPU requirements
 */

interface ResourceRequirements {
    cores: number;
    memoryMB: number;
    requiresGPU: boolean;
    timeout?: number;
}

interface UserLimits {
    tier: "free" | "pro" | "team" | "enterprise";
    maxCores: number;
    maxMemoryGB: number;
    hasGPUAccess: boolean;
}

type ClusterNode = SharedClusterNode;

interface SchedulingDecision {
    cluster: ClusterNode | null;
    reason: string;
    canRun: boolean;
    estimatedWaitTime?: number;
}

/**
 * Get user resource limits based on subscription tier
 */
export function getUserLimits(tier: string): UserLimits {
    const tierLimits: Record<string, UserLimits> = {
        free: {
            tier: "free",
            maxCores: 4,
            maxMemoryGB: 4,  // Changed from 8GB to 4GB
            hasGPUAccess: false,
        },
        pro: {
            tier: "pro",
            maxCores: 16,
            maxMemoryGB: 16,
            hasGPUAccess: true,
        },
        team: {
            tier: "team",
            maxCores: 32,
            maxMemoryGB: 32,
            hasGPUAccess: true,
        },
        enterprise: {
            tier: "enterprise",
            maxCores: 64,
            maxMemoryGB: 64,
            hasGPUAccess: true,
        },
    };

    return tierLimits[tier] || tierLimits.free;
}

/**
 * Validate if user can run job with requested resources
 */
export function validateResourceRequest(
    requested: ResourceRequirements,
    userLimits: UserLimits
): { valid: boolean; reason?: string } {
    // Check core limit
    if (requested.cores > userLimits.maxCores) {
        return {
            valid: false,
            reason: `Job requires ${requested.cores} cores but your ${userLimits.tier} plan allows max ${userLimits.maxCores} cores. Upgrade to run this job.`,
        };
    }

    // Check memory limit
    const requestedMemoryGB = requested.memoryMB / 1024;
    if (requestedMemoryGB > userLimits.maxMemoryGB) {
        return {
            valid: false,
            reason: `Job requires ${requestedMemoryGB}GB RAM but your ${userLimits.tier} plan allows max ${userLimits.maxMemoryGB}GB. Upgrade to run this job.`,
        };
    }

    // Check GPU access
    if (requested.requiresGPU && !userLimits.hasGPUAccess) {
        return {
            valid: false,
            reason: `Job requires GPU but your ${userLimits.tier} plan doesn't include GPU access. Upgrade to Pro or higher.`,
        };
    }

    return { valid: true };
}

/**
 * Find best cluster for job execution
 */
export function findSuitableCluster(
    requirements: ResourceRequirements
): SchedulingDecision {
    // Get all clusters
    const clusters = clusterRepo.listNodes();

    // Filter to online clusters only
    const onlineClusters = clusters.filter(c => c.status === "online");

    if (onlineClusters.length === 0) {
        return {
            cluster: null,
            canRun: false,
            reason: "No clusters available. Please try again later.",
        };
    }

    // Score each cluster
    const scoredClusters = onlineClusters
        .map(cluster => ({
            cluster,
            score: scoreCluster(cluster, requirements),
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);

    if (scoredClusters.length === 0) {
        return {
            cluster: null,
            canRun: false,
            reason: `No clusters found that can handle ${requirements.cores} cores and ${requirements.memoryMB}MB RAM. Try reducing resource requirements.`,
        };
    }

    // Select best cluster
    const best = scoredClusters[0];

    return {
        cluster: best.cluster,
        canRun: true,
        reason: `Selected cluster '${best.cluster.name}' (score: ${best.score.toFixed(2)})`,
    };
}

/**
 * Score a cluster for suitability
 * Higher score = better match
 */
function scoreCluster(
    cluster: ClusterNode,
    requirements: ResourceRequirements
): number {
    let score = 100;

    // Estimate cluster total resources using capability heuristics
    const totalCores = estimateTotalCores(cluster);
    const totalMemoryGB = estimateTotalMemory(cluster);

    // Calculate available resources
    const availableCores = totalCores * (1 - cluster.cpuUsage / 100);
    const availableMemoryGB = totalMemoryGB * (1 - cluster.memoryUsage / 100);

    // Check if cluster can handle the request
    if (availableCores < requirements.cores) {
        return 0; // Cannot handle core requirement
    }

    if (availableMemoryGB < requirements.memoryMB / 1024) {
        return 0; // Cannot handle memory requirement
    }

    // Check job capacity
    if (cluster.activeJobs >= cluster.maxJobs) {
        score -= 50; // Cluster is at capacity (but may free up soon)
    }

    // Prefer clusters with more headroom
    const coreHeadroom = (availableCores - requirements.cores) / totalCores;
    const memoryHeadroom = (availableMemoryGB - requirements.memoryMB / 1024) / totalMemoryGB;

    score += coreHeadroom * 30;
    score += memoryHeadroom * 30;

    // Prefer less loaded clusters
    score -= cluster.cpuUsage * 0.2;
    score -= cluster.memoryUsage * 0.2;

    // Prefer clusters with fewer active jobs
    const jobLoad = cluster.activeJobs / cluster.maxJobs;
    score -= jobLoad * 20;

    // Check GPU capability if required
    if (requirements.requiresGPU) {
        const hasGPU = cluster.capabilities.includes("gpu");
        if (!hasGPU) {
            return 0; // Cannot satisfy GPU requirement
        }
        score += 10; // Bonus for GPU capability when needed
    }

    return Math.max(0, score);
}

/**
 * Estimate total cores from cluster capabilities
 */
function estimateTotalCores(cluster: ClusterNode): number {
    // If we have capability hints, use them
    if (cluster.capabilities.includes("high-cpu")) return 64;
    if (cluster.capabilities.includes("medium-cpu")) return 32;
    if (cluster.capabilities.includes("low-cpu")) return 16;

    // Default assumption
    return 32;
}

/**
 * Estimate total memory from cluster capabilities
 */
function estimateTotalMemory(cluster: ClusterNode): number {
    // If we have capability hints, use them
    if (cluster.capabilities.includes("high-memory")) return 128;
    if (cluster.capabilities.includes("medium-memory")) return 64;
    if (cluster.capabilities.includes("low-memory")) return 32;

    // Default assumption
    return 64;
}

/**
 * Create a job execution request
 */
export interface JobExecutionRequest {
    workflowId: string;
    repositoryId: string;
    userId: string;
    yaml: string;
    repositoryUrl: string;
    branch?: string;
    userLimits: {
        cores: number;
        memoryGB: number;
    };
    env: Record<string, string>;
}

/**
 * Schedule a job for execution
 */
export async function scheduleJob(
    request: JobExecutionRequest,
    userTier: string
): Promise<{ success: boolean; message: string; clusterId?: string }> {
    // Get user limits
    const userLimits = getUserLimits(userTier);

    // Estimate resource requirements from limits (actual requirements determined by cluster)
    const estimatedResources: ResourceRequirements = {
        cores: Math.min(request.userLimits.cores, userLimits.maxCores),
        memoryMB: Math.min(request.userLimits.memoryGB * 1024, userLimits.maxMemoryGB * 1024),
        requiresGPU: false, // TODO: Detect from YAML
    };

    // Validate resource request
    const validation = validateResourceRequest(estimatedResources, userLimits);
    if (!validation.valid) {
        return {
            success: false,
            message: validation.reason!,
        };
    }

    // Find suitable cluster
    const decision = findSuitableCluster(estimatedResources);
    if (!decision.canRun || !decision.cluster) {
        return {
            success: false,
            message: decision.reason,
        };
    }

    // Send job to cluster
    try {
        const response = await fetch(`${decision.cluster.url}/execute`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                workflowId: request.workflowId,
                yaml: request.yaml,
                userLimits: request.userLimits,
                repositoryUrl: request.repositoryUrl,
                branch: request.branch || "main",
                env: request.env,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            return {
                success: false,
                message: error.error || "Failed to execute on cluster",
            };
        }

        console.log(`[Scheduler] Job sent to cluster ${decision.cluster.name}`);

        return {
            success: true,
            message: `Job scheduled on cluster '${decision.cluster.name}'`,
            clusterId: decision.cluster.id,
        };
    } catch (error: any) {
        return {
            success: false,
            message: `Failed to communicate with cluster: ${error.message}`,
        };
    }
}

/**
 * Get cluster statistics for monitoring
 */
export function getClusterStats() {
    const clusters = clusterRepo.listNodes();
    const online = clusters.filter(c => c.status === "online");

    const totalCores = online.reduce((sum, c) => sum + estimateTotalCores(c), 0);
    const totalMemoryGB = online.reduce((sum, c) => sum + estimateTotalMemory(c), 0);

    const avgCpuUsage = online.reduce((sum, c) => sum + c.cpuUsage, 0) / online.length || 0;
    const avgMemoryUsage = online.reduce((sum, c) => sum + c.memoryUsage, 0) / online.length || 0;

    const totalJobs = online.reduce((sum, c) => sum + c.activeJobs, 0);
    const maxJobs = online.reduce((sum, c) => sum + c.maxJobs, 0);

    return {
        totalClusters: clusters.length,
        onlineClusters: online.length,
        offlineClusters: clusters.length - online.length,
        totalCores,
        totalMemoryGB,
        avgCpuUsage: avgCpuUsage.toFixed(1),
        avgMemoryUsage: avgMemoryUsage.toFixed(1),
        activeJobs: totalJobs,
        maxJobs,
        utilizationRate: ((totalJobs / maxJobs) * 100).toFixed(1),
    };
}
