import React, { useState, useEffect } from "react";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorMessage } from "../common/ErrorMessage";
import { showConfirm } from "../common/ConfirmDialog";
import { api, ApiError } from "../../services/api-client";

interface OrganizationSettings {
  general: {
    name: string;
    description: string;
    email: string;
    location: string;
    website: string;
    default_repository_permission: "read" | "write" | "admin";
    members_can_create_repositories: boolean;
    members_can_create_public_repositories: boolean;
    members_can_create_private_repositories: boolean;
  };
  billing: {
    plan: string;
    seats: number;
    used_seats: number;
    billing_email: string;
    next_billing_date?: string;
  };
  security: {
    two_factor_requirement: boolean;
    allowed_ip_addresses: string[];
    saml_enabled: boolean;
    require_signed_commits: boolean;
  };
  member_privileges: {
    base_permissions: "read" | "write" | "admin" | "none";
    can_create_teams: boolean;
    can_create_projects: boolean;
    can_fork_private_repos: boolean;
  };
}

interface OrgSettingsProps {
  orgname: string;
}

type SettingsTab = "general" | "billing" | "security" | "privileges";

export const OrgSettings: React.FC<OrgSettingsProps> = ({ orgname }) => {
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState<OrganizationSettings | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<OrganizationSettings>(
        `/api/v1/organizations/${orgname}/settings`
      );
      setSettings(response.data);
      setFormData(response.data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError("Failed to load organization settings");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [orgname]);

  const handleSaveSettings = async () => {
    if (!formData) return;

    const confirmed = await showConfirm({
      title: "Save Settings",
      message: "Are you sure you want to save these changes?",
      confirmText: "Save",
      variant: "info",
    });

    if (!confirmed) return;

    setSaving(true);
    setError(null);

    try {
      const response = await api.patch<OrganizationSettings>(
        `/api/v1/organizations/${orgname}/settings`,
        formData
      );
      setSettings(response.data);
      setFormData(response.data);
      setHasChanges(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setError("Failed to save settings");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (settings) {
      setFormData(settings);
      setHasChanges(false);
    }
  };

  const updateFormData = (
    section: keyof OrganizationSettings,
    field: string,
    value: string | boolean | string[]
  ) => {
    if (!formData) return;
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [field]: value,
      },
    });
    setHasChanges(true);
  };

  const containerStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    overflow: "hidden",
  };

  const headerStyle: React.CSSProperties = {
    padding: "24px",
    borderBottom: "1px solid var(--border-color)",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 600,
    color: "var(--text-primary)",
    margin: 0,
  };

  const tabsStyle: React.CSSProperties = {
    display: "flex",
    borderBottom: "1px solid var(--border-color)",
    background: "var(--bg-tertiary)",
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "14px 20px",
    fontSize: "14px",
    fontWeight: 500,
    color: isActive ? "var(--accent-blue)" : "var(--text-secondary)",
    background: isActive ? "var(--bg-secondary)" : "transparent",
    border: "none",
    borderBottom: isActive ? "2px solid var(--accent-blue)" : "2px solid transparent",
    cursor: "pointer",
    transition: "all 0.2s",
  });

  const contentStyle: React.CSSProperties = {
    padding: "24px",
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: "32px",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "16px",
    paddingBottom: "8px",
    borderBottom: "1px solid var(--border-color)",
  };

  const fieldGroupStyle: React.CSSProperties = {
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

  const checkboxRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    background: "var(--bg-tertiary)",
    borderRadius: "var(--radius)",
  };

  const helpTextStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--text-muted)",
    marginTop: "4px",
  };

  const footerStyle: React.CSSProperties = {
    padding: "16px 24px",
    borderTop: "1px solid var(--border-color)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "var(--bg-tertiary)",
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    gap: "8px",
  };

  const infoBadgeStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: 600,
    borderRadius: "12px",
    background: "rgba(31, 111, 235, 0.15)",
    color: "#58a6ff",
  };

  const warningBoxStyle: React.CSSProperties = {
    background: "rgba(209, 153, 34, 0.1)",
    border: "1px solid rgba(209, 153, 34, 0.3)",
    borderRadius: "var(--radius)",
    padding: "12px 16px",
    marginBottom: "16px",
    fontSize: "13px",
    color: "#d19922",
  };

  if (loading) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  if (error && !settings) {
    return <ErrorMessage message={error} onRetry={fetchSettings} />;
  }

  if (!settings || !formData) {
    return <ErrorMessage message="Settings not found" />;
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Organization Settings</h2>
      </div>

      <div style={tabsStyle}>
        <button
          style={tabStyle(activeTab === "general")}
          onClick={() => setActiveTab("general")}
          type="button"
        >
          General
        </button>
        <button
          style={tabStyle(activeTab === "billing")}
          onClick={() => setActiveTab("billing")}
          type="button"
        >
          Billing
        </button>
        <button
          style={tabStyle(activeTab === "security")}
          onClick={() => setActiveTab("security")}
          type="button"
        >
          Security
        </button>
        <button
          style={tabStyle(activeTab === "privileges")}
          onClick={() => setActiveTab("privileges")}
          type="button"
        >
          Member Privileges
        </button>
      </div>

      <div style={contentStyle}>
        {error && <ErrorMessage message={error} />}

        {activeTab === "general" && (
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>General Settings</h3>
            <div style={fieldGroupStyle}>
              <div style={fieldStyle}>
                <label htmlFor="org-name" style={labelStyle}>
                  Organization Name
                </label>
                <input
                  id="org-name"
                  type="text"
                  style={inputStyle}
                  value={formData.general.name}
                  onChange={(e) =>
                    updateFormData("general", "name", e.target.value)
                  }
                  disabled={saving}
                />
              </div>

              <div style={fieldStyle}>
                <label htmlFor="org-email" style={labelStyle}>
                  Contact Email
                </label>
                <input
                  id="org-email"
                  type="email"
                  style={inputStyle}
                  value={formData.general.email}
                  onChange={(e) =>
                    updateFormData("general", "email", e.target.value)
                  }
                  disabled={saving}
                />
              </div>

              <div style={fieldStyle}>
                <label htmlFor="default-permission" style={labelStyle}>
                  Default Repository Permission
                </label>
                <select
                  id="default-permission"
                  style={inputStyle}
                  value={formData.general.default_repository_permission}
                  onChange={(e) =>
                    updateFormData(
                      "general",
                      "default_repository_permission",
                      e.target.value
                    )
                  }
                  disabled={saving}
                >
                  <option value="read">Read</option>
                  <option value="write">Write</option>
                  <option value="admin">Admin</option>
                </select>
                <span style={helpTextStyle}>
                  Default permission level for organization members
                </span>
              </div>

              <div style={checkboxRowStyle}>
                <input
                  id="can-create-repos"
                  type="checkbox"
                  checked={formData.general.members_can_create_repositories}
                  onChange={(e) =>
                    updateFormData(
                      "general",
                      "members_can_create_repositories",
                      e.target.checked
                    )
                  }
                  disabled={saving}
                />
                <label htmlFor="can-create-repos" style={{ fontSize: "14px", cursor: "pointer" }}>
                  Members can create repositories
                </label>
              </div>

              <div style={checkboxRowStyle}>
                <input
                  id="can-create-public"
                  type="checkbox"
                  checked={formData.general.members_can_create_public_repositories}
                  onChange={(e) =>
                    updateFormData(
                      "general",
                      "members_can_create_public_repositories",
                      e.target.checked
                    )
                  }
                  disabled={saving}
                />
                <label htmlFor="can-create-public" style={{ fontSize: "14px", cursor: "pointer" }}>
                  Members can create public repositories
                </label>
              </div>

              <div style={checkboxRowStyle}>
                <input
                  id="can-create-private"
                  type="checkbox"
                  checked={formData.general.members_can_create_private_repositories}
                  onChange={(e) =>
                    updateFormData(
                      "general",
                      "members_can_create_private_repositories",
                      e.target.checked
                    )
                  }
                  disabled={saving}
                />
                <label htmlFor="can-create-private" style={{ fontSize: "14px", cursor: "pointer" }}>
                  Members can create private repositories
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "billing" && (
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Billing Information</h3>
            <div style={warningBoxStyle}>
              ⚠ Billing settings are managed externally. Contact support to change your plan.
            </div>
            <div style={fieldGroupStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Current Plan</label>
                <div style={{ padding: "8px 0" }}>
                  <span style={infoBadgeStyle}>{formData.billing.plan}</span>
                </div>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Seats</label>
                <p style={{ margin: "4px 0", fontSize: "14px", color: "var(--text-secondary)" }}>
                  {formData.billing.used_seats} of {formData.billing.seats} seats used
                </p>
              </div>

              <div style={fieldStyle}>
                <label htmlFor="billing-email" style={labelStyle}>
                  Billing Email
                </label>
                <input
                  id="billing-email"
                  type="email"
                  style={inputStyle}
                  value={formData.billing.billing_email}
                  onChange={(e) =>
                    updateFormData("billing", "billing_email", e.target.value)
                  }
                  disabled={saving}
                />
              </div>

              {formData.billing.next_billing_date && (
                <div style={fieldStyle}>
                  <label style={labelStyle}>Next Billing Date</label>
                  <p style={{ margin: "4px 0", fontSize: "14px", color: "var(--text-secondary)" }}>
                    {new Date(formData.billing.next_billing_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Security Settings</h3>
            <div style={fieldGroupStyle}>
              <div style={checkboxRowStyle}>
                <input
                  id="require-2fa"
                  type="checkbox"
                  checked={formData.security.two_factor_requirement}
                  onChange={(e) =>
                    updateFormData(
                      "security",
                      "two_factor_requirement",
                      e.target.checked
                    )
                  }
                  disabled={saving}
                />
                <label htmlFor="require-2fa" style={{ fontSize: "14px", cursor: "pointer" }}>
                  Require two-factor authentication for all members
                </label>
              </div>

              <div style={checkboxRowStyle}>
                <input
                  id="require-signed"
                  type="checkbox"
                  checked={formData.security.require_signed_commits}
                  onChange={(e) =>
                    updateFormData(
                      "security",
                      "require_signed_commits",
                      e.target.checked
                    )
                  }
                  disabled={saving}
                />
                <label htmlFor="require-signed" style={{ fontSize: "14px", cursor: "pointer" }}>
                  Require signed commits
                </label>
              </div>

              <div style={checkboxRowStyle}>
                <input
                  id="saml-enabled"
                  type="checkbox"
                  checked={formData.security.saml_enabled}
                  onChange={(e) =>
                    updateFormData("security", "saml_enabled", e.target.checked)
                  }
                  disabled={saving}
                />
                <label htmlFor="saml-enabled" style={{ fontSize: "14px", cursor: "pointer" }}>
                  Enable SAML single sign-on
                </label>
              </div>

              <div style={fieldStyle}>
                <label htmlFor="allowed-ips" style={labelStyle}>
                  Allowed IP Addresses
                </label>
                <input
                  id="allowed-ips"
                  type="text"
                  style={inputStyle}
                  value={formData.security.allowed_ip_addresses.join(", ")}
                  onChange={(e) =>
                    updateFormData(
                      "security",
                      "allowed_ip_addresses",
                      e.target.value.split(",").map((ip) => ip.trim())
                    )
                  }
                  placeholder="192.168.1.1, 10.0.0.0/24"
                  disabled={saving}
                />
                <span style={helpTextStyle}>
                  Comma-separated list of IP addresses or CIDR ranges
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "privileges" && (
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Member Privileges</h3>
            <div style={fieldGroupStyle}>
              <div style={fieldStyle}>
                <label htmlFor="base-permissions" style={labelStyle}>
                  Base Repository Permissions
                </label>
                <select
                  id="base-permissions"
                  style={inputStyle}
                  value={formData.member_privileges.base_permissions}
                  onChange={(e) =>
                    updateFormData(
                      "member_privileges",
                      "base_permissions",
                      e.target.value
                    )
                  }
                  disabled={saving}
                >
                  <option value="none">None</option>
                  <option value="read">Read</option>
                  <option value="write">Write</option>
                  <option value="admin">Admin</option>
                </select>
                <span style={helpTextStyle}>
                  Default permission level for all organization repositories
                </span>
              </div>

              <div style={checkboxRowStyle}>
                <input
                  id="can-create-teams"
                  type="checkbox"
                  checked={formData.member_privileges.can_create_teams}
                  onChange={(e) =>
                    updateFormData(
                      "member_privileges",
                      "can_create_teams",
                      e.target.checked
                    )
                  }
                  disabled={saving}
                />
                <label htmlFor="can-create-teams" style={{ fontSize: "14px", cursor: "pointer" }}>
                  Members can create teams
                </label>
              </div>

              <div style={checkboxRowStyle}>
                <input
                  id="can-create-projects"
                  type="checkbox"
                  checked={formData.member_privileges.can_create_projects}
                  onChange={(e) =>
                    updateFormData(
                      "member_privileges",
                      "can_create_projects",
                      e.target.checked
                    )
                  }
                  disabled={saving}
                />
                <label htmlFor="can-create-projects" style={{ fontSize: "14px", cursor: "pointer" }}>
                  Members can create projects
                </label>
              </div>

              <div style={checkboxRowStyle}>
                <input
                  id="can-fork-private"
                  type="checkbox"
                  checked={formData.member_privileges.can_fork_private_repos}
                  onChange={(e) =>
                    updateFormData(
                      "member_privileges",
                      "can_fork_private_repos",
                      e.target.checked
                    )
                  }
                  disabled={saving}
                />
                <label htmlFor="can-fork-private" style={{ fontSize: "14px", cursor: "pointer" }}>
                  Members can fork private repositories
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {hasChanges && (
        <div style={footerStyle}>
          <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            You have unsaved changes
          </span>
          <div style={buttonGroupStyle}>
            <button
              className="btn"
              onClick={handleResetSettings}
              disabled={saving}
              type="button"
            >
              Discard
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveSettings}
              disabled={saving}
              type="button"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
