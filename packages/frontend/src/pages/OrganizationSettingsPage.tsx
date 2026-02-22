import React, { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api-client";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { OrgSettings } from "../components/organizations/OrgSettings";
import { OrgMembers } from "../components/organizations/OrgMembers";
import { TeamManager } from "../components/organizations/TeamManager";
import { TeamPermissions } from "../components/organizations/TeamPermissions";

interface Organization {
    id: string;
    name: string;
    isAdmin: boolean;
}

type SettingsTab = "general" | "members" | "teams" | "permissions";

/**
 * Organization settings page with tabs for general settings, members,
 * teams, and permissions.
 */
export const OrganizationSettingsPage: React.FC = () => {
    const { orgName } = useParams<{ orgName: string }>();
    const { isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>("general");

    const { data, loading, error } = useApi<Organization>(
        () => api.get<Organization>(`/organizations/${orgName}/settings`),
        [orgName],
    );

    const pageStyle: React.CSSProperties = {
        maxWidth: "1200px",
        margin: "0 auto",
    };

    const headerStyle: React.CSSProperties = {
        borderBottom: "1px solid var(--border-color)",
        paddingBottom: "16px",
        marginBottom: "24px",
    };

    const titleStyle: React.CSSProperties = {
        fontSize: "24px",
        fontWeight: 600,
        marginBottom: "8px",
    };

    const subtitleStyle: React.CSSProperties = {
        fontSize: "14px",
        color: "var(--text-secondary)",
    };

    const layoutStyle: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: "200px 1fr",
        gap: "32px",
    };

    const navStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    };

    const getNavItemStyle = (isActive: boolean): React.CSSProperties => ({
        padding: "8px 12px",
        fontSize: "14px",
        textAlign: "left",
        background: isActive ? "var(--bg-tertiary)" : "transparent",
        border: "none",
        borderLeft: isActive ? "2px solid var(--accent-blue)" : "2px solid transparent",
        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
        cursor: "pointer",
        transition: "all 0.15s",
        fontWeight: isActive ? 600 : 400,
    });

    const contentStyle: React.CSSProperties = {
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius)",
        padding: "24px",
        minHeight: "400px",
    };

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (loading) return <LoadingSpinner message="Loading settings..." />;
    if (error) return <ErrorMessage message={error} />;
    if (!data) return <ErrorMessage message="Organization not found" />;

    if (!data.isAdmin) {
        return <ErrorMessage message="You don't have permission to access organization settings" />;
    }

    return (
        <div style={pageStyle}>
            <div style={headerStyle}>
                <div style={titleStyle}>
                    {orgName} Settings
                </div>
                <div style={subtitleStyle}>
                    Manage organization settings, members, and teams
                </div>
            </div>

            <div style={layoutStyle}>
                <nav style={navStyle}>
                    <button
                        style={getNavItemStyle(activeTab === "general")}
                        onClick={() => setActiveTab("general")}
                    >
                        ⚙️ General
                    </button>
                    <button
                        style={getNavItemStyle(activeTab === "members")}
                        onClick={() => setActiveTab("members")}
                    >
                        👥 Members
                    </button>
                    <button
                        style={getNavItemStyle(activeTab === "teams")}
                        onClick={() => setActiveTab("teams")}
                    >
                        👨‍👩‍👧‍👦 Teams
                    </button>
                    <button
                        style={getNavItemStyle(activeTab === "permissions")}
                        onClick={() => setActiveTab("permissions")}
                    >
                        🔐 Permissions
                    </button>
                </nav>

                <div style={contentStyle}>
                    {activeTab === "general" && (
                        <OrgSettings orgname={data.name} />
                    )}
                    {activeTab === "members" && (
                        <OrgMembers orgname={data.name} />
                    )}
                    {activeTab === "teams" && (
                        <TeamManager orgname={data.name} />
                    )}
                    {activeTab === "permissions" && (
                        <TeamPermissions orgname={data.name} teamSlug="owners" />
                    )}
                </div>
            </div>
        </div>
    );
};
