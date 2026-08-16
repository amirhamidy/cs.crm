"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Activity } from "lucide-react";
import { useAnalytics, type TimeRange } from "@/hooks/useAnalytics";
import TimeRangeSelector from "./TimeRangeSelector";
import BestEmployeesChart from "./BestEmployeesChart";
import WeakestEmployeesChart from "./WeakestEmployeesChart";
import TopBringersChart from "./TopBringersChart";
import DepartmentChurn from "./DepartmentChurn";

export default function PerformancePage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [range, setRange] = useState<TimeRange>("monthly");
    const { loading, error, departments, bestEmployees, weakestEmployees, topBringers } = useAnalytics(range);

    const chips = [
        { label: "تسک", value: departments.reduce((sum, d) => sum + d.total, 0), color: "#94a3b8" },
        { label: "فروش", value: departments.reduce((sum, d) => sum + d.sold, 0), color: "#10b981" },
        { label: "لغو", value: departments.reduce((sum, d) => sum + d.cancelled, 0), color: "#ef4444" },
    ];

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
                        style={{ background: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)" }}
                    >
                        <Activity size={16} className="text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-[14px] font-extrabold text-gray-900 dark:text-white">آنالیز عملکرد دپارتمان‌ها</h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-400 dark:text-gray-500">برترین‌ها، ریزش مراحل و منابع ورودی مشتری</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {chips.map((chip) => (
                        <span
                            key={chip.label}
                            className="rounded-xl px-3 py-1.5 text-[11px] font-bold"
                            style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", color: chip.color }}
                        >
                            {chip.value} {chip.label}
                        </span>
                    ))}
                    <TimeRangeSelector value={range} onChange={setRange} loading={loading} />
                </div>
            </div>

            {error && (
                <div
                    className="rounded-2xl border px-4 py-3 text-[12px] font-semibold"
                    style={{
                        borderColor: isDark ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.15)",
                        background: isDark ? "rgba(239,68,68,0.06)" : "rgba(239,68,68,0.04)",
                        color: "#ef4444",
                    }}
                >
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <BestEmployeesChart items={bestEmployees} loading={loading} />
                <WeakestEmployeesChart items={weakestEmployees} loading={loading} />
                <TopBringersChart items={topBringers} loading={loading} />
            </div>

            <DepartmentChurn departments={departments} loading={loading} />
        </div>
    );
}