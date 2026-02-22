import React, { useState, useEffect } from "react";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorMessage } from "../common/ErrorMessage";
import { Modal } from "../common/Modal";
import { showConfirm } from "../common/ConfirmDialog";
import { api, ApiError } from "../../services/api-client";

type TeamPrivacy = "public" | "private";

interface Team {
  id: number;
  name: string;
  slug: string;
  description: string;
  privacy: TeamPrivacy;
  member_count: number;
  repo_count: number;
  created_at: string;
  updated_at: string;
}

interface CreateTeamData {
  name: string;
  description: string;
  privacy: TeamPrivacy;
}

interface TeamManagerProps {
  orgname: string;
}

export const TeamManager: React.FC<TeamManagerProps> = ({ orgname }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingTeam, setCreatingTeam] = useState(false);

  const [newTeam, setNewTeam] = useState<CreateTeamData>({
    name: "",
    description: "",
    privacy: "private",
  });

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Team[]>(
        `/api/v1/organizations/${orgname}/teams`
      );
      setTeams(response.data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError("Failed to load teams");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [orgname]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeam.name.trim()) return;

    setCreatingTeam(true);
    setError(null);

    try {
      const response = await api.post<Team>(
        `/api/v1/organizations/${orgname}/teams`,
        newTeam
      );
      setTeams([...teams, response.data]);
      setShowCreateModal(false);
      setNewTeam({ name: "", description: "", privacy: "private" });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 409
            ? "Team with this name already exists"
            : "Failed to create team"
        );
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    const confirmed = await showConfirm({
      title: "Delete Team",
      message: `Are you sure you want to delete the team "${team.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await api.delete(`/api/v1/organizations/${orgname}/teams/${team.slug}`);
      setTeams(teams.filter((t) => t.id !== team.id));
    } catch (err) {
      if (err instanceof ApiError) {
        setError("Failed to delete team");
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const handleUpdateTeam = async (team: Team, updates: Partial<Team>) => {
    setError(null);

    try {
      const response = await api.patch<Team>(
        `/api/v1/organizations/${orgname}/teams/${team.slug}`,
        updates
      );
      setTeams(teams.map((t) => (t.id === team.id ? { ...t, ...updates } : t)));
    } catch (err) {
      if (err instanceof ApiError) {
        setError("Failed to update team");
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const getPrivacyIcon = (privacy: TeamPrivacy): string => {
    return privacy === "public" ? "🌐" : "🔒";
  };

  const containerStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    padding: "24px",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 600,
    color: "var(--text-primary)",
    margin: 0,
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "16px",
  };

  const teamCardStyle: React.CSSProperties = {
    background: "var(--bg-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    padding: "20px",
    cursor: "pointer",
    transition: "all 0.2s",
  };

  const teamHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "12px",
  };

  const teamNameStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--text-primary)",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const teamDescStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: "1.5",
    marginBottom: "16px",
  };

  const teamStatsStyle: React.CSSProperties = {
    display: "flex",
    gap: "20px",
    fontSize: "13px",
    color: "var(--text-muted)",
  };

  const statItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  };

  const privacySelectStyle: React.CSSProperties = {
    padding: "4px 8px",
    fontSize: "12px",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    color: "var(--text-primary)",
    cursor: "pointer",
  };

  const teamActionsStyle: React.CSSProperties = {
    display: "flex",
    gap: "8px",
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid var(--border-color)",
  };

  const formStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  };

  const fieldStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--text-primary)",
  };

  const inputStyle: React.CSSProperties = {
    padding: "8px 12px",
    fontSize: "14px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    color: "var(--text-primary)",
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: "80px",
    resize: "vertical",
    fontFamily: "inherit",
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "48px 24px",
    color: "var(--text-muted)",
  };

  const deleteButtonStyle: React.CSSProperties = {
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--accent-red)",
    background: "transparent",
    border: "1px solid var(--accent-red)",
    borderRadius: "var(--radius)",
    cursor: "pointer",
  };

  const viewButtonStyle: React.CSSProperties = {
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--accent-blue)",
    background: "transparent",
    border: "1px solid var(--accent-blue)",
    borderRadius: "var(--radius)",
    cursor: "pointer",
    flex: 1,
  };

  if (loading) {
    return <LoadingSpinner message="Loading teams..." />;
  }

  if (error && teams.length === 0) {
    return <ErrorMessage message={error} onRetry={fetchTeams} />;
  }

  return (
    <>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Teams ({teams.length})</h2>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            type="button"
          >
            Create Team
          </button>
        </div>

        {error && <ErrorMessage message={error} />}

        {teams.length === 0 ? (
          <div style={emptyStateStyle}>
            <p>No teams yet. Create your first team to organize members and repositories!</p>
          </div>
        ) : (
          <div style={gridStyle}>
            {teams.map((team) => (
              <div key={team.id} style={teamCardStyle}>
                <div style={teamHeaderStyle}>
                  <h3 style={teamNameStyle}>
                    <span>{getPrivacyIcon(team.privacy)}</span>
                    <span>{team.name}</span>
                  </h3>
                  <select
                    style={privacySelectStyle}
                    value={team.privacy}
                    onChange={(e) =>
                      handleUpdateTeam(team, {
                        privacy: e.target.value as TeamPrivacy,
                      })
                    }
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <p style={teamDescStyle}>
                  {team.description || (
                    <em style={{ color: "var(--text-muted)" }}>No description</em>
                  )}
                </p>

                <div style={teamStatsStyle}>
                  <div style={statItemStyle}>
                    <span>👤</span>
                    <span>{team.member_count} members</span>
                  </div>
                  <div style={statItemStyle}>
                    <span>📦</span>
                    <span>{team.repo_count} repos</span>
                  </div>
                </div>

                <div style={teamActionsStyle}>
                  <button
                    style={viewButtonStyle}
                    onClick={() => {
                      window.location.href = `/orgs/${orgname}/teams/${team.slug}`;
                    }}
                    type="button"
                  >
                    View Details
                  </button>
                  <button
                    style={deleteButtonStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTeam(team);
                    }}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewTeam({ name: "", description: "", privacy: "private" });
          setError(null);
        }}
        title="Create Team"
        width="500px"
      >
        <form onSubmit={handleCreateTeam} style={formStyle}>
          <div style={fieldStyle}>
            <label htmlFor="name" style={labelStyle}>
              Team Name <span style={{ color: "var(--accent-red)" }}>*</span>
            </label>
            <input
              id="name"
              type="text"
              style={inputStyle}
              value={newTeam.name}
              onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
              placeholder="e.g., Core Team, Frontend, Backend"
              required
              disabled={creatingTeam}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="description" style={labelStyle}>
              Description
            </label>
            <textarea
              id="description"
              style={textareaStyle}
              value={newTeam.description}
              onChange={(e) =>
                setNewTeam({ ...newTeam, description: e.target.value })
              }
              placeholder="What is this team responsible for?"
              disabled={creatingTeam}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="privacy" style={labelStyle}>
              Privacy
            </label>
            <select
              id="privacy"
              style={inputStyle}
              value={newTeam.privacy}
              onChange={(e) =>
                setNewTeam({ ...newTeam, privacy: e.target.value as TeamPrivacy })
              }
              disabled={creatingTeam}
            >
              <option value="private">Private - Only visible to organization members</option>
              <option value="public">Public - Visible to everyone</option>
            </select>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "flex-end",
              marginTop: "8px",
            }}
          >
            <button
              className="btn"
              type="button"
              onClick={() => setShowCreateModal(false)}
              disabled={creatingTeam}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={creatingTeam}
            >
              {creatingTeam ? "Creating..." : "Create Team"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};
