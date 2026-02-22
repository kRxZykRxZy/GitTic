import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api-client";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { OrgProfile } from "../components/organizations/OrgProfile";
import { ProjectCard } from "../components/projects/ProjectCard";
import { OrgMembers } from "../components/organizations/OrgMembers";
import { TeamManager } from "../components/organizations/TeamManager";
import type { Project as ProjectCardModel } from "../types/api";

interface Organization {
    id: string;
    name: string;
    displayName: string;
    description?: string;
    avatarUrl?: string;
    memberCount: number;
    projectCount: number;
    teamCount: number;
    createdAt: string;
    isAdmin: boolean;
    isMember: boolean;
}

interface Project {
    id: string;
    name: string;
    description: string;
    stars: number;
    forks: number;
    language?: string;
    updatedAt: string;
}

interface OrganizationData {
    organization: Organization;
    repositories: Project[];
    memberCount: number;
    teamCount: number;
}

type OrgTab = "repositories" | "members" | "teams";

/**
 * Organization profile page showing repositories, members, and teams.
 */
export const OrganizationPage: React.FC = () => {
    const { orgName } = useParams<{ orgName: string }>();
    const { isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState<OrgTab>("repositories");

    const { data, loading, error } = useApi<OrganizationData>(
        () => api.get<OrganizationData>(`/organizations/${orgName}`),
        [orgName],
    );

    const pageStyle: React.CSSProperties = {
        maxWidth: "1200px",
        margin: "0 auto",
    };

    const headerStyle: React.CSSProperties = {
        borderBottom: "1px solid var(--border-color)",
        paddingBottom: "24px",
        marginBottom: "24px",
    };

    const profileRow: React.CSSProperties = {
        display: "flex",
        gap: "20px",
        alignItems: "start",
    };

    const avatarStyle: React.CSSProperties = {
        width: "80px",
        height: "80px",
        borderRadius: "var(--radius)",
        background: "var(--bg-tertiary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "32px",
    };

    const infoStyle: React.CSSProperties = {
        flex: 1,
    };

    const nameStyle: React.CSSProperties = {
        fontSize: "28px",
        fontWeight: 600,
        marginBottom: "4px",
    };

    const usernameStyle: React.CSSProperties = {
        fontSize: "18px",
        color: "var(--text-secondary)",
        marginBottom: "8px",
    };

    const descriptionStyle: React.CSSProperties = {
        fontSize: "14px",
        color: "var(--text-secondary)",
        marginBottom: "12px",
    };

    const statsRow: React.CSSProperties = {
        display: "flex",
        gap: "16px",
        fontSize: "13px",
        color: "var(--text-secondary)",
    };

    const statItem: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: "4px",
    };

    const actionsStyle: React.CSSProperties = {
        display: "flex",
        gap: "8px",
    };

    const buttonStyle: React.CSSProperties = {
        padding: "8px 16px",
        fontSize: "14px",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border-color)",
        background: "var(--bg-secondary)",
        color: "var(--text-primary)",
        cursor: "pointer",
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        transition: "background 0.15s",
    };

    const tabsStyle: React.CSSProperties = {
        display: "flex",
        gap: "8px",
        borderBottom: "1px solid var(--border-color)",
        marginBottom: "24px",
    };

    const getTabStyle = (isActive: boolean): React.CSSProperties => ({
        padding: "8px 16px",
        background: "transparent",
        border: "none",
        borderBottom: isActive ? "2px solid var(--accent-blue)" : "2px solid transparent",
        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: isActive ? 600 : 400,
        transition: "all 0.15s",
    });

    const projectsGrid: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
        gap: "16px",
    };

    const emptyStateStyle: React.CSSProperties = {
        textAlign: "center",
        padding: "48px 24px",
        color: "var(--text-muted)",
    };

    if (loading) return <LoadingSpinner message="Loading organization..." />;
    if (error) return <ErrorMessage message={error} />;
    if (!data?.organization) return <ErrorMessage message="Organization not found" />;

    const org = data.organization;
    const canManage = org.isAdmin;

    return (
        <div style={pageStyle}>
            <div style={headerStyle}>
                <div style={profileRow}>
                    <div style={avatarStyle}>
                        {org.avatarUrl ? (
                            <img src={org.avatarUrl} alt={org.name} style={{ width: "100%", height: "100%", borderRadius: "var(--radius)" }} />
                        ) : (
                            "🏢"
                        )}
                    </div>
                    <div style={infoStyle}>
                        <div style={nameStyle}>{org.displayName}</div>
                        <div style={usernameStyle}>@{org.name}</div>
                        {org.description && (
                            <div style={descriptionStyle}>{org.description}</div>
                        )}
                        <div style={statsRow}>
                            <div style={statItem}>
                                <span>📦</span>
                                <strong>{org.projectCount}</strong> repositories
                            </div>
                            <div style={statItem}>
                                <span>👥</span>
                                <strong>{org.memberCount}</strong> members
                            </div>
                            <div style={statItem}>
                                <span>👨‍👩‍👧‍👦</span>
                                <strong>{org.teamCount}</strong> teams
                            </div>
                        </div>
                    </div>
                    <div style={actionsStyle}>
                        {org.isMember && canManage && (
                            <Link to={`/organizations/${orgName}/settings`} style={buttonStyle}>
                                ⚙️ Settings
                            </Link>
                        )}
                        {!org.isMember && isAuthenticated && (
                            <button style={buttonStyle}>
                                ➕ Join
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div style={tabsStyle}>
                <button
                    style={getTabStyle(activeTab === "repositories")}
                    onClick={() => setActiveTab("repositories")}
                >
                    📦 Repositories ({org.projectCount})
                </button>
                <button
                    style={getTabStyle(activeTab === "members")}
                    onClick={() => setActiveTab("members")}
                >
                    👥 Members ({org.memberCount})
                </button>
                <button
                    style={getTabStyle(activeTab === "teams")}
                    onClick={() => setActiveTab("teams")}
                >
                    👨‍👩‍👧‍👦 Teams ({org.teamCount})
                </button>
            </div>

            {activeTab === "repositories" && (
                <>
                    {data.repositories.length > 0 ? (
                        <div style={projectsGrid}>
                            {data.repositories.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    project={{
                                        id: project.id,
                                        name: project.name,
                                        description: project.description,
                                        visibility: "public",
                                        ownerId: org.id,
                                        ownerUsername: org.name,
                                        language: project.language,
                                        stars: project.stars,
                                        forks: project.forks,
                                        openIssues: 0,
                                        defaultBranch: "main",
                                        hasReadme: false,
                                        size: 0,
                                        createdAt: project.updatedAt,
                                        updatedAt: project.updatedAt,
                                        lastActivityAt: project.updatedAt,
                                    } as ProjectCardModel}
                                />
                            ))}
                        </div>
                    ) : (
                        <div style={emptyStateStyle}>
                            No repositories yet.
                        </div>
                    )}
                </>
            )}

            {activeTab === "members" && (
                <OrgMembers orgname={org.name} />
            )}

            {activeTab === "teams" && (
                <TeamManager orgname={org.name} />
            )}
        </div>
    );
};
