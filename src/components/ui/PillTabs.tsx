"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type PillTab = { href: string; label: string; icon?: ReactNode };

export default function PillTabs({ tabs, exact = false }: { tabs: PillTab[]; exact?: boolean }) {
  const path = (usePathname() || "").replace(/\/$/, "");
  return (
    <div className="flex flex-wrap gap-2 rounded-[1.6rem] border border-gray-100 bg-white p-2 shadow-sm dark:border-white/[0.08] dark:bg-[#111827]" dir="rtl">
      {tabs.map((t) => {
        const active = path === t.href || (!exact && path.startsWith(t.href + "/"));
        return (
          <Link key={t.href} href={t.href} scroll
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-extrabold transition ${active ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.09]"}`}>
            {t.icon}{t.label}
          </Link>
        );
      })}
    </div>
  );
}
