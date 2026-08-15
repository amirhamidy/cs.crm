"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { ChevronDown, AlertTriangle, TrendingDown, Loader, Layers } from "lucide-react";
import type { DepartmentStat } from "@/hooks/useAnalytics";

interface Props {
    departments: DepartmentStat[];
    loading: boolean;
}

const META = [
    { key: "sold", label: "فروش", color: "#10b981" },
    { key: "completed", label: "تکمیل", color: "#3b82f6" },
    { key: "in_progress", label: "در جریان", color: "#f59e0b" },
    { key: "cancelled", label: "لغو", color: "#ef4444" },
] as const;

type MetaKey = (typeof META)[number]["key"];

const CHURN_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#3b82f6", "#6366f1"],
    ["#8b5cf6", "#ec4899"],
    ["#06b6d4", "#6366f1"],
];

export default function DepartmentChurn({ departments, loading }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [openKey, setOpenKey] = useState<string | null>(null);

    const border = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const cardBg = isDark ? "rgba(255,255,255,0.03)" : "#fafafa";
    const hoverBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)";

    const totalChurn = departments.reduce((sum, d) => sum + d.cancelled, 0);

    return (
        <div
            className="flex flex-col overflow-hidden rounded-2xl"
            style={{ border: `1px solid ${border}`, background: cardBg }}
        >
            <div
                className="flex items-center justify-between px-4 py-3.5"
                style={{ borderBottom: `1px solid ${border}` }}
            >
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex h-8 w-8 items-center justify-center rounded-xl"
                        style={{
                            background: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
                        }}
                    >
                        <TrendingDown size={15} className="text-rose-500" />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                            ریزش مشتری در دپارتمان‌ها و مراحل
                        </h3>
                        <p className="text-[10.5px] text-gray-400 dark:text-gray-500">
                            گلوگاه ریزش: کجای هر دپارتمان بیشترین تسک لغو شده ثبت شده
                        </p>
                    </div>
                </div>
                <span className="text-[10.5px] font-bold text-rose-500 dark:text-rose-400">
                    {totalChurn} تسک لغو شده
                </span>
            </div>

            <div className="flex flex-col divide-y" style={{ borderColor: border }}>
                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Loader size={18} className="animate-spin text-indigo-500" />
                    </div>
                ) : departments.length === 0 ? (
                    <div className="flex h-40 items-center justify-center">
                        <p className="text-[11.5px] text-gray-400 dark:text-gray-500">
                            داده‌ای در این بازه وجود ندارد
                        </p>
                    </div>
                ) : (
                    departments.map((dep, i) => {
                        const g = CHURN_GRADIENTS[i % CHURN_GRADIENTS.length];
                        const isOpen = openKey === dep.key;
                        const maxCancelled = Math.max(0, ...dep.stages.map((s) => s.cancelled));
                        const riskStage = dep.stages.find((s) => s.cancelled === maxCancelled && maxCancelled > 0);

                        return (
                            <motion.div key={dep.key} layout transition={{ duration: 0.2 }}>
                                <button
                                    type="button"
                                    onClick={() => setOpenKey(isOpen ? null : dep.key)}
                                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right transition-colors hover:bg-[var(--hover)]"
                                    style={{ ["--hover" as string]: hoverBg }}
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-extrabold text-white"
                                            style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }}
                                        >
                                            {dep.department_name.charAt(0) || "؟"}
                                        </div>
                                        <div className="flex min-w-0 flex-col">
                                            <p className="truncate text-[12.5px] font-bold text-gray-800 dark:text-gray-100">
                                                {dep.department_name}
                                            </p>
                                            <p className="text-[10.5px] text-gray-400 dark:text-gray-500">
                                                {dep.stages.length} مرحله · {dep.total} تسک · {dep.best ? `برترین: ${dep.best.full_name}` : "بدون تسک"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">
                                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10.5px] font-bold text-emerald-500">
                                            {dep.conversion}٪ فروش
                                        </span>
                                        <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[10.5px] font-bold text-rose-500">
                                            {dep.cancelled} لغو
                                        </span>
                                        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                            <ChevronDown size={15} className="text-gray-400 dark:text-gray-500" />
                                        </motion.span>
                                    </div>
                                </button>

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            style={{ overflow: "hidden" }}
                                        >
                                            <div className="flex flex-col gap-3 px-4 pb-4" style={{ borderTop: `1px solid ${border}` }}>
                                                <div className="mt-3 flex items-center gap-4">
                                                    {META.map((m) => (
                                                        <div key={m.key} className="flex items-center gap-1.5">
                                                            <span
                                                                className="h-2 w-2 rounded-full"
                                                                style={{ background: m.color }}
                                                            />
                                                            <span className="text-[10.5px] font-bold text-gray-400 dark:text-gray-500">
                                                                {m.label}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {riskStage && (
                                                    <div
                                                        className="flex items-center gap-2 rounded-xl border px-3 py-2.5"
                                                        style={{
                                                            borderColor: isDark ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.15)",
                                                            background: isDark ? "rgba(239,68,68,0.06)" : "rgba(239,68,68,0.04)",
                                                        }}
                                                    >
                                                        <AlertTriangle size={14} className="shrink-0 text-rose-500" />
                                                        <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                                            بیشترین ریزش در مرحله «{riskStage.name}»
                                                        </p>
                                                        <span className="mr-auto text-[11px] font-extrabold text-rose-500">
                                                            {riskStage.cancelled} لغو
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex flex-col gap-2.5">
                                                    {dep.stages.map((st) => {
                                                        const total = st.total || 1;
                                                        const isRisk = riskStage?.key === st.key;
                                                        return (
                                                            <div key={st.key} className="flex flex-col gap-1.5">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <Layers size={12} className="text-gray-300 dark:text-gray-600" />
                                                                        <span className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200">
                                                                            {st.name}
                                                                        </span>
                                                                        {isRisk && (
                                                                            <AlertTriangle size={11} className="text-rose-500" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-3 text-[10.5px] font-bold">
                                                                        <span className="text-emerald-500">{st.sold}</span>
                                                                        <span className="text-blue-500">{st.completed}</span>
                                                                        <span className="text-amber-500">{st.in_progress}</span>
                                                                        <span className="text-rose-500">{st.cancelled}</span>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    className="flex h-2 w-full overflow-hidden rounded-full"
                                                                    style={{
                                                                        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                                                                    }}
                                                                >
                                                                    <div style={{ width: `${(st.sold / total) * 100}%`, background: "#10b981" }} />
                                                                    <div style={{ width: `${(st.completed / total) * 100}%`, background: "#3b82f6" }} />
                                                                    <div style={{ width: `${(st.in_progress / total) * 100}%`, background: "#f59e0b" }} />
                                                                    <div style={{ width: `${(st.cancelled / total) * 100}%`, background: "#ef4444" }} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
