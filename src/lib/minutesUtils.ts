import axios from "axios";
import type { MeetingStatus } from "@/types/minutes";

/* ------------------------------------------------------------------ */
/* Status                                                              */
/* ------------------------------------------------------------------ */

export const STATUS_META: Record<MeetingStatus, { label: string; className: string; dot: string }> = {
  draft: {
    label: "پیش‌نویس",
    className: "border-slate-500/25 bg-slate-500/10 text-slate-600 dark:text-slate-300",
    dot: "bg-slate-400",
  },
  pending: {
    label: "در انتظار امضا",
    className: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  signed: {
    label: "امضا شده",
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  canceled: {
    label: "لغو شده",
    className: "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
};

export const STATUS_FILTERS: Array<{ value: MeetingStatus | ""; label: string }> = [
  { value: "", label: "همه" },
  { value: "draft", label: STATUS_META.draft.label },
  { value: "pending", label: STATUS_META.pending.label },
  { value: "signed", label: STATUS_META.signed.label },
  { value: "canceled", label: STATUS_META.canceled.label },
];

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(d);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO → مقدار input از نوع datetime-local (به وقت محلی مرورگر) */
export function toInputValue(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** مقدار datetime-local → ISO 8601 */
export function fromInputValue(value: string): string {
  return new Date(value).toISOString();
}

/* ------------------------------------------------------------------ */
/* Inputs                                                              */
/* ------------------------------------------------------------------ */

const FA = "۰۱۲۳۴۵۶۷۸۹";
const AR = "٠١٢٣٤٥٦٧٨٩";

export function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(FA.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
}

export const PHONE_REGEX = /^09\d{9}$/;

export const MAX_SIGNATURE_LENGTH = 500_000;
export const SIGNATURE_PREFIX = "data:image/png;base64,";

export function validateSignature(dataUrl: string | null): string | null {
  if (!dataUrl) return "لطفاً ابتدا امضا را رسم کنید.";
  if (!dataUrl.startsWith(SIGNATURE_PREFIX)) return "فرمت امضا باید PNG باشد.";
  if (dataUrl.length > MAX_SIGNATURE_LENGTH) return "حجم تصویر امضا زیاد است؛ دوباره و ساده‌تر امضا کنید.";
  return null;
}

export function buildPublicSignLink(token: string): string {
  if (typeof window === "undefined") return `/minutes/sign/${token}`;
  return `${window.location.origin}/minutes/sign/${token}`;
}

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

export interface ParsedError {
  status?: number;
  message: string;
  fields: Record<string, string>;
}

const flatten = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(flatten).filter(Boolean).join("، ");
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map(flatten).filter(Boolean).join("، ");
  }
  return String(value);
};

export function parseApiError(err: unknown, fallback = "خطایی رخ داد. دوباره تلاش کنید."): ParsedError {
  if (!axios.isAxiosError(err)) return { message: fallback, fields: {} };
  if (!err.response) return { message: "ارتباط با سرور برقرار نشد.", fields: {} };

  const status = err.response.status;
  const data = err.response.data as unknown;
  const fields: Record<string, string> = {};
  let message = "";

  if (typeof data === "string") {
    if (!data.trim().startsWith("<")) message = data;
  } else if (Array.isArray(data)) {
    message = flatten(data);
  } else if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const text = flatten(value);
      if (!text) continue;
      if (key === "detail" || key === "non_field_errors") message = message ? `${message}، ${text}` : text;
      else fields[key] = text;
    }
  }

  if (!message) {
    if (status === 401) message = "نشست شما منقضی شده است؛ دوباره وارد شوید.";
    else if (status === 403) message = "اجازه‌ی انجام این عملیات را ندارید.";
    else if (status === 404) message = "مورد درخواستی پیدا نشد یا به آن دسترسی ندارید.";
    else if (status >= 500) message = "خطای سرور؛ لطفاً کمی بعد دوباره تلاش کنید.";
    else if (Object.keys(fields).length) message = "لطفاً خطاهای فرم را بررسی کنید.";
    else message = fallback;
  }

  return { status, message, fields };
}
