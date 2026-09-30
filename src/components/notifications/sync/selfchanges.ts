import type { AxiosInstance, AxiosResponse } from "axios";

type Kind = "tickets" | "tasks";

type TouchMap = Record<Kind, Record<string, number>>;

const TTL_MS = 10 * 60 * 1000;

const MUTATING = new Set(["post", "patch", "put", "delete"]);

const TICKET_ID_RE = /\/tasks\/api\/v1\/internal_task\/(\d+)(?:\/|$)/;
const TASK_ID_RE = /\/tasks\/api\/v1\/tasks\/(\d+)(?:\/|$)/;

const TICKET_CREATE_RE = /\/tasks\/api\/v1\/internal_task\/create\/?$/;

const TASK_CREATE_RE = /\/tasks\/api\/v1\/tasks\/create\/?$/;

const key = (userId: number) => `crm-notif-touched:${userId}`;

function emptyMap(): TouchMap {
  return {
    tickets: {},
    tasks: {},
  };
}

function read(userId: number): TouchMap {
  if (typeof window === "undefined") {
    return emptyMap();
  }

  try {
    const raw = localStorage.getItem(key(userId));

    if (!raw) {
      return emptyMap();
    }

    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return emptyMap();
    }

    const value = parsed as Partial<TouchMap>;

    return {
      tickets:
        value.tickets && typeof value.tickets === "object" ? value.tickets : {},
      tasks: value.tasks && typeof value.tasks === "object" ? value.tasks : {},
    };
  } catch {
    return emptyMap();
  }
}

function write(userId: number, value: TouchMap) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key(userId), JSON.stringify(value));
  } catch {}
}

function record(userId: number, kind: Kind, id: number, now: number) {
  if (!Number.isFinite(id) || id <= 0) return;

  const data = read(userId);

  data[kind][String(id)] = now;

  write(userId, data);
}

function responseId(response: AxiosResponse<unknown>): number | null {
  const data = response.data;

  if (!data || typeof data !== "object") {
    return null;
  }

  const value = data as Record<string, unknown>;
  const id = value.id;

  if (typeof id === "number" && Number.isFinite(id)) {
    return id;
  }

  if (typeof id === "string" && id.trim() !== "") {
    const parsed = Number(id);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function track(userId: number, response: AxiosResponse<unknown>) {
  const config = response.config;
  const method = String(config.method ?? "").toLowerCase();
  const url = String(config.url ?? "");

  if (!MUTATING.has(method)) {
    return;
  }

  const ticketMatch = url.match(TICKET_ID_RE);

  if (ticketMatch) {
    record(userId, "tickets", Number(ticketMatch[1]), Date.now());
    return;
  }

  if (TICKET_CREATE_RE.test(url)) {
    const id = responseId(response);

    if (id != null) {
      record(userId, "tickets", id, Date.now());
    }

    return;
  }

  const taskMatch = url.match(TASK_ID_RE);

  if (taskMatch) {
    record(userId, "tasks", Number(taskMatch[1]), Date.now());
    return;
  }

  if (TASK_CREATE_RE.test(url)) {
    const id = responseId(response);

    if (id != null) {
      record(userId, "tasks", id, Date.now());
    }
  }
}

export function installSelfChangeTracker(
  instance: AxiosInstance,
  userId: number,
) {
  const interceptorId = instance.interceptors.response.use(
    (response) => {
      track(userId, response);
      return response;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  return () => {
    instance.interceptors.response.eject(interceptorId);
  };
}

export function readTouched(
  userId: number,
  now: number,
): {
  tickets: Set<number>;
  tasks: Set<number>;
} {
  const data = read(userId);
  const tickets = new Set<number>();
  const tasks = new Set<number>();
  const min = now - TTL_MS;

  for (const [id, timestamp] of Object.entries(data.tickets)) {
    if (timestamp >= min) {
      const value = Number(id);

      if (Number.isFinite(value)) {
        tickets.add(value);
      }
    }
  }

  for (const [id, timestamp] of Object.entries(data.tasks)) {
    if (timestamp >= min) {
      const value = Number(id);

      if (Number.isFinite(value)) {
        tasks.add(value);
      }
    }
  }

  return {
    tickets,
    tasks,
  };
}

export function consumeTouched(
  userId: number,
  beforeOrAt: number,
  fresh: {
    tickets: boolean;
    tasks: boolean;
  },
) {
  const data = read(userId);

  if (fresh.tickets) {
    for (const [id, timestamp] of Object.entries(data.tickets)) {
      if (timestamp <= beforeOrAt) {
        delete data.tickets[id];
      }
    }
  }

  if (fresh.tasks) {
    for (const [id, timestamp] of Object.entries(data.tasks)) {
      if (timestamp <= beforeOrAt) {
        delete data.tasks[id];
      }
    }
  }

  write(userId, data);
}
