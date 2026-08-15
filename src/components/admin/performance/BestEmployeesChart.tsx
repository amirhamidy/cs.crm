"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Award } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

export interface BestEmployeeItem {
    key: string;
    full_name: string;
    department_name: string;
    sold: number;
}

interface Props {
    items: BestEmployeeItem[];
    loading: boolean;
}

type ActiveBar = { name: string; department: string; sold: number; color: string; glow: string; index: number };

const BAR_COLORS = [
    { color: "#10b981", glow: "rgba(16,185,129,0.5)" },
    { color: "#22c55e", glow: "rgba(34,197,94,0.5)" },
    { color: "#0ea5e9", glow: "rgba(14,165,233,0.5)" },
    { color: "#6366f1", glow: "rgba(99,102,241,0.5)" },
    { color: "#a855f7", glow: "rgba(168,85,247,0.5)" },
    { color: "#f59e0b", glow: "rgba(245,158,11,0.5)" },
];

function CustomHBarShape({
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    index = 0,
    activeIndex,
}: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    index?: number;
    activeIndex: number | null;
}) {
    if (width <= 0) return null;
    const isActive = activeIndex === index;
    const meta = BAR_COLORS[index % BAR_COLORS.length];
    const radius = 6;

    return (
        <g>
            {isActive && (
                <rect x={x - 2} y={y - 3} width={width + 6} height={height + 6} rx={radius + 1} fill={meta.color} opacity={0.15} />
            )}
            <path
                d={`M ${x},${y} L ${x + Math.max(width - radius, 0)},${y} Q ${x + width},${y} ${x + width},${y + radius} L ${x + width},${y + height - radius} Q ${x + width},${y + height} ${x + Math.max(width - radius, 0)},${y + height} L ${x},${y + height} Z`}
                fill={`url(#hBarGrad-${index})`}
                style={{ filter: isActive ? `drop-shadow(0 0 8px ${meta.glow})` : "none", transition: "filter 0.2s ease" }}
            />
        </g>
    );
}

function CustomYTick({
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
    const label = payload.value.length > 12 ? `${payload.value.slice(0, 12)}…` : payload.value;
    return (
        <text x={x} y={y} dy={4} textAnchor="end" fontSize={11} fontWeight={600} fill={isDark ? "#cbd5e1" : "#334155"}>
            {label}
        </text>
    );
}

function BestEmployeesChartSkeleton() {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/8 dark:bg-slate-950">
            <div className="mb-3 flex items-start justify-between gap-3" dir="rtl">
                <div className="space-y-2">
                    <div className="h-4 w-36 animate-pulse rounded-full bg-gray-100 dark:bg-slate-900" />
                    <div className="h-3 w-24 animate-pulse rounded-full bg-gray-100/80 dark:bg-slate-900/60" />
                </div>
            </div>
            <div className="flex h-[200px] flex-col justify-between gap-3 px-2 py-2">
                {[85, 65, 72, 45, 55, 30].map((w, i) => (
                    <div key={i} className="h-5 animate-pulse rounded-full bg-gray-100 dark:bg-slate-900" style={{ width: `${w}%` }} />
                ))}
            </div>
        </div>
    );
}

export default function BestEmployeesChart({ items, loading }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [activeBar, setActiveBar] = useState<ActiveBar | null>(null);

    const data = useMemo(
        () =>
            items.slice(0, 6).map((item) => ({
                name: item.full_name,
                department: item.department_name,
                sold: item.sold,
            })),
        [items],
    );

    const handleMouseEnter = useCallback(
        (_: unknown, index: number) => {
            const item = data[index];
            if (!item) return;
            const meta = BAR_COLORS[index % BAR_COLORS.length];
            setActiveBar({ name: item.name, department: item.department, sold: item.sold, color: meta.color, glow: meta.glow, index });
        },
        [data],
    );

    const handleMouseLeave = useCallback(() => setActiveBar(null), []);

    const renderBarShape = useCallback(
        (props: unknown) => <CustomHBarShape {...(props as any)} activeIndex={activeBar?.index ?? null} />,
        [activeBar?.index],
    );

    const renderYTick = useCallback((props: unknown) => <CustomYTick {...(props as any)} isDark={isDark} />, [isDark]);

    if (loading) return <BestEmployeesChartSkeleton />;

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
                        style={{ background: isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)" }}
                    >
                        <Award size={15} className="text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">برترین کارمندان هر دپارتمان</h3>
                        <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">بر اساس فروش ثبت‌شده</p>
                    </div>
                </div>
            </div>

            <div className="absolute left-2 top-14 z-10 min-w-[160px]">
                <AnimatePresence mode="wait">
                    {activeBar && (
                        <motion.div
                            key={activeBar.index}
                            initial={{ opacity: 0, y: 4, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.96 }}
                            transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="pointer-events-none rounded-xl border border-gray-200/60 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/95"
                            style={{ boxShadow: `0 4px 20px ${activeBar.glow}` }}
                        >
                            <div className="mb-1 flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeBar.color, boxShadow: `0 0 6px ${activeBar.glow}` }} />
                                <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-100">{activeBar.name}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">{activeBar.department}</p>
                            <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                                فروش: <span className="font-bold tabular-nums" style={{ color: activeBar.color }}>{activeBar.sold.toLocaleString("fa-IR")}</span>
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
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                            barCategoryGap="22%"
                            onMouseLeave={handleMouseLeave}
                        >
                            <defs>
                                {BAR_COLORS.map((meta, i) => (
                                    <linearGradient key={i} id={`hBarGrad-${i}`} x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor={meta.color} stopOpacity={0.65} />
                                        <stop offset="100%" stopColor={meta.color} stopOpacity={1} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={renderYTick} width={90} />
                            <Bar dataKey="sold" shape={renderBarShape} onMouseEnter={handleMouseEnter} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </motion.div>
    );
}