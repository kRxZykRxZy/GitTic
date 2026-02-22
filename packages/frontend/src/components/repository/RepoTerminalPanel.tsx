import React, { useEffect, useRef, useState } from "react";
import { api } from "../../services/api-client";
import { useToast } from "../../hooks/useToast";

interface RepoTerminalPanelProps {
    owner: string;
    repo: string;
    branch: string;
}

interface TerminalSessionResponse {
    sessionId: string;
    clusterId: string | null;
    branch: string;
    status: string;
}

/**
 * Persistent terminal panel backed by backend session APIs.
 */
export const RepoTerminalPanel: React.FC<RepoTerminalPanelProps> = ({ owner, repo, branch }) => {
    const toast = useToast();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [clusterId, setClusterId] = useState<string | null>(null);
    const [cursor, setCursor] = useState(0);
    const [output, setOutput] = useState<string>("");
    const [command, setCommand] = useState("");
    const [busy, setBusy] = useState(false);
    const outputRef = useRef<HTMLPreElement>(null);

    useEffect(() => {
        let disposed = false;

        const createSession = async () => {
            try {
                const res = await api.post<TerminalSessionResponse>(`/repositories/${owner}/${repo}/terminal/session`, {
                    branch,
                });

                if (disposed) return;
                setSessionId(res.data.sessionId);
                setClusterId(res.data.clusterId);
                setOutput((prev) => `${prev}\n[connected to ${res.data.clusterId ? `cluster ${res.data.clusterId}` : "local executor"}]\n`);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to start terminal";
                toast.error(message);
            }
        };

        createSession();

        return () => {
            disposed = true;
        };
    }, [owner, repo, branch, toast]);

    useEffect(() => {
        if (!sessionId) return;

        const poll = async () => {
            try {
                const res = await api.get<{ output: string[]; cursor: number }>(
                    `/repositories/${owner}/${repo}/terminal/session/${sessionId}/output`,
                    { params: { cursor } },
                );

                if (res.data.output.length > 0) {
                    setOutput((prev) => `${prev}${res.data.output.join("")}`);
                }
                setCursor(res.data.cursor);
            } catch {
                // silence transient polling issues
            }
        };

        const interval = window.setInterval(poll, 1000);
        return () => window.clearInterval(interval);
    }, [owner, repo, sessionId, cursor]);

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    useEffect(() => {
        return () => {
            if (!sessionId) return;
            api.delete(`/repositories/${owner}/${repo}/terminal/session/${sessionId}`).catch(() => undefined);
        };
    }, [owner, repo, sessionId]);

    const runCommand = async () => {
        const trimmed = command.trim();
        if (!trimmed || !sessionId || busy) return;

        setBusy(true);
        try {
            await api.post(`/repositories/${owner}/${repo}/terminal/session/${sessionId}/command`, {
                command: trimmed,
            });
            setCommand("");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to run command";
            toast.error(message);
        } finally {
            setBusy(false);
        }
    };

    const panelStyle: React.CSSProperties = {
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        background: "var(--bg-secondary)",
    };

    const headerStyle: React.CSSProperties = {
        padding: "10px 12px",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "13px",
        background: "var(--bg-tertiary)",
    };

    const outputStyle: React.CSSProperties = {
        margin: 0,
        padding: "12px",
        minHeight: "360px",
        maxHeight: "460px",
        overflowY: "auto",
        background: "#0b1020",
        color: "#e6edf3",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: "12px",
        lineHeight: 1.5,
    };

    const inputRowStyle: React.CSSProperties = {
        display: "flex",
        gap: "8px",
        padding: "10px",
        borderTop: "1px solid var(--border-color)",
        background: "var(--bg-primary)",
    };

    return (
        <div style={panelStyle}>
            <div style={headerStyle}>
                <strong>Cluster Terminal</strong>
                <span>{clusterId ? `cluster: ${clusterId}` : "cluster: local"}</span>
            </div>
            <pre ref={outputRef} style={outputStyle}>{output || "Starting terminal session..."}</pre>
            <div style={inputRowStyle}>
                <input
                    className="input"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            runCommand();
                        }
                    }}
                    placeholder={sessionId ? "Run command in persistent session..." : "Starting session..."}
                    disabled={!sessionId || busy}
                    style={{ flex: 1 }}
                />
                <button className="btn btn-primary" onClick={runCommand} disabled={!sessionId || busy}>
                    Run
                </button>
            </div>
        </div>
    );
};
