import React, { useState } from "react";
import { useToast } from "../../hooks/useToast";
import { adminService } from "../../services/admin-service";
import { AnnouncementType } from "../../types/api";
import { required } from "../../utils/validation";

/**
 * Create and manage global announcements with type, active toggle.
 */
export const AnnouncementManager: React.FC = () => {
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<AnnouncementType>("info");
  const [expiresAt, setExpiresAt] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [recentAnnouncements, setRecentAnnouncements] = useState<
    Array<{ id: string; title: string; type: AnnouncementType; createdAt: string }>
  >([]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const titleCheck = required(title, "Title");
    if (!titleCheck.valid) newErrors.title = titleCheck.message;

    const msgCheck = required(message, "Message");
    if (!msgCheck.valid) newErrors.message = msgCheck.message;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await adminService.createAnnouncement({
        title: title.trim(),
        message: message.trim(),
        type,
        expiresAt: expiresAt || undefined,
      });

      if (response.success) {
        setRecentAnnouncements((prev) => [
          {
            id: response.data.id,
            title: response.data.title,
            type: response.data.type,
            createdAt: response.data.createdAt,
          },
          ...prev,
        ]);
      }

      toast.success("Announcement created");
      setTitle("");
      setMessage("");
      setType("info");
      setExpiresAt("");
    } catch {
      toast.error("Failed to create announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const formStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    padding: "20px",
    maxWidth: "600px",
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
    padding: "6px 12px",
    fontSize: "14px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    color: "var(--text-primary)",
    width: "100%",
  };

  const typeColors: Record<AnnouncementType, string> = {
    info: "var(--accent-blue)",
    warning: "var(--accent-yellow)",
    critical: "var(--accent-red)",
  };

  const recentStyle: React.CSSProperties = {
    marginTop: "24px",
  };

  const itemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 0",
    borderBottom: "1px solid var(--border-color)",
    fontSize: "14px",
  };

  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
        Announcements
      </h2>

      <form style={formStyle} onSubmit={handleSubmit} noValidate>
        <div style={fieldStyle}>
          <label style={labelStyle}>Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title" disabled={submitting} />
          {errors.title && <span style={errorStyle}>{errors.title}</span>}
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Message</label>
          <textarea className="input" value={message} onChange={(e) => setMessage(e.target.value)}
            rows={4} placeholder="Announcement body text" disabled={submitting}
            style={{ resize: "vertical" }} />
          {errors.message && <span style={errorStyle}>{errors.message}</span>}
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Type</label>
          <select style={selectStyle} value={type}
            onChange={(e) => setType(e.target.value as AnnouncementType)} disabled={submitting}>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Expires At (optional)</label>
          <input className="input" type="datetime-local" value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)} disabled={submitting} />
        </div>

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create Announcement"}
        </button>
      </form>

      {recentAnnouncements.length > 0 && (
        <div style={recentStyle}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
            Recently Created
          </h3>
          {recentAnnouncements.map((a) => (
            <div key={a.id} style={itemStyle}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: typeColors[a.type],
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 500 }}>{a.title}</span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "auto" }}>
                {a.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
