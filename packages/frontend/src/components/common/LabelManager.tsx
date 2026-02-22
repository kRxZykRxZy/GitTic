import React, { useState, useEffect } from "react";
import { api } from "../../services/api-client";
import "./LabelManager.css";

interface Label {
  name: string;
  color: string;
  description?: string;
}

interface LabelManagerProps {
  owner: string;
  repo: string;
  resourceType: "issue" | "pr";
  resourceId: string;
  resourceNumber: number;
  currentLabels: string[];
  onLabelsChange?: () => void;
}

export const LabelManager: React.FC<LabelManagerProps> = ({
  owner,
  repo,
  resourceType,
  resourceId,
  resourceNumber,
  currentLabels,
  onLabelsChange,
}) => {
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [showCreateLabel, setShowCreateLabel] = useState(false);
  const [newLabel, setNewLabel] = useState({ name: "", color: "#0969da", description: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailableLabels();
  }, [owner, repo]);

  const loadAvailableLabels = async () => {
    try {
      const response = await api.get<Label[]>(`/api/v1/${owner}/${repo}/labels`);
      setAvailableLabels(response.data || []);
    } catch (err) {
      console.error("Failed to load labels:", err);
    }
  };

  const handleAddLabel = async (labelName: string) => {
    if (currentLabels.includes(labelName)) return;

    try {
      setLoading(true);
      const endpoint = resourceType === "issue" 
        ? `/api/v1/${owner}/${repo}/issues/${resourceNumber}/labels`
        : `/api/v1/${owner}/${repo}/pulls/${resourceNumber}/labels`;
      
      await api.post(endpoint, { label: labelName });
      onLabelsChange?.();
    } catch (err) {
      console.error("Failed to add label:", err);
      alert("Failed to add label");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLabel = async (labelName: string) => {
    try {
      setLoading(true);
      const endpoint = resourceType === "issue"
        ? `/api/v1/${owner}/${repo}/issues/${resourceNumber}/labels/${labelName}`
        : `/api/v1/${owner}/${repo}/pulls/${resourceNumber}/labels/${labelName}`;
      
      await api.delete(endpoint);
      onLabelsChange?.();
    } catch (err) {
      console.error("Failed to remove label:", err);
      alert("Failed to remove label");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.name.trim()) return;

    try {
      setLoading(true);
      await api.post(`/api/v1/${owner}/${repo}/labels`, newLabel);
      await loadAvailableLabels();
      setNewLabel({ name: "", color: "#0969da", description: "" });
      setShowCreateLabel(false);
    } catch (err) {
      console.error("Failed to create label:", err);
      alert("Failed to create label");
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    "#0969da", "#1a7f37", "#8250df", "#bf3989", "#cf222e",
    "#fb8500", "#9a6700", "#54aeff", "#57d9a3", "#e3b341"
  ];

  return (
    <div className="label-manager">
      <div className="label-manager-header">
        <h4>Labels</h4>
        <button
          className="btn-sm btn-secondary"
          onClick={() => setShowCreateLabel(!showCreateLabel)}
          disabled={loading}
        >
          {showCreateLabel ? "Cancel" : "+ New Label"}
        </button>
      </div>

      {showCreateLabel && (
        <form className="create-label-form" onSubmit={handleCreateLabel}>
          <input
            type="text"
            placeholder="Label name"
            value={newLabel.name}
            onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
            required
            maxLength={50}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newLabel.description}
            onChange={(e) => setNewLabel({ ...newLabel, description: e.target.value })}
            maxLength={200}
          />
          <div className="color-picker">
            <label>Color:</label>
            <div className="color-options">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-swatch ${newLabel.color === color ? "selected" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewLabel({ ...newLabel, color })}
                  title={color}
                />
              ))}
            </div>
          </div>
          <button type="submit" className="btn-sm btn-primary" disabled={loading}>
            Create Label
          </button>
        </form>
      )}

      <div className="labels-list">
        {availableLabels.map((label) => {
          const isActive = currentLabels.includes(label.name);
          return (
            <div
              key={label.name}
              className={`label-item ${isActive ? "active" : ""}`}
              onClick={() => !loading && (isActive ? handleRemoveLabel(label.name) : handleAddLabel(label.name))}
            >
              <span className="label-badge" style={{ backgroundColor: label.color }}>
                {label.name}
              </span>
              {label.description && (
                <span className="label-description">{label.description}</span>
              )}
              {isActive && <span className="label-check">✓</span>}
            </div>
          );
        })}
      </div>

      {availableLabels.length === 0 && !showCreateLabel && (
        <p className="empty-message">No labels yet. Create one to get started!</p>
      )}
    </div>
  );
};
