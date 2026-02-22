import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { api } from "../../services/api-client";
import { LoadingSpinner } from "./LoadingSpinner";

interface ReadmeViewerProps {
    owner: string;
    repo: string;
    branch?: string;
}

/**
 * README.md Viewer Component
 * Fetches and displays repository README with markdown rendering
 */
export const ReadmeViewer: React.FC<ReadmeViewerProps> = ({
    owner,
    repo,
    branch = "main"
}) => {
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const containerStyle: React.CSSProperties = {
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius)",
        padding: "24px",
        marginBottom: "24px",
    };

    const headerStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "16px",
        paddingBottom: "12px",
        borderBottom: "1px solid var(--border-color)",
    };

    const titleStyle: React.CSSProperties = {
        fontSize: "16px",
        fontWeight: 600,
        flex: 1,
    };

    const emptyStateStyle: React.CSSProperties = {
        textAlign: "center",
        padding: "64px 24px",
        color: "var(--text-secondary)",
    };

    const markdownStyle: React.CSSProperties = {
        fontSize: "15px",
        lineHeight: "1.7",
        color: "var(--text-primary)",
    };

    useEffect(() => {
        fetchReadme();
    }, [owner, repo, branch]);

    const fetchReadme = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get<{ content?: string }>(`/repositories/${owner}/${repo}/readme?branch=${branch}`);
            setContent(response.data.content || "");
        } catch (err: any) {
            if (err.response?.status === 404) {
                setError("No README.md found in this repository");
            } else {
                setError("Failed to load README");
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "48px", textAlign: "center" }}>
                <LoadingSpinner message="Loading README..." />
            </div>
        );
    }

    if (error) {
        return (
            <div style={containerStyle}>
                <div style={emptyStateStyle}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
                    <div style={{ fontSize: "16px", color: "var(--text-secondary)" }}>{error}</div>
                    <button
                        className="btn btn-primary"
                        style={{ marginTop: "16px" }}
                        onClick={() => window.location.href = `/${owner}/${repo}/new/main?filename=README.md`}
                    >
                        Add a README
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <span style={{ fontSize: "20px" }}>📄</span>
                <span style={titleStyle}>README.md</span>
            </div>

            <div style={markdownStyle}>
                <ReactMarkdown
                    components={{
                        code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || "");
                            return match ? (
                                <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                >
                                    {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                            ) : (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            );
                        },
                        a({ node, children, href, ...props }) {
                            return (
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: "var(--accent-blue)", textDecoration: "none" }}
                                    {...props}
                                >
                                    {children}
                                </a>
                            );
                        },
                        img({ node, src, alt, ...props }) {
                            return (
                                <img
                                    src={src}
                                    alt={alt}
                                    style={{ maxWidth: "100%", height: "auto", borderRadius: "var(--radius)" }}
                                    {...props}
                                />
                            );
                        },
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        </div>
    );
};
