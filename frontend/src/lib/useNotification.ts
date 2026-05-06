import { useState, useCallback, useRef } from "react";
import { ToastMessage } from "@/components/Toast";

let toastCounter = 0;

export function useNotification() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const counterRef = useRef(0);

  const addNotification = useCallback(
    (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
      counterRef.current += 1;
      const id = `${Date.now()}-${counterRef.current}`;
      const newToast: ToastMessage = { id, message, type };
      setToasts((prev) => [newToast, ...prev]);
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string) => addNotification(message, "success"), [addNotification]);
  const error = useCallback((message: string) => addNotification(message, "error"), [addNotification]);
  const info = useCallback((message: string) => addNotification(message, "info"), [addNotification]);
  const warning = useCallback((message: string) => addNotification(message, "warning"), [addNotification]);

  return {
    toasts,
    addNotification,
    removeNotification,
    success,
    error,
    info,
    warning,
  };
}
