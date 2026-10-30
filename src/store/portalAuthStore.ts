"use client";
import { create } from "zustand";
import type { PortalAccount } from "@/types/portal";
import { clearPortalSession, getPortalAccount, getPortalAccess, getPortalExpiry, isPortalSessionValid, savePortalSession } from "@/lib/portal/portalAuth";
import { portalApi } from "@/lib/portal/portalApi";

interface PortalAuthState {
  account: PortalAccount | null; isAuthenticated: boolean; hasHydrated: boolean;
  setSession: (access: string, account: PortalAccount, expiresIn: number) => void;
  clear: () => void; initFromStorage: () => Promise<void>;
}
export const usePortalAuthStore = create<PortalAuthState>((set) => ({
  account: null, isAuthenticated: false, hasHydrated: false,
  setSession: (access, account, expiresIn) => {
    savePortalSession(access, account, expiresIn);
    set({ account, isAuthenticated: true, hasHydrated: true });
  },
  clear: () => { clearPortalSession(); set({ account: null, isAuthenticated: false, hasHydrated: true }); },
  initFromStorage: async () => {
    if (!isPortalSessionValid()) { clearPortalSession(); set({ account: null, isAuthenticated: false, hasHydrated: true }); return; }
    const access = getPortalAccess();
    const account = getPortalAccount();
    if (!access || !account) { clearPortalSession(); set({ account: null, isAuthenticated: false, hasHydrated: true }); return; }
    set({ account, isAuthenticated: true, hasHydrated: true });
    try {
      const fresh = await portalApi.me();
      const seconds = Math.max(1, Math.floor((getPortalExpiry() - Date.now()) / 1000));
      savePortalSession(access, fresh, seconds);
      set({ account: fresh, isAuthenticated: true, hasHydrated: true });
    } catch {
      // Keep the locally valid session on transient network failures.
      set({ account, isAuthenticated: true, hasHydrated: true });
    }
  },
}));
