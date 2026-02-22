import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PullRequestForm from "../components/pullrequests/PullRequestForm";
import type { CreatePullRequestData, PRBranch } from "../components/pullrequests/types";
import { useToast } from "../hooks/useToast";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api-client";

/**
 * Create pull request page for repository scope.
 */
export const PullRequestCreatePage: React.FC = () => {
    const { owner, repo } = useParams<{ owner: string; repo: string }>();
    const navigate = useNavigate();
    const toast = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: branchItems } = useApi<Array<{ name: string } | string>>(
        () => api.get<Array<{ name: string } | string>>(`/repositories/${owner}/${repo}/branches`).then((res) => {
            const data = (res.data as unknown as { data?: Array<{ name: string } | string> })?.data;
            return {
                ...res,
                data: Array.isArray(data) ? data : [],
            };
        }),
        [owner, repo],
    );

    const branches: PRBranch[] = useMemo(() => {
        const mapped = (branchItems || []).map((entry, index) => {
            const name = typeof entry === "string" ? entry : entry.name;
            return {
                name,
                sha: `${name}-${index}`,
            };
        });

        if (mapped.length > 0) return mapped;

        return [
            { name: "main", sha: "main" },
            { name: "develop", sha: "develop" },
        ];
    }, [branchItems]);

    const handleSubmit = async (payload: CreatePullRequestData) => {
        if (!owner || !repo) return;

        setSubmitting(true);
        setError(null);

        try {
            const response = await api.post<{ number?: number; id: string }>(`/repositories/${owner}/${repo}/pulls`, {
                title: payload.title,
                body: payload.description,
                base: payload.baseBranch,
                head: payload.headBranch,
                draft: payload.isDraft,
            });

            toast.success("Pull request created successfully");

            if (response.data.number) {
                navigate(`/${owner}/${repo}/pulls/${response.data.number}`);
            } else {
                navigate(`/${owner}/${repo}/pulls`);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to create pull request";
            setError(message);
            toast.error(message);
            throw err;
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "12px 0" }}>
            <div style={{ marginBottom: "16px" }}>
                <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>Create Pull Request</h1>
                <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", fontSize: "14px" }}>
                    Open a pull request in {owner}/{repo}
                </p>
            </div>

            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius)", padding: "16px" }}>
                <PullRequestForm
                    branches={branches}
                    onSubmit={handleSubmit}
                    onCancel={() => navigate(`/${owner}/${repo}/pulls`)}
                    isLoading={submitting}
                    error={error}
                />
            </div>
        </div>
    );
};
