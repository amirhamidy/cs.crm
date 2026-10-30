"use client";
import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { usePortalAuthStore } from "@/store/portalAuthStore";
import { usePortalCartStore } from "@/store/portalCartStore";
import { getPortalExpiry } from "@/lib/portal/portalAuth";

export default function PortalAuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasHydrated, initFromStorage, account } = usePortalAuthStore();
  const bindAccount = usePortalCartStore((s) => s.bindAccount);
  const [ready, setReady] = useState(false);
  useEffect(() => { void initFromStorage().finally(() => setReady(true)); }, [initFromStorage]);
  useEffect(() => { if (hasHydrated && account) bindAccount(account.id); }, [hasHydrated, account, bindAccount]);
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;
    const delay = Math.max(0, getPortalExpiry() - Date.now());
    const timer = window.setTimeout(() => {
      usePortalAuthStore.getState().clear();
      window.location.replace("/portal/login/");
    }, delay);
    return () => window.clearTimeout(timer);
  }, [hasHydrated, isAuthenticated]);
  useEffect(() => { if (ready && hasHydrated && !isAuthenticated) window.location.replace("/portal/login/"); }, [ready, hasHydrated, isAuthenticated]);
  if (!ready || !hasHydrated || !isAuthenticated) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 text-gray-500 dark:bg-[#090d18]"
      >
        <Loader size={22} className="animate-spin text-indigo-600" />
        <p className="text-[12.5px]">در حال بررسی نشست مشتری...</p>
      </div>
    );
  }
  return <>{children}</>;
}
