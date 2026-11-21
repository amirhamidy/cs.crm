"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import HighlightsDowntime from "./HighlightsDowntime";

const today = () => new Date().toISOString().slice(0, 10);
const monthAgo = () => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

export default function HighlightsTabsPage({ show }: { show: "highlights" | "downtime" }) {
    const path = usePathname();
    const [from, setFrom] = useState(monthAgo());
    const [to, setTo] = useState(today());
    const tabs = [
        { href: "/admin/production/highlights", label: "برترین‌ها" },
        { href: "/admin/production/downtime", label: "زمان توقف" },
    ];
    return (
        <div className="space-y-4 p-4">
            <div className="flex gap-2">
                {tabs.map((t) => (
                    <Link key={t.href} href={t.href} className={`rounded-full px-4 py-1.5 text-[12px] font-bold ${path === t.href ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 dark:bg-white/[0.06]"}`}>{t.label}</Link>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[12px]">
                <label>از <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border px-2 py-1 dark:bg-transparent" /></label>
                <label>تا <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border px-2 py-1 dark:bg-transparent" /></label>
            </div>
            <HighlightsDowntime dateFrom={from} dateTo={to} machineId={null} productId={null} show={show} />
        </div>
    );
}
