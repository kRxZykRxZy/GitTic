import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import IssueForm, { type IssueFormData } from "../components/issues/IssueForm";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api-client";

/**
 * Create issue page for repository scope.
 */
export const IssueCreatePage: React.FC = () => {
    const { owner, repo } = useParams<{ owner: string; repo: string }>();
    const navigate = useNavigate();
    const toast = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (formData: IssueFormData) => {
        if (!owner || !repo) return;

        setSubmitting(true);
        setError(null);

        try {
            const response = await api.post<{ number?: number; id: string }>(`/repositories/${owner}/${repo}/issues`, {
                title: formData.title,
                body: formData.description,
                assignees: formData.assignees.map((assignee) => assignee.id),
                labels: formData.labels.map((label) => label.name),
            });

            toast.success("Issue created successfully");

            const issueNumber = response.data.number;
            if (issueNumber) {
                navigate(`/${owner}/${repo}/issues/${issueNumber}`);
            } else {
                navigate(`/${owner}/${repo}/issues`);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to create issue";
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
                <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>Create Issue</h1>
                <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", fontSize: "14px" }}>
                    Open a new issue in {owner}/{repo}
                </p>
            </div>

            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius)", padding: "16px" }}>
                <IssueForm
                    onSubmit={handleSubmit}
                    onCancel={() => navigate(`/${owner}/${repo}/issues`)}
                    isLoading={submitting}
                    error={error}
                    availableLabels={[]}
                    availableUsers={[]}
                    availableMilestones={[]}
                />
            </div>
        </div>
    );
};
