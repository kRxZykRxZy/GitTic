import React, { useState, useEffect } from "react";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorMessage } from "../common/ErrorMessage";
import { api, ApiError } from "../../services/api-client";

interface Organization {
  id: number;
  name: string;
  username: string;
  description: string;
  avatar_url?: string;
  email?: string;
  location?: string;
  website?: string;
  created_at: string;
  updated_at: string;
  repo_count?: number;
  member_count?: number;
}

interface OrgProfileProps {
  orgname: string;
  onUpdate?: (org: Organization) => void;
}

export const OrgProfile: React.FC<OrgProfileProps> = ({ orgname, onUpdate }) => {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    email: "",
    location: "",
    website: "",
    avatar_url: "",
  });

  const fetchOrganization = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Organization>(`/api/v1/organizations/${orgname}`);
      const orgData = response.data;
      setOrg(orgData);
      setFormData({
        name: orgData.name || "",
        description: orgData.description || "",
        email: orgData.email || "",
        location: orgData.location || "",
        website: orgData.website || "",
        avatar_url: orgData.avatar_url || "",
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 404 ? "Organization not found" : "Failed to load organization");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, [orgname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await api.patch<Organization>(
        `/api/v1/organizations/${orgname}`,
        formData
      );
      const updatedOrg = response.data;
      setOrg(updatedOrg);
      setEditing(false);
      if (onUpdate) onUpdate(updatedOrg);
    } catch (err) {
      if (err instanceof ApiError) {
        setError("Failed to update organization");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (org) {
      setFormData({
        name: org.name || "",
        description: org.description || "",
        email: org.email || "",
        location: org.location || "",
        website: org.website || "",
        avatar_url: org.avatar_url || "",
      });
    }
    setEditing(false);
    setError(null);
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
    paddingBottom: "16px",
    borderBottom: "1px solid var(--border-color)",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 600,
    color: "var(--text-primary)",
    margin: 0,
  };

  const avatarSectionStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "24px",
  };

  const avatarStyle: React.CSSProperties = {
    width: "100px",
    height: "100px",
    borderRadius: "var(--radius)",
    objectFit: "cover",
    border: "1px solid var(--border-color)",
  };

  const avatarPlaceholderStyle: React.CSSProperties = {
    width: "100px",
    height: "100px",
    borderRadius: "var(--radius)",
    background: "var(--bg-tertiary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "36px",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-color)",
  };

  const formStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
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

  const readOnlyStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: "1.5",
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
    marginTop: "8px",
  };

  const metaStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginTop: "24px",
    padding: "16px",
    background: "var(--bg-tertiary)",
    borderRadius: "var(--radius)",
  };

  const metaItemStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  };

  const metaLabelStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    fontWeight: 600,
  };

  const metaValueStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--text-primary)",
  };

  if (loading) {
    return <LoadingSpinner message="Loading organization profile..." />;
  }

  if (error && !org) {
    return <ErrorMessage message={error} onRetry={fetchOrganization} />;
  }

  if (!org) {
    return <ErrorMessage message="Organization not found" />;
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Organization Profile</h2>
        {!editing ? (
          <button
            className="btn btn-primary"
            onClick={() => setEditing(true)}
            type="button"
          >
            Edit Profile
          </button>
        ) : null}
      </div>

      {error && <ErrorMessage message={error} />}

      <div style={avatarSectionStyle}>
        {formData.avatar_url ? (
          <img src={formData.avatar_url} alt={org.name} style={avatarStyle} />
        ) : (
          <div style={avatarPlaceholderStyle}>
            {org.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: "18px", color: "var(--text-primary)" }}>
            {org.name}
          </h3>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "14px" }}>
            @{org.username}
          </p>
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={fieldStyle}>
            <label htmlFor="name" style={labelStyle}>
              Display Name
            </label>
            <input
              id="name"
              type="text"
              style={inputStyle}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={saving}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="description" style={labelStyle}>
              Description
            </label>
            <textarea
              id="description"
              style={textareaStyle}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell us about this organization..."
              disabled={saving}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="email" style={labelStyle}>
              Email
            </label>
            <input
              id="email"
              type="email"
              style={inputStyle}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@organization.com"
              disabled={saving}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="location" style={labelStyle}>
              Location
            </label>
            <input
              id="location"
              type="text"
              style={inputStyle}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="San Francisco, CA"
              disabled={saving}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="website" style={labelStyle}>
              Website
            </label>
            <input
              id="website"
              type="url"
              style={inputStyle}
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://example.com"
              disabled={saving}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="avatar_url" style={labelStyle}>
              Avatar URL
            </label>
            <input
              id="avatar_url"
              type="url"
              style={inputStyle}
              value={formData.avatar_url}
              onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              placeholder="https://example.com/avatar.png"
              disabled={saving}
            />
          </div>

          <div style={buttonGroupStyle}>
            <button
              className="btn"
              type="button"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <div style={formStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Description</label>
            <p style={readOnlyStyle}>
              {org.description || <em style={{ color: "var(--text-muted)" }}>No description</em>}
            </p>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Email</label>
            <p style={readOnlyStyle}>
              {org.email || <em style={{ color: "var(--text-muted)" }}>Not provided</em>}
            </p>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Location</label>
            <p style={readOnlyStyle}>
              {org.location || <em style={{ color: "var(--text-muted)" }}>Not provided</em>}
            </p>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Website</label>
            <p style={readOnlyStyle}>
              {org.website ? (
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--accent-blue)" }}
                >
                  {org.website}
                </a>
              ) : (
                <em style={{ color: "var(--text-muted)" }}>Not provided</em>
              )}
            </p>
          </div>
        </div>
      )}

      <div style={metaStyle}>
        <div style={metaItemStyle}>
          <span style={metaLabelStyle}>Repositories</span>
          <span style={metaValueStyle}>{org.repo_count || 0}</span>
        </div>
        <div style={metaItemStyle}>
          <span style={metaLabelStyle}>Members</span>
          <span style={metaValueStyle}>{org.member_count || 0}</span>
        </div>
        <div style={metaItemStyle}>
          <span style={metaLabelStyle}>Created</span>
          <span style={metaValueStyle}>
            {new Date(org.created_at).toLocaleDateString()}
          </span>
        </div>
        <div style={metaItemStyle}>
          <span style={metaLabelStyle}>Last Updated</span>
          <span style={metaValueStyle}>
            {new Date(org.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};
