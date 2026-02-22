import { Scheduler } from "@platform/cluster";
import * as clusterRepo from "../db/repositories/cluster-repo.js";

/**
 * Request forwarding service.
 *
 * When the main server is overloaded (detected by `load-monitor`),
 * this service proxies HTTP requests to healthy cluster nodes.
 *
 * Uses the `@platform/cluster` Scheduler for optimal node selection
 * and implements a circuit breaker pattern to avoid routing to
 * nodes that are repeatedly failing.
 */

/** Configuration for the circuit breaker. */
interface CircuitBreakerState {
    /** Number of consecutive failures. */
    failures: number;
    /** Timestamp when the circuit was opened (ms since epoch). */
    openedAt: number;
    /** Whether the circuit is currently open (blocking requests). */
    isOpen: boolean;
}

/** Per-node circuit breaker states. */
const _circuits = new Map<string, CircuitBreakerState>();

/** Number of failures before opening the circuit. */
const FAILURE_THRESHOLD = 3;

/** How long the circuit stays open before half-opening (ms). */
const CIRCUIT_RESET_MS = 30_000;

/** Request timeout for forwarded requests (ms). */
const FORWARD_TIMEOUT_MS = 15_000;

/**
 * Check if a circuit breaker is allowing requests for a given node.
 *
 * @param nodeId - The cluster node ID.
 * @returns `true` if the circuit is closed (requests allowed).
 */
function isCircuitClosed(nodeId: string): boolean {
    const state = _circuits.get(nodeId);
    if (!state) return true;

    if (!state.isOpen) return true;

    // Half-open: allow a probe if enough time has passed
    if (Date.now() - state.openedAt >= CIRCUIT_RESET_MS) {
        return true;
    }

    return false;
}

/**
 * Record a successful forward to a node, resetting its circuit.
 *
 * @param nodeId - The cluster node ID.
 */
function recordSuccess(nodeId: string): void {
    _circuits.set(nodeId, {
        failures: 0,
        openedAt: 0,
        isOpen: false,
    });
}

/**
 * Record a failure for a node. If the failure threshold is
 * exceeded, the circuit opens.
 *
 * @param nodeId - The cluster node ID.
 */
function recordFailure(nodeId: string): void {
    const state = _circuits.get(nodeId) ?? {
        failures: 0,
        openedAt: 0,
        isOpen: false,
    };

    state.failures++;

    if (state.failures >= FAILURE_THRESHOLD) {
        state.isOpen = true;
        state.openedAt = Date.now();
        console.warn(
            `[load-forwarder] Circuit opened for node ${nodeId} after ${state.failures} failures`,
        );
    }

    _circuits.set(nodeId, state);
}

/**
 * Select the best available cluster node for forwarding.
 *
 * Uses the `Scheduler` from `@platform/cluster` for load-balanced
 * selection, filtered to nodes whose circuits are closed.
 *
 * @returns The selected node or `null` if none available.
 */
function selectNode(): ReturnType<typeof clusterRepo.findById> {
    const onlineNodes = clusterRepo.getOnlineNodes();
    const eligible = onlineNodes.filter(
        (n) => n.activeJobs < n.maxJobs && isCircuitClosed(n.id),
    );

    if (eligible.length === 0) return null;

    // Use the Scheduler for weighted selection
    const scheduler = new Scheduler("least-loaded");
    scheduler.updateNodes(
        eligible.map((n) => ({
            id: n.id,
            name: n.name,
            token: n.token ?? "",
            url: n.url,
            status: "online" as const,
            version: n.version ?? "",
            cpuUsage: n.cpuUsage,
            memoryUsage: n.memoryUsage,
            activeJobs: n.activeJobs,
            maxJobs: n.maxJobs,
            capabilities: n.capabilities ?? [],
            lastHeartbeat: n.lastHeartbeat ?? new Date().toISOString(),
            registeredAt: n.registeredAt ?? new Date().toISOString(),
            updatedAt: n.updatedAt ?? new Date().toISOString(),
        })),
    );
    const selected = scheduler.selectNode();

    if (!selected) return eligible[0]; // Fallback to first eligible

    return clusterRepo.findById(selected.id);
}

/**
 * Forward an HTTP request to a cluster node.
 *
 * Selects the best node, proxies the request, and returns
 * the response. If the forward fails the circuit breaker
 * is updated and the error is propagated.
 *
 * @param options - Request details to forward.
 * @returns The response from the cluster node.
 *
 * @throws {Error} When no nodes are available or the forward fails.
 */
export async function forwardRequest(options: {
    method: string;
    path: string;
    headers: Record<string, string>;
    body?: string | Buffer | null;
}): Promise<{ status: number; headers: Record<string, string>; body: string }> {
    const node = selectNode();
    if (!node) {
        throw new Error("No healthy cluster nodes available for forwarding");
    }

    const targetUrl = `${node.url}${options.path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FORWARD_TIMEOUT_MS);

    try {
        // Convert body to proper type for fetch
        let bodyInit: string | null | undefined;
        if (options.method !== "GET" && options.method !== "HEAD") {
            if (options.body instanceof Buffer) {
                bodyInit = options.body.toString();
            } else if (typeof options.body === "string") {
                bodyInit = options.body;
            } else {
                bodyInit = undefined;
            }
        } else {
            bodyInit = undefined;
        }

        const response = await fetch(targetUrl, {
            method: options.method,
            headers: {
                ...options.headers,
                "X-Forwarded-For": options.headers["x-forwarded-for"] ?? "",
                "X-Forwarded-By": "platform-load-forwarder",
            },
            body: bodyInit,
            signal: controller.signal,
        });

        const responseBody = await response.text();
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        recordSuccess(node.id);
        return {
            status: response.status,
            headers: responseHeaders,
            body: responseBody,
        };
    } catch (err) {
        recordFailure(node.id);
        throw new Error(
            `Forward to node ${node.name} (${node.url}) failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Get the current circuit breaker states for all tracked nodes.
 * Useful for admin dashboards and debugging.
 *
 * @returns Map of node IDs to their circuit breaker states.
 */
export function getCircuitStates(): Map<string, CircuitBreakerState> {
    return new Map(_circuits);
}

/**
 * Reset all circuit breakers. Useful after a cluster-wide
 * recovery or manual intervention.
 */
export function resetAllCircuits(): void {
    _circuits.clear();
    console.log("[load-forwarder] All circuit breakers reset");
}
