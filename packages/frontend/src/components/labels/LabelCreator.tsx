import React, { useState } from "react";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api-client";

interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface LabelCreatorProps {
  owner: string;
  repo: string;
  onLabelCreated?: (label: Label) => void;
}

const PRESET_COLORS = [
  "#FF6B6B", // Red
  "#FFA500", // Orange
  "#FFD700", // Yellow
  "#4CAF50", // Green
  "#00BCD4", // Cyan
  "#2196F3", // Blue
  "#9C27B0", // Purple
  "#E91E63", // Pink
  "#795548", // Brown
  "#607D8B", // Gray
];

/**
 * Label Creator Component
 * Create custom labels with color picker for issues and PRs
 */
export const LabelCreator: React.FC<LabelCreatorProps> = ({ owner, repo, onLabelCreated }) => {
  const toast = useToast();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [description, setDescription] = useState("");
  const [customColor, setCustomColor] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Label name is required");
      return;
    }

    setCreating(true);
    try {
      const response = await api.post<Label>(`/repositories/${owner}/${repo}/labels`, {
        name: name.trim(),
        color: customColor || color,
        description: description.trim() || undefined,
      });

      toast.success(`Label "${name}" created!`);
      setName("");
      setDescription("");
      setCustomColor("");
      
      if (onLabelCreated && response.data) {
        onLabelCreated(response.data);
      }
    } catch (err) {
      toast.error("Failed to create label");
    } finally {
      setCreating(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    padding: "16px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: 600,
    marginBottom: "16px",
  };

  const formStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const previewStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: 500,
    background: customColor || color,
    color: "#fff",
    marginBottom: "8px",
  };

  const colorGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(10, 1fr)",
    gap: "8px",
    marginBottom: "12px",
  };

  const colorButtonStyle = (presetColor: string): React.CSSProperties => ({
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: presetColor,
    border: color === presetColor && !customColor ? "3px solid var(--text-primary)" : "2px solid var(--border-color)",
    cursor: "pointer",
    transition: "transform 0.15s",
  });

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>Create New Label</h3>
      
      <form style={formStyle} onSubmit={handleCreate}>
        <div>
          <label style={{ fontSize: "14px", fontWeight: 500, marginBottom: "8px", display: "block" }}>
            Preview
          </label>
          <div style={previewStyle}>
            {name || "label-name"}
          </div>
        </div>

        <div>
          <label style={{ fontSize: "14px", fontWeight: 500, marginBottom: "8px", display: "block" }}>
            Label Name *
          </label>
          <input
            className="input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., bug, enhancement, documentation"
            disabled={creating}
            maxLength={50}
          />
        </div>

        <div>
          <label style={{ fontSize: "14px", fontWeight: 500, marginBottom: "8px", display: "block" }}>
            Description (optional)
          </label>
          <input
            className="input"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this label"
            disabled={creating}
            maxLength={100}
          />
        </div>

        <div>
          <label style={{ fontSize: "14px", fontWeight: 500, marginBottom: "8px", display: "block" }}>
            Preset Colors
          </label>
          <div style={colorGridStyle}>
            {PRESET_COLORS.map((presetColor) => (
              <button
                key={presetColor}
                type="button"
                style={colorButtonStyle(presetColor)}
                onClick={() => {
                  setColor(presetColor);
                  setCustomColor("");
                }}
                title={presetColor}
              />
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: "14px", fontWeight: 500, marginBottom: "8px", display: "block" }}>
            Custom Color
          </label>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="color"
              value={customColor || color}
              onChange={(e) => setCustomColor(e.target.value)}
              style={{ width: "50px", height: "40px", cursor: "pointer" }}
            />
            <input
              className="input"
              type="text"
              value={customColor || color}
              onChange={(e) => setCustomColor(e.target.value)}
              placeholder="#FF6B6B"
              pattern="^#[0-9A-Fa-f]{6}$"
              style={{ flex: 1 }}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={creating || !name.trim()}
          style={{ marginTop: "8px" }}
        >
          {creating ? "Creating..." : "Create Label"}
        </button>
      </form>
    </div>
  );
};
