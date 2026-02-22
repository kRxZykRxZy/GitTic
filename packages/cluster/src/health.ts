/**
 * Health checking for cluster nodes.
 * Provides CPU, RAM, disk, and network health assessment
 * with an aggregate cluster health view.
 * @module
 */

import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Health status levels in order of severity */
export enum HealthStatus {
  Healthy = "healthy",
  Degraded = "degraded",
  Unhealthy = "unhealthy",
  Unknown = "unknown",
}

/** Health check result for a single component */
export interface ComponentHealth {
  /** Name of the component (cpu, memory, disk, network) */
  component: string;
  /** Health status */
  status: HealthStatus;
  /** Current value as a percentage (0-100) */
  value: number;
  /** Threshold that triggers degraded status */
  degradedThreshold: number;
  /** Threshold that triggers unhealthy status */
  unhealthyThreshold: number;
  /** Human-readable message */
  message: string;
}

/** Overall health report for a single node */
export interface NodeHealthReport {
  /** Node identifier */
  nodeId: string;
  /** Overall health status (worst of all components) */
  status: HealthStatus;
  /** Individual component health checks */
  components: ComponentHealth[];
  /** When the check was performed */
  checkedAt: number;
  /** Uptime in seconds */
  uptimeSeconds: number;
}

/** Thresholds for health determination */
export interface HealthThresholds {
  /** CPU usage percentage thresholds */
  cpu: { degraded: number; unhealthy: number };
  /** Memory usage percentage thresholds */
  memory: { degraded: number; unhealthy: number };
  /** Disk usage percentage thresholds */
  disk: { degraded: number; unhealthy: number };
}

/** Default thresholds for health checks */
const DEFAULT_THRESHOLDS: HealthThresholds = {
  cpu: { degraded: 70, unhealthy: 90 },
  memory: { degraded: 75, unhealthy: 90 },
  disk: { degraded: 80, unhealthy: 95 },
};

/**
 * Check the health of the current node.
 * Inspects CPU, memory, and disk utilization against configurable thresholds.
 * @param nodeId - Identifier for the node being checked
 * @param thresholds - Optional custom thresholds
 * @returns Complete health report for the node
 */
export async function checkNodeHealth(
  nodeId: string,
  thresholds: HealthThresholds = DEFAULT_THRESHOLDS
): Promise<NodeHealthReport> {
  const components: ComponentHealth[] = [];

  const cpuHealth = checkCpuHealth(thresholds.cpu);
  components.push(cpuHealth);

  const memoryHealth = checkMemoryHealth(thresholds.memory);
  components.push(memoryHealth);

  const diskHealth = await checkDiskHealth(thresholds.disk);
  components.push(diskHealth);

  const overallStatus = aggregateComponentStatus(components);

  return {
    nodeId,
    status: overallStatus,
    components,
    checkedAt: Date.now(),
    uptimeSeconds: os.uptime(),
  };
}

/**
 * Check CPU health by computing current usage from os.cpus().
 * @param thresholds - Degraded and unhealthy thresholds
 * @returns CPU component health
 */
function checkCpuHealth(thresholds: { degraded: number; unhealthy: number }): ComponentHealth {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  for (const cpu of cpus) {
    const { user, nice, sys, idle, irq } = cpu.times;
    totalTick += user + nice + sys + idle + irq;
    totalIdle += idle;
  }

  const usage = totalTick > 0 ? Math.round(((totalTick - totalIdle) / totalTick) * 100) : 0;
  const status = determineStatus(usage, thresholds);

  return {
    component: "cpu",
    status,
    value: usage,
    degradedThreshold: thresholds.degraded,
    unhealthyThreshold: thresholds.unhealthy,
    message: `CPU usage: ${usage}%`,
  };
}

/**
 * Check memory health by comparing used vs total system memory.
 * @param thresholds - Degraded and unhealthy thresholds
 * @returns Memory component health
 */
function checkMemoryHealth(thresholds: { degraded: number; unhealthy: number }): ComponentHealth {
  const total = os.totalmem();
  const free = os.freemem();
  const usage = Math.round(((total - free) / total) * 100);
  const status = determineStatus(usage, thresholds);

  return {
    component: "memory",
    status,
    value: usage,
    degradedThreshold: thresholds.degraded,
    unhealthyThreshold: thresholds.unhealthy,
    message: `Memory usage: ${usage}% (${formatBytes(total - free)}/${formatBytes(total)})`,
  };
}

/**
 * Check disk health using df command.
 * Falls back to unknown status if the command fails.
 * @param thresholds - Degraded and unhealthy thresholds
 * @returns Disk component health
 */
async function checkDiskHealth(
  thresholds: { degraded: number; unhealthy: number }
): Promise<ComponentHealth> {
  try {
    const { stdout } = await execFileAsync("df", ["-P", "/"]);
    const lines = stdout.trim().split("\n");
    if (lines.length < 2) throw new Error("Unexpected df output");

    const parts = lines[1].split(/\s+/);
    const usePercent = parseInt(parts[4], 10);
    const status = determineStatus(usePercent, thresholds);

    return {
      component: "disk",
      status,
      value: usePercent,
      degradedThreshold: thresholds.degraded,
      unhealthyThreshold: thresholds.unhealthy,
      message: `Disk usage: ${usePercent}%`,
    };
  } catch {
    return {
      component: "disk",
      status: HealthStatus.Unknown,
      value: 0,
      degradedThreshold: thresholds.degraded,
      unhealthyThreshold: thresholds.unhealthy,
      message: "Disk health check unavailable",
    };
  }
}

/**
 * Determine health status from a usage value and thresholds.
 */
function determineStatus(
  value: number,
  thresholds: { degraded: number; unhealthy: number }
): HealthStatus {
  if (value >= thresholds.unhealthy) return HealthStatus.Unhealthy;
  if (value >= thresholds.degraded) return HealthStatus.Degraded;
  return HealthStatus.Healthy;
}

/**
 * Compute the aggregate status from multiple component statuses.
 * Returns the worst status among all components.
 */
function aggregateComponentStatus(components: ComponentHealth[]): HealthStatus {
  const priority: Record<HealthStatus, number> = {
    [HealthStatus.Unhealthy]: 3,
    [HealthStatus.Degraded]: 2,
    [HealthStatus.Unknown]: 1,
    [HealthStatus.Healthy]: 0,
  };

  let worst = HealthStatus.Healthy;
  for (const c of components) {
    if (priority[c.status] > priority[worst]) {
      worst = c.status;
    }
  }
  return worst;
}

/**
 * Aggregate health reports from multiple nodes into a cluster-level summary.
 * @param reports - Individual node health reports
 * @returns Cluster health summary
 */
export function aggregateClusterHealth(reports: NodeHealthReport[]): {
  status: HealthStatus;
  totalNodes: number;
  healthyNodes: number;
  degradedNodes: number;
  unhealthyNodes: number;
  unknownNodes: number;
} {
  let healthy = 0;
  let degraded = 0;
  let unhealthy = 0;
  let unknown = 0;

  for (const report of reports) {
    switch (report.status) {
      case HealthStatus.Healthy:
        healthy++;
        break;
      case HealthStatus.Degraded:
        degraded++;
        break;
      case HealthStatus.Unhealthy:
        unhealthy++;
        break;
      default:
        unknown++;
    }
  }

  let status = HealthStatus.Healthy;
  if (unhealthy > 0) status = HealthStatus.Unhealthy;
  else if (degraded > 0) status = HealthStatus.Degraded;
  else if (unknown > 0 && healthy === 0) status = HealthStatus.Unknown;

  return {
    status,
    totalNodes: reports.length,
    healthyNodes: healthy,
    degradedNodes: degraded,
    unhealthyNodes: unhealthy,
    unknownNodes: unknown,
  };
}

/**
 * Format bytes into a human-readable string (KB, MB, GB).
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
}
