// src/components/admin/performance/KpiCards.tsx
"use client";
import { motion } from "framer-motion";
import { TrendingUp, Users, CheckCircle, XCircle } from "lucide-react";
import type { TaskStatusOverview, EmployeeRankItem } from "@/hooks/useAnalytics";

interface Props {
    overview: TaskStatusOverview;
    employees: EmployeeRankItem[];
    loading: boolean;
}

export default function KpiCards({ overview, employees, loading }: Props) {
    const totalSold = overview.sold;
    const totalActive = employees.length;
    const topEmployee = employees[0];
    const cancelRate =
        overview.sold + overview.cancelled > 0
            ? Math.round((overview.cancelled / (overview.sold + overview.cancelled)) * 100)
            : 0;

    const cards = [
        {
            label: "فروش موفق",
            value: totalSold,
            icon: TrendingUp,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
        },
        {
            label: "کارمندان فعال",
            value: totalActive,
            icon: Users,
            color: "text-indigo-400",
            bg: "bg-indigo-500/10",
            border: "border-indigo-500/20",
        },
        {
            label: "بهترین کارمند",
            value: topEmployee?.full_name ?? "—",
            sub: topEmployee ? `${topEmployee.actual} فروش` : undefined,
            icon: CheckCircle,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
        },
        {
            label: "نرخ لغو",
            value: `${cancelRate}%`,
            icon: XCircle,
            color: "text-rose-400",
            bg: "bg-rose-500/10",
            border: "border-rose-500/20",
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" dir="rtl">
            {cards.map((card, i) => (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className={`rounded-2xl border ${card.border} ${card.bg} p-5 flex flex-col gap-3`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400">{card.label}</span>
                        <card.icon size={16} className={card.color} />
                    </div>
                    {loading ? (
                        <div className="h-7 w-20 rounded-lg bg-white/5 animate-pulse" />
                    ) : (
                        <div>
                            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                            {card.sub && <p className="text-xs text-zinc-500 mt-0.5">{card.sub}</p>}
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}
