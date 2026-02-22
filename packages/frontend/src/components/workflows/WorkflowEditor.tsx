import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api-client";

interface WorkflowRun {
    id: string;
    workflowId: string;
    status: "queued" | "running" | "success" | "failed" | "timeout";
    startedAt: string;
    completedAt?: string;
    duration?: number;
    clusterId?: string;
    resources?: {
        cores: number;
        memoryMB: number;
    };
}

interface WorkflowTemplateResponse {
    template: string;
}

interface WorkflowLimitsResponse {
    tier: string;
    limits: {
        maxCores: number;
        maxMemoryGB: number;
        hasGPUAccess: boolean;
        canUpgrade: boolean;
    };
}

interface WorkflowClusterStatsResponse {
    stats: {
        onlineClusters: number;
        activeJobs: number;
        maxJobs: number;
        utilizationRate: string | number;
    };
}

interface WorkflowExecuteResponse {
    message: string;
    workflowId: string;
    clusterId?: string;
}

/**
 * Workflow Editor and Executor
 * Create, edit, and run .gittic/workflows/*.yaml files
 */
export const WorkflowEditor: React.FC = () => {
    const toast = useToast();

    const [yaml, setYaml] = useState("");
    const [loading, setLoading] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [runs, setRuns] = useState<WorkflowRun[]>([]);
    const [limits, setLimits] = useState<any>(null);
    const [clusterStats, setClusterStats] = useState<any>(null);

    const cardStyle: React.CSSProperties = {
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius)",
        padding: "16px",
    };

    const cardTitleStyle: React.CSSProperties = {
        fontSize: "14px",
        fontWeight: 600,
        marginBottom: "12px",
    };

    useEffect(() => {
        loadTemplate();
        loadLimits();
        loadClusterStats();
    }, []);

    const loadTemplate = async () => {
        try {
            const response = await api.get<WorkflowTemplateResponse>("/workflows/template");
            setYaml(response.data.template);
        } catch (err) {
            console.error("Failed to load template:", err);
        }
    };

    const loadLimits = async () => {
        try {
            const response = await api.get<WorkflowLimitsResponse>("/workflows/limits");
            setLimits(response.data);
        } catch (err) {
            console.error("Failed to load limits:", err);
        }
    };

    const loadClusterStats = async () => {
        try {
            const response = await api.get<WorkflowClusterStatsResponse>("/workflows/clusters/stats");
            setClusterStats(response.data.stats);
        } catch (err) {
            console.error("Failed to load cluster stats:", err);
        }
    };

    const handleExecute = async () => {
        setExecuting(true);
        try {
            const response = await api.post<WorkflowExecuteResponse>("/workflows/execute", {
                yaml,
                repositoryId: "test/repo",
                repositoryUrl: "",
            });

            toast.success(response.data.message);

            const newRun: WorkflowRun = {
                id: response.data.workflowId,
                workflowId: response.data.workflowId,
                status: "running",
                startedAt: new Date().toISOString(),
                clusterId: response.data.clusterId,
            };

            setRuns([newRun, ...runs]);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to execute workflow");
        } finally {
            setExecuting(false);
        }
    };

    return (
        <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Workflow Editor</h1>
                <button
                    className="btn btn-primary"
                    onClick={handleExecute}
                    disabled={executing || !yaml}
                >
                    {executing ? "Executing..." : "Run Workflow"}
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "24px" }}>
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius)", padding: "24px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>
                        .gittic/workflows/ci.yml
                    </div>
                    <textarea
                        style={{
                            width: "100%",
                            minHeight: "500px",
                            fontFamily: "monospace",
                            fontSize: "13px",
                            padding: "12px",
                            background: "var(--bg-primary)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "var(--radius)",
                            color: "var(--text-primary)",
                            resize: "vertical",
                        }}
                        value={yaml}
                        onChange={(e) => setYaml(e.target.value)}
                        placeholder="Enter your workflow YAML here..."
                        spellCheck={false}
                    />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {limits && (
                        <div style={cardStyle}>
                            <div style={cardTitleStyle}>Your Resource Limits</div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
                                <span>Tier:</span>
                                <strong>{limits.tier}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
                                <span>CPU Cores:</span>
                                <strong>{limits.limits.maxCores}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
                                <span>RAM:</span>
                                <strong>{limits.limits.maxMemoryGB}GB</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                                <span>GPU Access:</span>
                                <strong>{limits.limits.hasGPUAccess ? "Yes" : "No"}</strong>
                            </div>
                            {limits.limits.canUpgrade && (
                                <div style={{ marginTop: "12px", padding: "12px", background: "rgba(33, 150, 243, 0.1)", borderRadius: "var(--radius)", fontSize: "12px" }}>
                                    <strong>Want more resources?</strong>
                                    <br />
                                    Upgrade to unlock:
                                    <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
                                        <li>Pro: 16 cores, 16GB RAM, GPU</li>
                                        <li>Team: 32 cores, 32GB RAM, GPU</li>
                                        <li>Enterprise: 64 cores, 64GB RAM, GPU</li>
                                    </ul>
                                    <button
                                        className="btn btn-primary"
                                        style={{ marginTop: "8px", width: "100%", fontSize: "12px" }}
                                        onClick={() => window.location.href = "/settings?tab=subscription"}
                                    >
                                        Upgrade Now
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {clusterStats && (
                        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius)", padding: "16px" }}>
                            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Cluster Statistics</div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
                                <span>Online Clusters:</span>
                                <strong>{clusterStats.onlineClusters}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
                                <span>Active Jobs:</span>
                                <strong>{clusterStats.activeJobs}/{clusterStats.maxJobs}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                                <span>Utilization:</span>
                                <strong>{clusterStats.utilizationRate}%</strong>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
