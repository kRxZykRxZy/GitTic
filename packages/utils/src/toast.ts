/**
 * Toast notification types for global SweetAlert (Swal) system.
 */
export type ToastType = "success" | "error" | "warning" | "info" | "loading";

export type ToastCategory =
  | "build"
  | "git"
  | "ai"
  | "moderation"
  | "general"
  | "auth"
  | "cluster"
  | "pipeline";

export interface ToastMessage {
  id: string;
  type: ToastType;
  category: ToastCategory;
  title: string;
  text?: string;
  timer?: number;
  dismissible?: boolean;
  timestamp: number;
}

/**
 * Create a toast message payload.
 */
export function createToast(
  type: ToastType,
  category: ToastCategory,
  title: string,
  text?: string,
  timer = 5000
): ToastMessage {
  return {
    id: `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    category,
    title,
    text,
    timer,
    dismissible: true,
    timestamp: Date.now(),
  };
}
