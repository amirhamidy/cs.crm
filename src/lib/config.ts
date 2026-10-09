// آدرس بک‌اند (Django).
// اولویت: public/config.js (زمان اجرا، بدون نیاز به بیلد دوباره) ← NEXT_PUBLIC_API_URL ← مقدار پیش‌فرض
declare global {
  interface Window {
    __APP_CONFIG__?: { API_URL?: string };
  }
}

export const DEFAULT_API_URL = "///////";

export function getApiUrl(): string {
  const fromWindow =
    typeof window !== "undefined" ? window.__APP_CONFIG__?.API_URL : undefined;

  const value = (
    fromWindow ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_API_URL
  ).trim();

  return value.replace(/\/+$/, "");
}
