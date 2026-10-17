import { getApiUrl } from "@/lib/config";

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
