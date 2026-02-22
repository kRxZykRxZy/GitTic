import React, { useState, useEffect } from "react";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorMessage } from "../common/ErrorMessage";
import { Modal } from "../common/Modal";
import { showConfirm } from "../common/ConfirmDialog";
import { api, ApiError } from "../../services/api-client";

type MemberRole = "member" | "admin" | "owner";

interface Member {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: MemberRole;
  joined_at: string;
}

interface AddMemberData {
  username: string;
  role: MemberRole;
}

interface OrgMembersProps {
  orgname: string;
}

export const OrgMembers: React.FC<OrgMembersProps> = ({ orgname }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [changingRole, setChangingRole] = useState<number | null>(null);

  const [newMember, setNewMember] = useState<AddMemberData>({
    username: "",
    role: "member",
  });

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Member[]>(
        `/api/v1/organizations/${orgname}/members`
      );
      setMembers(response.data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError("Failed to load members");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [orgname]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.username.trim()) return;

    setAddingMember(true);
    setError(null);

    try {
      const response = await api.post<Member>(
        `/api/v1/organizations/${orgname}/members`,
        newMember
      );
      setMembers([...members, response.data]);
      setShowAddModal(false);
      setNewMember({ username: "", role: "member" });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 404
            ? "User not found"
            : err.status === 409
            ? "User is already a member"
            : "Failed to add member"
        );
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (member: Member) => {
    const confirmed = await showConfirm({
      title: "Remove Member",
      message: `Are you sure you want to remove ${member.username} from this organization?`,
      confirmText: "Remove",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await api.delete(
        `/api/v1/organizations/${orgname}/members/${member.username}`
      );
      setMembers(members.filter((m) => m.id !== member.id));
    } catch (err) {
      if (err instanceof ApiError) {
        setError("Failed to remove member");
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const handleChangeRole = async (member: Member, newRole: MemberRole) => {
    if (newRole === member.role) return;

    setChangingRole(member.id);
    setError(null);

    try {
      const response = await api.patch<Member>(
        `/api/v1/organizations/${orgname}/members/${member.username}`,
        { role: newRole }
      );
      setMembers(
        members.map((m) => (m.id === member.id ? { ...m, role: newRole } : m))
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError("Failed to change member role");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setChangingRole(null);
    }
  };

  const getRoleBadgeColor = (role: MemberRole): string => {
    switch (role) {
      case "owner":
        return "#8250df";
      case "admin":
        return "#1f6feb";
      case "member":
        return "#58a6ff";
      default:
        return "#6e7681";
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

  const memberInfoStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };

  const avatarStyle: React.CSSProperties = {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    objectFit: "cover",
  };

  const avatarPlaceholderStyle: React.CSSProperties = {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "var(--bg-tertiary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    color: "var(--text-secondary)",
  };

  const nameStyle: React.CSSProperties = {
    fontWeight: 600,
    color: "var(--text-primary)",
    fontSize: "14px",
  };

  const usernameStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "var(--text-muted)",
  };

  const roleBadgeStyle = (role: MemberRole): React.CSSProperties => ({
    display: "inline-block",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: 600,
    borderRadius: "12px",
    background: `${getRoleBadgeColor(role)}20`,
    color: getRoleBadgeColor(role),
    textTransform: "capitalize",
  });

  const selectStyle: React.CSSProperties = {
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
    return <LoadingSpinner message="Loading members..." />;
  }

  if (error && members.length === 0) {
    return <ErrorMessage message={error} onRetry={fetchMembers} />;
  }

  return (
    <>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Members ({members.length})</h2>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            type="button"
          >
            Add Member
          </button>
        </div>

        {error && <ErrorMessage message={error} />}

        {members.length === 0 ? (
          <div style={emptyStateStyle}>
            <p>No members yet. Add your first member to get started!</p>
          </div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Member</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Joined</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td style={tdStyle}>
                    <div style={memberInfoStyle}>
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.name}
                          style={avatarStyle}
                        />
                      ) : (
                        <div style={avatarPlaceholderStyle}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={nameStyle}>{member.name}</div>
                        <div style={usernameStyle}>@{member.username}</div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                      {member.email}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {member.role === "owner" ? (
                      <span style={roleBadgeStyle(member.role)}>{member.role}</span>
                    ) : (
                      <select
                        style={selectStyle}
                        value={member.role}
                        onChange={(e) =>
                          handleChangeRole(member, e.target.value as MemberRole)
                        }
                        disabled={changingRole === member.id}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                      {new Date(member.joined_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {member.role !== "owner" && (
                      <button
                        style={actionButtonStyle}
                        onClick={() => handleRemoveMember(member)}
                        type="button"
                      >
                        Remove
                      </button>
                    )}
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
          setNewMember({ username: "", role: "member" });
          setError(null);
        }}
        title="Add Member"
        width="450px"
      >
        <form onSubmit={handleAddMember} style={formStyle}>
          <div style={fieldStyle}>
            <label htmlFor="username" style={labelStyle}>
              Username
            </label>
            <input
              id="username"
              type="text"
              style={inputStyle}
              value={newMember.username}
              onChange={(e) =>
                setNewMember({ ...newMember, username: e.target.value })
              }
              placeholder="Enter username"
              required
              disabled={addingMember}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="role" style={labelStyle}>
              Role
            </label>
            <select
              id="role"
              style={inputStyle}
              value={newMember.role}
              onChange={(e) =>
                setNewMember({ ...newMember, role: e.target.value as MemberRole })
              }
              disabled={addingMember}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
            <button
              className="btn"
              type="button"
              onClick={() => setShowAddModal(false)}
              disabled={addingMember}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={addingMember}
            >
              {addingMember ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};
