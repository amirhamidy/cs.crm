"use client";

import { Menu, User } from "lucide-react";
import { motion } from "framer-motion";
import { useSidebar } from "@/hooks/useSidebar";
import { useCurrentEmployee } from "@/hooks/usecurrentemployee";
import { ThemeToggle } from "../ThemeToggle";
import GlobalSearch from "@/components/customcomponents/search/GlobalSearch";

export default function Topbar() {
  const { toggle } = useSidebar();
  const { employee, loading } = useCurrentEmployee();

  const displayName = employee?.full_name || "ادمین";

  return (
    <header className="fixed top-0 right-0 left-0 z-50 h-16 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <motion.button
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
          </motion.button>

          <div className="hidden md:block">
            <h1 className="text-[14px] font-medium text-gray-900 dark:text-white">
              داشبورد مدیریت
            </h1>
          </div>
        </div>

        <GlobalSearch />

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm shadow-blue-500/30">
              <User className="h-4 w-4 text-white" strokeWidth={1.5} />
            </div>

            <span className="hidden min-w-12 text-[13px] font-medium text-gray-900 md:block dark:text-white">
              {loading ? (
                <motion.span
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  ...
                </motion.span>
              ) : (
                displayName
              )}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}