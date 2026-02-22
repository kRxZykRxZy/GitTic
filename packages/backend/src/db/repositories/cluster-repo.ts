import { randomUUID } from "node:crypto";
import type { ClusterNode } from "@platform/shared";
import { getDb } from "../connection.js";

/** Row shape from SQLite. */
interface ClusterRow {
    id: string;
    name: string;
    token: string;
    url: string;
    status: string;
    version: string;
    capabilities: string;
    cpu_usage: number;
    memory_usage: number;
    active_jobs: number;
    max_jobs: number;
    last_heartbeat: string | null;
    registered_at: string;
    updated_at: string;
}

/** Map a row to the shared ClusterNode type. */
function toClusterNode(row: ClusterRow): ClusterNode {
    return {
        id: row.id,
        name: row.name,
        token: row.token,
        url: row.url,
        status: row.status as ClusterNode["status"],
        version: row.version,
        capabilities: JSON.parse(row.capabilities) as string[],
        cpuUsage: row.cpu_usage,
        memoryUsage: row.memory_usage,
        activeJobs: row.active_jobs,
        maxJobs: row.max_jobs,
        lastHeartbeat: row.last_heartbeat ?? "",
        registeredAt: row.registered_at,
        updatedAt: row.updated_at,
    };
}

/** Input for registering a cluster node. */
export interface RegisterNodeInput {
    name: string;
    token: string;
    url: string;
    version?: string;
    capabilities?: string[];
    maxJobs?: number;
}

/** Input for heartbeat updates. */
export interface HeartbeatInput {
    cpuUsage: number;
    memoryUsage: number;
    activeJobs: number;
}

/**
 * Register a new cluster node.
 */
export function register(input: RegisterNodeInput): ClusterNode {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
        `INSERT INTO clusters (id, name, token, url, status, version, capabilities, max_jobs, last_heartbeat, registered_at, updated_at)
     VALUES (?, ?, ?, ?, 'online', ?, ?, ?, ?, ?, ?)`,
    ).run(
        id,
        input.name,
        input.token,
        input.url,
        input.version || "0.0.0",
        JSON.stringify(input.capabilities || []),
        input.maxJobs ?? 4,
        now,
        now,
        now,
    );

    return findById(id)!;
}

/**
 * Find a cluster node by its ID.
 */
export function findById(id: string): ClusterNode | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM clusters WHERE id = ?").get(id) as ClusterRow | undefined;
    return row ? toClusterNode(row) : null;
}

/**
 * Find a cluster node by its authentication token.
 */
export function findByToken(token: string): ClusterNode | null {
    const db = getDb();
    const row = db
        .prepare("SELECT * FROM clusters WHERE token = ?")
        .get(token) as ClusterRow | undefined;
    return row ? toClusterNode(row) : null;
}

/**
 * Update the heartbeat for a node (CPU, memory, active jobs, timestamp).
 */
export function updateHeartbeat(id: string, input: HeartbeatInput): boolean {
    const db = getDb();
    const now = new Date().toISOString();
    const result = db
        .prepare(
            `UPDATE clusters
       SET cpu_usage = ?, memory_usage = ?, active_jobs = ?, last_heartbeat = ?, updated_at = ?
       WHERE id = ?`,
        )
        .run(input.cpuUsage, input.memoryUsage, input.activeJobs, now, now, id);
    return result.changes > 0;
}

/**
 * Update a node's status (online, offline, draining, updating).
 */
export function updateStatus(id: string, status: ClusterNode["status"]): boolean {
    const db = getDb();
    const result = db
        .prepare("UPDATE clusters SET status = ?, updated_at = ? WHERE id = ?")
        .run(status, new Date().toISOString(), id);
    return result.changes > 0;
}

/**
 * List all cluster nodes, optionally filtered by status.
 */
export function listNodes(status?: ClusterNode["status"]): ClusterNode[] {
    const db = getDb();
    if (status) {
        const rows = db
            .prepare("SELECT * FROM clusters WHERE status = ? ORDER BY name")
            .all(status) as ClusterRow[];
        return rows.map(toClusterNode);
    }
    const rows = db.prepare("SELECT * FROM clusters ORDER BY name").all() as ClusterRow[];
    return rows.map(toClusterNode);
}

/**
 * Delete a cluster node by ID.
 */
export function deleteNode(id: string): boolean {
    const db = getDb();
    const result = db.prepare("DELETE FROM clusters WHERE id = ?").run(id);
    return result.changes > 0;
}

/**
 * Get all nodes currently marked as online.
 */
export function getOnlineNodes(): ClusterNode[] {
    return listNodes("online");
}
/**
 * Remove all cluster nodes with stale heartbeats (no heartbeat for specified duration).
 * @param staleThresholdMs - How old a heartbeat must be to be considered stale (default: 30 seconds)
 * @returns Number of nodes removed
 */
export function cleanupStaleNodes(staleThresholdMs: number = 30_000): number {
    const db = getDb();
    const now = Date.now();

    // Find all nodes with no heartbeat or heartbeat older than threshold
    const rows = db
        .prepare("SELECT id, name, last_heartbeat FROM clusters")
        .all() as Array<{ id: string; name: string; last_heartbeat: string | null }>;

    let removedCount = 0;

    for (const row of rows) {
        if (!row.last_heartbeat) {
            // No heartbeat ever received, remove if older than threshold
            const registeredTime = db
                .prepare("SELECT registered_at FROM clusters WHERE id = ?")
                .get(row.id) as { registered_at: string } | undefined;

            if (registeredTime) {
                const ageMs = now - new Date(registeredTime.registered_at).getTime();
                if (ageMs > staleThresholdMs) {
                    deleteNode(row.id);
                    console.log(`🗑️  Removed stale cluster node: ${row.name} (no heartbeat)`);
                    removedCount++;
                }
            }
        } else {
            // Check if last heartbeat is older than threshold
            const lastHeartbeatMs = new Date(row.last_heartbeat).getTime();
            const ageSinceHeartbeatMs = now - lastHeartbeatMs;

            if (ageSinceHeartbeatMs > staleThresholdMs) {
                deleteNode(row.id);
                console.log(`🗑️  Removed stale cluster node: ${row.name} (heartbeat ${Math.round(ageSinceHeartbeatMs / 1000)}s old)`);
                removedCount++;
            }
        }
    }

    return removedCount;
}