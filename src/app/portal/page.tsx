"use client";
import { useEffect } from "react";
import { usePortalAuthStore } from "@/store/portalAuthStore";
export default function PortalIndex() {
  const { isAuthenticated, hasHydrated, initFromStorage } = usePortalAuthStore();
  useEffect(() => { void initFromStorage(); }, [initFromStorage]);
  useEffect(() => { if (hasHydrated) window.location.replace(isAuthenticated ? "/portal/products/" : "/portal/login/"); }, [hasHydrated, isAuthenticated]);
  return <div className="grid min-h-screen place-items-center">در حال انتقال...</div>;
}
