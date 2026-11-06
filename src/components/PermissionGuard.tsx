"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { routePermission } from "@/config/menu";
import { usePermissions } from "@/hooks/usePermissions";

export default function PermissionGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { can, loaded } = usePermissions();

  const need = routePermission(pathname ?? "");

  if (!need) return <>{children}</>;

  if (!loaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-gray-400">
        <Spinner size={22} className="animate-spin" />
      </div>
    );
  }

  if (!can(need.section, need.action)) {
    return (
      <div
        dir="rtl"
        className="mx-auto mt-16 flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-gray-900/[0.08] bg-white p-8 text-center shadow-sm dark:border-white/[0.08] dark:bg-gray-900"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <ShieldAlert size={24} />
        </span>
        <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">
          به این بخش دسترسی ندارید
        </h2>
        <p className="text-[12.5px] leading-6 text-gray-500 dark:text-gray-400">
          برای دیدن این صفحه باید مدیر سیستم دسترسی لازم را به حساب شما بدهد.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
