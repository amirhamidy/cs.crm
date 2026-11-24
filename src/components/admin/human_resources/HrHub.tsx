"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarOff, Trash2, UserCog, Users, Wallet } from "lucide-react";

const BASE = "/admin/human-resources";
const TABS = [
    { href: BASE, label: "منابع", Icon: Users },
    { href: `${BASE}/info`, label: "اطلاعات", Icon: UserCog },
    { href: `${BASE}/salaries`, label: "پایه حقوق", Icon: Wallet },
    { href: `${BASE}/leaves`, label: "مرخصی", Icon: CalendarOff },
    { href: `${BASE}/waste`, label: "کسر ضایعات", Icon: Trash2 },
];

export default function HrTabs() {
    const path = usePathname().replace(/\/$/, "");
    return (
        <div className="flex flex-wrap gap-2 rounded-full border border-gray-100 bg-white p-2 shadow-sm dark:border-white/[0.08] dark:bg-[#111827]" dir="rtl">
            {TABS.map(({ href, label, Icon }) => (
                <Link key={href} href={href} scroll
                    className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-[12px] font-extrabold transition ${path === href ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.09]"}`}>
                    <Icon size={14} />{label}
                </Link>
            ))}
        </div>
    );
}
