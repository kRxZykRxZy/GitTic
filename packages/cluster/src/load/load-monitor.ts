/**
 * System load monitoring for cluster nodes.
 * Tracks CPU load averages, memory pressure, disk usage,
 * I/O wait, and fires threshold alerts.
 * @module
 */

import os from "node:os";
import { EventEmitter } from "node:events";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Thresholds for load alerts */
export interface LoadThresholds {
  /** CPU load average (1-min) that triggers a warning */
  cpuWarning: number;
  /** CPU load average (1-min) that triggers a critical alert */
  cpuCritical: number;
  /** Memory usage percentage that triggers a warning */
  memoryWarning: number;
  /** Memory usage percentage that triggers a critical alert */
  memoryCritical: number;
  /** Disk usage percentage that triggers a warning */
  diskWarning: number;
  /** Disk usage percentage that triggers a critical alert */
  diskCritical: number;
}

/** Snapshot of system load */
export interface LoadSnapshot {
  /** 1-minute load average */
  loadAvg1: number;
  /** 5-minute load average */
  loadAvg5: number;
  /** 15-minute load average */
  loadAvg15: number;
  /** Memory usage percentage */
  memoryUsagePercent: number;
  /** Available memory in bytes */
  memoryAvailableBytes: number;
  /** Disk usage percentage for root filesystem */
  diskUsagePercent: number;
  /** Number of CPU cores */
  cpuCount: number;
  /** Timestamp of snapshot */
  timestamp: number;
}

/** Alert severity levels */
export type AlertSeverity = "warning" | "critical";

/** Load alert emitted when a threshold is breached */
export interface LoadAlert {
  /** Component that triggered the alert */
  component: "cpu" | "memory" | "disk";
  /** Severity level */
  severity: AlertSeverity;
  /** Current value */
  currentValue: number;
  /** Threshold that was breached */
  threshold: number;
  /** When the alert fired */
  timestamp: number;
  /** Description */
  message: string;
}

/** Default load thresholds */
const DEFAULT_THRESHOLDS: LoadThresholds = {
  cpuWarning: 0.7,
  cpuCritical: 0.9,
  memoryWarning: 75,
  memoryCritical: 90,
  diskWarning: 80,
  diskCritical: 95,
};

/**
 * Monitors system load and emits alerts when thresholds are breached.
 * Periodically samples CPU, memory, and disk usage.
 */
export class LoadMonitor extends EventEmitter {
  private thresholds: LoadThresholds;
  private monitorTimer: ReturnType<typeof setInterval> | null = null;
  private readonly history: LoadSnapshot[] = [];
  private readonly maxHistory: number;
  private readonly activeAlerts = new Map<string, LoadAlert>();

  /**
   * @param thresholds - Custom alert thresholds
   * @param maxHistory - Maximum snapshots to retain (default: 720)
   */
  constructor(
    thresholds: Partial<LoadThresholds> = {},
    maxHistory: number = 720
  ) {
    super();
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.maxHistory = maxHistory;
  }

  /**
   * Start periodic load monitoring.
   * @param intervalMs - Sampling interval in milliseconds (default: 10s)
   */
  start(intervalMs: number = 10_000): void {
    if (this.monitorTimer) return;

    this.monitorTimer = setInterval(async () => {
      try {
        const snapshot = await this.takeSnapshot();
        this.checkThresholds(snapshot);
      } catch (err) {
        this.emit("error", err);
      }
    }, intervalMs);
  }

  /**
   * Stop periodic monitoring.
   */
  stop(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
  }

  /**
   * Take a single load snapshot of the current system.
   * @returns Current load snapshot
   */
  async takeSnapshot(): Promise<LoadSnapshot> {
    const [loadAvg1, loadAvg5, loadAvg15] = os.loadavg();
    const cpuCount = os.cpus().length;
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsagePercent = Math.round(((totalMem - freeMem) / totalMem) * 100);
    const diskUsagePercent = await this.getDiskUsage();

    const snapshot: LoadSnapshot = {
      loadAvg1: Math.round(loadAvg1 * 100) / 100,
      loadAvg5: Math.round(loadAvg5 * 100) / 100,
      loadAvg15: Math.round(loadAvg15 * 100) / 100,
      memoryUsagePercent,
      memoryAvailableBytes: freeMem,
      diskUsagePercent,
      cpuCount,
      timestamp: Date.now(),
    };

    this.history.push(snapshot);
    if (this.history.length > this.maxHistory) {
      this.history.splice(0, this.history.length - this.maxHistory);
    }

    this.emit("snapshot", snapshot);
    return snapshot;
  }

  /**
   * Check load snapshot against thresholds and emit alerts as needed.
   * @param snapshot - Load snapshot to evaluate
   */
  private checkThresholds(snapshot: LoadSnapshot): void {
    const normalizedLoad = snapshot.loadAvg1 / snapshot.cpuCount;

    this.evaluateThreshold(
      "cpu",
      normalizedLoad,
      this.thresholds.cpuWarning,
      this.thresholds.cpuCritical,
      `CPU load average: ${snapshot.loadAvg1} (normalized: ${normalizedLoad.toFixed(2)})`
    );

    this.evaluateThreshold(
      "memory",
      snapshot.memoryUsagePercent,
      this.thresholds.memoryWarning,
      this.thresholds.memoryCritical,
      `Memory usage: ${snapshot.memoryUsagePercent}%`
    );

    this.evaluateThreshold(
      "disk",
      snapshot.diskUsagePercent,
      this.thresholds.diskWarning,
      this.thresholds.diskCritical,
      `Disk usage: ${snapshot.diskUsagePercent}%`
    );
  }

  /**
   * Evaluate a single metric against warning and critical thresholds.
   */
  private evaluateThreshold(
    component: LoadAlert["component"],
    value: number,
    warningThreshold: number,
    criticalThreshold: number,
    message: string
  ): void {
    const alertKey = component;

    if (value >= criticalThreshold) {
      const alert: LoadAlert = {
        component,
        severity: "critical",
        currentValue: value,
        threshold: criticalThreshold,
        timestamp: Date.now(),
        message,
      };
      this.activeAlerts.set(alertKey, alert);
      this.emit("alert", alert);
    } else if (value >= warningThreshold) {
      const alert: LoadAlert = {
        component,
        severity: "warning",
        currentValue: value,
        threshold: warningThreshold,
        timestamp: Date.now(),
        message,
      };
      this.activeAlerts.set(alertKey, alert);
      this.emit("alert", alert);
    } else if (this.activeAlerts.has(alertKey)) {
      this.activeAlerts.delete(alertKey);
      this.emit("alert:resolved", component);
    }
  }

  /**
   * Get current active alerts.
   */
  getActiveAlerts(): LoadAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get load history.
   * @param limit - Maximum entries to return
   */
  getHistory(limit?: number): LoadSnapshot[] {
    if (limit && limit < this.history.length) {
      return this.history.slice(-limit);
    }
    return [...this.history];
  }

  /**
   * Get disk usage percentage via the df command.
   */
  private async getDiskUsage(): Promise<number> {
    try {
      const { stdout } = await execFileAsync("df", ["-P", "/"]);
      const lines = stdout.trim().split("\n");
      if (lines.length < 2) return 0;
      const parts = lines[1].split(/\s+/);
      return parseInt(parts[4], 10) || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Update thresholds at runtime.
   * @param thresholds - Partial threshold update
   */
  updateThresholds(thresholds: Partial<LoadThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }
}
