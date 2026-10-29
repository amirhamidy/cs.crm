import { getApiUrl } from "@/lib/config";

const G = [
  "from-indigo-500 to-violet-500",
  "from-pink-500 to-fuchsia-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
];

export const gradientOf = (n: number) => G[Math.abs(n) % G.length];
export const initialOf = (t: string, f = "د") => t.trim().charAt(0) || f;






export function resolveFileUrl(url?: string | null): string {
  if (!url) return "";
  if (/^(blob:|data:)/i.test(url)) return url;

  const base = getApiUrl();

  if (url.startsWith("//")) return `https:${url}`;

  if (/^https?:\/\//i.test(url)) {
    try {
      const u = new URL(url);
      const b = new URL(base);
      if (u.host === b.host && b.protocol === "https:") u.protocol = "https:";
      return u.toString();
    } catch {
      return url;
    }
  }

  return `${base}/${url.replace(/^\/+/, "")}`;
}





const FIELD_LABELS: Record<string, string> = {
  title: "عنوان",
  file: "فایل",
  order: "ترتیب",
};


export function extractError(
  e: unknown,
  fallback = "عملیات انجام نشد، دوباره تلاش کنید.",
): string {
  const err = e as {
    code?: string;
    response?: { status?: number; data?: unknown };
  };

  if (err?.code === "ERR_NETWORK") return "ارتباط با سرور برقرار نشد.";
  if (err?.code === "ECONNABORTED") return "زمان درخواست به پایان رسید.";

  const pick = (v: unknown): string => {
    if (!v) return "";
    if (typeof v === "string") return v.length > 300 ? "" : v; 
    if (Array.isArray(v)) return v.map(pick).filter(Boolean).join("، ");
    if (typeof v === "object") {
      return Object.entries(v as Record<string, unknown>)
        .map(([k, val]) => {
          const m = pick(val);
          if (!m) return "";
          return k === "detail" || k === "non_field_errors"
            ? m
            : `${FIELD_LABELS[k] ?? k}: ${m}`;
        })
        .filter(Boolean)
        .join(" | ");
    }
    return "";
  };

  const msg = pick(err?.response?.data);
  if (msg) return msg;

  switch (err?.response?.status) {
    case 401:
    case 403:
      return "دسترسی لازم برای این عملیات را ندارید.";
    case 404:
      return "آدرس درخواست در سرور پیدا نشد.";
    case 413:
      return "حجم فایل بیش از حد مجاز است.";
    default:
      return fallback;
  }
}