/**
 * Circuit breaker pattern for cluster node communication.
 * Prevents cascading failures by tracking error rates per node
 * and temporarily disabling unhealthy connections.
 * @module
 */

import { EventEmitter } from "node:events";

/** Circuit breaker states */
export enum CircuitState {
  Closed = "closed",
  Open = "open",
  HalfOpen = "half-open",
}

/** Configuration for a circuit breaker */
export interface CircuitBreakerConfig {
  /** Number of failures before opening the circuit */
  failureThreshold: number;
  /** Time in ms before transitioning from open to half-open */
  recoveryTimeoutMs: number;
  /** Number of successful requests in half-open to close the circuit */
  successThreshold: number;
  /** Sliding window size in ms for counting failures */
  windowMs: number;
}

/** State information for a single node's circuit breaker */
export interface CircuitInfo {
  /** Node identifier */
  nodeId: string;
  /** Current state */
  state: CircuitState;
  /** Number of failures in current window */
  failureCount: number;
  /** Number of successes in half-open state */
  halfOpenSuccesses: number;
  /** Timestamp when the circuit was last opened */
  lastOpenedAt: number | null;
  /** Timestamp when the circuit should transition to half-open */
  retryAfter: number | null;
  /** Total lifetime failures */
  totalFailures: number;
  /** Total lifetime successes */
  totalSuccesses: number;
}

/** Default circuit breaker configuration */
const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeoutMs: 30_000,
  successThreshold: 3,
  windowMs: 60_000,
};

/**
 * Manages per-node circuit breakers to prevent cascading failures.
 * Each node gets its own breaker that transitions through
 * closed → open → half-open → closed states.
 */
export class CircuitBreakerManager extends EventEmitter {
  private readonly config: CircuitBreakerConfig;
  private readonly circuits = new Map<string, CircuitInfo>();
  private readonly failureTimestamps = new Map<string, number[]>();

  /**
   * @param config - Partial configuration (merged with defaults)
   */
  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if a request to the given node is allowed.
   * Automatically transitions from open to half-open when recovery timeout expires.
   * @param nodeId - Target node identifier
   * @returns True if the circuit allows the request
   */
  isAllowed(nodeId: string): boolean {
    const circuit = this.getOrCreateCircuit(nodeId);

    switch (circuit.state) {
      case CircuitState.Closed:
        return true;

      case CircuitState.Open: {
        const now = Date.now();
        if (circuit.retryAfter !== null && now >= circuit.retryAfter) {
          this.transitionTo(circuit, CircuitState.HalfOpen);
          return true;
        }
        return false;
      }

      case CircuitState.HalfOpen:
        return true;

      default:
        return false;
    }
  }

  /**
   * Record a successful request to a node.
   * In half-open state, enough successes will close the circuit.
   * @param nodeId - Node identifier
   */
  recordSuccess(nodeId: string): void {
    const circuit = this.getOrCreateCircuit(nodeId);
    circuit.totalSuccesses++;

    if (circuit.state === CircuitState.HalfOpen) {
      circuit.halfOpenSuccesses++;
      if (circuit.halfOpenSuccesses >= this.config.successThreshold) {
        this.transitionTo(circuit, CircuitState.Closed);
      }
    }
  }

  /**
   * Record a failed request to a node.
   * In closed state, enough failures within the window will open the circuit.
   * In half-open state, a single failure re-opens the circuit.
   * @param nodeId - Node identifier
   */
  recordFailure(nodeId: string): void {
    const circuit = this.getOrCreateCircuit(nodeId);
    circuit.totalFailures++;

    if (circuit.state === CircuitState.HalfOpen) {
      this.transitionTo(circuit, CircuitState.Open);
      return;
    }

    if (circuit.state === CircuitState.Closed) {
      const now = Date.now();
      let timestamps = this.failureTimestamps.get(nodeId);
      if (!timestamps) {
        timestamps = [];
        this.failureTimestamps.set(nodeId, timestamps);
      }

      timestamps.push(now);

      // Remove timestamps outside the window
      const windowStart = now - this.config.windowMs;
      const filtered = timestamps.filter((t) => t >= windowStart);
      this.failureTimestamps.set(nodeId, filtered);

      circuit.failureCount = filtered.length;

      if (circuit.failureCount >= this.config.failureThreshold) {
        this.transitionTo(circuit, CircuitState.Open);
      }
    }
  }

  /**
   * Get the current circuit information for a node.
   * @param nodeId - Node identifier
   * @returns Circuit info or undefined if not tracked
   */
  getCircuit(nodeId: string): CircuitInfo | undefined {
    return this.circuits.get(nodeId);
  }

  /**
   * Get all circuit breaker states.
   * @returns Array of circuit info for all tracked nodes
   */
  getAllCircuits(): CircuitInfo[] {
    return Array.from(this.circuits.values());
  }

  /**
   * Manually reset a circuit breaker to the closed state.
   * @param nodeId - Node identifier
   * @returns True if the circuit was found and reset
   */
  reset(nodeId: string): boolean {
    const circuit = this.circuits.get(nodeId);
    if (!circuit) return false;

    this.transitionTo(circuit, CircuitState.Closed);
    this.failureTimestamps.delete(nodeId);
    return true;
  }

  /**
   * Reset all circuit breakers.
   */
  resetAll(): void {
    for (const [nodeId] of this.circuits) {
      this.reset(nodeId);
    }
  }

  /**
   * Remove tracking for a specific node.
   * @param nodeId - Node identifier
   */
  remove(nodeId: string): boolean {
    this.failureTimestamps.delete(nodeId);
    return this.circuits.delete(nodeId);
  }

  /**
   * Get or create a circuit for a node.
   */
  private getOrCreateCircuit(nodeId: string): CircuitInfo {
    let circuit = this.circuits.get(nodeId);
    if (!circuit) {
      circuit = {
        nodeId,
        state: CircuitState.Closed,
        failureCount: 0,
        halfOpenSuccesses: 0,
        lastOpenedAt: null,
        retryAfter: null,
        totalFailures: 0,
        totalSuccesses: 0,
      };
      this.circuits.set(nodeId, circuit);
    }
    return circuit;
  }

  /**
   * Transition a circuit to a new state.
   */
  private transitionTo(circuit: CircuitInfo, newState: CircuitState): void {
    const oldState = circuit.state;
    circuit.state = newState;

    switch (newState) {
      case CircuitState.Open: {
        const now = Date.now();
        circuit.lastOpenedAt = now;
        circuit.retryAfter = now + this.config.recoveryTimeoutMs;
        circuit.halfOpenSuccesses = 0;
        break;
      }
      case CircuitState.HalfOpen:
        circuit.halfOpenSuccesses = 0;
        break;
      case CircuitState.Closed:
        circuit.failureCount = 0;
        circuit.halfOpenSuccesses = 0;
        circuit.retryAfter = null;
        break;
    }

    this.emit("state:change", {
      nodeId: circuit.nodeId,
      from: oldState,
      to: newState,
      timestamp: Date.now(),
    });
  }

  /**
   * Get the count of nodes in each circuit state.
   */
  getStateCounts(): Record<CircuitState, number> {
    const counts: Record<CircuitState, number> = {
      [CircuitState.Closed]: 0,
      [CircuitState.Open]: 0,
      [CircuitState.HalfOpen]: 0,
    };

    for (const circuit of this.circuits.values()) {
      counts[circuit.state]++;
    }

    return counts;
  }
}
