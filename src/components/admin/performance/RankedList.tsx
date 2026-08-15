"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Loader } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface RankedItem {
    key: string;
    name: string;
    subtitle?: string;
    value: number;
    suffix?: string;
    accent?: string;
}

interface Props {
    icon: LucideIcon;
    title: string;
    caption?: string;
    items: RankedItem[];
    loading: boolean;
    valueLabel?: string;
}

const GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#3b82f6", "#6366f1"],
    ["#8b5cf6", "#ec4899"],
    ["#06b6d4", "#6366f1"],
    ["#f59e0b", "#ef4444"],
];

export default function RankedList({
    icon: Icon,
    title,
    caption,
    items,
    loading,
    valueLabel = "مقدار",
}: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const border = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const cardBg = isDark ? "rgba(255,255,255,0.03)" : "#fafafa";

    return (
        <div
            className="flex flex-col overflow-hidden rounded-2xl"
            style={{ border: `1px solid ${border}`, background: cardBg }}
        >
            <div
                className="flex items-center justify-between px-4 py-3.5"
                style={{ borderBottom: `1px solid ${border}` }}
            >
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex h-8 w-8 items-center justify-center rounded-xl"
                        style={{
                            background: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                        }}
                    >
                        <Icon size={15} className="text-indigo-500" />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                            {title}
                        </h3>
                        {caption && (
                            <p className="text-[10.5px] text-gray-400 dark:text-gray-500">{caption}</p>
                        )}
                    </div>
                </div>
                <span className="text-[10.5px] font-bold text-gray-400 dark:text-gray-500">
                    {valueLabel}
                </span>
            </div>

            <div className="flex flex-col divide-y" style={{ borderColor: border }}>
                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Loader size={18} className="animate-spin text-indigo-500" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex h-40 items-center justify-center">
                        <p className="text-[11.5px] text-gray-400 dark:text-gray-500">
                            داده‌ای در این بازه وجود ندارد
                        </p>
                    </div>
                ) : (
                    items.map((item, index) => {
                        const g = GRADIENTS[index % GRADIENTS.length];
                        return (
                            <motion.div
                                key={item.key}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                className="flex items-center gap-3 px-4 py-3"
                            >
                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold text-white"
                                    style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }}
                                >
                                    {index + 1}
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <p className="truncate text-[12.5px] font-bold text-gray-800 dark:text-gray-100">
                                        {item.name}
                                    </p>
                                    {item.subtitle && (
                                        <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">
                                            {item.subtitle}
                                        </p>
                                    )}
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                    <span
                                        className="text-[13px] font-extrabold"
                                        style={{ color: item.accent || (isDark ? "#c7d2fe" : "#6366f1") }}
                                    >
                                        {item.value}
                                    </span>
                                    {item.suffix && (
                                        <span className="text-[10.5px] text-gray-400 dark:text-gray-500">
                                            {item.suffix}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
