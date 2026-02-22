/**
 * Geographic routing for cluster requests.
 * Routes requests to the nearest or most appropriate region
 * based on latency, capacity, and failover rules.
 * @module
 */

import { createHash } from "node:crypto";

/** Latency measurement between source and region */
export interface LatencyEntry {
  /** Source identifier (user location, IP range, etc.) */
  sourceId: string;
  /** Target region identifier */
  regionId: string;
  /** Measured latency in milliseconds */
  latencyMs: number;
  /** When the measurement was taken */
  measuredAt: number;
}

/** Routing decision result */
export interface RoutingDecision {
  /** Selected region ID */
  regionId: string;
  /** Reason for selection */
  reason: string;
  /** Estimated latency to selected region */
  estimatedLatencyMs: number | null;
  /** Alternative regions in preference order */
  alternatives: string[];
  /** Whether failover was triggered */
  failover: boolean;
}

/** Region health status for routing */
export interface RegionHealthStatus {
  /** Region identifier */
  regionId: string;
  /** Whether the region is available for routing */
  available: boolean;
  /** Current load percentage (0-100) */
  loadPercent: number;
  /** Number of healthy nodes */
  healthyNodes: number;
}

/** Configuration for the geo router */
export interface GeoRouterConfig {
  /** Maximum allowed latency before considering alternatives (ms) */
  maxAcceptableLatencyMs: number;
  /** Load threshold above which to prefer alternative regions */
  loadThresholdPercent: number;
  /** How long latency measurements remain valid (ms) */
  latencyTtlMs: number;
  /** Default region when no routing data is available */
  defaultRegion: string;
}

/** Default router configuration */
const DEFAULT_CONFIG: GeoRouterConfig = {
  maxAcceptableLatencyMs: 200,
  loadThresholdPercent: 85,
  latencyTtlMs: 300_000,
  defaultRegion: "us-east",
};

/**
 * Routes requests to the most appropriate geographic region.
 * Uses latency measurements, region health, and capacity to make
 * routing decisions with automatic failover.
 */
export class GeoRouter {
  private readonly config: GeoRouterConfig;
  private readonly latencyMap = new Map<string, LatencyEntry[]>();
  private readonly regionHealth = new Map<string, RegionHealthStatus>();

  /**
   * @param config - Partial router configuration (merged with defaults)
   */
  constructor(config: Partial<GeoRouterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Record a latency measurement from a source to a region.
   * @param sourceId - Source identifier
   * @param regionId - Target region
   * @param latencyMs - Measured latency in milliseconds
   */
  recordLatency(sourceId: string, regionId: string, latencyMs: number): void {
    const key = sourceId;
    let entries = this.latencyMap.get(key);
    if (!entries) {
      entries = [];
      this.latencyMap.set(key, entries);
    }

    entries.push({
      sourceId,
      regionId,
      latencyMs,
      measuredAt: Date.now(),
    });

    // Limit entries per source
    if (entries.length > 100) {
      entries.splice(0, entries.length - 100);
    }
  }

  /**
   * Update the health status of a region.
   * @param status - Region health status
   */
  updateRegionHealth(status: RegionHealthStatus): void {
    this.regionHealth.set(status.regionId, status);
  }

  /**
   * Route a request to the best region.
   * Considers latency, health, and load to select the optimal target.
   * @param sourceId - Source identifier
   * @param requiredRegion - Optional hard requirement for a specific region
   * @returns Routing decision
   */
  route(sourceId: string, requiredRegion?: string): RoutingDecision {
    // If a specific region is required and available, use it
    if (requiredRegion) {
      const health = this.regionHealth.get(requiredRegion);
      if (health?.available) {
        return {
          regionId: requiredRegion,
          reason: "required-region",
          estimatedLatencyMs: this.getAverageLatency(sourceId, requiredRegion),
          alternatives: this.getAlternatives(requiredRegion),
          failover: false,
        };
      }
      // Required region unavailable, failover
      return this.failoverRoute(sourceId, requiredRegion);
    }

    // Find the best region by latency
    const candidates = this.rankRegionsByLatency(sourceId);

    for (const candidate of candidates) {
      const health = this.regionHealth.get(candidate.regionId);

      if (!health || !health.available) continue;
      if (health.loadPercent > this.config.loadThresholdPercent) continue;

      return {
        regionId: candidate.regionId,
        reason: "latency-optimal",
        estimatedLatencyMs: candidate.avgLatencyMs,
        alternatives: candidates
          .filter((c) => c.regionId !== candidate.regionId)
          .map((c) => c.regionId),
        failover: false,
      };
    }

    // No optimal region found, use any available region
    for (const [regionId, health] of this.regionHealth) {
      if (health.available && health.healthyNodes > 0) {
        return {
          regionId,
          reason: "best-available",
          estimatedLatencyMs: this.getAverageLatency(sourceId, regionId),
          alternatives: [],
          failover: true,
        };
      }
    }

    // Last resort: default region
    return {
      regionId: this.config.defaultRegion,
      reason: "default-fallback",
      estimatedLatencyMs: null,
      alternatives: [],
      failover: true,
    };
  }

  /**
   * Handle failover when a required region is unavailable.
   */
  private failoverRoute(sourceId: string, failedRegion: string): RoutingDecision {
    const alternatives = this.getAlternatives(failedRegion);

    for (const altRegion of alternatives) {
      const health = this.regionHealth.get(altRegion);
      if (health?.available && health.healthyNodes > 0) {
        return {
          regionId: altRegion,
          reason: `failover-from-${failedRegion}`,
          estimatedLatencyMs: this.getAverageLatency(sourceId, altRegion),
          alternatives: alternatives.filter((r) => r !== altRegion),
          failover: true,
        };
      }
    }

    return {
      regionId: this.config.defaultRegion,
      reason: "failover-default",
      estimatedLatencyMs: null,
      alternatives: [],
      failover: true,
    };
  }

  /**
   * Rank regions by average latency from a source.
   * Filters out stale measurements.
   */
  private rankRegionsByLatency(sourceId: string): Array<{ regionId: string; avgLatencyMs: number }> {
    const entries = this.latencyMap.get(sourceId) ?? [];
    const now = Date.now();
    const valid = entries.filter((e) => now - e.measuredAt < this.config.latencyTtlMs);

    const regionLatencies = new Map<string, number[]>();
    for (const entry of valid) {
      let list = regionLatencies.get(entry.regionId);
      if (!list) {
        list = [];
        regionLatencies.set(entry.regionId, list);
      }
      list.push(entry.latencyMs);
    }

    const ranked: Array<{ regionId: string; avgLatencyMs: number }> = [];
    for (const [regionId, latencies] of regionLatencies) {
      const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
      ranked.push({ regionId, avgLatencyMs: avg });
    }

    return ranked.sort((a, b) => a.avgLatencyMs - b.avgLatencyMs);
  }

  /**
   * Get the average latency from a source to a region.
   */
  private getAverageLatency(sourceId: string, regionId: string): number | null {
    const entries = this.latencyMap.get(sourceId) ?? [];
    const now = Date.now();
    const valid = entries.filter(
      (e) => e.regionId === regionId && now - e.measuredAt < this.config.latencyTtlMs
    );

    if (valid.length === 0) return null;
    return Math.round(valid.reduce((sum, e) => sum + e.latencyMs, 0) / valid.length);
  }

  /**
   * Get alternative regions sorted by available health data.
   */
  private getAlternatives(excludeRegion: string): string[] {
    return Array.from(this.regionHealth.entries())
      .filter(([id, h]) => id !== excludeRegion && h.available)
      .sort((a, b) => a[1].loadPercent - b[1].loadPercent)
      .map(([id]) => id);
  }

  /**
   * Consistent hash routing for deterministic region selection.
   * Useful for cache-friendly routing where the same key always
   * routes to the same region.
   * @param key - Routing key
   * @param availableRegions - List of available region IDs
   * @returns Selected region ID
   */
  consistentHashRoute(key: string, availableRegions: string[]): string {
    if (availableRegions.length === 0) return this.config.defaultRegion;

    const hash = createHash("sha256").update(key).digest("hex");
    const index = parseInt(hash.substring(0, 8), 16) % availableRegions.length;
    return availableRegions[index];
  }

  /**
   * Clean up stale latency entries.
   * @returns Number of entries removed
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [sourceId, entries] of this.latencyMap) {
      const before = entries.length;
      const filtered = entries.filter((e) => now - e.measuredAt < this.config.latencyTtlMs);
      removed += before - filtered.length;

      if (filtered.length === 0) {
        this.latencyMap.delete(sourceId);
      } else {
        this.latencyMap.set(sourceId, filtered);
      }
    }

    return removed;
  }
}
