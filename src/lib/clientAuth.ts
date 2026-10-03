import axios from "axios";
import { getApiUrl } from "@/lib/config";
import type { SessionUser } from "@/types/auth";

const ACCESS_KEY = "crm-access";
const REFRESH_KEY = "crm-refresh";
const USER_KEY = "user";
const USER_ID_KEY = "crm-user-id";
// کلیدهای نسخه‌ی قبلی (برای اینکه کاربرانِ لاگین‌شده بیرون نیفتند)
const LEGACY_TYPE_KEY = "crm-type";
const LEGACY_USERNAME_KEY = "crm-username";

export const AUTH_STORAGE_KEYS = [ACCESS_KEY, REFRESH_KEY];

function read(key: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  if (typeof window === "undefined") return;

  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // localStorage در دسترس نیست (مثلاً حالت private)
  }
}

export const getAccessToken = () => read(ACCESS_KEY);
export const getRefreshToken = () => read(REFRESH_KEY);

function isValidUser(user: unknown): user is SessionUser {
  const candidate = user as Partial<SessionUser> | null;

  return (
    typeof candidate?.id === "number" &&
    Number.isFinite(candidate.id) &&
    typeof candidate?.username === "string" &&
    (candidate?.type === 1 || candidate?.type === 2)
  );
}

export function getStoredUser(): SessionUser | null {
  if (!getAccessToken() || !getRefreshToken()) return null;

  const raw = read(USER_KEY);

  if (raw) {
    try {
      const user = JSON.parse(raw);

      if (isValidUser(user)) {
        return { id: user.id, username: user.username, type: user.type };
      }
    } catch {
      // به fallback برو
    }
  }

  // fallback: ساختار قدیمی localStorage
  const type = read(LEGACY_TYPE_KEY);
  const rawId = read(USER_ID_KEY);
  const id = rawId && rawId !== "undefined" ? Number(rawId) : NaN;

  const legacy = {
    id,
    username: read(LEGACY_USERNAME_KEY) ?? "",
    type: type === "1" ? 1 : type === "2" ? 2 : null,
  };

  return isValidUser(legacy)
    ? { id: legacy.id, username: legacy.username, type: legacy.type }
    : null;
}

export function saveSession(params: {
  access: string;
  refresh: string;
  user: SessionUser;
}) {
  write(ACCESS_KEY, params.access);
  write(REFRESH_KEY, params.refresh);
  write(USER_KEY, JSON.stringify(params.user));
  write(USER_ID_KEY, String(params.user.id));
  write(LEGACY_TYPE_KEY, String(params.user.type));
  write(LEGACY_USERNAME_KEY, params.user.username);
}

export function clearSession() {
  write(ACCESS_KEY, null);
  write(REFRESH_KEY, null);
  write(USER_KEY, null);
  write(USER_ID_KEY, null);
  write(LEGACY_TYPE_KEY, null);
  write(LEGACY_USERNAME_KEY, null);
}

let refreshPromise: Promise<string | null> | null = null;

/**
 * چند درخواست هم‌زمان فقط «یک» refresh می‌زنند.
 * - توکن جدید  → رشته
 * - refresh رد شد (۴۰۰/۴۰۱/۴۰۳) → null  (یعنی باید لاگ‌اوت شود)
 * - خطای شبکه/سرور → throw  (جلسه حفظ می‌شود تا با قطعی لحظه‌ای بیرون نیفتد)
 */
export function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  const refresh = getRefreshToken();
  if (!refresh) return Promise.resolve(null);

  refreshPromise = (async () => {
    try {
      const { data } = await axios.post(
        `${getApiUrl()}/accounts/api/v1/auth/refresh/`,
        { refresh },
        { timeout: 15_000 },
      );

      if (typeof data?.access !== "string" || !data.access) return null;

      write(ACCESS_KEY, data.access);

      if (typeof data.refresh === "string" && data.refresh) {
        write(REFRESH_KEY, data.refresh);
      }

      return data.access as string;
    } catch (error) {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;

      if (status === 400 || status === 401 || status === 403) return null;

      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
