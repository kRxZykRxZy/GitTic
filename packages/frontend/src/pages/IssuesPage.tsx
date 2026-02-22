import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePaginatedApi } from "../hooks/useApi";
import { api } from "../services/api-client";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import IssueList from "../components/issues/IssueList";
import IssueFilters from "../components/issues/IssueFilters";
import type { FilterConfig } from "../components/issues/IssueFilters";
import { Pagination } from "../components/common/Pagination";

interface IssueFiltersState {
    state: "open" | "closed" | "all";
    labels: string[];
    assignee?: string;
    milestone?: string;
    sort: "created" | "updated" | "comments";
    direction: "asc" | "desc";
}

/**
 * Issues list page with filters for state, labels, assignees, milestones, and sorting.
 */
export const IssuesPage: React.FC = () => {
    const { owner, repo } = useParams<{ owner?: string; repo?: string }>();
    const { isAuthenticated } = useAuth();

    const [filters, setFilters] = useState<IssueFiltersState>({
        state: "open",
        labels: [],
        sort: "created",
        direction: "desc",
    });

    const endpoint = owner && repo
        ? `/repositories/${owner}/${repo}/issues`
        : "/issues";

    const {
        items: issues,
        loading,
        error,
        page,
        totalPages,
        total,
        perPage,
        hasNext,
        hasPrev,
        goToPage,
    } = usePaginatedApi<any>(
        (page, perPage) =>
            api.get(endpoint, {
                params: {
                    page,
                    perPage,
                    state: filters.state,
                    labels: filters.labels.join(","),
                    assignee: filters.assignee,
                    milestone: filters.milestone,
                    sort: filters.sort,
                    direction: filters.direction,
                },
            }),
        25,
    );

    const pageStyle: React.CSSProperties = {
        maxWidth: "1200px",
        margin: "0 auto",
    };

    const headerStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "24px",
        gap: "16px",
        flexWrap: "wrap",
    };

    const titleRow: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    };

    const titleStyle: React.CSSProperties = {
        fontSize: "24px",
        fontWeight: 600,
    };

    const countBadge: React.CSSProperties = {
        fontSize: "14px",
        padding: "4px 10px",
        background: "var(--bg-tertiary)",
        borderRadius: "12px",
        color: "var(--text-secondary)",
    };

    const buttonStyle: React.CSSProperties = {
        padding: "8px 16px",
        fontSize: "14px",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border-color)",
        background: "var(--accent-blue)",
        color: "white",
        cursor: "pointer",
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontWeight: 500,
        transition: "opacity 0.15s",
    };

    const layoutStyle: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: "250px 1fr",
        gap: "24px",
    };

    const sidebar: React.CSSProperties = {
        position: "sticky" as const,
        top: "80px",
        alignSelf: "start",
    };

    const mainContent: React.CSSProperties = {
        minWidth: 0,
    };

    const emptyStateStyle: React.CSSProperties = {
        textAlign: "center",
        padding: "64px 24px",
        color: "var(--text-muted)",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius)",
    };

    const emptyIcon: React.CSSProperties = {
        fontSize: "48px",
        marginBottom: "16px",
    };

    const breadcrumbStyle: React.CSSProperties = {
        fontSize: "14px",
        color: "var(--text-secondary)",
        marginBottom: "16px",
    };

    const breadcrumbLink: React.CSSProperties = {
        color: "var(--accent-blue)",
        textDecoration: "none",
    };

    if (loading && page === 1) return <LoadingSpinner message="Loading issues..." />;
    if (error) return <ErrorMessage message={error} />;

    const showNewIssueButton = isAuthenticated && owner && repo;
    const mappedFilters: FilterConfig = {
        status: filters.state === "all" ? [] : [filters.state],
        labels: filters.labels,
        assignees: filters.assignee ? [filters.assignee] : [],
        priority: [],
    };

    return (
        <div style={pageStyle}>
            {owner && repo && (
                <div style={breadcrumbStyle}>
                    <Link to={`/${owner}`} style={breadcrumbLink}>{owner}</Link>
                    {" / "}
                    <Link to={`/${owner}/${repo}`} style={breadcrumbLink}>{repo}</Link>
                    {" / Issues"}
                </div>
            )}

            <div style={headerStyle}>
                <div style={titleRow}>
                    <div style={titleStyle}>
                        {owner && repo ? `${owner}/${repo} Issues` : "All Issues"}
                    </div>
                    <div style={countBadge}>{total}</div>
                </div>
                {showNewIssueButton && (
                    <Link to={`/${owner}/${repo}/issues/create`} style={buttonStyle}>
                        ➕ New Issue
                    </Link>
                )}
            </div>

            <div style={layoutStyle}>
                <div style={sidebar}>
                    <IssueFilters
                        availableLabels={[]}
                        availableUsers={[]}
                        activeFilters={mappedFilters}
                        onFiltersChange={(next) => {
                            setFilters((prev) => ({
                                ...prev,
                                state: next.status[0] as IssueFiltersState["state"] ?? "all",
                                labels: next.labels,
                                assignee: next.assignees[0],
                            }));
                        }}
                        onClearFilters={() =>
                            setFilters((prev) => ({ ...prev, state: "all", labels: [], assignee: undefined }))
                        }
                        compact
                    />
                </div>

                <div style={mainContent}>
                    {issues.length > 0 ? (
                        <>
                            <IssueList
                                issues={issues}
                                isLoading={loading}
                                onIssueClick={(issue) => {
                                    if (owner && repo) {
                                        window.location.href = `/${owner}/${repo}/issues/${issue.id}`;
                                    }
                                }}
                            />
                            {totalPages > 1 && (
                                <Pagination
                                    page={page}
                                    totalPages={totalPages}
                                    perPage={perPage}
                                    total={total}
                                    onPageChange={goToPage}
                                    hasNext={hasNext}
                                    hasPrev={hasPrev}
                                />
                            )}
                        </>
                    ) : (
                        <div style={emptyStateStyle}>
                            <div style={emptyIcon}>
                                {filters.state === "open" ? "🎉" : "🔍"}
                            </div>
                            <div style={{ fontSize: "16px", fontWeight: 500, marginBottom: "8px" }}>
                                {filters.state === "open"
                                    ? "No open issues"
                                    : "No issues found"}
                            </div>
                            <div style={{ fontSize: "14px" }}>
                                {filters.state === "open"
                                    ? "Great! All issues have been resolved."
                                    : "Try adjusting your filters or search criteria."}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
