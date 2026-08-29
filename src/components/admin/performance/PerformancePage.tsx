"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Activity, ListTodo, TrendingUp, Ban } from "lucide-react";
import { useAnalytics, type TimeRange } from "@/hooks/useAnalytics";
import TimeRangeSelector from "./TimeRangeSelector";
import BestEmployeesChart from "./BestEmployeesChart";
import WeakestEmployeesChart from "./WeakestEmployeesChart";
import TopBringersChart from "./TopBringersChart";
import DepartmentChurn from "./DepartmentChurn";
import TopStagesChart from "./TopStagesChart";

export default function PerformancePage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [range, setRange] = useState<TimeRange>("monthly");

    const {
        loading,
        error,
        departments,
        bestEmployees,
        weakestEmployees,
        topBringers,
        topSoldStages,
        topCompletedStages,
        topInProgressStages,
        topCancelledStages,
    } = useAnalytics(range);

    const chips = [
        {
            label: "تسک",
            value: departments.reduce((sum, d) => sum + d.total, 0),
            icon: ListTodo,
            gradient: ["#94a3b8", "#64748b"],
        },
        {
            label: "فروش",
            value: departments.reduce((sum, d) => sum + d.sold, 0),
            icon: TrendingUp,
            gradient: ["#2dd4bf", "#0ea5e9"],
        },
        {
            label: "لغو",
            value: departments.reduce((sum, d) => sum + d.cancelled, 0),
            icon: Ban,
            gradient: ["#fb7185", "#c084fc"],
        },
    ];

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                            background:
                                "linear-gradient(135deg, rgba(96,165,250,0.15), rgba(129,140,248,0.15))",
                            border: `1px solid ${isDark
                                    ? "rgba(129,140,248,0.2)"
                                    : "rgba(129,140,248,0.15)"
                                }`,
                        }}
                    >
                        <Activity size={17} className="text-indigo-400" />
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                            آنالیز عملکرد دپارتمان‌ها
                        </h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-400 dark:text-gray-500">
                            برترین‌ها، ریزش فرآیندها و منابع ورودی مشتری
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {chips.map((chip) => (
                        <span
                            key={chip.label}
                            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold"
                            style={{
                                background: isDark
                                    ? "rgba(255,255,255,0.04)"
                                    : "rgba(0,0,0,0.03)",
                                border: `1px solid ${isDark
                                        ? "rgba(255,255,255,0.06)"
                                        : "rgba(0,0,0,0.05)"
                                    }`,
                            }}
                        >
                            <chip.icon
                                size={11}
                                style={{ color: chip.gradient[0] }}
                            />

                            <span
                                className="bg-clip-text text-transparent"
                                style={{
                                    backgroundImage: `linear-gradient(135deg, ${chip.gradient[0]}, ${chip.gradient[1]})`,
                                }}
                            >
                                {chip.value.toLocaleString("fa-IR")}
                            </span>

                            <span className="text-gray-400 dark:text-gray-500">
                                {chip.label}
                            </span>
                        </span>
                    ))}

                    <TimeRangeSelector
                        value={range}
                        onChange={setRange}
                        loading={loading}
                    />
                </div>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border px-4 py-3 text-[12px] font-semibold"
                    style={{
                        borderColor: isDark
                            ? "rgba(251,113,133,0.2)"
                            : "rgba(251,113,133,0.15)",
                        background: isDark
                            ? "rgba(251,113,133,0.06)"
                            : "rgba(251,113,133,0.04)",
                        color: "#fb7185",
                    }}
                >
                    {error}
                </motion.div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <BestEmployeesChart
                    items={bestEmployees}
                    loading={loading}
                />

                <WeakestEmployeesChart
                    items={weakestEmployees}
                    loading={loading}
                />

                <TopBringersChart
                    items={topBringers}
                    loading={loading}
                />

                <TopStagesChart
                    topSoldStages={topSoldStages}
                    topCompletedStages={topCompletedStages}
                    topInProgressStages={topInProgressStages}
                    topCancelledStages={topCancelledStages}
                    loading={loading}
                    activeRange={range}
                />
            </div>

            <DepartmentChurn
                departments={departments}
                loading={loading}
            />
        </div>
    );
}