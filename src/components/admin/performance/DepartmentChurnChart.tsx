"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { TrendingDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

export interface DepartmentChurnItem {
    key: string;
    department_name: string;
    total: number;
    sold: number;
    completed: number;
    in_progress: number;
    cancelled: number;
    churnRate: number;
}

interface Props {
    items: DepartmentChurnItem[];
    loading: boolean;
}

type ActiveDept = {
    name: string;
    sold: number;
    completed: number;
    in_progress: number;
    cancelled: number;
    churnRate: number;
    index: number;
};

const META = [
    { key: "sold", label: "فروش", color: "#10b981" },
    { key: "completed", label: "تکمیل", color: "#3b82f6" },
    { key: "in_progress", label: "جریان", color: "#f59e0b" },
    { key: "cancelled", label: "لغو", color: "#ef4444" },
] as const;

function CustomXTick({
    x,
    y,
    payload,
    isDark,
}: {
    x?: number;
    y?: number;
    payload?: { value: string };
    isDark: boolean;
}) {
    if (!payload?.value || x === undefined || y === undefined) return null;
    const label = payload.value.length > 8 ? `${payload.value.slice(0, 8)}…` : payload.value;
    return (
        <text x={x} y={y + 14} textAnchor="middle" fontSize={11} fontWeight={500} fill={isDark ? "#64748b" : "#64748b"}>
            {label}
        </text>
    );
}

function DepartmentChurnChartSkeleton() {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/8 dark:bg-slate-950">
            <div className="mb-3 space-y-2" dir="rtl">
                <div className="h-4 w-44 animate-pulse rounded-full bg-gray-100 dark:bg-slate-900" />
                <div className="h-3 w-28 animate-pulse rounded-full bg-gray-100/80 dark:bg-slate-900/60" />
            </div>
            <div className="flex h-[200px] items-end gap-2 px-2">
                {[60, 80, 45, 70, 35, 55, 40].map((h, i) => (
                    <div key={i} className="flex-1 animate-pulse rounded-t-md bg-gray-100 dark:bg-slate-900" style={{ height: `${h}%` }} />
                ))}
            </div>
        </div>
    );
}

export default function DepartmentChurnChart({ items, loading }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [activeDept, setActiveDept] = useState<ActiveDept | null>(null);

    const data = useMemo(
        () =>
            items.slice(0, 8).map((item) => ({
                name: item.department_name,
                sold: item.sold,
                completed: item.completed,
                in_progress: item.in_progress,
                cancelled: item.cancelled,
                churnRate: item.churnRate,
            })),
        [items],
    );

    const handleMouseEnter = useCallback(
        (_: unknown, index: number) => {
            const item = data[index];
            if (!item) return;
            setActiveDept({
                name: item.name,
                sold: item.sold,
                completed: item.completed,
                in_progress: item.in_progress,
                cancelled: item.cancelled,
                churnRate: item.churnRate,
                index,
            });
        },
        [data],
    );

    const handleMouseLeave = useCallback(() => setActiveDept(null), []);
    const gridColor = isDark ? "rgba(255,255,255,0.04)" : "#e2e8f0";
    const renderXTick = useCallback((props: unknown) => <CustomXTick {...(props as any)} isDark={isDark} />, [isDark]);

    if (loading) return <DepartmentChurnChartSkeleton />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-slate-950"
        >
            <div className="mb-3 flex items-start justify-between gap-3" dir="rtl">
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex h-8 w-8 items-center justify-center rounded-xl"
                        style={{ background: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)" }}
                    >
                        <TrendingDown size={15} className="text-rose-500" />
                    </div>
                    <div>
                        <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">ریزش مشتری در دپارتمان‌ها</h3>
                        <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">وضعیت تسک‌ها به تفکیک دپارتمان</p>
                    </div>
                </div>

                <div className="hidden items-center gap-3 sm:flex">
                    {META.map((m) => (
                        <div key={m.key} className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
                            <span className="text-[10.5px] font-bold text-gray-400 dark:text-gray-500">{m.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="absolute left-2 top-14 z-10 min-w-[170px]">
                <AnimatePresence mode="wait">
                    {activeDept && (
                        <motion.div
                            key={activeDept.index}
                            initial={{ opacity: 0, y: 4, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.96 }}
                            transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="pointer-events-none rounded-xl border border-gray-200/60 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/95"
                            style={{ boxShadow: "0 4px 20px rgba(239,68,68,0.35)" }}
                        >
                            <p className="mb-1.5 text-[12px] font-semibold text-gray-800 dark:text-gray-100">{activeDept.name}</p>
                            <div className="flex flex-col gap-0.5">
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">فروش: <span className="font-bold text-emerald-500">{activeDept.sold}</span></p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">تکمیل: <span className="font-bold text-blue-500">{activeDept.completed}</span></p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">جریان: <span className="font-bold text-amber-500">{activeDept.in_progress}</span></p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">لغو: <span className="font-bold text-rose-500">{activeDept.cancelled}</span> ({activeDept.churnRate}٪)</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="h-[220px] w-full">
                {data.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">داده‌ای در این بازه وجود ندارد</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 8 }} barCategoryGap="30%" onMouseLeave={handleMouseLeave}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={renderXTick} interval={0} height={28} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} className="[&_text]:fill-gray-400 dark:[&_text]:fill-gray-500" />
                            <Bar dataKey="sold" stackId="a" fill="#10b981" onMouseEnter={handleMouseEnter} />
                            <Bar dataKey="completed" stackId="a" fill="#3b82f6" onMouseEnter={handleMouseEnter} />
                            <Bar dataKey="in_progress" stackId="a" fill="#f59e0b" onMouseEnter={handleMouseEnter} />
                            <Bar dataKey="cancelled" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} onMouseEnter={handleMouseEnter} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </motion.div>
    );
}