"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
    ComposedChart, Bar, Area,
    XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { TrendingUp, TrendingDown, Target, ChevronDown } from "lucide-react";
import { AnimatedChartTooltip } from "./ChartTooltip";
import { salesTargetData, periodLabels, type Period } from "@/data/charts";
import { CHART_COLORS, TREND_COLORS, TARGET_COLOR } from "@/data/constants";

type ActivePoint = {
    name: string;
    actual: number;
    target: number;
    index: number;
    color: string;
};

function formatK(val: number) {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toLocaleString("fa-IR");
}

export default function SalesTargetWidget() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [period, setPeriod] = useState<Period>("monthly");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [activePoint, setActivePoint] = useState<ActivePoint | null>(null);
    const setActivePointRef = useRef(setActivePoint);
    setActivePointRef.current = setActivePoint;

    useEffect(() => { setMounted(true); }, []);

    const dark = mounted ? resolvedTheme === "dark" : false;
    const data = salesTargetData[period];
    const totalActual = data.reduce((s, d) => s + d.actual, 0);
    const totalTarget = data.reduce((s, d) => s + d.target, 0);
    const progress = Math.min((totalActual / totalTarget) * 100, 100);
    const isAbove = totalActual >= totalTarget;

    const TooltipCapture = useCallback(({ active, payload, label }: any) => {
        if (active && payload?.length) {
            const idx = salesTargetData[period].findIndex((d) => d.name === label);
            const point: ActivePoint = {
                name: label,
                actual: payload.find((p: any) => p.dataKey === "actual")?.value ?? 0,
                target: payload.find((p: any) => p.dataKey === "target")?.value ?? 0,
                index: idx >= 0 ? idx : 0,
                color: CHART_COLORS[(idx >= 0 ? idx : 0) % CHART_COLORS.length],
            };
            setTimeout(() => setActivePointRef.current(point), 0);
        } else {
            setTimeout(() => setActivePointRef.current(null), 0);
        }
        return null;
    }, [period]);

    return (
        <div
            dir="rtl"
            className={`relative rounded-2xl overflow-visible p-5 border transition-colors duration-300 ${dark ? "bg-[#0f1117] border-white/[0.07]" : "bg-white border-slate-200"
                }`}
            style={{
                boxShadow: dark
                    ? "0 4px 24px rgba(0,0,0,0.4)"
                    : "0 2px 16px rgba(0,0,0,0.06)",
            }}
        >
            <div className="pointer-events-none absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl opacity-[0.12] bg-[#818cf8]" />

            <Header
                dark={dark}
                period={period}
                totalActual={totalActual}
                totalTarget={totalTarget}
                dropdownOpen={dropdownOpen}
                setDropdownOpen={setDropdownOpen}
                setPeriod={(p) => { setPeriod(p); setDropdownOpen(false); setActivePoint(null); }}
            />

            <ProgressBar dark={dark} progress={progress} isAbove={isAbove} />

            <div className="relative h-[188px]" onMouseLeave={() => setActivePoint(null)}>
                {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={data}
                            margin={{ top: 8, right: 2, left: -26, bottom: 0 }}
                            barCategoryGap="38%"
                            onMouseLeave={() => setActivePoint(null)}
                        >
                            <defs>
                                {CHART_COLORS.map((color, i) => (
                                    <linearGradient key={i} id={`stw-bar-${i}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                                        <stop offset="100%" stopColor={color} stopOpacity={0.35} />
                                    </linearGradient>
                                ))}
                                <linearGradient id="stw-area" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={TARGET_COLOR} stopOpacity={0.18} />
                                    <stop offset="100%" stopColor={TARGET_COLOR} stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid
                                vertical={false}
                                stroke={dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}
                                strokeDasharray="3 3"
                            />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 10, fill: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.38)", fontFamily: "inherit" }}
                                axisLine={false} tickLine={false} dy={6}
                            />
                            <YAxis
                                tickFormatter={formatK}
                                tick={{ fontSize: 10, fill: dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.32)", fontFamily: "inherit" }}
                                axisLine={false} tickLine={false} width={46}
                            />
                            <Tooltip
                                content={<TooltipCapture />}
                                cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", radius: 6 }}
                            />
                            <Bar dataKey="actual" radius={[5, 5, 2, 2]} maxBarSize={28} animationDuration={700} animationEasing="ease-out">
                                {data.map((_, i) => (
                                    <Cell
                                        key={i}
                                        fill={`url(#stw-bar-${i % CHART_COLORS.length})`}
                                        opacity={1}
                                    />
                                ))}
                            </Bar>
                            <Area
                                dataKey="target"
                                stroke={TARGET_COLOR}
                                strokeWidth={1.5}
                                strokeDasharray="5 4"
                                fill="url(#stw-area)"
                                dot={false}
                                activeDot={{ r: 4, fill: TARGET_COLOR, stroke: dark ? "#0f1117" : "#fff", strokeWidth: 2 }}
                                animationDuration={900}
                                animationEasing="ease-out"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <ChartSkeleton dark={dark} />
                )}

                <AnimatedChartTooltip
                    visible={!!activePoint}
                    animKey={activePoint?.index ?? "none"}
                    position="top-right"
                    dark={dark}
                    colorKey={activePoint?.color ?? ""}
                    glowColor={activePoint?.color}
                    title={activePoint?.name ?? ""}
                    rows={[
                        { dotStyle: "square", label: "فروش", value: formatK(activePoint?.actual ?? 0), color: activePoint?.color ?? "" },
                        { dotStyle: "dashed-circle", label: "تارگت", value: formatK(activePoint?.target ?? 0), color: TARGET_COLOR },
                    ]}
                    footer={activePoint ? {
                        label: "نسبت",
                        value: `${((activePoint.actual / activePoint.target) * 100).toFixed(0)}٪`,
                        valueColor: activePoint.actual >= activePoint.target ? TREND_COLORS.up : TREND_COLORS.down,
                    } : undefined}
                />
            </div>

            <Legend dark={dark} />
        </div>
    );
}

function Header({ dark, period, totalActual, totalTarget, dropdownOpen, setDropdownOpen, setPeriod }: {
    dark: boolean;
    period: Period;
    totalActual: number;
    totalTarget: number;
    dropdownOpen: boolean;
    setDropdownOpen: (v: boolean) => void;
    setPeriod: (p: Period) => void;
}) {
    return (
        <div className="relative flex items-start justify-between mb-5">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#818cf8]/10">
                        <Target size={14} className="text-[#818cf8]" />
                    </div>
                    <span className={`text-sm font-semibold ${dark ? "text-white/85" : "text-slate-700"}`}>
                        تارگت فروش
                    </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <motion.span
                        key={period + totalActual}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className={`text-2xl font-bold tabular-nums ${dark ? "text-white" : "text-slate-900"}`}
                    >
                        {totalActual >= 1000 ? `${(totalActual / 1000).toFixed(1)}k` : totalActual.toLocaleString("fa-IR")}
                    </motion.span>
                    <span className={`text-xs ${dark ? "text-white/25" : "text-slate-400"}`}>
                        / {totalTarget >= 1000 ? `${(totalTarget / 1000).toFixed(1)}k` : totalTarget.toLocaleString("fa-IR")}
                    </span>
                </div>
            </div>

            <div className="relative z-20">
                <motion.button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors duration-200 ${dark
                            ? "bg-white/[0.05] border-white/10 text-white/60 hover:bg-white/10"
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                        }`}
                >
                    {periodLabels[period]}
                    <motion.span animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="inline-flex">
                        <ChevronDown size={12} />
                    </motion.span>
                </motion.button>

                <AnimatePresence>
                    {dropdownOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.96 }}
                            transition={{ duration: 0.14 }}
                            className={`absolute left-0 top-full mt-1.5 rounded-xl overflow-hidden border min-w-[90px] ${dark
                                    ? "bg-[#13161e] border-white/10 shadow-lg shadow-black/40"
                                    : "bg-white border-slate-200 shadow-md"
                                }`}
                        >
                            {(["weekly", "monthly", "yearly"] as Period[]).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`w-full text-right px-3 py-2 text-xs transition-colors ${p === period
                                            ? dark ? "bg-[#818cf8]/15 text-[#818cf8] font-semibold" : "bg-[#818cf8]/10 text-[#6366f1] font-semibold"
                                            : dark ? "text-white/50 hover:bg-white/5 hover:text-white/80" : "text-slate-500 hover:bg-slate-50"
                                        }`}
                                >
                                    {periodLabels[p]}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function ProgressBar({ dark, progress, isAbove }: { dark: boolean; progress: number; isAbove: boolean }) {
    return (
        <div className="relative mb-5">
            <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[11px] ${dark ? "text-white/35" : "text-slate-400"}`}>پیشرفت تارگت</span>
                <div className="flex items-center gap-1">
                    {isAbove
                        ? <TrendingUp size={11} className="text-[#34d399]" />
                        : <TrendingDown size={11} className="text-[#f472b6]" />
                    }
                    <span className={`text-[11px] font-bold tabular-nums ${isAbove ? "text-[#34d399]" : "text-[#f472b6]"}`}>
                        {progress.toFixed(1)}٪
                    </span>
                </div>
            </div>
            <div className={`h-1.5 rounded-full overflow-hidden ${dark ? "bg-white/[0.06]" : "bg-slate-100"}`}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.9, ease: [0.34, 1.2, 0.64, 1] }}
                    className="h-full rounded-full relative overflow-hidden"
                    style={{ background: isAbove ? "linear-gradient(90deg,#34d399,#38bdf8)" : "linear-gradient(90deg,#818cf8,#f472b6)" }}
                >
                    <motion.div
                        className="absolute inset-0"
                        animate={{ x: ["-100%", "120%"] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                        style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)" }}
                    />
                </motion.div>
            </div>
        </div>
    );
}

function ChartSkeleton({ dark }: { dark: boolean }) {
    return (
        <div className="flex flex-col gap-3 pt-6 px-2">
            {[55, 80, 45, 70, 60].map((w, i) => (
                <div
                    key={i}
                    className={`h-1.5 rounded-full animate-pulse ${dark ? "bg-white/8" : "bg-slate-200"}`}
                    style={{ width: `${w}%` }}
                />
            ))}
        </div>
    );
}

function Legend({ dark }: { dark: boolean }) {
    return (
        <div className="flex items-center gap-4 mt-3 justify-end">
            <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                    {CHART_COLORS.map((c, i) => (
                        <div key={i} className="w-1.5 h-2 rounded-sm" style={{ background: c }} />
                    ))}
                </div>
                <span className={`text-[11px] ${dark ? "text-white/35" : "text-slate-400"}`}>فروش واقعی</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div
                    className="w-5 h-[2px] rounded-full"
                    style={{ background: "repeating-linear-gradient(90deg,#38bdf8 0,#38bdf8 4px,transparent 4px,transparent 8px)" }}
                />
                <span className={`text-[11px] ${dark ? "text-white/35" : "text-slate-400"}`}>تارگت</span>
            </div>
        </div>
    );
}
