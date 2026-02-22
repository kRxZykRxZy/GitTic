/**
 * Region management for geographic cluster distribution.
 * Defines regions, assigns nodes, and tracks regional capacity.
 * @module
 */

import { EventEmitter } from "node:events";

/** Region definition */
export interface Region {
  /** Unique region identifier (e.g., "us-east", "eu-west") */
  id: string;
  /** Display name */
  name: string;
  /** Geographic description */
  location: string;
  /** Whether this region is active */
  active: boolean;
  /** Maximum nodes allowed in this region */
  maxNodes: number;
  /** Priority for failover (lower = preferred) */
  failoverPriority: number;
  /** Region metadata */
  metadata: Record<string, unknown>;
}

/** Node assignment to a region */
export interface RegionNodeAssignment {
  /** Node identifier */
  nodeId: string;
  /** Region identifier */
  regionId: string;
  /** When the node was assigned */
  assignedAt: number;
  /** Whether the node is healthy */
  healthy: boolean;
}

/** Capacity summary for a region */
export interface RegionCapacity {
  /** Region identifier */
  regionId: string;
  /** Total nodes assigned */
  totalNodes: number;
  /** Healthy nodes */
  healthyNodes: number;
  /** Maximum nodes allowed */
  maxNodes: number;
  /** Utilization percentage */
  utilizationPercent: number;
  /** Whether the region has available capacity */
  hasCapacity: boolean;
}

/**
 * Manages geographic regions and node assignments.
 * Tracks capacity per region and supports failover prioritization.
 */
export class RegionManager extends EventEmitter {
  private readonly regions = new Map<string, Region>();
  private readonly assignments = new Map<string, RegionNodeAssignment>();

  /**
   * Add or update a region definition.
   * @param region - Region definition
   */
  addRegion(region: Region): void {
    this.regions.set(region.id, region);
    this.emit("region:added", region);
  }

  /**
   * Remove a region. Fails if nodes are still assigned.
   * @param regionId - Region identifier
   * @returns True if removed, false if not found or has nodes
   */
  removeRegion(regionId: string): boolean {
    const assignedNodes = this.getNodesInRegion(regionId);
    if (assignedNodes.length > 0) return false;

    const removed = this.regions.delete(regionId);
    if (removed) {
      this.emit("region:removed", regionId);
    }
    return removed;
  }

  /**
   * Get a region by ID.
   * @param regionId - Region identifier
   */
  getRegion(regionId: string): Region | undefined {
    return this.regions.get(regionId);
  }

  /**
   * List all regions.
   * @param activeOnly - If true, only return active regions
   */
  listRegions(activeOnly: boolean = false): Region[] {
    const all = Array.from(this.regions.values());
    if (activeOnly) return all.filter((r) => r.active);
    return all;
  }

  /**
   * Assign a node to a region.
   * @param nodeId - Node identifier
   * @param regionId - Region to assign to
   * @returns The assignment, or null if region is at capacity
   */
  assignNode(nodeId: string, regionId: string): RegionNodeAssignment | null {
    const region = this.regions.get(regionId);
    if (!region || !region.active) return null;

    const currentNodes = this.getNodesInRegion(regionId);
    if (currentNodes.length >= region.maxNodes) return null;

    // Remove existing assignment if re-assigning
    this.unassignNode(nodeId);

    const assignment: RegionNodeAssignment = {
      nodeId,
      regionId,
      assignedAt: Date.now(),
      healthy: true,
    };

    this.assignments.set(nodeId, assignment);
    this.emit("node:assigned", assignment);

    return assignment;
  }

  /**
   * Remove a node from its region.
   * @param nodeId - Node identifier
   * @returns True if the node was assigned and removed
   */
  unassignNode(nodeId: string): boolean {
    const removed = this.assignments.delete(nodeId);
    if (removed) {
      this.emit("node:unassigned", nodeId);
    }
    return removed;
  }

  /**
   * Update the health status of a node.
   * @param nodeId - Node identifier
   * @param healthy - Whether the node is healthy
   */
  setNodeHealth(nodeId: string, healthy: boolean): boolean {
    const assignment = this.assignments.get(nodeId);
    if (!assignment) return false;
    assignment.healthy = healthy;
    return true;
  }

  /**
   * Get all node assignments in a region.
   * @param regionId - Region identifier
   */
  getNodesInRegion(regionId: string): RegionNodeAssignment[] {
    return Array.from(this.assignments.values()).filter(
      (a) => a.regionId === regionId
    );
  }

  /**
   * Get the region assignment for a specific node.
   * @param nodeId - Node identifier
   */
  getNodeRegion(nodeId: string): RegionNodeAssignment | undefined {
    return this.assignments.get(nodeId);
  }

  /**
   * Get capacity information for a region.
   * @param regionId - Region identifier
   */
  getCapacity(regionId: string): RegionCapacity | null {
    const region = this.regions.get(regionId);
    if (!region) return null;

    const nodes = this.getNodesInRegion(regionId);
    const healthyCount = nodes.filter((n) => n.healthy).length;
    const utilization = region.maxNodes > 0
      ? Math.round((nodes.length / region.maxNodes) * 100)
      : 0;

    return {
      regionId,
      totalNodes: nodes.length,
      healthyNodes: healthyCount,
      maxNodes: region.maxNodes,
      utilizationPercent: utilization,
      hasCapacity: nodes.length < region.maxNodes,
    };
  }

  /**
   * Get capacity for all active regions.
   */
  getAllCapacities(): RegionCapacity[] {
    const capacities: RegionCapacity[] = [];
    for (const region of this.regions.values()) {
      if (region.active) {
        const cap = this.getCapacity(region.id);
        if (cap) capacities.push(cap);
      }
    }
    return capacities;
  }

  /**
   * Get regions ordered by failover priority.
   * Excludes the specified region (the failing one).
   * @param excludeRegionId - Region to exclude from failover targets
   */
  getFailoverTargets(excludeRegionId: string): Region[] {
    return Array.from(this.regions.values())
      .filter((r) => r.id !== excludeRegionId && r.active)
      .sort((a, b) => a.failoverPriority - b.failoverPriority);
  }

  /**
   * Toggle a region's active state.
   * @param regionId - Region identifier
   * @param active - Whether to activate or deactivate
   */
  setRegionActive(regionId: string, active: boolean): boolean {
    const region = this.regions.get(regionId);
    if (!region) return false;
    region.active = active;
    this.emit(active ? "region:activated" : "region:deactivated", regionId);
    return true;
  }
}
