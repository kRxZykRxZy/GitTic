import React, { useState } from "react";
import { useToast } from "../../hooks/useToast";

interface PollinationsPanelProps {
    owner: string;
    repo: string;
}

/**
 * Lightweight Pollinations AI assistant panel.
 */
export const PollinationsPanel: React.FC<PollinationsPanelProps> = ({ owner, repo }) => {
    const toast = useToast();
    const [prompt, setPrompt] = useState(`Review repository ${owner}/${repo} and suggest next improvements.`);
    const [loading, setLoading] = useState(false);
    const [answer, setAnswer] = useState("");

    const runPrompt = async () => {
        const trimmed = prompt.trim();
        if (!trimmed) return;

        setLoading(true);
        try {
            const url = `https://text.pollinations.ai/${encodeURIComponent(trimmed)}`;
            const response = await fetch(url, { method: "GET" });
            if (!response.ok) {
                throw new Error(`Pollinations request failed (${response.status})`);
            }
            const text = await response.text();
            setAnswer(text);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Pollinations request failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius)", overflow: "hidden", background: "var(--bg-secondary)" }}>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-tertiary)", fontSize: "13px", fontWeight: 600 }}>
                Pollinations AI
            </div>
            <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    placeholder="Ask Pollinations AI..."
                    style={{ width: "100%", resize: "vertical", fontFamily: "inherit" }}
                    className="input"
                />
                <div>
                    <button className="btn btn-primary" onClick={runPrompt} disabled={loading}>
                        {loading ? "Asking..." : "Ask AI"}
                    </button>
                </div>
                <pre style={{ margin: 0, padding: "10px", minHeight: "180px", maxHeight: "420px", overflow: "auto", border: "1px solid var(--border-color)", borderRadius: "var(--radius)", background: "var(--bg-primary)", whiteSpace: "pre-wrap", fontSize: "13px" }}>
                    {answer || "AI output appears here."}
                </pre>
            </div>
        </div>
    );
};
