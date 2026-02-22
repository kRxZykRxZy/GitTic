import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import Swal, { SweetAlertIcon } from "sweetalert2";
import { TOAST_DURATION_MS } from "../utils/constants";

/** Toast function signatures */
interface ToastContextValue {
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  loading: (message: string, title?: string) => void;
  dismiss: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/** Preconfigured toast mixin using SweetAlert2 */
const ToastMixin = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: TOAST_DURATION_MS,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
  customClass: {
    popup: "toast-popup",
  },
});

/**
 * Show a toast notification with the given icon and message.
 */
function showToast(
  icon: SweetAlertIcon,
  message: string,
  title?: string,
  timer?: number,
): void {
  ToastMixin.fire({
    icon,
    title: title || "",
    text: message,
    timer: timer ?? TOAST_DURATION_MS,
  });
}

/**
 * ToastProvider wraps the app and provides toast notification functions.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const success = useCallback((message: string, title?: string) => {
    showToast("success", message, title);
  }, []);

  const error = useCallback((message: string, title?: string) => {
    showToast("error", message, title, TOAST_DURATION_MS * 2);
  }, []);

  const warning = useCallback((message: string, title?: string) => {
    showToast("warning", message, title);
  }, []);

  const info = useCallback((message: string, title?: string) => {
    showToast("info", message, title);
  }, []);

  const loading = useCallback((message: string, title?: string) => {
    Swal.fire({
      title: title || "Loading...",
      text: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  }, []);

  const dismiss = useCallback(() => {
    Swal.close();
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ success, error, warning, info, loading, dismiss }),
    [success, error, warning, info, loading, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
};

/**
 * Hook to access toast notification functions. Must be used within ToastProvider.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
