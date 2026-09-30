import type { NotificationInput } from "@/components/notifications/types";

/* ─────────── داده‌ی نرمال‌شده‌ی API ─────────── */

export interface TicketAttachment {
  id: number;
  note: string;
  fileName: string;
  uploadedBy: number | null;
  createdAt: string;
}

/** تیکت داخلی (internal_task) */
export interface Ticket {
  id: number;
  title: string;
  status: string;
  assignedIds: number[];
  deadline: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  attachments: TicketAttachment[];
}

export interface Routine {
  id: number;
  task: number;
  nextRunAt: string | null;
  isActive: boolean;
}

/** تسک پروژه (کانبان دپارتمان‌ها) */
export interface ProjectTask {
  id: number;
  title: string;
  status: string;
  currentStep: number;
  assignedIds: number[];
  departmentName: string;
  stepName: string;
  updatedAt: string;
}

/* ─────────── آخرین وضعیتِ دیده‌شده (snapshot) ─────────── */

/** برای هر تیکتی که به کاربر مربوط است (گیرنده یا فرستنده). */
export interface TicketMark {
  /** status */
  s: string;
  /** deadline */
  d: string | null;
  /** بزرگ‌ترین id پیوست (پیام) دیده‌شده */
  a: number;
  /** آیا کاربر گیرنده بوده (1) یا فقط فرستنده (0) */
  r: 0 | 1;
  /** آخرین باری که در لیست دیده شد (ms) */
  t: number;
}

/** برای هر تسک پروژه‌ای که تا حالا در لیست «تسک‌های من» بوده. */
export interface TaskMark {
  /** الان در لیست من هست (1) یا نه (0) */
  m: 0 | 1;
  /** مرحله‌ی فعلی */
  st: number;
  /** آخرین باری که در لیست من بود (ms) */
  t: number;
}

export interface Snapshot {
  v: 1;
  /** undefined = هنوز baseline گرفته نشده */
  tickets?: Record<string, TicketMark>;
  tasks?: Record<string, TaskMark>;
  /** routineId → next_run_at ای که برایش نوتیف داده‌ایم */
  routines?: Record<string, string>;
}

/* ─────────── ورودی/خروجی detectorها ─────────── */

export interface Names {
  byId: Map<number, string>;
  /** کلیدها lowercase */
  byUsername: Map<string, string>;
}

export interface DetectContext {
  /** id «کاربر» (User) — برای تیکت‌های داخلی، روتین‌ها و پیوست‌ها */
  userId: number;
  /** id «کارمند» (Employee) — برای تسک‌های پروژه (assigned_employee). null = پروفایل کارمندی پیدا نشده */
  employeeId: number | null;
  username: string | null;
  now: number;
  /** شناسه‌هایی که خود کاربر تازه تغییر داده (نباید برایشان نوتیف بیاید) */
  selfTouched: Set<number>;
  names: Names;
  /** آیا چت این تیکت همین الان جلوی چشم کاربر باز است؟ */
  isTicketActive: (ticketId: number) => boolean;
}

export interface DetectResult<T> {
  events: NotificationInput[];
  next: T;
}
