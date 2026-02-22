import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CircuitBreakerManager,
  CircuitState,
} from "../load/circuit-breaker.js";

describe("CircuitBreakerManager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts in closed state", () => {
    const cb = new CircuitBreakerManager({ failureThreshold: 3 });
    expect(cb.isAllowed("node-1")).toBe(true);
    expect(cb.getCircuit("node-1")?.state).toBe(CircuitState.Closed);
  });

  it("opens after reaching failure threshold", () => {
    const cb = new CircuitBreakerManager({
      failureThreshold: 3,
      windowMs: 60_000,
    });

    cb.recordFailure("node-1");
    cb.recordFailure("node-1");
    expect(cb.getCircuit("node-1")?.state).toBe(CircuitState.Closed);

    cb.recordFailure("node-1");
    expect(cb.getCircuit("node-1")?.state).toBe(CircuitState.Open);
  });

  it("blocks requests when open", () => {
    const cb = new CircuitBreakerManager({
      failureThreshold: 2,
      recoveryTimeoutMs: 5000,
    });
    cb.recordFailure("node-1");
    cb.recordFailure("node-1");
    expect(cb.isAllowed("node-1")).toBe(false);
  });

  it("transitions to half-open after recovery timeout", () => {
    const cb = new CircuitBreakerManager({
      failureThreshold: 2,
      recoveryTimeoutMs: 5000,
    });
    cb.recordFailure("node-1");
    cb.recordFailure("node-1");
    expect(cb.isAllowed("node-1")).toBe(false);

    vi.advanceTimersByTime(5001);
    expect(cb.isAllowed("node-1")).toBe(true);
    expect(cb.getCircuit("node-1")?.state).toBe(CircuitState.HalfOpen);
  });

  it("closes after enough successes in half-open", () => {
    const cb = new CircuitBreakerManager({
      failureThreshold: 2,
      recoveryTimeoutMs: 1000,
      successThreshold: 2,
    });
    cb.recordFailure("node-1");
    cb.recordFailure("node-1");

    vi.advanceTimersByTime(1001);
    cb.isAllowed("node-1");

    cb.recordSuccess("node-1");
    expect(cb.getCircuit("node-1")?.state).toBe(CircuitState.HalfOpen);
    cb.recordSuccess("node-1");
    expect(cb.getCircuit("node-1")?.state).toBe(CircuitState.Closed);
  });

  it("re-opens on failure in half-open state", () => {
    const cb = new CircuitBreakerManager({
      failureThreshold: 2,
      recoveryTimeoutMs: 1000,
    });
    cb.recordFailure("node-1");
    cb.recordFailure("node-1");

    vi.advanceTimersByTime(1001);
    cb.isAllowed("node-1");
    expect(cb.getCircuit("node-1")?.state).toBe(CircuitState.HalfOpen);

    cb.recordFailure("node-1");
    expect(cb.getCircuit("node-1")?.state).toBe(CircuitState.Open);
  });

  it("tracks total failures and successes", () => {
    const cb = new CircuitBreakerManager({ failureThreshold: 10 });
    cb.recordSuccess("node-1");
    cb.recordSuccess("node-1");
    cb.recordFailure("node-1");

    const circuit = cb.getCircuit("node-1");
    expect(circuit?.totalSuccesses).toBe(2);
    expect(circuit?.totalFailures).toBe(1);
  });

  it("reset returns circuit to closed state", () => {
    const cb = new CircuitBreakerManager({ failureThreshold: 1 });
    cb.recordFailure("node-1");
    expect(cb.getCircuit("node-1")?.state).toBe(CircuitState.Open);

    cb.reset("node-1");
    expect(cb.getCircuit("node-1")?.state).toBe(CircuitState.Closed);
  });

  it("getAllCircuits returns all tracked nodes", () => {
    const cb = new CircuitBreakerManager();
    cb.isAllowed("n1");
    cb.isAllowed("n2");
    expect(cb.getAllCircuits()).toHaveLength(2);
  });

  it("getStateCounts returns correct counts", () => {
    const cb = new CircuitBreakerManager({ failureThreshold: 1 });
    cb.isAllowed("n1");
    cb.recordFailure("n2");
    const counts = cb.getStateCounts();
    expect(counts[CircuitState.Closed]).toBe(1);
    expect(counts[CircuitState.Open]).toBe(1);
  });

  it("emits state:change event", () => {
    const cb = new CircuitBreakerManager({ failureThreshold: 1 });
    const events: unknown[] = [];
    cb.on("state:change", (e) => events.push(e));
    cb.recordFailure("node-1");
    expect(events).toHaveLength(1);
  });
});
