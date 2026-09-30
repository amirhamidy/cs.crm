import axios from "axios";
import { useNotificationStore } from "@/store/notificationStore";
import type { NotificationInput } from "@/components/notifications/types";
import { isTicketActive } from "./activeTickets";
import { SYNC_CONFIG as CFG } from "./config";
import { detectRoutines, detectTasks, detectTickets } from "./detectors";
import {
  fetchEmployees,
  fetchInternalTasks,
  fetchProjectTasks,
  fetchRoutines,
} from "./Fetchers";
import {
  buildNames,
  normalizeProjectTasks,
  normalizeRoutines,
  normalizeTickets,
  resolveEmployeeId,
} from "./Normalize";
import { consumeTouched, readTouched } from "./selfchanges";
import { loadSnapshot, saveSnapshot } from "./snapshot";
import type {
  DetectContext,
  Names,
  ProjectTask,
  Routine,
  Snapshot,
  Ticket,
} from "./types";

interface EngineOptions {
  userId: number;
  username: string | null;
}

export function createSyncEngine({ userId, username }: EngineOptions) {
  let stopped = true;
  let started = false;
  let running = false;
  let failures = 0;
  let pollTimer: number | undefined;
  let routineTimer: number | undefined;
  let controller: AbortController | null = null;

  let tickets: Ticket[] | null = null;
  let routines: Routine[] | null = null;
  let projectTasks: ProjectTask[] | null = null;
  let projectTasksAt = 0;
  let names: Names = {
    byId: new Map(),
    byUsername: new Map(),
  };
  let namesAt = 0;
  let employeeId: number | null = null;
  let employeesTriedAt = 0;

  const lastPollKey = `crm-notif-lastpoll:${userId}`;
  const store = () => useNotificationStore.getState();

  const isVisible = () =>
    typeof document === "undefined" || document.visibilityState === "visible";

  const baseMs = () => (isVisible() ? CFG.visibleMs : CFG.hiddenMs);

  function nextDelay() {
    const backoff = Math.min(baseMs() * 2 ** failures, CFG.maxBackoffMs);

    return backoff * (0.9 + Math.random() * 0.2);
  }

  function schedule(delay?: number) {
    window.clearTimeout(pollTimer);

    if (stopped) return;

    pollTimer = window.setTimeout(() => void tick(), delay ?? nextDelay());
  }

  function claimPoll(minGapMs: number): boolean {
    try {
      const last = Number(localStorage.getItem(lastPollKey) ?? 0);

      if (Date.now() - last < minGapMs) {
        return false;
      }

      localStorage.setItem(lastPollKey, String(Date.now()));
    } catch {}

    return true;
  }

  async function tick(minGapMs?: number) {
    if (stopped || running) return;

    window.clearTimeout(pollTimer);

    if (!navigator.onLine) {
      schedule();
      return;
    }

    if (!claimPoll(minGapMs ?? baseMs() * 0.8)) {
      schedule();
      return;
    }

    running = true;

    try {
      await pollOnce();
      failures = 0;
    } catch (error) {
      if (!axios.isCancel(error)) {
        failures += 1;
      }
    } finally {
      running = false;

      if (!stopped) {
        schedule();
      }
    }
  }

  async function refreshNames(signal: AbortSignal) {
    employeesTriedAt = Date.now();

    try {
      const list = await fetchEmployees(signal);

      names = buildNames(list);
      employeeId = resolveEmployeeId(list, username);

      namesAt = Date.now();
    } catch (error) {
      if (axios.isCancel(error)) {
        throw error;
      }

      namesAt = Date.now() - CFG.namesTtlMs + 60_000;
    }
  }

  /** لیست کارمندها باید قبل از detect آماده باشد (برای پیدا کردن employeeId) */
  async function ensureEmployees(signal: AbortSignal) {
    const needsFirstLoad = employeesTriedAt === 0;

    const needsRetry =
      employeeId === null &&
      Date.now() - employeesTriedAt >= CFG.employeeRetryMs;

    if (needsFirstLoad || needsRetry) {
      await refreshNames(signal);
    }
  }

  async function pollOnce() {
    if (store().userId !== userId) return;

    controller = new AbortController();

    const { signal } = controller;
    const startedAt = Date.now();

    await ensureEmployees(signal);

    const fresh = {
      tickets: false,
      routines: false,
      tasks: false,
    };

    const attempt = async (
      label: keyof typeof fresh,
      fn: () => Promise<void>,
    ) => {
      try {
        await fn();
        fresh[label] = true;
      } catch (error) {
        if (axios.isCancel(error) || signal.aborted) {
          throw error;
        }
      }
    };

    await attempt("tickets", async () => {
      tickets = normalizeTickets(await fetchInternalTasks(signal));
    });

    await attempt("routines", async () => {
      routines = normalizeRoutines(await fetchRoutines(signal));
    });

    if (!projectTasks || startedAt - projectTasksAt >= CFG.projectTasksMs) {
      await attempt("tasks", async () => {
        projectTasks = normalizeProjectTasks(await fetchProjectTasks(signal));

        projectTasksAt = startedAt;
      });
    }

    if (!fresh.tickets && !fresh.routines && !fresh.tasks) {
      throw new Error("notification sync failed");
    }

    const snapshot = loadSnapshot(userId);
    const touched = readTouched(userId, Date.now());

    const compute = () => {
      const now = Date.now();

      const ctx = (selfTouched: Set<number>): DetectContext => ({
        userId,
        employeeId,
        username,
        now,
        selfTouched,
        names,
        isTicketActive,
      });

      const events: NotificationInput[] = [];

      const next: Snapshot = {
        ...snapshot,
        v: 1,
      };

      if (fresh.tickets && tickets) {
        const result = detectTickets(
          tickets,
          snapshot.tickets,
          ctx(touched.tickets),
        );

        events.push(...result.events);
        next.tickets = result.next;
      }

      if (fresh.tasks && projectTasks && employeeId !== null) {
        const result = detectTasks(
          projectTasks,
          snapshot.tasks,
          ctx(touched.tasks),
        );

        events.push(...result.events);
        next.tasks = result.next;
      }

      if ((fresh.tickets || fresh.routines) && tickets && routines) {
        const byId = new Map(tickets.map((ticket) => [ticket.id, ticket]));

        const result = detectRoutines(
          routines,
          byId,
          snapshot.routines,
          ctx(new Set()),
        );

        events.push(...result.events);
        next.routines = result.next;
      }

      return {
        events,
        next,
      };
    };

    let result = compute();

    if (result.events.length > 0 && Date.now() - namesAt >= CFG.namesTtlMs) {
      await refreshNames(signal);
      result = compute();
    }

    saveSnapshot(userId, result.next);

    consumeTouched(userId, startedAt, {
      tickets: fresh.tickets,
      tasks: fresh.tasks,
    });

    if (result.events.length > 0) {
      store().addMany(result.events);
    }

    scheduleRoutineTimer();

    controller = null;
  }

  function scheduleRoutineTimer() {
    window.clearTimeout(routineTimer);

    if (stopped || !tickets || !routines) {
      return;
    }

    const byId = new Map(tickets.map((ticket) => [ticket.id, ticket]));

    const now = Date.now();
    let nearest = Infinity;

    for (const routine of routines) {
      const ticket = byId.get(routine.task);

      if (!ticket || !routine.isActive || !routine.nextRunAt) {
        continue;
      }

      if (ticket.status !== "waiting" || !ticket.assignedIds.includes(userId)) {
        continue;
      }

      const due = Date.parse(routine.nextRunAt);

      if (!Number.isNaN(due) && due > now) {
        nearest = Math.min(nearest, due);
      }
    }

    if (nearest === Infinity) {
      return;
    }

    routineTimer = window.setTimeout(
      runRoutineCheck,
      Math.min(nearest - now + 750, 2_000_000_000),
    );
  }

  function runRoutineCheck() {
    if (stopped || !tickets || !routines || store().userId !== userId) {
      return;
    }

    const snapshot = loadSnapshot(userId);

    const byId = new Map(tickets.map((ticket) => [ticket.id, ticket]));

    const result = detectRoutines(routines, byId, snapshot.routines, {
      userId,
      employeeId,
      username,
      now: Date.now(),
      selfTouched: new Set(),
      names,
      isTicketActive,
    });

    saveSnapshot(userId, {
      ...snapshot,
      v: 1,
      routines: result.next,
    });

    if (result.events.length > 0) {
      store().addMany(result.events);
    }

    scheduleRoutineTimer();
  }

  function onVisibilityChange() {
    if (isVisible()) {
      void tick(5_000);
    } else {
      schedule();
    }
  }

  function onOnline() {
    void tick(5_000);
  }

  return {
    start() {
      if (started) return;

      started = true;
      stopped = false;
      failures = 0;

      document.addEventListener("visibilitychange", onVisibilityChange);

      window.addEventListener("online", onOnline);

      window.clearTimeout(pollTimer);

      pollTimer = window.setTimeout(
        () => void tick(3_000),
        CFG.firstPollDelayMs,
      );
    },

    stop() {
      if (!started) return;

      started = false;
      stopped = true;

      window.clearTimeout(pollTimer);
      window.clearTimeout(routineTimer);

      controller?.abort();
      controller = null;

      document.removeEventListener("visibilitychange", onVisibilityChange);

      window.removeEventListener("online", onOnline);
    },
  };
}
