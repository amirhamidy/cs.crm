import type { NotificationInput } from "@/components/notifications/types";
import type {
  DetectContext,
  DetectResult,
  ProjectTask,
  Routine,
  TaskMark,
  Ticket,
  TicketAttachment,
  TicketMark,
} from "./types";

const RETAIN_MS = 30 * 24 * 60 * 60 * 1000;
const CLOSED = new Set(["completed", "cancelled"]);

const fa = (n: number) => n.toLocaleString("fa-IR");
const q = (title: string) => `«${title.trim() || "بدون عنوان"}»`;

function pastIso(
  value: string | null | undefined,
  now: number,
): string | undefined {
  if (!value) {
    return undefined;
  }

  const ms = Date.parse(value);

  if (Number.isNaN(ms) || ms > now) {
    return undefined;
  }

  return new Date(ms).toISOString();
}

function formatWhen(value: string): string {
  const ms = Date.parse(value);

  if (Number.isNaN(ms)) {
    return value;
  }

  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ms));
}

function preview(a: TicketAttachment): string {
  if (a.note) {
    return a.note.length > 80 ? `${a.note.slice(0, 80)}…` : a.note;
  }

  return a.fileName ? `فایل ${a.fileName}` : "پیوست جدید";
}

export function detectTickets(
  tickets: Ticket[],
  prev: Record<string, TicketMark> | undefined,
  ctx: DetectContext,
): DetectResult<Record<string, TicketMark>> {
  const events: NotificationInput[] = [];
  const next: Record<string, TicketMark> = {};
  const myName = ctx.username?.trim().toLowerCase() || null;

  const receivedEvent = (t: Ticket, idSuffix: string): NotificationInput => {
    const creator = t.createdBy.trim();

    const sender =
      ctx.names.byUsername.get(creator.toLowerCase()) || creator || "همکار";

    return {
      id: `ticket_received:${t.id}${idSuffix}`,
      kind: "ticket_received",
      title: `تیکت جدید از ${sender}`,
      body: t.title.trim() || undefined,
      createdAt: pastIso(idSuffix ? t.updatedAt : t.createdAt, ctx.now),
    };
  };

  for (const t of tickets) {
    const assignedToMe = t.assignedIds.includes(ctx.userId);

    const createdByMe =
      myName !== null && t.createdBy.trim().toLowerCase() === myName;

    if (!assignedToMe && !createdByMe) {
      continue;
    }

    const key = String(t.id);
    const before = prev?.[key];

    const maxAttachment = t.attachments.reduce((m, a) => Math.max(m, a.id), 0);

    next[key] = {
      s: t.status,
      d: t.deadline,
      a: maxAttachment,
      r: assignedToMe ? 1 : 0,
      t: ctx.now,
    };

    const self = ctx.selfTouched.has(t.id);

    if (!before) {
      // تیکت کاملاً جدید که به من رسیده (فقط بعد از گرفتن baseline)
      if (prev !== undefined && assignedToMe && !createdByMe && !self) {
        events.push(receivedEvent(t, ""));
      }

      continue;
    }

    if (before.r === 0 && assignedToMe && !createdByMe && !self) {
      events.push(receivedEvent(t, `:${t.updatedAt}`));
    }

    if (before.s !== t.status && !self) {
      let text: string | null = null;

      if (t.status === "completed") {
        text = "تکمیل شد";
      } else if (t.status === "cancelled") {
        text = "لغو شد";
      } else if (
        CLOSED.has(before.s) &&
        (t.status === "in_progress" || t.status === "waiting")
      ) {
        text = "دوباره باز شد";
      }

      if (text) {
        events.push({
          id: `ticket_status:${t.id}:${t.status}:${t.updatedAt}`,
          kind: "ticket_status",
          title: `تیکت ${q(t.title)} ${text}`,
          createdAt: pastIso(t.updatedAt, ctx.now),
        });
      }
    }

    if (before.d !== t.deadline && !self) {
      events.push({
        id: `ticket_deadline:${t.id}:${t.deadline ?? "none"}:${t.updatedAt}`,
        kind: "ticket_deadline",
        title: t.deadline
          ? `ددلاین تیکت ${q(t.title)} تعیین شد`
          : `ددلاین تیکت ${q(t.title)} برداشته شد`,
        body: t.deadline ? formatWhen(t.deadline) : undefined,
        createdAt: pastIso(t.updatedAt, ctx.now),
      });
    }

    const incoming = t.attachments.filter(
      (a) => a.id > before.a && a.uploadedBy !== ctx.userId,
    );

    if (incoming.length > 0 && !ctx.isTicketActive(t.id)) {
      const last = incoming[incoming.length - 1];

      const who =
        (last.uploadedBy !== null && ctx.names.byId.get(last.uploadedBy)) ||
        "همکار";

      events.push({
        id: `ticket_message:${t.id}:${last.id}`,
        kind: "ticket_message",
        title:
          incoming.length === 1
            ? `پیام جدید از ${who}`
            : `${fa(incoming.length)} پیام جدید در تیکت ${q(t.title)}`,
        body:
          incoming.length === 1
            ? `در ${q(t.title)}: ${preview(last)}`
            : `${who}: ${preview(last)}`,
        createdAt: pastIso(last.createdAt, ctx.now),
      });
    }
  }

  if (prev) {
    for (const [key, mark] of Object.entries(prev)) {
      if (!(key in next) && ctx.now - mark.t < RETAIN_MS) {
        next[key] = mark;
      }
    }
  }

  return {
    events,
    next,
  };
}

export function detectTasks(
  tasks: ProjectTask[],
  prev: Record<string, TaskMark> | undefined,
  ctx: DetectContext,
): DetectResult<Record<string, TaskMark>> {
  const events: NotificationInput[] = [];
  const next: Record<string, TaskMark> = {};
  const employeeId = ctx.employeeId;

  // بدون پروفایل کارمندی نمی‌شود تسک‌های من را تشخیص داد؛ snapshot را دست نزن
  if (employeeId === null) {
    return { events, next: prev ?? {} };
  }

  for (const t of tasks) {
    // assigned_employee شناسه‌ی «کارمند» است، نه «کاربر»
    const mine = t.assignedIds.includes(employeeId);

    if (!mine) {
      continue;
    }

    const key = String(t.id);
    const before = prev?.[key];

    next[key] = {
      m: 1,
      st: t.currentStep,
      t: ctx.now,
    };

    if (ctx.selfTouched.has(t.id)) {
      continue;
    }

    // prev === undefined یعنی baseline هنوز گرفته نشده → فقط ثبت کن، نوتیف نده
    if (prev === undefined) {
      continue;
    }

    if (!before || before.m === 0 || before.st !== t.currentStep) {
      const where = [t.departmentName, t.stepName].filter(Boolean).join(" / ");

      events.push({
        id: `task_assigned:${t.id}:${t.currentStep}:${t.updatedAt}`,
        kind: "task_assigned",
        title: `وظیفه جدید: ${t.title.trim() || "بدون عنوان"}`,
        body: where || undefined,
        createdAt: pastIso(t.updatedAt, ctx.now),
      });
    }
  }

  if (prev) {
    for (const [key, mark] of Object.entries(prev)) {
      if (key in next) {
        continue;
      }

      if (ctx.now - mark.t < RETAIN_MS) {
        next[key] = {
          ...mark,
          m: 0,
        };
      }
    }
  }

  return {
    events,
    next,
  };
}

export function detectRoutines(
  routines: Routine[],
  ticketsById: Map<number, Ticket>,
  prev: Record<string, string> | undefined,
  ctx: DetectContext,
): DetectResult<Record<string, string>> {
  const firstRun = prev === undefined;
  const events: NotificationInput[] = [];
  const next: Record<string, string> = {};

  for (const r of routines) {
    const key = String(r.id);

    if (prev && prev[key] !== undefined) {
      next[key] = prev[key];
    }

    const t = ticketsById.get(r.task);

    if (!t || !r.isActive || !r.nextRunAt) {
      continue;
    }

    if (!t.assignedIds.includes(ctx.userId)) {
      continue;
    }

    if (t.status !== "waiting") {
      continue;
    }

    const due = Date.parse(r.nextRunAt);

    if (Number.isNaN(due) || due > ctx.now) {
      continue;
    }

    if (prev && prev[key] === r.nextRunAt) {
      continue;
    }

    next[key] = r.nextRunAt;

    if (firstRun) {
      continue;
    }

    events.push({
      id: `routine_ready:${r.id}:${r.nextRunAt}`,
      kind: "routine_ready",
      title: `روتین ${q(t.title)} آماده‌ی اجراست`,
      createdAt: pastIso(r.nextRunAt, ctx.now),
    });
  }

  return {
    events,
    next,
  };
}
