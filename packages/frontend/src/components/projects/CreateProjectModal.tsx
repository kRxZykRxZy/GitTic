import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { useToast } from "../../hooks/useToast";
import { projectService } from "../../services/project-service";
import { VISIBILITY_OPTIONS } from "../../utils/constants";
import { ProjectVisibility } from "../../types/api";
import { required } from "../../utils/validation";
import { ApiError } from "../../services/api-client";

/** Props for CreateProjectModal */
interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

/**
 * Modal form to create a new project with name, description, visibility, and README option.
 */
export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<ProjectVisibility>("public");
  const [initReadme, setInitReadme] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setVisibility("public");
    setInitReadme(true);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const nameCheck = required(name, "Project name");
    if (!nameCheck.valid) newErrors.name = nameCheck.message;

    if (name.trim() && !/^[a-zA-Z0-9._-]+$/.test(name.trim())) {
      newErrors.name =
        "Project name may only contain alphanumeric characters, dots, hyphens, and underscores";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await projectService.create({
        name: name.trim(),
        description: description.trim(),
        visibility,
        initReadme,
      });
      toast.success("Project created successfully!");
      resetForm();
      onClose();
      onCreated?.();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? "Failed to create project."
          : "An unexpected error occurred.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "14px",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--text-primary)",
  };

  const errorStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--accent-red)",
  };

  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "6px 12px",
    fontSize: "14px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    color: "var(--text-primary)",
  };

  const checkboxRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "var(--text-secondary)",
  };

  const footer = (
    <>
      <button className="btn" type="button" onClick={() => { resetForm(); onClose(); }} disabled={submitting}>
        Cancel
      </button>
      <button className="btn btn-primary" type="submit" form="create-project-form" disabled={submitting}>
        {submitting ? "Creating…" : "Create Project"}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project" footer={footer}>
      <form id="create-project-form" onSubmit={handleSubmit} noValidate>
        <div style={fieldStyle}>
          <label htmlFor="project-name" style={labelStyle}>Project Name</label>
          <input id="project-name" className="input" type="text" value={name}
            onChange={(e) => setName(e.target.value)} placeholder="my-project" disabled={submitting} />
          {errors.name && <span style={errorStyle}>{errors.name}</span>}
        </div>

        <div style={fieldStyle}>
          <label htmlFor="project-desc" style={labelStyle}>Description (optional)</label>
          <textarea id="project-desc" className="input" value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description of your project" rows={3}
            disabled={submitting} style={{ resize: "vertical" }} />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="project-vis" style={labelStyle}>Visibility</label>
          <select id="project-vis" style={selectStyle} value={visibility}
            onChange={(e) => setVisibility(e.target.value as ProjectVisibility)} disabled={submitting}>
            {VISIBILITY_OPTIONS.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>

        <label style={checkboxRow}>
          <input type="checkbox" checked={initReadme}
            onChange={(e) => setInitReadme(e.target.checked)} disabled={submitting} />
          Initialize with a README
        </label>
      </form>
    </Modal>
  );
};
