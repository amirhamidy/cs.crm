"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { TrendingDown } from "lucide-react";
import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

export interface WeakestEmployeeItem {
    key: string;
    full_name: string;
    total: number;
    cancelled: number;
}

interface Props {
    items: WeakestEmployeeItem[];
    loading: boolean;
}

type ActiveRing = { name: string; cancelled: number; total: number; color: string; glow: string; index: number };

const MAUVE_SCALE = [
    { color: "#fb7185", glow: "rgba(251,113,133,0.5)" },
    { color: "#f472b6", glow: "rgba(244,114,182,0.5)" },
    { color: "#e879f9", glow: "rgba(232,121,249,0.5)" },
    { color: "#c084fc", glow: "rgba(192,132,252,0.5)" },
    { color: "#fda4af", glow: "rgba(253,164,175,0.5)" },
    { color: "#f0abfc", glow: "rgba(240,171,252,0.5)" },
];

function WeakestEmployeesChartSkeleton() {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/8 dark:bg-slate-950">
            <div className="mb-3 space-y-2" dir="rtl">
                <div className="h-4 w-40 animate-pulse rounded-full bg-gray-100 dark:bg-slate-900" />
                <div className="h-3 w-24 animate-pulse rounded-full bg-gray-100/80 dark:bg-slate-900/60" />
            </div>
            <div className="flex h-[200px] items-center justify-center">
                <div className="h-32 w-32 animate-pulse rounded-full border-[10px] border-gray-100 dark:border-slate-900" />
            </div>
        </div>
    );
}

export default function WeakestEmployeesChart({ items, loading }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [activeRing, setActiveRing] = useState<ActiveRing | null>(null);

    const data = useMemo(
        () =>
            items.slice(0, 6).map((item, i) => ({
                name: item.full_name,
                cancelled: item.cancelled,
                total: item.total,
                fill: MAUVE_SCALE[i % MAUVE_SCALE.length].color,
            })),
        [items],
    );

    const handleMouseEnter = useCallback(
        (_: unknown, index: number) => {
            const item = data[index];
            if (!item) return;
            const meta = MAUVE_SCALE[index % MAUVE_SCALE.length];
            setActiveRing({ name: item.name, cancelled: item.cancelled, total: item.total, color: meta.color, glow: meta.glow, index });
        },
        [data],
    );

    const handleMouseLeave = useCallback(() => setActiveRing(null), []);

    if (loading) return <WeakestEmployeesChartSkeleton />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative overflow-hidden rounded-2xl border p-4 shadow-sm"
            style={{
                borderColor: isDark ? "rgba(251,113,133,0.1)" : "rgba(251,113,133,0.12)",
                background: isDark
                    ? "linear-gradient(160deg, rgba(244,114,182,0.05), rgba(15,23,42,0))"
                    : "linear-gradient(160deg, rgba(244,114,182,0.05), #ffffff)",
            }}
        >
            <div className="mb-3 flex items-start justify-between gap-3" dir="rtl">
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex h-8 w-8 items-center justify-center rounded-xl"
                        style={{ background: "linear-gradient(135deg, rgba(251,113,133,0.18), rgba(192,132,252,0.18))" }}
                    >
                        <TrendingDown size={15} className="text-rose-400" />
                    </div>
                    <div>
                        <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">بیشترین تسک لغو شده</h3>
                        <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">نیاز به پیگیری و بهبود</p>
                    </div>
                </div>
            </div>

            <div className="absolute left-2 top-14 z-10 min-w-[150px]">
                <AnimatePresence mode="wait">
                    {activeRing && (
                        <motion.div
                            key={activeRing.index}
                            initial={{ opacity: 0, y: 4, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.96 }}
                            transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="pointer-events-none rounded-xl border border-gray-200/60 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/95"
                            style={{ boxShadow: `0 4px 20px ${activeRing.glow}` }}
                        >
                            <div className="mb-1 flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeRing.color, boxShadow: `0 0 6px ${activeRing.glow}` }} />
                                <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-100">{activeRing.name}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                لغو شده: <span className="font-bold tabular-nums" style={{ color: activeRing.color }}>{activeRing.cancelled.toLocaleString("fa-IR")}</span> از {activeRing.total.toLocaleString("fa-IR")}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="h-[220px] w-full">
                {data.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">داده‌ای در این بازه وجود ندارد</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            data={data}
                            innerRadius="22%"
                            outerRadius="95%"
                            startAngle={90}
                            endAngle={-270}
                            onMouseLeave={handleMouseLeave}
                        >
                            <RadialBar dataKey="cancelled" background={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(148,163,184,0.12)" }} cornerRadius={8} onMouseEnter={handleMouseEnter} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {data.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 px-1" dir="rtl">
                    {data.map((item) => (
                        <div key={item.name} className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
                            <span className="text-[10.5px] text-gray-500 dark:text-gray-400">{item.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}