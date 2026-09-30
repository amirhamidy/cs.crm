import { useNotificationStore } from "@/store/notificationStore";
import type { ToastType } from "./types";

interface ToastOptions {
  description?: string;
  href?: string;
  duration?: number;
}

function push(type: ToastType, message: string, options?: ToastOptions) {
  return useNotificationStore
    .getState()
    .pushToast({ message, type, ...options });
}


export const toast = {
  success: (message: string, options?: ToastOptions) =>
    push("success", message, options),
  error: (message: string, options?: ToastOptions) =>
    push("error", message, options),
  info: (message: string, options?: ToastOptions) =>
    push("info", message, options),
  dismiss: (id: string) => useNotificationStore.getState().dismissToast(id),
};
