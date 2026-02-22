import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api-client";

interface Member {
    id: string;
    username: string;
    email: string;
    role: "owner" | "admin" | "member" | "billing";
    avatarUrl?: string;
}

interface OrganizationFormProps {
    onSuccess?: () => void;
}

interface CreateOrgResponse {
    id: string;
}

interface AddMemberResponse extends Member { }

/**
 * Organization Creation and Management Component
 * Create orgs, add members, manage permissions
 */
export const OrganizationForm: React.FC<OrganizationFormProps> = ({ onSuccess }) => {
    const navigate = useNavigate();
    const toast = useToast();
    const [step, setStep] = useState<"create" | "add-members">("create");
    const [orgId, setOrgId] = useState<string>("");

    // Organization details
    const [name, setName] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [description, setDescription] = useState("");
    const [website, setWebsite] = useState("");
    const [email, setEmail] = useState("");

    // Member management
    const [memberEmail, setMemberEmail] = useState("");
    const [memberRole, setMemberRole] = useState<Member["role"]>("member");
    const [members, setMembers] = useState<Member[]>([]);

    const [creating, setCreating] = useState(false);
    const [addingMember, setAddingMember] = useState(false);

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Organization name is required");
            return;
        }

        setCreating(true);
        try {
            const response = await api.post<CreateOrgResponse>("/organizations", {
                name: name.trim().toLowerCase(),
                displayName: displayName.trim() || name.trim(),
                description: description.trim() || undefined,
                website: website.trim() || undefined,
                email: email.trim() || undefined,
            });

            setOrgId(response.data.id);
            toast.success(`Organization "${displayName || name}" created!`);
            setStep("add-members");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to create organization");
        } finally {
            setCreating(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!memberEmail.trim()) {
            toast.error("Email is required");
            return;
        }

        setAddingMember(true);
        try {
            const response = await api.post<AddMemberResponse>(`/organizations/${orgId}/members`, {
                email: memberEmail.trim(),
                role: memberRole,
            });

            setMembers([...members, response.data]);
            toast.success(`Member added with ${memberRole} role`);
            setMemberEmail("");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to add member");
        } finally {
            setAddingMember(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm("Remove this member from the organization?")) return;

        try {
            await api.delete(`/organizations/${orgId}/members/${memberId}`);
            setMembers(members.filter(m => m.id !== memberId));
            toast.success("Member removed");
        } catch (err) {
            toast.error("Failed to remove member");
        }
    };

    const handleUpdateMemberRole = async (memberId: string, newRole: Member["role"]) => {
        try {
            await api.patch(`/organizations/${orgId}/members/${memberId}`, {
                role: newRole,
            });

            setMembers(members.map(m =>
                m.id === memberId ? { ...m, role: newRole } : m
            ));

            toast.success("Member role updated");
        } catch (err) {
            toast.error("Failed to update role");
        }
    };

    const handleFinish = () => {
        if (onSuccess) {
            onSuccess();
        } else {
            navigate(`/${name}`);
        }
    };

    const containerStyle: React.CSSProperties = {
        maxWidth: "600px",
        margin: "0 auto",
    };

    const cardStyle: React.CSSProperties = {
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius)",
        padding: "32px",
    };

    const titleStyle: React.CSSProperties = {
        fontSize: "24px",
        fontWeight: 700,
        marginBottom: "8px",
    };

    const subtitleStyle: React.CSSProperties = {
        fontSize: "14px",
        color: "var(--text-secondary)",
        marginBottom: "24px",
    };

    const formStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    };

    const labelStyle: React.CSSProperties = {
        fontSize: "14px",
        fontWeight: 500,
        marginBottom: "6px",
        display: "block",
    };

    const roleGridStyle: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "8px",
        marginTop: "8px",
    };

    const roleCardStyle = (isSelected: boolean): React.CSSProperties => ({
        padding: "12px",
        border: `2px solid ${isSelected ? "var(--accent-blue)" : "var(--border-color)"}`,
        borderRadius: "var(--radius)",
        cursor: "pointer",
        background: isSelected ? "rgba(33, 150, 243, 0.05)" : "var(--bg-primary)",
        transition: "all 0.15s",
    });

    const roleNameStyle: React.CSSProperties = {
        fontSize: "14px",
        fontWeight: 600,
        marginBottom: "4px",
    };

    const roleDescStyle: React.CSSProperties = {
        fontSize: "12px",
        color: "var(--text-secondary)",
    };

    const memberListStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginTop: "16px",
    };

    const memberCardStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px",
        background: "var(--bg-primary)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius)",
    };

    const ROLE_DESCRIPTIONS = {
        owner: "Full access, can delete organization",
        admin: "Manage settings and members",
        member: "Access organization repositories",
        billing: "Manage billing and subscription",
    };

    if (step === "create") {
        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <h1 style={titleStyle}>Create Organization</h1>
                    <p style={subtitleStyle}>
                        Organizations allow you to collaborate with others across many projects
                    </p>

                    <form style={formStyle} onSubmit={handleCreateOrg}>
                        <div>
                            <label style={labelStyle}>
                                Organization Name * <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>(username format)</span>
                            </label>
                            <input
                                className="input"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value.toLowerCase())}
                                placeholder="my-organization"
                                pattern="^[a-z0-9-]+$"
                                required
                                disabled={creating}
                            />
                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                Lowercase letters, numbers, and hyphens only
                            </span>
                        </div>

                        <div>
                            <label style={labelStyle}>Display Name</label>
                            <input
                                className="input"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="My Organization"
                                disabled={creating}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Description</label>
                            <textarea
                                className="input"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What does your organization do?"
                                rows={3}
                                disabled={creating}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Website (optional)</label>
                            <input
                                className="input"
                                type="url"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                placeholder="https://example.com"
                                disabled={creating}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Contact Email (optional)</label>
                            <input
                                className="input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="contact@example.com"
                                disabled={creating}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={creating || !name.trim()}
                            style={{ marginTop: "8px" }}
                        >
                            {creating ? "Creating..." : "Create Organization"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h1 style={titleStyle}>Add Members</h1>
                <p style={subtitleStyle}>
                    Invite team members to {displayName || name}
                </p>

                <form style={formStyle} onSubmit={handleAddMember}>
                    <div>
                        <label style={labelStyle}>Member Email</label>
                        <input
                            className="input"
                            type="email"
                            value={memberEmail}
                            onChange={(e) => setMemberEmail(e.target.value)}
                            placeholder="member@example.com"
                            disabled={addingMember}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Role</label>
                        <div style={roleGridStyle}>
                            {(Object.keys(ROLE_DESCRIPTIONS) as Member["role"][]).map((role) => (
                                <div
                                    key={role}
                                    style={roleCardStyle(memberRole === role)}
                                    onClick={() => setMemberRole(role)}
                                >
                                    <div style={roleNameStyle}>{role.charAt(0).toUpperCase() + role.slice(1)}</div>
                                    <div style={roleDescStyle}>{ROLE_DESCRIPTIONS[role]}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={addingMember || !memberEmail.trim()}
                    >
                        {addingMember ? "Adding..." : "Add Member"}
                    </button>
                </form>

                {members.length > 0 && (
                    <div style={memberListStyle}>
                        <div style={{ fontSize: "14px", fontWeight: 600, marginTop: "16px" }}>
                            Members ({members.length})
                        </div>
                        {members.map((member) => (
                            <div key={member.id} style={memberCardStyle}>
                                <div>
                                    <div style={{ fontSize: "14px", fontWeight: 500 }}>{member.username}</div>
                                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                        {member.email}
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                    <select
                                        className="input"
                                        value={member.role}
                                        onChange={(e) => handleUpdateMemberRole(member.id, e.target.value as Member["role"])}
                                        style={{ fontSize: "12px", padding: "4px 8px" }}
                                    >
                                        <option value="owner">Owner</option>
                                        <option value="admin">Admin</option>
                                        <option value="member">Member</option>
                                        <option value="billing">Billing</option>
                                    </select>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => handleRemoveMember(member.id)}
                                        style={{ padding: "4px 8px", fontSize: "12px" }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    className="btn"
                    onClick={handleFinish}
                    style={{ marginTop: "24px", width: "100%" }}
                >
                    {members.length > 0 ? "Finish Setup" : "Skip for Now"}
                </button>
            </div>
        </div>
    );
};
