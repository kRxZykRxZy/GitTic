import { describe, it, expect } from "vitest";
import { Scheduler } from "../scheduler.js";
import type { ClusterNode } from "@platform/shared";

function makeNode(overrides: Partial<ClusterNode> = {}): ClusterNode {
  return {
    id: "node-1",
    name: "Node 1",
    token: "tok",
    url: "http://localhost:3000",
    status: "online",
    version: "1.0.0",
    capabilities: ["docker", "node"],
    cpuUsage: 50,
    memoryUsage: 50,
    activeJobs: 0,
    maxJobs: 10,
    lastHeartbeat: new Date().toISOString(),
    registeredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Scheduler - round-robin", () => {
  it("distributes evenly across nodes", () => {
    const scheduler = new Scheduler("round-robin");
    const nodes = [
      makeNode({ id: "n1", name: "N1", cpuUsage: 50 }),
      makeNode({ id: "n2", name: "N2", cpuUsage: 50 }),
      makeNode({ id: "n3", name: "N3", cpuUsage: 50 }),
    ];
    scheduler.updateNodes(nodes);

    const selected = [
      scheduler.selectNode()?.id,
      scheduler.selectNode()?.id,
      scheduler.selectNode()?.id,
    ];
    expect(selected).toContain("n1");
    expect(selected).toContain("n2");
    expect(selected).toContain("n3");
  });

  it("cycles through nodes repeatedly", () => {
    const scheduler = new Scheduler("round-robin");
    const nodes = [
      makeNode({ id: "a", name: "A" }),
      makeNode({ id: "b", name: "B" }),
    ];
    scheduler.updateNodes(nodes);

    const first = scheduler.selectNode()?.id;
    const second = scheduler.selectNode()?.id;
    const third = scheduler.selectNode()?.id;
    expect(first).not.toBe(second);
    expect(third).toBe(first);
  });
});

describe("Scheduler - least-loaded", () => {
  it("picks the node with lowest load", () => {
    const scheduler = new Scheduler("least-loaded");
    const nodes = [
      makeNode({ id: "busy", cpuUsage: 90, memoryUsage: 90, activeJobs: 8, maxJobs: 10 }),
      makeNode({ id: "idle", cpuUsage: 10, memoryUsage: 10, activeJobs: 0, maxJobs: 10 }),
    ];
    scheduler.updateNodes(nodes);
    expect(scheduler.selectNode()?.id).toBe("idle");
  });
});

describe("Scheduler - no nodes", () => {
  it("returns null when no nodes available", () => {
    const scheduler = new Scheduler("round-robin");
    scheduler.updateNodes([]);
    expect(scheduler.selectNode()).toBeNull();
  });

  it("returns null when all nodes are offline", () => {
    const scheduler = new Scheduler("round-robin");
    scheduler.updateNodes([makeNode({ status: "offline" })]);
    expect(scheduler.selectNode()).toBeNull();
  });

  it("returns null when all nodes are at max capacity", () => {
    const scheduler = new Scheduler("round-robin");
    scheduler.updateNodes([makeNode({ activeJobs: 10, maxJobs: 10 })]);
    expect(scheduler.selectNode()).toBeNull();
  });
});

describe("Scheduler - getStats", () => {
  it("returns correct stats", () => {
    const scheduler = new Scheduler("least-loaded");
    scheduler.updateNodes([
      makeNode({ id: "n1", cpuUsage: 40, memoryUsage: 60, activeJobs: 2 }),
      makeNode({ id: "n2", cpuUsage: 60, memoryUsage: 40, activeJobs: 3 }),
    ]);
    const stats = scheduler.getStats();
    expect(stats.totalNodes).toBe(2);
    expect(stats.onlineNodes).toBe(2);
    expect(stats.totalJobs).toBe(5);
    expect(stats.avgCpu).toBe(50);
    expect(stats.avgMemory).toBe(50);
  });

  it("returns zero stats when no nodes", () => {
    const scheduler = new Scheduler("least-loaded");
    scheduler.updateNodes([]);
    const stats = scheduler.getStats();
    expect(stats.totalNodes).toBe(0);
    expect(stats.avgCpu).toBe(0);
  });
});
