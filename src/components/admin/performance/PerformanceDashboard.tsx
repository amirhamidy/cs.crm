"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, m } from "framer-motion";
import { Building2, Users, Layers, UserPlus, LayoutDashboard, CalendarClock } from "lucide-react";
import type { Props } from "./shared/types";

const Sk = () => <div className="h-[340px] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-900" />;
const Overview = dynamic(() => import("./overview"), { loading: Sk });
const Departments = dynamic(() => import("./departments"), { loading: Sk });
const Employees = dynamic(() => import("./employees"), { loading: Sk });
const Stages = dynamic(() => import("./stages"), { loading: Sk });
const Customers = dynamic(() => import("./customers"), { loading: Sk });
const MyTaskDeadlines = dynamic(() => import("./MyTaskDeadlines"), { loading: Sk });

const TABS = [
    { id: "overview", label: "نمای کلی", icon: LayoutDashboard },
    { id: "departments", label: "دپارتمان‌ها", icon: Building2 },
    { id: "employees", label: "کارمندان", icon: Users },
    { id: "stages", label: "مراحل", icon: Layers },
    { id: "customers", label: "مشتریان", icon: UserPlus },
    { id: "deadlines", label: "مهلت‌ها", icon: CalendarClock },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function PerformanceDashboard(p: Props) {
    const [tab, setTab] = useState<TabId>("overview");

    if (p.loading) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-[340px] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-900" />
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <nav className="flex gap-1.5 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-1.5 dark:border-white/10 dark:bg-gray-950">
                {TABS.map((t) => {
                    const on = tab === t.id;
                    return (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-[12px] font-bold transition-colors ${on ? "text-white" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"}`}>
                            {on && (
                                <m.span layoutId="perf-tab" className="absolute inset-0 rounded-xl bg-gradient-to-l from-indigo-500 to-violet-500"
                                    transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                            )}
                            <t.icon size={14} className="relative" />
                            <span className="relative">{t.label}</span>
                        </button>
                    );
                })}
            </nav>

            <AnimatePresence mode="wait">
                <m.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    {tab === "overview" && <Overview {...p} />}
                    {tab === "departments" && <Departments {...p} />}
                    {tab === "employees" && <Employees {...p} />}
                    {tab === "stages" && <Stages {...p} />}
                    {tab === "customers" && <Customers {...p} />}
                    {tab === "deadlines" && <MyTaskDeadlines />}
                </m.div>
            </AnimatePresence>
        </div>
    );
}

