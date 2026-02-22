import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";
import type { HeartbeatPayload } from "@platform/shared";

const execFileAsync = promisify(execFile);

export interface AgentConfig {
    clusterId: string;
    serverUrl: string;
    token: string;
    heartbeatIntervalMs: number;
    capabilities: string[];
    maxJobs: number;
    version: string;
}

function resolveNodeUrl(): string | undefined {
    const explicit = process.env.CLUSTER_PUBLIC_URL;
    if (explicit && explicit.trim().length > 0) return explicit.trim();

    const port = process.env.CLUSTER_PORT;
    if (!port) return undefined;

    const host = process.env.CLUSTER_HOST || os.hostname();
    const protocol = process.env.CLUSTER_PROTOCOL || "http";
    return `${protocol}://${host}:${port}`;
}

/**
 * Cluster agent that auto-registers with the platform,
 * sends heartbeats, reports resource usage, and manages jobs.
 */
export class ClusterAgent {
    private config: AgentConfig;
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private activeJobs = 0;
    private registered = false;

    constructor(config: AgentConfig) {
        this.config = config;
    }

    /**
     * Auto-register this cluster node with the platform server.
     */
    async register(): Promise<boolean> {
        try {
            const token = this.config.token;
            if (!token || token.length < 1) {
                console.error("❌ Error: Invalid token provided to cluster agent");
                return false;
            }

            const nodeUrl = resolveNodeUrl();

            const payload = {
                name: os.hostname(),
                token: token,
                capabilities: this.config.capabilities || ["cpu"],
                maxJobs: this.config.maxJobs || 5,
                version: this.config.version || "1.0.0",
                ...(nodeUrl ? { url: nodeUrl } : {}),
            };

            console.log(`📡 Sending registration request to ${this.config.serverUrl}/api/v1/clusters/register`);

            const response = await fetch(`${this.config.serverUrl}/api/v1/clusters/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorMsg = `HTTP ${response.status}`;
                try {
                    const errorBody = await response.json();
                    errorMsg = errorBody.error || errorMsg;
                } catch {
                    errorMsg = await response.text() || errorMsg;
                }
                console.error(`❌ Registration failed: ${errorMsg}`);
                return false;
            }

            const result = await response.json();
            console.log(`✅ Registration successful:`, result);
            this.registered = true;
            return true;
        } catch (err) {
            console.error("❌ Registration error:", err instanceof Error ? err.message : err);
            return false;
        }
    }

    /**
     * Start sending periodic heartbeats.
     */
    startHeartbeat(): void {
        if (this.heartbeatTimer) return;

        this.heartbeatTimer = setInterval(async () => {
            try {
                await this.sendHeartbeat();
            } catch (err) {
                console.error("Heartbeat failed:", err);
            }
        }, this.config.heartbeatIntervalMs);
    }

    /**
     * Stop heartbeat reporting.
     */
    stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * Send a single heartbeat with current system stats.
     */
    async sendHeartbeat(): Promise<void> {
        const payload: HeartbeatPayload = {
            token: this.config.token,
            clusterId: this.config.clusterId,
            cpuUsage: await this.getCpuUsage(),
            memoryUsage: this.getMemoryUsage(),
            activeJobs: this.activeJobs,
            version: this.config.version,
            capabilities: this.config.capabilities,
            timestamp: new Date().toISOString(),
        };

        await fetch(`${this.config.serverUrl}/api/v1/clusters/heartbeat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.config.token}`,
            },
            body: JSON.stringify(payload),
        });
    }

    /**
     * Get current CPU usage percentage.
     */
    private async getCpuUsage(): Promise<number> {
        const cpus = os.cpus();
        const total = cpus.reduce((acc, cpu) => {
            const times = cpu.times;
            return acc + times.user + times.nice + times.sys + times.irq + times.idle;
        }, 0);
        const idle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
        return Math.round(((total - idle) / total) * 100);
    }

    /**
     * Get current memory usage percentage.
     */
    private getMemoryUsage(): number {
        const total = os.totalmem();
        const free = os.freemem();
        return Math.round(((total - free) / total) * 100);
    }

    /**
     * Check for and apply remote updates.
     */
    async checkForUpdates(): Promise<{ hasUpdate: boolean; newVersion?: string }> {
        try {
            const response = await fetch(
                `${this.config.serverUrl}/api/v1/clusters/updates/${this.config.clusterId}`,
                {
                    headers: { Authorization: `Bearer ${this.config.token}` },
                }
            );
            if (!response.ok) return { hasUpdate: false };
            const data = (await response.json()) as { version: string; updateUrl?: string };
            return {
                hasUpdate: data.version !== this.config.version,
                newVersion: data.version,
            };
        } catch {
            return { hasUpdate: false };
        }
    }

    get isRegistered(): boolean {
        return this.registered;
    }

    incrementJobs(): void {
        this.activeJobs++;
    }

    decrementJobs(): void {
        if (this.activeJobs > 0) this.activeJobs--;
    }

    getActiveJobs(): number {
        return this.activeJobs;
    }
}
