import { getApiUrl } from "@/lib/config";

// آدرس فایل‌های مدیا (آپلودها) را همیشه به دامنه‌ی بک‌اند و مسیر درست می‌برد؛
// حتی اگر بک‌اند آدرس مطلق با http یا هاست داخلی برگردانده باشد.
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";

  const base = getApiUrl();

  try {
    const parsed = new URL(url, base);
    return `${base}${parsed.pathname}${parsed.search}`;
  } catch {
    return `${base}/${url.replace(/^\/+/, "")}`;
  }
}
