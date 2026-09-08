"use client";

import {
    AlertTriangle,
    CheckCircle2,
    ClipboardList,
    Clock3,
    PackageCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

interface Props {
    pending: number;
    active: number;
    completed: number;
    criticalStock: number;
    totalTasks: number;
}

export default function WarehouseEmployeeStats({
    pending,
    active,
    completed,
    criticalStock,
    totalTasks,
}: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const items = [
        {
            title: "کل وظایف",
            value: totalTasks,
            icon: ClipboardList,
            tone: isDark ? "text-white" : "text-gray-900",
            bg: isDark ? "bg-white/[0.06]" : "bg-gray-100",
        },
        {
            title: "در انتظار",
            value: pending,
            icon: Clock3,
            tone: "text-amber-400",
            bg: "bg-amber-400/10",
        },
        {
            title: "در حال انجام",
            value: active,
            icon: PackageCheck,
            tone: "text-indigo-400",
            bg: "bg-indigo-400/10",
        },
        {
            title: "تکمیل شده",
            value: completed,
            icon: CheckCircle2,
            tone: "text-emerald-400",
            bg: "bg-emerald-400/10",
        },
        {
            title: "موجودی بحرانی",
            value: criticalStock,
            icon: AlertTriangle,
            tone: "text-red-400",
            bg: "bg-red-400/10",
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((item, index) => {
                const Icon = item.icon;

                return (
                    <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="rounded-2xl border p-4"
                        style={{
                            borderColor: isDark
                                ? "rgba(255,255,255,0.07)"
                                : "rgba(15,23,42,0.07)",
                            background: isDark ? "#101114" : "#f8fafc",
                        }}
                    >
                        <div
                            className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${item.bg}`}
                        >
                            <Icon className={`h-5 w-5 ${item.tone}`} />
                        </div>

                        <p
                            className="text-xs"
                            style={{
                                color: isDark
                                    ? "rgba(255,255,255,0.4)"
                                    : "#94a3b8",
                            }}
                        >
                            {item.title}
                        </p>

                        <p className={`mt-1 text-xl font-bold ${item.tone}`}>
                            {item.value.toLocaleString("fa-IR")}
                        </p>
                    </motion.div>
                );
            })}
        </div>
    );
}