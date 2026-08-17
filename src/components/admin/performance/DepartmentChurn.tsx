"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Crown,
    HelpCircle,
    TrendingDown,
    Workflow,
} from "lucide-react";
import type { DepartmentStat, StageStat } from "@/hooks/useAnalytics";

interface Props {
    departments: DepartmentStat[];
    loading: boolean;
}

const SEGMENTS = [
    { key: "sold", label: "فروش", color: "#10b981" },
    { key: "completed", label: "تکمیل", color: "#3b82f6" },
    { key: "in_progress", label: "در جریان", color: "#cbd5e1" },
    { key: "cancelled", label: "لغو", color: "#ef4444" },
] as const;

function SegmentTooltip({ stage, isDark }: { stage: StageStat; isDark: boolean }) {
    const rows = [
        { label: "فروش", value: stage.sold, color: "#10b981" },
        { label: "تکمیل", value: stage.completed, color: "#3b82f6" },
        { label: "در جریان", value: stage.in_progress, color: "#94a3b8" },
        { label: "لغو", value: stage.cancelled, color: "#ef4444" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 z-30 mb-2.5 w-44 -translate-x-1/2 rounded-2xl border p-3 shadow-xl"
            style={{
                background: isDark ? "#0f172a" : "#ffffff",
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
            }}
        >
            <p className="mb-2 text-[11.5px] font-extrabold text-gray-800 dark:text-gray-100">
                {stage.name}
            </p>
            <div className="flex flex-col gap-1.5">
                {rows.map((r) => (
                    <div key={r.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.color }} />
                            <span className="text-[10.5px] text-gray-500 dark:text-gray-400">{r.label}</span>
                        </div>
                        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200">{r.value}</span>
                    </div>
                ))}
                <div className="mt-1 flex items-center justify-between border-t border-dashed pt-1.5" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)" }}>
                    <span className="text-[10.5px] text-gray-400 dark:text-gray-500">مجموع</span>
                    <span className="text-[11px] font-extrabold text-indigo-500">{stage.total}</span>
                </div>
            </div>
            <div
                className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r"
                style={{
                    background: isDark ? "#0f172a" : "#ffffff",
                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
                }}
            />
        </motion.div>
    );
}

function SegmentedBar({ stages, isDark }: { stages: StageStat[]; isDark: boolean }) {
    const [hoverKey, setHoverKey] = useState<string | null>(null);
    const maxCancelled = Math.max(0, ...stages.map((s) => s.cancelled));

    return (
        <div className="flex flex-col gap-2">
            <div className="flex h-14 w-full gap-1">
                {stages.map((stage) => {
                    const total = stage.total || 1;
                    const isRisk = stage.cancelled === maxCancelled && maxCancelled > 0;
                    return (
                        <div
                            key={stage.key}
                            className="relative flex-1"
                            onMouseEnter={() => setHoverKey(stage.key)}
                            onMouseLeave={() => setHoverKey(null)}
                        >
                            <motion.div
                                whileHover={{ y: -3 }}
                                transition={{ duration: 0.15 }}
                                className="flex h-full w-full cursor-pointer overflow-hidden rounded-xl"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.035)",
                                    boxShadow: isRisk ? "0 0 0 1.5px rgba(244,63,94,0.5) inset" : "none",
                                }}
                            >
                                {SEGMENTS.map((seg) => {
                                    const val = stage[seg.key as keyof StageStat] as number;
                                    const pct = (val / total) * 100;
                                    if (pct <= 0) return null;
                                    return (
                                        <div
                                            key={seg.key}
                                            style={{ width: `${pct}%`, background: seg.color }}
                                            className="h-full"
                                        />
                                    );
                                })}
                            </motion.div>

                            <AnimatePresence>
                                {hoverKey === stage.key && <SegmentTooltip stage={stage} isDark={isDark} />}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-1">
                {stages.map((stage) => (
                    <div key={stage.key} className="flex-1 text-center">
                        <p className="truncate text-[10.5px] font-bold text-gray-500 dark:text-gray-400">
                            {stage.name}
                        </p>
                        <p className="text-[9.5px] text-gray-400 dark:text-gray-600">{stage.total} تسک</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EmployeePanel({
    person,
    isDark,
    variant,
}: {
    person: DepartmentStat["best"] | null;
    isDark: boolean;
    variant: "best" | "worst";
}) {
    const isBest = variant === "best";
    const border = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";

    const accentBg = isBest
        ? isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)"
        : isDark ? "rgba(244,63,94,0.12)" : "rgba(244,63,94,0.08)";
    const accentText = isBest
        ? isDark ? "#a5b4fc" : "#6366f1"
        : isDark ? "#fda4af" : "#f43f5e";

    return (
        <div className="flex h-full flex-col rounded-2xl p-4" style={{ border: `1px dashed ${border}` }}>
            <div className="mb-3 flex items-center gap-1.5">
                {isBest ? (
                    <Crown size={13} className="text-amber-500" />
                ) : (
                    <TrendingDown size={13} className="text-rose-400" />
                )}
                <span className="text-[10.5px] font-extrabold text-gray-400 dark:text-gray-500">
                    {isBest ? "کارمند برتر" : "نیاز به بهبود"}
                </span>
            </div>

            {!person ? (
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-center text-[11px] text-gray-400 dark:text-gray-500">
                        داده‌ای ثبت نشده
                    </p>
                </div>
            ) : (
                <div className="flex flex-1 flex-col">
                    <div className="mb-4 flex items-center gap-2.5">
                        <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-extrabold"
                            style={{ background: accentBg, color: accentText }}
                        >
                            {person.full_name.charAt(0) || "؟"}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-[12.5px] font-bold text-gray-800 dark:text-gray-100">
                                {person.full_name}
                            </p>
                            <p className="text-[10.5px] text-gray-400 dark:text-gray-500">
                                {person.total} تسک واگذارشده
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        {[
                            { label: "فروش رفته", value: person.sold, color: "#10b981" },
                            { label: "تکمیل‌شده", value: person.completed, color: "#3b82f6" },
                            { label: "لغوشده", value: person.cancelled, color: "#ef4444" },
                        ].map((row) => (
                            <div
                                key={row.label}
                                className="flex items-center justify-between border-b border-dashed pb-2 last:border-0"
                                style={{ borderColor: border }}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: row.color }} />
                                    <span className="text-[11px] text-gray-500 dark:text-gray-400">{row.label}</span>
                                </div>
                                <span className="text-[12px] font-extrabold" style={{ color: row.color }}>
                                    {row.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function DepartmentChurnSkeleton() {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/8 dark:bg-slate-950">
            <div className="mb-4 flex items-center gap-2.5" dir="rtl">
                <div className="h-8 w-8 animate-pulse rounded-xl bg-gray-100 dark:bg-slate-900" />
                <div className="space-y-2">
                    <div className="h-4 w-44 animate-pulse rounded-full bg-gray-100 dark:bg-slate-900" />
                    <div className="h-3 w-60 animate-pulse rounded-full bg-gray-100/80 dark:bg-slate-900/60" />
                </div>
            </div>
            <div className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-slate-900" />
        </div>
    );
}

export default function DepartmentChurn({ departments, loading }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [index, setIndex] = useState(0);
    const [showInfo, setShowInfo] = useState(false);

    const border = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const cardBg = isDark ? "rgba(255,255,255,0.03)" : "#fafafa";

    if (loading) return <DepartmentChurnSkeleton />;

    if (departments.length === 0) {
        return (
            <div
                className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl"
                style={{ border: `1px solid ${border}`, background: cardBg }}
            >
                <Workflow size={18} className="text-gray-300 dark:text-gray-600" />
                <p className="text-[11.5px] text-gray-400 dark:text-gray-500">داده‌ای در این بازه وجود ندارد</p>
            </div>
        );
    }

    const clampedIndex = Math.min(index, departments.length - 1);
    const dept = departments[clampedIndex];
    const goTo = (i: number) => setIndex(Math.max(0, Math.min(departments.length - 1, i)));

    const maxCancelled = Math.max(0, ...dept.stages.map((s) => s.cancelled));
    const riskStage = dept.stages.find((s) => s.cancelled === maxCancelled && maxCancelled > 0);

    const showWorst = dept.worst && dept.worst.key !== dept.best?.key;

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col rounded-2xl"
            style={{ border: `1px solid ${border}`, background: cardBg }}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-4 pt-4">
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex h-8 w-8 items-center justify-center rounded-xl"
                        style={{ background: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)" }}
                    >
                        <Workflow size={15} className="text-indigo-500" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                                مسیر تسک‌ها در فرآیند های دپارتمان
                            </h3>
                            <button
                                type="button"
                                onMouseEnter={() => setShowInfo(true)}
                                onMouseLeave={() => setShowInfo(false)}
                                className="relative flex h-4 w-4 items-center justify-center text-gray-300 dark:text-gray-600"
                            >
                                <HelpCircle size={13} />
                                <AnimatePresence>
                                    {showInfo && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 4 }}
                                            className="absolute right-0 top-6 z-20 w-56 rounded-xl border bg-white p-2.5 text-right shadow-lg dark:border-white/10 dark:bg-slate-900"
                                            style={{ borderColor: border }}
                                        >
                                            <p className="text-[10.5px] leading-5 text-gray-500 dark:text-gray-400">
                                                هر تیکه از نوار یک مرحله از دپارتمان است. با هاور کردن روی هر تیکه جزئیات تعداد تسک‌های فروش‌رفته، تکمیل‌شده، در جریان و لغوشده نمایش داده می‌شود.
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>
                        <p className="text-[10.5px] text-gray-400 dark:text-gray-500">
                            روی هر تیکه هاور کن تا جزئیات مرحله را ببینی
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mt-3.5 flex items-center gap-1 border-b px-4" style={{ borderColor: border }}>
                <button
                    type="button"
                    onClick={() => goTo(clampedIndex - 1)}
                    disabled={clampedIndex === 0}
                    className="flex h-7 w-6 shrink-0 items-center justify-center text-gray-300 transition-opacity disabled:opacity-30 dark:text-gray-600"
                >
                    <ChevronRight size={15} />
                </button>

                <div className="flex flex-1 items-center gap-4 overflow-x-auto">
                    {departments.map((d, i) => {
                        const active = i === clampedIndex;
                        return (
                            <button
                                key={d.key}
                                type="button"
                                onClick={() => goTo(i)}
                                className="relative flex shrink-0 flex-col items-center gap-2 pb-2.5 pt-1"
                            >
                                <span
                                    className="whitespace-nowrap text-[12px] font-bold transition-colors"
                                    style={{
                                        color: active
                                            ? isDark ? "#c7d2fe" : "#6366f1"
                                            : isDark ? "#64748b" : "#94a3b8",
                                    }}
                                >
                                    {d.department_name}
                                    <span className="mr-1 text-[10px] font-medium text-gray-300 dark:text-gray-600">
                                        {d.total}
                                    </span>
                                </span>
                                {active && (
                                    <motion.span
                                        layoutId="dept-tab-indicator"
                                        className="absolute -bottom-[1px] h-[2px] w-full rounded-full"
                                        style={{ background: isDark ? "#818cf8" : "#6366f1" }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={() => goTo(clampedIndex + 1)}
                    disabled={clampedIndex === departments.length - 1}
                    className="flex h-7 w-6 shrink-0 items-center justify-center text-gray-300 transition-opacity disabled:opacity-30 dark:text-gray-600"
                >
                    <ChevronLeft size={15} />
                </button>
            </div>

            {/* Body */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={dept.key}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_180px_180px] items-center"
                >
                    {/* Chart */}
                    <div className="flex flex-col gap-4">
                        {riskStage && (
                            <div
                                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px]"
                                style={{ background: isDark ? "rgba(244,63,94,0.08)" : "rgba(244,63,94,0.06)" }}
                            >
                                <AlertCircle size={12} className="shrink-0 text-rose-500" />
                                <span className="text-gray-500 dark:text-gray-400">
                                    بیشترین ریزش در مرحله{" "}
                                    <span className="font-bold text-rose-500">«{riskStage.name}»</span>{" "}
                                    — بررسی این مرحله توصیه می‌شود
                                </span>
                            </div>
                        )}

                        {dept.stages.length === 0 ? (
                            <div className="flex h-32 items-center justify-center text-[11.5px] text-gray-400 dark:text-gray-500">
                                هیچ مرحله‌ای برای این دپارتمان تعریف نشده
                            </div>
                        ) : (
                            <SegmentedBar stages={dept.stages} isDark={isDark} />
                        )}

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                            {SEGMENTS.map((seg) => (
                                <div key={seg.key} className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full" style={{ background: seg.color }} />
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{seg.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <EmployeePanel person={dept.best} isDark={isDark} variant="best" />
                    <EmployeePanel person={dept.worst} isDark={isDark} variant="worst" />
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}
