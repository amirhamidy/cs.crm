import type { Snapshot } from "./types";

const key = (userId: number) => `crm-notif-snapshot:v2:${userId}`;

const memory = new Map<number, Snapshot>();

export function loadSnapshot(userId: number): Snapshot {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(key(userId));

      if (raw) {
        const parsed: unknown = JSON.parse(raw);

        if (
          parsed &&
          typeof parsed === "object" &&
          (parsed as Snapshot).v === 1
        ) {
          const snapshot = parsed as Snapshot;

          memory.set(userId, snapshot);

          return snapshot;
        }
      }
    } catch {}
  }

  return (
    memory.get(userId) ?? {
      v: 1,
    }
  );
}

export function saveSnapshot(userId: number, snapshot: Snapshot) {
  memory.set(userId, snapshot);

  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(key(userId), JSON.stringify(snapshot));
  } catch {}
}
