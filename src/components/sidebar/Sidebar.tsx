"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useSidebarIsOpen,
  useSidebarActions,
} from "@/store/mobileSidebarStore";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useLogout } from "@/hooks/useLogout";

export default function Sidebar() {
  const pathname = usePathname();
  const isOpen = useSidebarIsOpen();
  const { close } = useSidebarActions();
  const { logout } = useLogout();
  const menuItems = useMenuItems();

  const closeOnMobile = () => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      close();
    }
  };

  return (
    <>
      <div
        aria-hidden
        onClick={close}
        className={cn(
          "fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        inert={!isOpen}
        className={cn(
          "fixed right-0 z-50 flex w-[280px] flex-col border-l border-gray-200/60 bg-white dark:border-white/10 dark:bg-slate-950",
          "top-0 h-dvh md:top-16 md:z-40 md:h-[calc(100dvh-4rem)] md:w-64",
          "transition-transform duration-300 ease-out will-change-transform",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-200/60 p-4 md:hidden dark:border-white/10">
          <h2 className="text-[14px] font-medium text-gray-900 dark:text-white">
            منوی اصلی
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="بستن منو"
            className="rounded-lg p-1.5 transition-colors hover:bg-gray-100/80 dark:hover:bg-white/10"
          >
            <X
              className="h-5 w-5 text-gray-600 dark:text-gray-300"
              strokeWidth={1.5}
            />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeOnMobile}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors duration-200",
                  isActive
                    ? "bg-blue-50/80 text-blue-600 before:absolute before:inset-y-0 before:right-0 before:w-0.5 before:rounded-full before:bg-blue-600 dark:bg-blue-500/10 dark:text-blue-400 dark:before:bg-blue-400"
                    : "text-gray-700 hover:bg-gray-100/60 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200",
                  )}
                  strokeWidth={isActive ? 2 : 1.5}
                />

                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-2 border-t border-gray-200/60 p-3 dark:border-white/10">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-red-400 transition-colors hover:bg-red-500/10 active:scale-[0.98]"
          >
            <LogOut size={18} />
            <span>خروج</span>
          </button>

          <a
            href="https://radcosys.ir/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[11px] text-gray-500 transition-colors hover:bg-gray-100/50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
          >
            <span>توسعه داده شده توسط تیم فنی رادکو</span>
            <Image
              src="/logo.jpg"
              alt="رادکو"
              width={30}
              height={30}
              className="flex-shrink-0 rounded-md object-cover"
            />
          </a>
        </div>
      </aside>
    </>
  );
}