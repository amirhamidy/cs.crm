"use client";

import {
    AlertTriangle,
    CheckCircle2,
    ClipboardList,
    Clock3,
    PackageCheck,
} from "lucide-react";
import { motion } from "framer-motion";

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
    const items = [
        {
            title: "کل وظایف",
            value: totalTasks,
            icon: ClipboardList,
            tone: "text-white",
            bg: "bg-white/[0.06]",
        },
        {
            title: "در انتظار",
            value: pending,
            icon: Clock3,
            tone: "text-amber-300",
            bg: "bg-amber-400/10",
        },
        {
            title: "در حال انجام",
            value: active,
            icon: PackageCheck,
            tone: "text-blue-300",
            bg: "bg-blue-400/10",
        },
        {
            title: "تکمیل شده",
            value: completed,
            icon: CheckCircle2,
            tone: "text-emerald-300",
            bg: "bg-emerald-400/10",
        },
        {
            title: "موجودی بحرانی",
            value: criticalStock,
            icon: AlertTriangle,
            tone: "text-red-300",
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
                        className="rounded-2xl border border-white/[0.07] bg-[#101114] p-4"
                    >
                        <div
                            className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${item.bg}`}
                        >
                            <Icon className={`h-5 w-5 ${item.tone}`} />
                        </div>

                        <p className="text-xs text-white/40">
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