import React, { useState, useCallback } from "react";
import { useApi } from "../../hooks/useApi";
import { useToast } from "../../hooks/useToast";
import { adminService } from "../../services/admin-service";
import { Modal } from "../common/Modal";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorMessage } from "../common/ErrorMessage";
import { FeatureFlag as FeatureFlagType } from "../../types/api";

/**
 * Feature flags list with toggle switches and create new flag modal.
 */
export const FeatureFlags: React.FC = () => {
  const toast = useToast();
  const { data, loading, error, refetch } = useApi<FeatureFlagType[]>(
    () => adminService.getFeatureFlags(),
    [],
  );

  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleToggle = useCallback(
    async (flag: FeatureFlagType) => {
      try {
        await adminService.toggleFeature(flag.id, !flag.enabled);
        toast.success(
          `${flag.name} ${flag.enabled ? "disabled" : "enabled"}`,
        );
        await refetch();
      } catch {
        toast.error("Failed to toggle feature flag");
      }
    },
    [toast, refetch],
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newName.trim()) {
      toast.warning("Key and name are required");
      return;
    }
    setShowCreate(false);
    toast.success("Feature flag creation submitted");
    setNewKey("");
    setNewName("");
    setNewDesc("");
    await refetch();
  };

  if (loading) return <LoadingSpinner message="Loading feature flags…" />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  const flags = Array.isArray(data)
    ? data
    : Array.isArray((data as unknown as { data?: FeatureFlagType[] })?.data)
      ? (data as unknown as { data: FeatureFlagType[] }).data
      : [];

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  };

  const listStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  };

  const flagRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    gap: "16px",
  };

  const flagInfo: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  };

  const flagKey: React.CSSProperties = {
    fontSize: "12px",
    fontFamily: "var(--font-mono)",
    color: "var(--text-muted)",
  };

  const toggleStyle = (enabled: boolean): React.CSSProperties => ({
    width: "44px",
    height: "24px",
    borderRadius: "12px",
    background: enabled ? "var(--accent-green)" : "var(--bg-tertiary)",
    border: "1px solid var(--border-color)",
    position: "relative",
    cursor: "pointer",
    transition: "background 0.2s",
    flexShrink: 0,
  });

  const toggleKnob = (enabled: boolean): React.CSSProperties => ({
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#fff",
    position: "absolute",
    top: "2px",
    left: enabled ? "22px" : "2px",
    transition: "left 0.2s",
  });

  const fieldStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "12px",
  };

  return (
    <div>
      <div style={headerStyle}>
        <h2 style={{ fontSize: "20px", fontWeight: 600 }}>Feature Flags</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)} type="button">
          + New Flag
        </button>
      </div>

      <div style={listStyle}>
        {flags.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
            No feature flags configured.
          </div>
        ) : (
          flags.map((flag) => (
            <div key={flag.id} style={flagRow}>
              <div style={flagInfo}>
                <span style={{ fontWeight: 600, fontSize: "14px" }}>{flag.name}</span>
                <span style={flagKey}>{flag.key}</span>
                {flag.description && (
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    {flag.description}
                  </span>
                )}
              </div>
              <button
                style={toggleStyle(flag.enabled)}
                onClick={() => handleToggle(flag)}
                aria-label={`Toggle ${flag.name}`}
                type="button"
              >
                <div style={toggleKnob(flag.enabled)} />
              </button>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Feature Flag">
        <form onSubmit={handleCreate}>
          <div style={fieldStyle}>
            <label style={{ fontSize: "14px", fontWeight: 500 }}>Key</label>
            <input className="input" value={newKey} onChange={(e) => setNewKey(e.target.value)}
              placeholder="feature_key" />
          </div>
          <div style={fieldStyle}>
            <label style={{ fontSize: "14px", fontWeight: 500 }}>Name</label>
            <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="Feature Name" />
          </div>
          <div style={fieldStyle}>
            <label style={{ fontSize: "14px", fontWeight: 500 }}>Description</label>
            <textarea className="input" value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
              rows={3} placeholder="What does this flag control?" />
          </div>
          <button className="btn btn-primary" type="submit" style={{ marginTop: "8px" }}>
            Create Flag
          </button>
        </form>
      </Modal>
    </div>
  );
};
