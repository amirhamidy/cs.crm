export type NotificationKind =
  | "ticket_received"
  | "ticket_message"
  | "ticket_status"
  | "ticket_deadline"
  | "routine_ready"
  | "task_assigned"
  | "system";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  href?: string;
  createdAt: string;
  read: boolean;
}

export type NotificationInput = Omit<AppNotification, "createdAt" | "read"> & {
  createdAt?: string;
};

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  href?: string;
  duration: number;
}
