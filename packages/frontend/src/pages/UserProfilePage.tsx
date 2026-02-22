import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api-client";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { Icon } from "../components/common/Icon";
import { Badge } from "../components/common/Badge";
import { formatRelativeTime } from "../utils/format";

interface UserProfile {
    id: string;
    username: string;
    email?: string;
    name?: string;
    bio?: string;
    avatar?: string;
    location?: string;
    company?: string;
    website?: string;
    twitterUsername?: string;
    createdAt: string;
    stats: {
        followers: number;
        following: number;
        repositories: number;
        stars: number;
    };
    isFollowing?: boolean;
}

interface Repository {
    id: string;
    name: string;
    slug: string;
    description?: string;
    isPrivate: boolean;
    stars: number;
    forks: number;
    language?: string;
    updatedAt: string;
}

/**
 * User Profile Page
 * Shows user information, repositories, and follow functionality
 */
export const UserProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<"repositories" | "followers" | "following">("repositories");

    const { data: profile, loading: profileLoading, error: profileError, refetch: refetchProfile } = useApi<UserProfile>(
        () => api.get(`/api/v1/users/${username}`),
        [username],
    );

    const { data: repositories, loading: reposLoading } = useApi<Repository[]>(
        () => api.get(`/api/v1/users/${username}/repositories`),
        [username],
    );

    const [following, setFollowing] = useState(false);

    React.useEffect(() => {
        if (profile) {
            setFollowing(profile.isFollowing ?? false);
        }
    }, [profile]);

    const handleFollow = async () => {
        try {
            if (following) {
                await api.delete(`/api/v1/users/${username}/follow`);
            } else {
                await api.post(`/api/v1/users/${username}/follow`, {});
            }
            setFollowing(!following);
            refetchProfile();
        } catch (error) {
            console.error("Failed to update follow status:", error);
        }
    };

    const isOwnProfile = currentUser?.username === username;

    if (profileLoading) {
        return <LoadingSpinner message="Loading profile..." />;
    }

    if (profileError || !profile) {
        return <ErrorMessage message={profileError || "User not found"} />;
    }

    const containerStyle: React.CSSProperties = {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "24px",
    };

    const headerStyle: React.CSSProperties = {
        display: "flex",
        gap: "24px",
        marginBottom: "32px",
        paddingBottom: "24px",
        borderBottom: "1px solid var(--border-color)",
    };

    const avatarStyle: React.CSSProperties = {
        width: "120px",
        height: "120px",
        borderRadius: "50%",
        background: "var(--bg-tertiary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "48px",
        fontWeight: 600,
        color: "var(--text-secondary)",
    };

    const infoStyle: React.CSSProperties = {
        flex: 1,
    };

    const nameStyle: React.CSSProperties = {
        fontSize: "24px",
        fontWeight: 600,
        marginBottom: "4px",
    };

    const usernameStyle: React.CSSProperties = {
        fontSize: "16px",
        color: "var(--text-secondary)",
        marginBottom: "16px",
    };

    const bioStyle: React.CSSProperties = {
        fontSize: "14px",
        lineHeight: 1.5,
        marginBottom: "16px",
    };

    const metaStyle: React.CSSProperties = {
        display: "flex",
        gap: "16px",
        flexWrap: "wrap",
        fontSize: "14px",
        color: "var(--text-secondary)",
        marginBottom: "16px",
    };

    const metaItemStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: "4px",
    };

    const statsStyle: React.CSSProperties = {
        display: "flex",
        gap: "24px",
        marginBottom: "16px",
    };

    const statStyle: React.CSSProperties = {
        fontSize: "14px",
    };

    const statValueStyle: React.CSSProperties = {
        fontWeight: 600,
        color: "var(--text-primary)",
        marginRight: "4px",
    };

    const tabsStyle: React.CSSProperties = {
        display: "flex",
        gap: "16px",
        borderBottom: "1px solid var(--border-color)",
        marginBottom: "24px",
    };

    const tabStyle = (active: boolean): React.CSSProperties => ({
        padding: "12px 16px",
        background: "none",
        border: "none",
        borderBottom: active ? "2px solid var(--accent-blue)" : "2px solid transparent",
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        fontSize: "14px",
        fontWeight: 500,
        cursor: "pointer",
        transition: "color 0.2s, border-color 0.2s",
    });

    const repoGridStyle: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "16px",
    };

    const repoCardStyle: React.CSSProperties = {
        padding: "16px",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius)",
        transition: "border-color 0.2s",
    };

    const repoTitleStyle: React.CSSProperties = {
        fontSize: "16px",
        fontWeight: 600,
        marginBottom: "8px",
        color: "var(--accent-blue)",
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: "8px",
    };

    const repoDescStyle: React.CSSProperties = {
        fontSize: "13px",
        color: "var(--text-secondary)",
        marginBottom: "12px",
        lineHeight: 1.4,
    };

    const repoMetaStyle: React.CSSProperties = {
        display: "flex",
        gap: "16px",
        fontSize: "12px",
        color: "var(--text-secondary)",
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <div style={avatarStyle}>
                    {profile.avatar ? (
                        <img src={profile.avatar} alt={profile.username} style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
                    ) : (
                        profile.username.charAt(0).toUpperCase()
                    )}
                </div>
                <div style={infoStyle}>
                    <div style={nameStyle}>{profile.name || profile.username}</div>
                    <div style={usernameStyle}>@{profile.username}</div>
                    {profile.bio && <div style={bioStyle}>{profile.bio}</div>}

                    <div style={metaStyle}>
                        {profile.company && (
                            <div style={metaItemStyle}>
                                <Icon name="server" size={16} />
                                {profile.company}
                            </div>
                        )}
                        {profile.location && (
                            <div style={metaItemStyle}>
                                <Icon name="server" size={16} />
                                {profile.location}
                            </div>
                        )}
                        {profile.website && (
                            <div style={metaItemStyle}>
                                <Icon name="link" size={16} />
                                <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)", textDecoration: "none" }}>
                                    {profile.website}
                                </a>
                            </div>
                        )}
                    </div>

                    <div style={statsStyle}>
                        <Link to={`/${username}/followers`} style={{ textDecoration: "none" }}>
                            <div style={statStyle}>
                                <span style={statValueStyle}>{profile.stats.followers}</span>
                                <span style={{ color: "var(--text-secondary)" }}>followers</span>
                            </div>
                        </Link>
                        <Link to={`/${username}/following`} style={{ textDecoration: "none" }}>
                            <div style={statStyle}>
                                <span style={statValueStyle}>{profile.stats.following}</span>
                                <span style={{ color: "var(--text-secondary)" }}>following</span>
                            </div>
                        </Link>
                        <div style={statStyle}>
                            <span style={statValueStyle}>{profile.stats.repositories}</span>
                            <span style={{ color: "var(--text-secondary)" }}>repositories</span>
                        </div>
                    </div>

                    {!isOwnProfile && currentUser && (
                        <button
                            className={following ? "btn btn-secondary" : "btn btn-primary"}
                            onClick={handleFollow}
                            style={{ padding: "8px 16px" }}
                        >
                            {following ? "Unfollow" : "Follow"}
                        </button>
                    )}
                    {isOwnProfile && (
                        <Link to="/settings" className="btn btn-secondary" style={{ padding: "8px 16px", textDecoration: "none", display: "inline-block" }}>
                            Edit Profile
                        </Link>
                    )}
                </div>
            </div>

            <div style={tabsStyle}>
                <button
                    style={tabStyle(activeTab === "repositories")}
                    onClick={() => setActiveTab("repositories")}
                >
                    Repositories {profile.stats.repositories > 0 && `(${profile.stats.repositories})`}
                </button>
                <button
                    style={tabStyle(activeTab === "followers")}
                    onClick={() => setActiveTab("followers")}
                >
                    Followers {profile.stats.followers > 0 && `(${profile.stats.followers})`}
                </button>
                <button
                    style={tabStyle(activeTab === "following")}
                    onClick={() => setActiveTab("following")}
                >
                    Following {profile.stats.following > 0 && `(${profile.stats.following})`}
                </button>
            </div>

            {activeTab === "repositories" && (
                <div style={repoGridStyle}>
                    {reposLoading ? (
                        <LoadingSpinner message="Loading repositories..." />
                    ) : repositories && repositories.length > 0 ? (
                        repositories.map((repo) => (
                            <div key={repo.id} style={repoCardStyle}>
                                <Link to={`/${username}/${repo.slug}`} style={repoTitleStyle}>
                                    <Icon name="folder" size={16} />
                                    {repo.name}
                                    {repo.isPrivate && <Badge variant="default" label="Private" />}
                                </Link>
                                {repo.description && <div style={repoDescStyle}>{repo.description}</div>}
                                <div style={repoMetaStyle}>
                                    {repo.language && <span>{repo.language}</span>}
                                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        <Icon name="star" size={12} />
                                        {repo.stars}
                                    </span>
                                    <span>Updated {formatRelativeTime(repo.updatedAt)}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
                            No repositories yet
                        </div>
                    )}
                </div>
            )}

            {activeTab === "followers" && (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
                    Followers list coming soon
                </div>
            )}

            {activeTab === "following" && (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
                    Following list coming soon
                </div>
            )}
        </div>
    );
};
