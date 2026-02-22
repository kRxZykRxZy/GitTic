import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePaginatedApi } from "../hooks/useApi";
import { api } from "../services/api-client";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import PullRequestList from "../components/pullrequests/PullRequestList";
import { Pagination } from "../components/common/Pagination";

interface PRFiltersState {
    state: "open" | "closed" | "merged" | "all";
    author?: string;
    assignee?: string;
    label?: string;
    sort: "created" | "updated" | "popularity" | "long-running";
    direction: "asc" | "desc";
}

/**
 * Pull requests list page with filters and sorting options.
 */
export const PullRequestsPage: React.FC = () => {
    const { owner, repo } = useParams<{ owner?: string; repo?: string }>();
    const { isAuthenticated } = useAuth();

    const [filters, setFilters] = useState<PRFiltersState>({
        state: "open",
        sort: "created",
        direction: "desc",
    });

    const endpoint = owner && repo
        ? `/repositories/${owner}/${repo}/pulls`
        : "/pulls";

    const {
        items: pullRequests,
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
                    author: filters.author,
                    assignee: filters.assignee,
                    label: filters.label,
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

    const filterBar: React.CSSProperties = {
        display: "flex",
        gap: "12px",
        marginBottom: "16px",
        padding: "12px",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius)",
        flexWrap: "wrap",
        alignItems: "center",
    };

    const filterGroup: React.CSSProperties = {
        display: "flex",
        gap: "8px",
        alignItems: "center",
    };

    const filterLabel: React.CSSProperties = {
        fontSize: "13px",
        color: "var(--text-secondary)",
        fontWeight: 500,
    };

    const getFilterButtonStyle = (isActive: boolean): React.CSSProperties => ({
        padding: "4px 12px",
        fontSize: "13px",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border-color)",
        background: isActive ? "var(--accent-blue)" : "var(--bg-primary)",
        color: isActive ? "white" : "var(--text-primary)",
        cursor: "pointer",
        transition: "all 0.15s",
    });

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

    if (loading && page === 1) return <LoadingSpinner message="Loading pull requests..." />;
    if (error) return <ErrorMessage message={error} />;

    const showNewPRButton = isAuthenticated && owner && repo;

    return (
        <div style={pageStyle}>
            {owner && repo && (
                <div style={breadcrumbStyle}>
                    <Link to={`/${owner}`} style={breadcrumbLink}>{owner}</Link>
                    {" / "}
                    <Link to={`/${owner}/${repo}`} style={breadcrumbLink}>{repo}</Link>
                    {" / Pull Requests"}
                </div>
            )}

            <div style={headerStyle}>
                <div style={titleRow}>
                    <div style={titleStyle}>
                        {owner && repo ? `${owner}/${repo} Pull Requests` : "All Pull Requests"}
                    </div>
                    <div style={countBadge}>{total}</div>
                </div>
                {showNewPRButton && (
                    <Link to={`/${owner}/${repo}/pulls/create`} style={buttonStyle}>
                        ➕ New Pull Request
                    </Link>
                )}
            </div>

            <div style={filterBar}>
                <div style={filterGroup}>
                    <span style={filterLabel}>State:</span>
                    <button
                        style={getFilterButtonStyle(filters.state === "open")}
                        onClick={() => setFilters({ ...filters, state: "open" })}
                    >
                        Open
                    </button>
                    <button
                        style={getFilterButtonStyle(filters.state === "closed")}
                        onClick={() => setFilters({ ...filters, state: "closed" })}
                    >
                        Closed
                    </button>
                    <button
                        style={getFilterButtonStyle(filters.state === "merged")}
                        onClick={() => setFilters({ ...filters, state: "merged" })}
                    >
                        Merged
                    </button>
                </div>

                <div style={filterGroup}>
                    <span style={filterLabel}>Sort:</span>
                    <button
                        style={getFilterButtonStyle(filters.sort === "created")}
                        onClick={() => setFilters({ ...filters, sort: "created" })}
                    >
                        Newest
                    </button>
                    <button
                        style={getFilterButtonStyle(filters.sort === "updated")}
                        onClick={() => setFilters({ ...filters, sort: "updated" })}
                    >
                        Recently Updated
                    </button>
                    <button
                        style={getFilterButtonStyle(filters.sort === "popularity")}
                        onClick={() => setFilters({ ...filters, sort: "popularity" })}
                    >
                        Most Comments
                    </button>
                </div>
            </div>

            {pullRequests.length > 0 ? (
                <>
                    <PullRequestList pullRequests={pullRequests} isLoading={loading} />
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
                            ? "No open pull requests"
                            : "No pull requests found"}
                    </div>
                    <div style={{ fontSize: "14px" }}>
                        {filters.state === "open"
                            ? "Great! All pull requests have been merged or closed."
                            : "Try adjusting your filters."}
                    </div>
                </div>
            )}
        </div>
    );
};
