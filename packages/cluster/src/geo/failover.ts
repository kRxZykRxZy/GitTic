/**
 * Failover handling for cluster regions.
 * Detects region failures, triggers automatic failover to backup regions,
 * and manages failback when primary regions recover.
 * @module
 */

import { EventEmitter } from "node:events";

/** Failover state for a region */
export enum FailoverState {
  /** Region is operating normally */
  Normal = "normal",
  /** Region has been detected as degraded */
  Degraded = "degraded",
  /** Failover is in progress */
  FailingOver = "failing-over",
  /** Traffic has been routed to backup region */
  FailedOver = "failed-over",
  /** Region is recovering, failback in progress */
  FailingBack = "failing-back",
}

/** Failover configuration per region */
export interface FailoverConfig {
  /** Region identifier */
  regionId: string;
  /** Backup region for failover */
  backupRegionId: string;
  /** Number of consecutive failures before triggering failover */
  failureThreshold: number;
  /** Health check interval in ms */
  checkIntervalMs: number;
  /** Minimum time in failed-over state before attempting failback (ms) */
  failbackDelayMs: number;
  /** Number of consecutive successes before failback */
  recoveryThreshold: number;
}

/** Health check result */
export interface HealthCheckResult {
  /** Region identifier */
  regionId: string;
  /** Whether the check passed */
  healthy: boolean;
  /** Response time in ms */
  responseTimeMs: number;
  /** Number of healthy nodes */
  healthyNodes: number;
  /** Total nodes */
  totalNodes: number;
  /** When the check was performed */
  checkedAt: number;
}

/** Failover event record */
export interface FailoverEvent {
  /** Source region */
  fromRegion: string;
  /** Target backup region */
  toRegion: string;
  /** State transition */
  state: FailoverState;
  /** Reason for the event */
  reason: string;
  /** When the event occurred */
  timestamp: number;
}

/** Internal state for a region's failover tracking */
interface RegionFailoverState {
  config: FailoverConfig;
  state: FailoverState;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  failedOverAt: number | null;
  lastCheckAt: number | null;
  events: FailoverEvent[];
}

/**
 * Manages failover detection and recovery for cluster regions.
 * Monitors region health and automatically fails over to backup
 * regions when primary regions become unhealthy.
 */
export class FailoverManager extends EventEmitter {
  private readonly regions = new Map<string, RegionFailoverState>();
  private readonly maxEventHistory: number;

  /**
   * @param maxEventHistory - Maximum failover events per region (default: 100)
   */
  constructor(maxEventHistory: number = 100) {
    super();
    this.maxEventHistory = maxEventHistory;
  }

  /**
   * Register a region for failover monitoring.
   * @param config - Failover configuration
   */
  registerRegion(config: FailoverConfig): void {
    this.regions.set(config.regionId, {
      config,
      state: FailoverState.Normal,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      failedOverAt: null,
      lastCheckAt: null,
      events: [],
    });
  }

  /**
   * Process a health check result for a region.
   * Evaluates whether to trigger failover or failback based on
   * the check result and current state.
   * @param result - Health check result
   * @returns New failover state after processing
   */
  processHealthCheck(result: HealthCheckResult): FailoverState {
    const region = this.regions.get(result.regionId);
    if (!region) return FailoverState.Normal;

    region.lastCheckAt = result.checkedAt;

    if (result.healthy) {
      return this.handleHealthyCheck(region, result);
    } else {
      return this.handleUnhealthyCheck(region, result);
    }
  }

  /**
   * Handle a healthy check result.
   * Resets failure counter and may trigger failback.
   */
  private handleHealthyCheck(
    region: RegionFailoverState,
    result: HealthCheckResult
  ): FailoverState {
    region.consecutiveFailures = 0;
    region.consecutiveSuccesses++;

    if (region.state === FailoverState.FailedOver) {
      const now = Date.now();
      const failedOverDuration = region.failedOverAt
        ? now - region.failedOverAt
        : 0;

      if (
        failedOverDuration >= region.config.failbackDelayMs &&
        region.consecutiveSuccesses >= region.config.recoveryThreshold
      ) {
        this.transitionState(region, FailoverState.FailingBack, "Region recovered");
        // After failback confirmation, return to normal
        this.transitionState(region, FailoverState.Normal, "Failback complete");
        region.failedOverAt = null;
      }
    } else if (region.state === FailoverState.Degraded) {
      this.transitionState(region, FailoverState.Normal, "Health restored");
    }

    return region.state;
  }

  /**
   * Handle an unhealthy check result.
   * Increments failure counter and may trigger failover.
   */
  private handleUnhealthyCheck(
    region: RegionFailoverState,
    result: HealthCheckResult
  ): FailoverState {
    region.consecutiveSuccesses = 0;
    region.consecutiveFailures++;

    if (
      region.state === FailoverState.Normal &&
      region.consecutiveFailures >= Math.ceil(region.config.failureThreshold / 2)
    ) {
      this.transitionState(region, FailoverState.Degraded, "Elevated failure rate");
    }

    if (region.consecutiveFailures >= region.config.failureThreshold) {
      if (
        region.state !== FailoverState.FailedOver &&
        region.state !== FailoverState.FailingOver
      ) {
        this.transitionState(
          region,
          FailoverState.FailingOver,
          `${region.consecutiveFailures} consecutive failures`
        );
        this.transitionState(
          region,
          FailoverState.FailedOver,
          `Failover to ${region.config.backupRegionId}`
        );
        region.failedOverAt = Date.now();
      }
    }

    return region.state;
  }

  /**
   * Transition a region to a new failover state.
   */
  private transitionState(
    region: RegionFailoverState,
    newState: FailoverState,
    reason: string
  ): void {
    const event: FailoverEvent = {
      fromRegion: region.config.regionId,
      toRegion: region.config.backupRegionId,
      state: newState,
      reason,
      timestamp: Date.now(),
    };

    region.state = newState;
    region.events.push(event);

    if (region.events.length > this.maxEventHistory) {
      region.events.splice(0, region.events.length - this.maxEventHistory);
    }

    this.emit("failover:event", event);
  }

  /**
   * Get the current failover state for a region.
   * @param regionId - Region identifier
   */
  getState(regionId: string): FailoverState | undefined {
    return this.regions.get(regionId)?.state;
  }

  /**
   * Get the active target region (backup if failed over, primary otherwise).
   * @param regionId - Primary region identifier
   * @returns The region that should receive traffic
   */
  getActiveRegion(regionId: string): string {
    const region = this.regions.get(regionId);
    if (!region) return regionId;

    if (region.state === FailoverState.FailedOver) {
      return region.config.backupRegionId;
    }

    return regionId;
  }

  /**
   * Get failover event history for a region.
   * @param regionId - Region identifier
   * @param limit - Maximum events to return
   */
  getEvents(regionId: string, limit?: number): FailoverEvent[] {
    const region = this.regions.get(regionId);
    if (!region) return [];

    const events = region.events;
    if (limit && limit < events.length) {
      return events.slice(-limit);
    }
    return [...events];
  }

  /**
   * Force a failover for a region (manual trigger).
   * @param regionId - Region to fail over
   * @param reason - Reason for manual failover
   */
  forceFailover(regionId: string, reason: string = "manual trigger"): boolean {
    const region = this.regions.get(regionId);
    if (!region) return false;

    this.transitionState(region, FailoverState.FailingOver, reason);
    this.transitionState(region, FailoverState.FailedOver, reason);
    region.failedOverAt = Date.now();
    return true;
  }

  /**
   * Force a failback for a region (manual trigger).
   * @param regionId - Region to fail back
   */
  forceFailback(regionId: string): boolean {
    const region = this.regions.get(regionId);
    if (!region || region.state !== FailoverState.FailedOver) return false;

    this.transitionState(region, FailoverState.FailingBack, "Manual failback");
    this.transitionState(region, FailoverState.Normal, "Manual failback complete");
    region.failedOverAt = null;
    return true;
  }

  /**
   * Get all regions currently in a failed-over state.
   */
  getFailedOverRegions(): string[] {
    const result: string[] = [];
    for (const [regionId, state] of this.regions) {
      if (state.state === FailoverState.FailedOver) {
        result.push(regionId);
      }
    }
    return result;
  }
}
