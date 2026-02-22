import React, { useState, useRef } from "react";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api-client";

interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

interface AttachmentUploaderProps {
  context: "issue" | "pr" | "chat";
  contextId: string;
  owner?: string;
  repo?: string;
  onAttachmentUploaded?: (attachment: Attachment) => void;
}

/**
 * Attachment Uploader Component
 * Upload images, files, and folders for issues, PRs, and chat
 */
export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  context,
  contextId,
  owner,
  repo,
  onAttachmentUploaded,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      
      // Add all files to form data
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      formData.append("context", context);
      formData.append("contextId", contextId);
      if (owner) formData.append("owner", owner);
      if (repo) formData.append("repo", repo);

      const endpoint = owner && repo
        ? `/repositories/${owner}/${repo}/attachments`
        : "/attachments";

      const response = await api.post<Attachment[]>(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(`${files.length} file(s) uploaded successfully!`);

      if (onAttachmentUploaded && response.data) {
        response.data.forEach((attachment) => onAttachmentUploaded(attachment));
      }
    } catch (err) {
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const containerStyle: React.CSSProperties = {
    border: `2px dashed ${dragOver ? "var(--accent-blue)" : "var(--border-color)"}`,
    borderRadius: "var(--radius)",
    padding: "20px",
    textAlign: "center",
    background: dragOver ? "rgba(33, 150, 243, 0.05)" : "var(--bg-primary)",
    transition: "all 0.15s",
    cursor: uploading ? "not-allowed" : "pointer",
  };

  const iconStyle: React.CSSProperties = {
    fontSize: "32px",
    marginBottom: "8px",
  };

  const textStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "var(--text-secondary)",
    marginBottom: "8px",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "8px 16px",
    fontSize: "14px",
    background: "var(--accent-blue)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius)",
    cursor: uploading ? "not-allowed" : "pointer",
    fontWeight: 500,
  };

  return (
    <div>
      <div
        style={containerStyle}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <div style={iconStyle}>📎</div>
        <div style={textStyle}>
          {uploading ? (
            "Uploading..."
          ) : (
            <>
              Drag and drop files here, or click to browse
              <br />
              <span style={{ fontSize: "12px" }}>
                Supports images, documents, archives (max 50MB per file)
              </span>
            </>
          )}
        </div>
        {!uploading && (
          <button
            style={buttonStyle}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Choose Files
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={uploading}
        accept="image/*,.pdf,.doc,.docx,.txt,.md,.zip,.tar,.gz"
      />
    </div>
  );
};

/**
 * Attachment Display Component
 * Shows uploaded attachments with preview and download
 */
interface AttachmentListProps {
  attachments: Attachment[];
  onRemove?: (attachmentId: string) => void;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({ attachments, onRemove }) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const isImage = (mimeType: string) => mimeType.startsWith("image/");

  const listStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "16px",
  };

  const attachmentStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
  };

  const thumbnailStyle: React.CSSProperties = {
    width: "48px",
    height: "48px",
    borderRadius: "var(--radius)",
    objectFit: "cover",
    background: "var(--bg-tertiary)",
  };

  const iconStyle: React.CSSProperties = {
    width: "48px",
    height: "48px",
    borderRadius: "var(--radius)",
    background: "var(--bg-tertiary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
  };

  const infoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const filenameStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const metaStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--text-secondary)",
    marginTop: "2px",
  };

  if (attachments.length === 0) return null;

  return (
    <div style={listStyle}>
      {attachments.map((attachment) => (
        <div key={attachment.id} style={attachmentStyle}>
          {isImage(attachment.mimeType) ? (
            <img src={attachment.url} alt={attachment.filename} style={thumbnailStyle} />
          ) : (
            <div style={iconStyle}>📄</div>
          )}
          
          <div style={infoStyle}>
            <div style={filenameStyle}>{attachment.filename}</div>
            <div style={metaStyle}>
              {formatFileSize(attachment.size)} • {new Date(attachment.uploadedAt).toLocaleDateString()}
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <a
              href={attachment.url}
              download={attachment.filename}
              className="btn"
              style={{ padding: "6px 12px", fontSize: "12px", textDecoration: "none" }}
            >
              Download
            </a>
            {onRemove && (
              <button
                className="btn btn-danger"
                style={{ padding: "6px 12px", fontSize: "12px" }}
                onClick={() => onRemove(attachment.id)}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
