import React, { useEffect, useCallback } from "react";

/** Props for Modal component */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

/**
 * Reusable modal dialog with header, body, footer, close button, and overlay.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  width = "500px",
}) => {
  /** Close on Escape key */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "16px",
  };

  const dialogStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    width: "100%",
    maxWidth: width,
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid var(--border-color)",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--text-primary)",
  };

  const closeStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "var(--text-secondary)",
    fontSize: "20px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "var(--radius)",
  };

  const bodyStyle: React.CSSProperties = {
    padding: "20px",
    overflowY: "auto",
    flex: 1,
  };

  const footerStyle: React.CSSProperties = {
    padding: "16px 20px",
    borderTop: "1px solid var(--border-color)",
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
  };

  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div style={dialogStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>{title}</h2>
          <button
            style={closeStyle}
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            ✕
          </button>
        </div>
        <div style={bodyStyle}>{children}</div>
        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </div>
  );
};
