import { create } from "zustand";
import type {
  AppNotification,
  NotificationInput,
  Toast,
  ToastType,
} from "@/components/notifications/types";

const MAX_ITEMS = 100;
const MAX_TOASTS = 3;

export const notificationsStorageKey = (userId: number) =>
  `crm-notifications:${userId}`;

function isNotification(value: unknown): value is AppNotification {
  if (!value || typeof value !== "object") return false;

  const n = value as Partial<AppNotification>;

  return (
    typeof n.id === "string" &&
    typeof n.kind === "string" &&
    typeof n.title === "string" &&
    typeof n.createdAt === "string"
  );
}

function readStored(userId: number): {
  exists: boolean;
  items: AppNotification[];
} {
  if (typeof window === "undefined") {
    return { exists: false, items: [] };
  }

  try {
    const key = notificationsStorageKey(userId);
    const raw = localStorage.getItem(key);

    if (raw === null) {
      return { exists: false, items: [] };
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return { exists: true, items: [] };
    }

    return {
      exists: true,
      items: parsed
        .filter(isNotification)
        .map((n) => ({
          ...n,
          read: Boolean(n.read),
        })),
    };
  } catch {
    return { exists: true, items: [] };
  }
}

function load(userId: number): AppNotification[] {
  return readStored(userId).items;
}

function save(userId: number, items: AppNotification[]) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      notificationsStorageKey(userId),
      JSON.stringify(items.slice(0, MAX_ITEMS)),
    );
  } catch {}
}

let toastSeq = 0;

const nextToastId = () => `t-${Date.now()}-${++toastSeq}`;

interface PushToastInput {
  message: string;
  type?: ToastType;
  description?: string;
  href?: string;
  duration?: number;
}

interface NotificationState {
  userId: number | null;
  items: AppNotification[];
  toasts: Toast[];
  bind: (userId: number | null) => void;
  reload: () => void;
  add: (input: NotificationInput, options?: { toast?: boolean }) => boolean;
  addMany: (
    inputs: NotificationInput[],
    options?: { toast?: boolean },
  ) => number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  clearAll: () => void;
  pushToast: (input: PushToastInput) => string;
  dismissToast: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => {
  const commit = (next: AppNotification[]) => {
    const { userId } = get();

    if (userId != null) {
      save(userId, next);
    }

    set({
      items: next,
    });
  };

  return {
    userId: null,
    items: [],
    toasts: [],

    bind: (userId) => {
      if (get().userId === userId) return;

      set({
        userId,
        items: userId == null ? [] : load(userId),
      });
    },

    reload: () => {
      const { userId } = get();

      if (userId == null) {
        set({ items: [] });
        return;
      }

      set({
        items: load(userId),
      });
    },

    add: (input, options) => {
      return get().addMany([input], options) > 0;
    },

    addMany: (inputs, options) => {
      const { userId, items } = get();

      if (userId == null || inputs.length === 0) {
        return 0;
      }

      const stored = readStored(userId);
      const base = stored.exists ? stored.items : items;
      const known = new Set(base.map((item) => item.id));
      const now = new Date().toISOString();
      const fresh: AppNotification[] = [];

      for (const input of inputs) {
        if (!input.id || known.has(input.id)) continue;

        known.add(input.id);

        fresh.push({
          ...input,
          createdAt: input.createdAt ?? now,
          read: false,
        });
      }

      if (fresh.length === 0) {
        if (base !== items) {
          set({ items: base });
        }

        return 0;
      }

      fresh.sort(
        (a, b) =>
          Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
          a.id.localeCompare(b.id),
      );

      commit([...fresh, ...base].slice(0, MAX_ITEMS));

      if (options?.toast !== false) {
        if (fresh.length === 1) {
          get().pushToast({
            type: "info",
            message: fresh[0].title,
            description: fresh[0].body,
            href: fresh[0].href,
          });
        } else {
          get().pushToast({
            type: "info",
            message: `${fresh.length.toLocaleString("fa-IR")} اعلان جدید داری`,
            description: fresh[0].title,
          });
        }
      }

      return fresh.length;
    },

    markRead: (id) => {
      const { items } = get();

      if (!items.some((item) => item.id === id && !item.read)) {
        return;
      }

      commit(
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                read: true,
              }
            : item,
        ),
      );
    },

    markAllRead: () => {
      const { items } = get();

      if (!items.some((item) => !item.read)) {
        return;
      }

      commit(
        items.map((item) =>
          item.read
            ? item
            : {
                ...item,
                read: true,
              },
        ),
      );
    },

    remove: (id) => {
      commit(get().items.filter((item) => item.id !== id));
    },

    clearAll: () => {
      commit([]);
    },

    pushToast: ({
      message,
      type = "info",
      description,
      href,
      duration,
    }) => {
      const existing = get().toasts.find(
        (toast) => toast.message === message && toast.type === type,
      );

      if (existing) {
        return existing.id;
      }

      const id = nextToastId();

      const toast: Toast = {
        id,
        type,
        message,
        description,
        href,
        duration: duration ?? (href ? 7000 : 4500),
      };

      set((state) => ({
        toasts: [...state.toasts, toast].slice(-MAX_TOASTS),
      }));

      return id;
    },

    dismissToast: (id) => {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      }));
    },
  };
});