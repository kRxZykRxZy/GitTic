import React from "react";
import Swal from "sweetalert2";

/** Props for ConfirmDialog component */
interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void | Promise<void>;
  children: (showDialog: () => void) => React.ReactNode;
}

/** Color map for variants */
const variantColorMap: Record<string, string> = {
  danger: "#da3633",
  warning: "#d29922",
  info: "#58a6ff",
};

/**
 * Confirmation dialog using SweetAlert2 for destructive or important actions.
 * Uses a render-prop pattern to expose the trigger function.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  children,
}) => {
  const showDialog = async () => {
    const result = await Swal.fire({
      title,
      text: message,
      icon: variant === "danger" ? "warning" : variant,
      showCancelButton: true,
      confirmButtonColor: variantColorMap[variant],
      cancelButtonColor: "var(--bg-tertiary)",
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      background: "#161b22",
      color: "#f0f6fc",
      customClass: {
        popup: "confirm-dialog-popup",
        confirmButton: "confirm-dialog-btn",
        cancelButton: "confirm-dialog-cancel",
      },
    });

    if (result.isConfirmed) {
      await onConfirm();
    }
  };

  return <>{children(showDialog)}</>;
};

/**
 * Standalone function to show a confirmation dialog.
 * Returns true if confirmed, false otherwise.
 */
export async function showConfirm(options: {
  title: string;
  message: string;
  confirmText?: string;
  variant?: "danger" | "warning" | "info";
}): Promise<boolean> {
  const color =
    variantColorMap[options.variant ?? "danger"];

  const result = await Swal.fire({
    title: options.title,
    text: options.message,
    icon: options.variant === "danger" ? "warning" : (options.variant ?? "warning"),
    showCancelButton: true,
    confirmButtonColor: color,
    cancelButtonColor: "#21262d",
    confirmButtonText: options.confirmText ?? "Confirm",
    cancelButtonText: "Cancel",
    background: "#161b22",
    color: "#f0f6fc",
  });

  return result.isConfirmed;
}
