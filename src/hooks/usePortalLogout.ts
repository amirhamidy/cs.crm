"use client";
import { usePortalAuthStore } from "@/store/portalAuthStore";
import { usePortalCartStore } from "@/store/portalCartStore";
export function usePortalLogout() {
  return () => {
    usePortalCartStore.getState().clear();
    usePortalAuthStore.getState().clear();
    window.location.replace("/portal/login/");
  };
}
