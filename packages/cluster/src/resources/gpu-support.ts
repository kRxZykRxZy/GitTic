/**
 * GPU support for cluster nodes.
 * Detects GPU availability, tracks GPU capabilities,
 * manages GPU job scheduling, and monitors utilization.
 * @module
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { EventEmitter } from "node:events";

const execFileAsync = promisify(execFile);

/** GPU device information */
export interface GpuDevice {
  /** Device index */
  index: number;
  /** Device name/model */
  name: string;
  /** Total memory in MB */
  totalMemoryMb: number;
  /** Available memory in MB */
  freeMemoryMb: number;
  /** Current utilization percentage (0-100) */
  utilizationPercent: number;
  /** Current temperature in Celsius */
  temperatureCelsius: number;
  /** Whether the device is available for jobs */
  available: boolean;
}

/** GPU capability flags for a node */
export interface GpuCapabilities {
  /** Whether the node has GPU support */
  hasGpu: boolean;
  /** Number of GPU devices */
  deviceCount: number;
  /** GPU driver version */
  driverVersion: string;
  /** CUDA version (if applicable) */
  cudaVersion: string | null;
  /** List of device details */
  devices: GpuDevice[];
  /** Aggregate total memory across all GPUs */
  totalMemoryMb: number;
  /** Last detection timestamp */
  detectedAt: number;
}

/** GPU job assignment */
export interface GpuJobAssignment {
  /** Job identifier */
  jobId: string;
  /** Assigned GPU device indices */
  deviceIndices: number[];
  /** GPU memory allocated in MB */
  allocatedMemoryMb: number;
  /** When the assignment was made */
  assignedAt: number;
}

/** GPU utilization snapshot */
export interface GpuUtilizationSnapshot {
  /** Node identifier */
  nodeId: string;
  /** Average utilization across GPUs */
  avgUtilization: number;
  /** Maximum utilization among GPUs */
  maxUtilization: number;
  /** Total free memory across GPUs */
  totalFreeMemoryMb: number;
  /** Number of GPUs in use */
  gpusInUse: number;
  /** Total GPUs available */
  totalGpus: number;
  /** When the snapshot was taken */
  timestamp: number;
}

/**
 * Manages GPU resources on cluster nodes.
 * Detects GPU hardware, tracks utilization, and schedules GPU jobs.
 */
export class GpuManager extends EventEmitter {
  private capabilities: GpuCapabilities | null = null;
  private readonly assignments = new Map<string, GpuJobAssignment>();
  private readonly utilizationHistory: GpuUtilizationSnapshot[] = [];
  private readonly maxHistory: number;
  private monitorTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * @param maxHistory - Maximum utilization snapshots to retain (default: 720)
   */
  constructor(maxHistory: number = 720) {
    super();
    this.maxHistory = maxHistory;
  }

  /**
   * Detect GPU devices on the current system.
   * Uses nvidia-smi for NVIDIA GPUs. Returns empty capabilities
   * if no GPUs are detected or the tool is unavailable.
   * @returns GPU capabilities of the current node
   */
  async detect(): Promise<GpuCapabilities> {
    try {
      const { stdout } = await execFileAsync("nvidia-smi", [
        "--query-gpu=index,name,memory.total,memory.free,utilization.gpu,temperature.gpu",
        "--format=csv,noheader,nounits",
      ]);

      const lines = stdout.trim().split("\n").filter((l) => l.length > 0);
      const devices: GpuDevice[] = lines.map((line) => {
        const parts = line.split(",").map((s) => s.trim());
        return {
          index: parseInt(parts[0], 10),
          name: parts[1] ?? "Unknown GPU",
          totalMemoryMb: parseInt(parts[2], 10) || 0,
          freeMemoryMb: parseInt(parts[3], 10) || 0,
          utilizationPercent: parseInt(parts[4], 10) || 0,
          temperatureCelsius: parseInt(parts[5], 10) || 0,
          available: true,
        };
      });

      const driverVersion = await this.getDriverVersion();

      this.capabilities = {
        hasGpu: devices.length > 0,
        deviceCount: devices.length,
        driverVersion,
        cudaVersion: await this.getCudaVersion(),
        devices,
        totalMemoryMb: devices.reduce((sum, d) => sum + d.totalMemoryMb, 0),
        detectedAt: Date.now(),
      };
    } catch {
      this.capabilities = {
        hasGpu: false,
        deviceCount: 0,
        driverVersion: "",
        cudaVersion: null,
        devices: [],
        totalMemoryMb: 0,
        detectedAt: Date.now(),
      };
    }

    return this.capabilities;
  }

  /**
   * Get cached GPU capabilities.
   */
  getCapabilities(): GpuCapabilities | null {
    return this.capabilities;
  }

  /**
   * Allocate GPU device(s) for a job.
   * @param jobId - Job identifier
   * @param requiredDevices - Number of GPUs needed
   * @param requiredMemoryMb - Minimum GPU memory needed per device
   * @returns Assignment, or null if insufficient resources
   */
  allocate(
    jobId: string,
    requiredDevices: number = 1,
    requiredMemoryMb: number = 0
  ): GpuJobAssignment | null {
    if (!this.capabilities || !this.capabilities.hasGpu) return null;

    const usedIndices = new Set<number>();
    for (const assignment of this.assignments.values()) {
      for (const idx of assignment.deviceIndices) {
        usedIndices.add(idx);
      }
    }

    const available = this.capabilities.devices.filter(
      (d) =>
        d.available &&
        !usedIndices.has(d.index) &&
        d.freeMemoryMb >= requiredMemoryMb
    );

    if (available.length < requiredDevices) return null;

    const selected = available.slice(0, requiredDevices);
    const assignment: GpuJobAssignment = {
      jobId,
      deviceIndices: selected.map((d) => d.index),
      allocatedMemoryMb: selected.reduce((sum, d) => sum + d.freeMemoryMb, 0),
      assignedAt: Date.now(),
    };

    this.assignments.set(jobId, assignment);
    this.emit("gpu:allocated", assignment);
    return assignment;
  }

  /**
   * Release GPU devices from a completed job.
   * @param jobId - Job identifier
   */
  release(jobId: string): boolean {
    const removed = this.assignments.delete(jobId);
    if (removed) {
      this.emit("gpu:released", jobId);
    }
    return removed;
  }

  /**
   * Get a utilization snapshot for the current node.
   * @param nodeId - Node identifier
   */
  getUtilization(nodeId: string): GpuUtilizationSnapshot | null {
    if (!this.capabilities || !this.capabilities.hasGpu) return null;

    const devices = this.capabilities.devices;
    const usedIndices = new Set<number>();
    for (const assignment of this.assignments.values()) {
      for (const idx of assignment.deviceIndices) {
        usedIndices.add(idx);
      }
    }

    const avgUtil = devices.length > 0
      ? Math.round(devices.reduce((sum, d) => sum + d.utilizationPercent, 0) / devices.length)
      : 0;
    const maxUtil = devices.reduce((max, d) => Math.max(max, d.utilizationPercent), 0);
    const totalFree = devices.reduce((sum, d) => sum + d.freeMemoryMb, 0);

    const snapshot: GpuUtilizationSnapshot = {
      nodeId,
      avgUtilization: avgUtil,
      maxUtilization: maxUtil,
      totalFreeMemoryMb: totalFree,
      gpusInUse: usedIndices.size,
      totalGpus: devices.length,
      timestamp: Date.now(),
    };

    this.utilizationHistory.push(snapshot);
    if (this.utilizationHistory.length > this.maxHistory) {
      this.utilizationHistory.splice(0, this.utilizationHistory.length - this.maxHistory);
    }

    return snapshot;
  }

  /**
   * Get the NVIDIA driver version.
   */
  private async getDriverVersion(): Promise<string> {
    try {
      const { stdout } = await execFileAsync("nvidia-smi", [
        "--query-gpu=driver_version",
        "--format=csv,noheader",
      ]);
      return stdout.trim().split("\n")[0] ?? "";
    } catch {
      return "";
    }
  }

  /**
   * Get the CUDA version from nvidia-smi.
   */
  private async getCudaVersion(): Promise<string | null> {
    try {
      const { stdout } = await execFileAsync("nvidia-smi", []);
      const match = stdout.match(/CUDA Version:\s*([\d.]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Start periodic GPU monitoring.
   * @param nodeId - Node identifier
   * @param intervalMs - Monitoring interval (default: 30s)
   */
  startMonitoring(nodeId: string, intervalMs: number = 30_000): void {
    if (this.monitorTimer) return;

    this.monitorTimer = setInterval(async () => {
      await this.detect();
      this.getUtilization(nodeId);
    }, intervalMs);
  }

  /**
   * Stop GPU monitoring.
   */
  stopMonitoring(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
  }

  /**
   * Get the number of available (unallocated) GPU devices.
   */
  getAvailableDeviceCount(): number {
    if (!this.capabilities) return 0;

    const usedIndices = new Set<number>();
    for (const assignment of this.assignments.values()) {
      for (const idx of assignment.deviceIndices) {
        usedIndices.add(idx);
      }
    }

    return this.capabilities.devices.filter(
      (d) => d.available && !usedIndices.has(d.index)
    ).length;
  }
}
