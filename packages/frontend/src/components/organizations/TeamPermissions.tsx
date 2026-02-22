import React, { useState, useEffect } from "react";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorMessage } from "../common/ErrorMessage";
import { Modal } from "../common/Modal";
import { showConfirm } from "../common/ConfirmDialog";
import { api, ApiError } from "../../services/api-client";

type Permission = "read" | "write" | "admin";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  private: boolean;
}

interface TeamRepository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  private: boolean;
  permission: Permission;
  added_at: string;
}

interface AddRepoData {
  repository_name: string;
  permission: Permission;
}

interface TeamPermissionsProps {
  orgname: string;
  teamSlug: string;
}

export const TeamPermissions: React.FC<TeamPermissionsProps> = ({
  orgname,
  teamSlug,
}) => {
  const [repos, setRepos] = useState<TeamRepository[]>([]);
  const [availableRepos, setAvailableRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingRepo, setAddingRepo] = useState(false);
  const [updatingPermission, setUpdatingPermission] = useState<number | null>(null);

  const [newRepo, setNewRepo] = useState<AddRepoData>({
    repository_name: "",
    permission: "read",
  });

  const fetchTeamRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<TeamRepository[]>(
        `/api/v1/organizations/${orgname}/teams/${teamSlug}/repos`
      );
      setRepos(response.data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError("Failed to load team repositories");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRepos = async () => {
    try {
      const response = await api.get<Repository[]>(
        `/api/v1/organizations/${orgname}/repositories`
      );
      setAvailableRepos(response.data);
    } catch (err) {
      console.error("Failed to fetch available repos:", err);
    }
  };

  useEffect(() => {
    fetchTeamRepos();
    fetchAvailableRepos();
  }, [orgname, teamSlug]);

  const handleAddRepository = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepo.repository_name) return;

    setAddingRepo(true);
    setError(null);

    try {
      const response = await api.put<TeamRepository>(
        `/api/v1/organizations/${orgname}/teams/${teamSlug}/repos/${newRepo.repository_name}`,
        { permission: newRepo.permission }
      );
      setRepos([...repos, response.data]);
      setShowAddModal(false);
      setNewRepo({ repository_name: "", permission: "read" });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 404
            ? "Repository not found"
            : err.status === 409
            ? "Repository already added to team"
            : "Failed to add repository"
        );
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setAddingRepo(false);
    }
  };

  const handleRemoveRepository = async (repo: TeamRepository) => {
    const confirmed = await showConfirm({
      title: "Remove Repository",
      message: `Are you sure you want to remove "${repo.name}" from this team?`,
      confirmText: "Remove",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await api.delete(
        `/api/v1/organizations/${orgname}/teams/${teamSlug}/repos/${repo.name}`
      );
      setRepos(repos.filter((r) => r.id !== repo.id));
    } catch (err) {
      if (err instanceof ApiError) {
        setError("Failed to remove repository");
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const handleUpdatePermission = async (
    repo: TeamRepository,
    newPermission: Permission
  ) => {
    if (newPermission === repo.permission) return;

    setUpdatingPermission(repo.id);
    setError(null);

    try {
      await api.put(
        `/api/v1/organizations/${orgname}/teams/${teamSlug}/repos/${repo.name}`,
        { permission: newPermission }
      );
      setRepos(
        repos.map((r) =>
          r.id === repo.id ? { ...r, permission: newPermission } : r
        )
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError("Failed to update permission");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setUpdatingPermission(null);
    }
  };

  const getPermissionColor = (permission: Permission): string => {
    switch (permission) {
      case "admin":
        return "#8250df";
      case "write":
        return "#1f6feb";
      case "read":
        return "#58a6ff";
      default:
        return "#6e7681";
    }
  };

  const getPermissionIcon = (permission: Permission): string => {
    switch (permission) {
      case "admin":
        return "🔧";
      case "write":
        return "✏️";
      case "read":
        return "👁️";
      default:
        return "❓";
    }
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

  const infoBoxStyle: React.CSSProperties = {
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    padding: "12px 16px",
    marginBottom: "20px",
    fontSize: "13px",
    color: "var(--text-secondary)",
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
  };

  const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "12px 8px",
    borderBottom: "1px solid var(--border-color)",
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--text-secondary)",
  };

  const tdStyle: React.CSSProperties = {
    padding: "16px 8px",
    borderBottom: "1px solid var(--border-color)",
  };

  const repoNameStyle: React.CSSProperties = {
    fontWeight: 600,
    color: "var(--text-primary)",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const repoDescStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "var(--text-muted)",
    marginTop: "4px",
  };

  const badgeStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "2px 6px",
    fontSize: "11px",
    fontWeight: 600,
    borderRadius: "4px",
    background: "rgba(248, 81, 73, 0.1)",
    color: "#f85149",
  };

  const permissionSelectStyle: React.CSSProperties = {
    padding: "6px 10px",
    fontSize: "13px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    color: "var(--text-primary)",
    cursor: "pointer",
  };

  const actionButtonStyle: React.CSSProperties = {
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--accent-red)",
    background: "transparent",
    border: "1px solid var(--accent-red)",
    borderRadius: "var(--radius)",
    cursor: "pointer",
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

  const emptyStateStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "48px 24px",
    color: "var(--text-muted)",
  };

  if (loading) {
    return <LoadingSpinner message="Loading team repositories..." />;
  }

  if (error && repos.length === 0) {
    return <ErrorMessage message={error} onRetry={fetchTeamRepos} />;
  }

  return (
    <>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Repository Permissions ({repos.length})</h2>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            type="button"
          >
            Add Repository
          </button>
        </div>

        <div style={infoBoxStyle}>
          <strong>Permission Levels:</strong> Read (clone, pull) · Write (push, manage
          issues/PRs) · Admin (full control, settings)
        </div>

        {error && <ErrorMessage message={error} />}

        {repos.length === 0 ? (
          <div style={emptyStateStyle}>
            <p>No repositories added yet. Add repositories to manage team access!</p>
          </div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Repository</th>
                <th style={thStyle}>Permission</th>
                <th style={thStyle}>Added</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {repos.map((repo) => (
                <tr key={repo.id}>
                  <td style={tdStyle}>
                    <div style={repoNameStyle}>
                      <span>{repo.name}</span>
                      {repo.private && <span style={badgeStyle}>Private</span>}
                    </div>
                    {repo.description && (
                      <div style={repoDescStyle}>{repo.description}</div>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <select
                      style={permissionSelectStyle}
                      value={repo.permission}
                      onChange={(e) =>
                        handleUpdatePermission(
                          repo,
                          e.target.value as Permission
                        )
                      }
                      disabled={updatingPermission === repo.id}
                    >
                      <option value="read">
                        {getPermissionIcon("read")} Read
                      </option>
                      <option value="write">
                        {getPermissionIcon("write")} Write
                      </option>
                      <option value="admin">
                        {getPermissionIcon("admin")} Admin
                      </option>
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                      {new Date(repo.added_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button
                      style={actionButtonStyle}
                      onClick={() => handleRemoveRepository(repo)}
                      type="button"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewRepo({ repository_name: "", permission: "read" });
          setError(null);
        }}
        title="Add Repository to Team"
        width="500px"
      >
        <form onSubmit={handleAddRepository} style={formStyle}>
          <div style={fieldStyle}>
            <label htmlFor="repository_name" style={labelStyle}>
              Repository <span style={{ color: "var(--accent-red)" }}>*</span>
            </label>
            <select
              id="repository_name"
              style={inputStyle}
              value={newRepo.repository_name}
              onChange={(e) =>
                setNewRepo({ ...newRepo, repository_name: e.target.value })
              }
              required
              disabled={addingRepo}
            >
              <option value="">Select a repository...</option>
              {availableRepos
                .filter((ar) => !repos.find((r) => r.id === ar.id))
                .map((repo) => (
                  <option key={repo.id} value={repo.name}>
                    {repo.name} {repo.private ? "(Private)" : "(Public)"}
                  </option>
                ))}
            </select>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Only repositories not already added to this team are shown
            </span>
          </div>

          <div style={fieldStyle}>
            <label htmlFor="permission" style={labelStyle}>
              Permission Level
            </label>
            <select
              id="permission"
              style={inputStyle}
              value={newRepo.permission}
              onChange={(e) =>
                setNewRepo({ ...newRepo, permission: e.target.value as Permission })
              }
              disabled={addingRepo}
            >
              <option value="read">Read - Clone and pull</option>
              <option value="write">Write - Push, manage issues and PRs</option>
              <option value="admin">Admin - Full repository control</option>
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
              onClick={() => setShowAddModal(false)}
              disabled={addingRepo}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={addingRepo || !newRepo.repository_name}
            >
              {addingRepo ? "Adding..." : "Add Repository"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};
