"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Users } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export interface TopBringerItem {
    key: string;
    full_name: string;
    count: number;
    actual: number;
    potential: number;
}

interface Props {
    items: TopBringerItem[];
    loading: boolean;
}

type ActiveSlice = { name: string; actual: number; count: number; color: string; glow: string; index: number };

const VIOLET_SCALE = [
    { color: "#818cf8", glow: "rgba(129,140,248,0.5)" },
    { color: "#a78bfa", glow: "rgba(167,139,250,0.5)" },
    { color: "#c084fc", glow: "rgba(192,132,252,0.5)" },
    { color: "#38bdf8", glow: "rgba(56,189,248,0.5)" },
    { color: "#2dd4bf", glow: "rgba(45,212,191,0.5)" },
    { color: "#f472b6", glow: "rgba(244,114,182,0.5)" },
];

function TopBringersChartSkeleton() {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/8 dark:bg-slate-950">
            <div className="mb-3 space-y-2" dir="rtl">
                <div className="h-4 w-36 animate-pulse rounded-full bg-gray-100 dark:bg-slate-900" />
                <div className="h-3 w-24 animate-pulse rounded-full bg-gray-100/80 dark:bg-slate-900/60" />
            </div>
            <div className="flex h-[200px] items-center justify-center">
                <div className="h-32 w-32 animate-pulse rounded-full border-[14px] border-gray-100 dark:border-slate-900" />
            </div>
        </div>
    );
}

export default function TopBringersChart({ items, loading }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [activeSlice, setActiveSlice] = useState<ActiveSlice | null>(null);

    const data = useMemo(
        () =>
            items.slice(0, 6).map((item, i) => ({
                name: item.full_name,
                actual: item.actual,
                count: item.count,
                fill: VIOLET_SCALE[i % VIOLET_SCALE.length].color,
            })),
        [items],
    );

    const totalActual = useMemo(() => data.reduce((sum, item) => sum + item.actual, 0), [data]);

    const handleMouseEnter = useCallback(
        (_: unknown, index: number) => {
            const item = data[index];
            if (!item) return;
            const meta = VIOLET_SCALE[index % VIOLET_SCALE.length];
            setActiveSlice({ name: item.name, actual: item.actual, count: item.count, color: meta.color, glow: meta.glow, index });
        },
        [data],
    );

    const handleMouseLeave = useCallback(() => setActiveSlice(null), []);

    if (loading) return <TopBringersChartSkeleton />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative overflow-hidden rounded-2xl border p-4 shadow-sm"
            style={{
                borderColor: isDark ? "rgba(129,140,248,0.1)" : "rgba(129,140,248,0.12)",
                background: isDark
                    ? "linear-gradient(160deg, rgba(129,140,248,0.05), rgba(15,23,42,0))"
                    : "linear-gradient(160deg, rgba(129,140,248,0.05), #ffffff)",
            }}
        >
            <div className="mb-3 flex items-start justify-between gap-3" dir="rtl">
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex h-8 w-8 items-center justify-center rounded-xl"
                        style={{ background: "linear-gradient(135deg, rgba(129,140,248,0.18), rgba(56,189,248,0.18))" }}
                    >
                        <Users size={15} className="text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">آورنده‌های برتر مشتری</h3>
                        <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">بیشترین مشتری بالفعل جذب‌شده</p>
                    </div>
                </div>
            </div>

            <div className="absolute left-2 top-14 z-10 min-w-[160px]">
                <AnimatePresence mode="wait">
                    {activeSlice && (
                        <motion.div
                            key={activeSlice.index}
                            initial={{ opacity: 0, y: 4, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.96 }}
                            transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="pointer-events-none rounded-xl border border-gray-200/60 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/95"
                            style={{ boxShadow: `0 4px 20px ${activeSlice.glow}` }}
                        >
                            <div className="mb-1 flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeSlice.color, boxShadow: `0 0 6px ${activeSlice.glow}` }} />
                                <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-100">{activeSlice.name}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                بالفعل: <span className="font-bold tabular-nums" style={{ color: activeSlice.color }}>{activeSlice.actual.toLocaleString("fa-IR")}</span> از {activeSlice.count.toLocaleString("fa-IR")} ورودی
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="relative h-[220px] w-full">
                {data.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">داده‌ای در این بازه وجود ندارد</div>
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart onMouseLeave={handleMouseLeave}>
                                <Pie
                                    data={data}
                                    dataKey="actual"
                                    nameKey="name"
                                    innerRadius="58%"
                                    outerRadius="88%"
                                    paddingAngle={3}
                                    cornerRadius={6}
                                    stroke="none"
                                    onMouseEnter={handleMouseEnter}
                                >
                                    {data.map((item, i) => (
                                        <Cell
                                            key={item.name}
                                            fill={item.fill}
                                            opacity={activeSlice && activeSlice.index !== i ? 0.35 : 1}
                                            style={{ transition: "opacity 0.2s ease" }}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[18px] font-extrabold text-gray-900 dark:text-white">{totalActual.toLocaleString("fa-IR")}</span>
                            <span className="text-[10.5px] text-gray-400 dark:text-gray-500">مشتری بالفعل</span>
                        </div>
                    </>
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