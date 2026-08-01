"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Users, TrendingUp, CheckSquare, Star, ChevronDown } from "lucide-react";

interface StatBreakdownItem {
    label: string;
    value: number | string;
}

interface StatItem {
    key: string;
    label: string;
    value: number;
    suffix: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    trend: string;
    breakdown: StatBreakdownItem[];
}

const STATS: StatItem[] = [
    {
        key: "customers",
        label: "مشتریان ثبت‌شده",
        value: 248,
        suffix: "",
        icon: Users,
        color: "#6366f1",
        bg: "rgba(99,102,241,0.1)",
        trend: "+12 این ماه",
        breakdown: [
            { label: "فعال", value: 182 },
            { label: "غیرفعال", value: 41 },
            { label: "جدید", value: 25 },
        ],
    },
    {
        key: "deals",
        label: "معاملات بسته‌شده",
        value: 84,
        suffix: "",
        icon: TrendingUp,
        color: "#22c55e",
        bg: "rgba(34,197,94,0.1)",
        trend: "+5 این ماه",
        breakdown: [
            { label: "موفق", value: 71 },
            { label: "ناموفق", value: 13 },
        ],
    },
    {
        key: "tasks",
        label: "وظایف تکمیل‌شده",
        value: 312,
        suffix: "",
        icon: CheckSquare,
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.1)",
        trend: "+28 این ماه",
        breakdown: [
            { label: "به موقع", value: 285 },
            { label: "با تأخیر", value: 27 },
        ],
    },
    {
        key: "performance",
        label: "امتیاز عملکرد",
        value: 97,
        suffix: "٪",
        icon: Star,
        color: "#ec4899",
        bg: "rgba(236,72,153,0.1)",
        trend: "بالاتر از میانگین",
        breakdown: [
            { label: "سرعت پاسخ", value: "98٪" },
            { label: "رضایت مشتری", value: "96٪" },
            { label: "دقت اطلاعات", value: "97٪" },
        ],
    },
];

function useCounter(target: number, duration = 1200) {
    const [count, setCount] = useState(0);
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;
        const steps = 40;
        const increment = target / steps;
        let current = 0;
        const interval = setInterval(() => {
            current += increment;
            if (current >= target) {
                setCount(target);
                clearInterval(interval);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);
        return () => clearInterval(interval);
    }, [target, duration]);

    return count;
}

function StatCard({ stat, isDark }: { stat: StatItem; isDark: boolean }) {
    const count = useCounter(stat.value);
    const [open, setOpen] = useState(false);
    const Icon = stat.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative rounded-xl border transition-all duration-200 cursor-pointer group"
            style={{
                background: isDark ? "rgba(255,255,255,0.02)" : "#fafafa",
                borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                boxShadow: open ? `0 0 0 2px ${stat.color}30` : "none",
            }}
            onClick={() => setOpen((v) => !v)}
            whileHover={{ scale: 1.01 }}
        >
            <div className="flex items-center gap-3 p-3.5">
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                    style={{ background: stat.bg }}
                >
                    <Icon size={16} style={{ color: stat.color }} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 leading-none mb-1 truncate">
                        {stat.label}
                    </p>
                    <div className="flex items-baseline gap-1">
                        <span
                            className="text-[22px] font-black leading-none tabular-nums"
                            style={{ color: stat.color }}
                        >
                            {count}
                        </span>
                        {stat.suffix && (
                            <span className="text-[14px] font-black" style={{ color: stat.color }}>
                                {stat.suffix}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                        style={{ background: stat.bg, color: stat.color }}
                    >
                        {stat.trend}
                    </span>
                    <ChevronDown
                        size={12}
                        className="text-gray-300 dark:text-gray-600 transition-transform duration-200"
                        style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                    />
                </div>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                    >
                        <div
                            className="mx-3 mb-3 rounded-lg p-2.5 space-y-1.5"
                            style={{ background: stat.bg }}
                        >
                            {stat.breakdown.map((b) => (
                                <div key={b.label} className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold" style={{ color: stat.color, opacity: 0.8 }}>
                                        {b.label}
                                    </span>
                                    <span className="text-[11px] font-black" style={{ color: stat.color }}>
                                        {b.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

interface ProfileQuickStatsProps {
    stats?: StatItem[];
    periodLabel?: string;
}

export default function ProfileQuickStats({
    stats = STATS,
    periodLabel = "۳۰ روز اخیر",
}: ProfileQuickStatsProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;

    return (
        <div
            className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/[0.06] p-4 space-y-3 overflow-auto"
            style={{
                boxShadow: isDark
                    ? "0 0 0 1px rgba(99,102,241,0.08), 0 4px 24px rgba(99,102,241,0.06)"
                    : "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
            }}
        >
            <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-black text-gray-700 dark:text-gray-300">آمار عملکرد</p>
                <span className="text-[10.5px] font-semibold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/[0.04] px-2 py-0.5 rounded-lg">
                    {periodLabel}
                </span>
            </div>
            {stats.map((stat) => (
                <StatCard key={stat.key} stat={stat} isDark={isDark} />
            ))}
        </div>
    );
}
