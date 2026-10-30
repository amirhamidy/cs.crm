"use client";

import { Menu } from "lucide-react";
import { m } from "framer-motion";
import { useSidebar } from "@/hooks/useSidebar";
import { useCurrentEmployee } from "@/hooks/usecurrentemployee";
import { ThemeToggle } from "../ThemeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import ProfileMenu from "./ProfileMenu";

export default function Topbar() {
  const { toggle } = useSidebar();
  const { employee, loading } = useCurrentEmployee();

  const displayName = employee?.full_name || "ادمین";

  return (
    <header className="fixed top-0 right-0 left-0 z-50 h-16 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <m.button
            onClick={toggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-lg p-1.5 transition-colors hover:bg-gray-100/80 dark:hover:bg-white/10"
            aria-label="باز و بسته کردن سایدبار"
          >
            <Menu
              className="h-5 w-5 text-gray-700 dark:text-gray-300"
              strokeWidth={1.5}
            />
          </m.button>

          <div className="hidden md:block">
            <h1 className="text-[14px] font-medium text-gray-900 dark:text-white">
              داشبورد مدیریت
            </h1>
          </div>
        </div>

        

        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />

          <ProfileMenu name={displayName} />
        </div>
      </div>
    </header>
  );
}