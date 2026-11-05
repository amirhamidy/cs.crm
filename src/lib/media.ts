import { getMediaUrl } from "@/lib/config";

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";

  const base = getMediaUrl();
  const parseBase =
    base ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost");

  try {
    const parsed = new URL(url, parseBase);
    return `${base}${parsed.pathname}${parsed.search}`;
  } catch {
    return `${base}/${url.replace(/^\/+/, "")}`;
  }
}
