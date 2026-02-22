import React, { useState, useRef } from "react";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api-client";

interface AvatarUploaderProps {
    currentAvatar?: string;
    context: "user" | "organization" | "repository";
    contextId: string;
    onUploadSuccess?: (avatarUrl: string) => void;
    size?: "small" | "medium" | "large";
}

/**
 * Avatar/Profile Picture Uploader
 * Upload and manage profile pictures for users, orgs, and repos
 */
export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
    currentAvatar,
    context,
    contextId,
    onUploadSuccess,
    size = "medium",
}) => {
    const toast = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | undefined>(currentAvatar);
    const [dragOver, setDragOver] = useState(false);

    const sizeMap = {
        small: 64,
        medium: 128,
        large: 200,
    };

    const handleFileSelect = async (file: File) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be less than 5MB");
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("avatar", file);
            formData.append("context", context);
            formData.append("contextId", contextId);

            const endpoint = context === "user"
                ? "/user/avatar"
                : context === "organization"
                    ? `/organizations/${contextId}/avatar`
                    : `/repositories/${contextId}/avatar`;

            const response = await api.post<{ avatarUrl?: string }>(endpoint, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            toast.success("Profile picture updated!");

            if (onUploadSuccess && response.data?.avatarUrl) {
                onUploadSuccess(response.data.avatarUrl);
            }
        } catch (err) {
            toast.error("Failed to upload profile picture");
            setPreview(currentAvatar);
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleRemove = async () => {
        if (!confirm("Remove profile picture?")) return;

        try {
            const endpoint = context === "user"
                ? "/user/avatar"
                : context === "organization"
                    ? `/organizations/${contextId}/avatar`
                    : `/repositories/${contextId}/avatar`;

            await api.delete(endpoint);

            setPreview(undefined);
            toast.success("Profile picture removed");

            if (onUploadSuccess) {
                onUploadSuccess("");
            }
        } catch (err) {
            toast.error("Failed to remove profile picture");
        }
    };

    const pixelSize = sizeMap[size];

    const containerStyle: React.CSSProperties = {
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
    };

    const avatarContainerStyle: React.CSSProperties = {
        position: "relative",
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
        borderRadius: "50%",
        border: `3px dashed ${dragOver ? "var(--accent-blue)" : "var(--border-color)"}`,
        overflow: "hidden",
        cursor: uploading ? "not-allowed" : "pointer",
        background: preview ? "transparent" : "var(--bg-tertiary)",
        transition: "border-color 0.15s",
    };

    const avatarImageStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    };

    const placeholderStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${pixelSize / 3}px`,
        color: "var(--text-muted)",
    };

    const overlayStyle: React.CSSProperties = {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: 0,
        transition: "opacity 0.15s",
        cursor: "pointer",
    };

    const buttonGroupStyle: React.CSSProperties = {
        display: "flex",
        gap: "8px",
    };

    return (
        <div style={containerStyle}>
            <div
                style={avatarContainerStyle}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !uploading && fileInputRef.current?.click()}
                onMouseEnter={(e) => {
                    const overlay = e.currentTarget.querySelector('[data-overlay]') as HTMLElement;
                    if (overlay) overlay.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                    const overlay = e.currentTarget.querySelector('[data-overlay]') as HTMLElement;
                    if (overlay) overlay.style.opacity = "0";
                }}
            >
                {preview ? (
                    <img src={preview} alt="Avatar" style={avatarImageStyle} />
                ) : (
                    <div style={placeholderStyle}>
                        {context === "user" ? "👤" : context === "organization" ? "🏢" : "📦"}
                    </div>
                )}

                <div style={overlayStyle} data-overlay>
                    <span style={{ color: "#fff", fontSize: "12px", fontWeight: 500 }}>
                        {uploading ? "Uploading..." : "Change"}
                    </span>
                </div>
            </div>

            <div style={buttonGroupStyle}>
                <button
                    className="btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{ fontSize: "12px", padding: "4px 12px" }}
                >
                    Upload
                </button>
                {preview && (
                    <button
                        className="btn btn-danger"
                        onClick={handleRemove}
                        disabled={uploading}
                        style={{ fontSize: "12px", padding: "4px 12px" }}
                    >
                        Remove
                    </button>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                }}
                disabled={uploading}
            />
        </div>
    );
};

/**
 * Avatar Display Component
 * Shows user/org/repo avatar with fallback
 */
interface AvatarProps {
    src?: string;
    alt: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    type?: "user" | "organization" | "repository";
}

export const Avatar: React.FC<AvatarProps> = ({
    src,
    alt,
    size = "md",
    type = "user"
}) => {
    const sizeMap = {
        xs: 24,
        sm: 32,
        md: 40,
        lg: 56,
        xl: 80,
    };

    const pixelSize = sizeMap[size];

    const avatarStyle: React.CSSProperties = {
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
        borderRadius: "50%",
        objectFit: "cover",
        background: "var(--bg-tertiary)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${pixelSize / 2.5}px`,
        color: "var(--text-muted)",
        flexShrink: 0,
    };

    const getInitial = () => {
        if (type === "organization") return "🏢";
        if (type === "repository") return "📦";
        return alt.charAt(0).toUpperCase();
    };

    return src ? (
        <img src={src} alt={alt} style={avatarStyle} />
    ) : (
        <div style={avatarStyle}>{getInitial()}</div>
    );
};
