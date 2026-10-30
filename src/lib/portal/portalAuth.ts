"use client";
import type { PortalAccount } from "@/types/portal";

const ACCESS = "portal-access";
const ACCOUNT = "portal-account";
const EXPIRES = "portal-expires-at";

export function getPortalAccess(): string | null {
  try { return typeof window === "undefined" ? null : window.localStorage.getItem(ACCESS); } catch { return null; }
}
export function getPortalAccount(): PortalAccount | null {
  try { const raw = window.localStorage.getItem(ACCOUNT); return raw ? JSON.parse(raw) as PortalAccount : null; } catch { return null; }
}
export function savePortalSession(access: string, account: PortalAccount, expiresIn: number) {
  try {
    window.localStorage.setItem(ACCESS, access);
    window.localStorage.setItem(ACCOUNT, JSON.stringify(account));
    window.localStorage.setItem(EXPIRES, String(Date.now() + Math.max(0, expiresIn) * 1000));
  } catch { /* storage may be unavailable */ }
}
export function isPortalSessionValid(): boolean {
  try {
    const access = getPortalAccess();
    const expiry = Number(window.localStorage.getItem(EXPIRES) || 0);
    return Boolean(access && expiry > Date.now());
  } catch { return false; }
}
export function getPortalExpiry(): number {
  try { return Number(window.localStorage.getItem(EXPIRES) || 0); } catch { return 0; }
}
export function clearPortalSession(accountId?: number | null) {
  try {
    const id = accountId ?? getPortalAccount()?.id;
    window.localStorage.removeItem(ACCESS);
    window.localStorage.removeItem(ACCOUNT);
    window.localStorage.removeItem(EXPIRES);
    if (id != null) window.localStorage.removeItem(`portal-cart:${id}`);
  } catch { /* storage may be unavailable */ }
}
