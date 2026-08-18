"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, TrendingDown, Award } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";

interface ScoreData {
    employee: number;
    score: number;
    total_deducted: number;
}

interface ScoreCardProps {
    employeeId: number;
    employeeName?: string;
}

const SCORE_TIERS = [
    { min: 90, label: "عالی", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    { min: 70, label: "خوب", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
    { min: 50, label: "متوسط", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    { min: 0, label: "نیاز به بهبود", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
];

function getTier(score: number) {
    return SCORE_TIERS.find((t) => score >= t.min) ?? SCORE_TIERS[SCORE_TIERS.length - 1];
}

export default function ScoreCard({ employeeId, employeeName }: ScoreCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [data, setData] = useState<ScoreData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError(false);

        axiosInstance
            .get<ScoreData>(`/score/api/v1/employees/${employeeId}/`)
            .then(({ data: res }) => {
                if (alive) setData(res);
            })
            .catch(() => {
                if (alive) setError(true);
            })
            .finally(() => {
                if (alive) setLoading(false);
            });

        return () => { alive = false; };
    }, [employeeId]);

    const border = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const surface = isDark ? "rgba(255,255,255,0.02)" : "#fafafa";

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="relative rounded-2xl p-5 flex flex-col gap-4 overflow-hidden"
            style={{ border: `1px solid ${border}`, background: surface }}
            dir="rtl"
        >
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                    <p className="text-[13px] font-extrabold text-gray-800 dark:text-gray-100">
                        امتیاز عملکرد
                    </p>
                    {employeeName && (
                        <p className="text-[11.5px] text-gray-400 dark:text-gray-500">{employeeName}</p>
                    )}
                </div>
                <div
                    className="w-9 h-9 rounded-2xl flex items-center justify-center"
                    style={{ background: isDark ? "rgba(234,179,8,0.12)" : "rgba(234,179,8,0.08)" }}
                >
                    <Star size={16} fill="#facc15" color="#facc15" strokeWidth={0} />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-20">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-5 h-5 rounded-full border-2 border-transparent"
                        style={{
                            borderTopColor: isDark ? "#a5b4fc" : "#6366f1",
                            borderRightColor: isDark ? "rgba(165,180,252,0.3)" : "rgba(99,102,241,0.2)",
                        }}
                    />
                </div>
            ) : error || !data ? (
                <div className="flex items-center justify-center h-20">
                    <p className="text-[12px] text-red-400">خطا در دریافت امتیاز</p>
                </div>
            ) : (
                <ScoreBody data={data} isDark={isDark} />
            )}
        </motion.div>
    );
}

function ScoreBody({ data, isDark }: { data: ScoreData; isDark: boolean }) {
    const tier = getTier(data.score);
    const pct = Math.min(100, Math.max(0, data.score));

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-end gap-3">
                <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="text-[22px] font-black leading-none tracking-tight"
                    style={{ color: tier.color }}
                >
                    {data.score}
                </motion.span>
                <div className="flex flex-col gap-1 pb-1">
                    <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: tier.bg, color: tier.color }}
                    >
                        {tier.label}
                    </span>
                    <span className="text-[10.5px] text-gray-400 dark:text-gray-500">از ۱۰۰</span>
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <div
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
                >
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
                        className="h-full rounded-full"
                        style={{
                            background: `linear-gradient(90deg, ${tier.color}cc, ${tier.color})`,
                        }}
                    />
                </div>
            </div>

            <div
                className="grid grid-cols-2 gap-2 pt-1 border-t"
                style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}
            >
                <StatChip
                    icon={<Award size={12} />}
                    label="امتیاز کسب‌شده"
                    value={data.score}
                    color="#22c55e"
                    bg={isDark ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.07)"}
                    isDark={isDark}
                />
                <StatChip
                    icon={<TrendingDown size={12} />}
                    label="کسر شده"
                    value={data.total_deducted}
                    color="#ef4444"
                    bg={isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.07)"}
                    isDark={isDark}
                />
            </div>
        </div>
    );
}

function StatChip({
    icon,
    label,
    value,
    color,
    bg,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
    bg: string;
    isDark: boolean;
}) {
    return (
        <div
            className="flex flex-col gap-1 rounded-xl px-3 py-2.5"
            style={{ background: bg }}
        >
            <div className="flex items-center gap-1.5" style={{ color }}>
                {icon}
                <span className="text-[10.5px] font-semibold">{label}</span>
            </div>
            <span className="text-[16px] font-extrabold" style={{ color }}>
                {value}
            </span>
        </div>
    );
}
