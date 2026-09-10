"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
    ArrowDownLeft,
    ArrowLeft,
    ArrowUpRight,
    CalendarDays,
    FileText,
    User,
} from "lucide-react";
import type { ApiStockTransaction } from "@/types/warehouse";

interface Props {
    transaction: ApiStockTransaction;
    index?: number;
}

const formatNumber = (value: number | null | undefined) =>
    new Intl.NumberFormat("fa-IR").format(Number(value ?? 0));

const formatDate = (value: string | null | undefined) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

export default function WarehouseEmployeeTransactionCard({
    transaction,
    index = 0,
}: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [hovered, setHovered] = useState(false);

    const isIn = transaction.transaction_type === "stock_in";
    const quantityChanged = Number(transaction.quantity_changed ?? 0);
    const quantityBefore = Number(transaction.quantity_before ?? 0);
    const quantityAfter = Number(transaction.quantity_after ?? 0);

    const accentColor = isIn ? "#10b981" : "#f43f5e";
    const accentBg = isIn
        ? isDark
            ? "rgba(16,185,129,0.14)"
            : "rgba(16,185,129,0.1)"
        : isDark
            ? "rgba(244,63,94,0.14)"
            : "rgba(244,63,94,0.1)";

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, delay: index * 0.04 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            className="relative flex min-h-[148px] flex-col justify-between overflow-visible rounded-3xl p-4"
            style={{
                background: isDark ? "rgba(255,255,255,0.03)" : "#fafafa",
                border: isDark
                    ? "1px solid rgba(255,255,255,0.06)"
                    : "1px solid rgba(15,23,42,0.06)",
                boxShadow: isDark
                    ? "0 8px 30px rgba(0,0,0,0.22)"
                    : "0 8px 24px rgba(15,23,42,0.05)",
            }}
        >
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
                <defs>
                    <linearGradient
                        id={`tx-border-${transaction.id}`}
                        x1="100%"
                        y1="100%"
                        x2="0%"
                        y2="0%"
                    >
                        <stop offset="0%" stopColor={isIn ? "#10b981" : "#f43f5e"} />
                        <stop offset="100%" stopColor={isIn ? "#059669" : "#e11d48"} />
                    </linearGradient>
                </defs>
                <motion.rect
                    x="1"
                    y="1"
                    width="calc(100% - 2px)"
                    height="calc(100% - 2px)"
                    rx="23"
                    ry="23"
                    fill="none"
                    stroke={`url(#tx-border-${transaction.id})`}
                    strokeWidth="1.4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={
                        hovered
                            ? { pathLength: 1, opacity: 1 }
                            : { pathLength: 0, opacity: 0 }
                    }
                    transition={{ duration: 0.45, ease: "easeInOut" }}
                />
            </svg>

            <div className="relative z-[1] flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                        style={{ background: accentBg }}
                    >
                        {isIn ? (
                            <ArrowDownLeft size={18} className="text-emerald-500" />
                        ) : (
                            <ArrowUpRight size={18} className="text-rose-500" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                            {transaction.product_name || "محصول نامشخص"}
                        </h3>
                        <div className="mt-1 flex items-center gap-2">
                            <span
                                className="inline-flex items-center gap-1 rounded-xl px-2 py-0.5 text-[10.5px] font-extrabold"
                                style={{
                                    background: accentBg,
                                    color: isIn ? "#059669" : "#e11d48",
                                }}
                            >
                                {transaction.transaction_type_display || "تراکنش"}
                            </span>
                            {transaction.stock_out_reason_display && (
                                <span className="text-[10.5px] font-semibold text-gray-500 dark:text-gray-400">
                                    · {transaction.stock_out_reason_display}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="shrink-0 text-left">
                    <p
                        className="text-[16px] font-black tracking-tight"
                        style={{ color: accentColor }}
                    >
                        {isIn ? "+" : "-"}
                        {formatNumber(quantityChanged)}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                        تعداد
                    </p>
                </div>
            </div>

            <div className="relative z-[1] mt-4 flex items-center justify-center gap-3 rounded-2xl bg-gray-50 px-3 py-3 dark:bg-white/[0.025]">
                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold text-gray-400 dark:text-white/40">
                        موجودی قبل
                    </span>
                    <span className="mt-0.5 text-[13px] font-black text-gray-700 dark:text-gray-200">
                        {formatNumber(quantityBefore)}
                    </span>
                </div>

                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white shadow-sm dark:bg-[#0f172a]">
                    <ArrowLeft size={11} className="text-gray-400" />
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold text-gray-400 dark:text-white/40">
                        موجودی بعد
                    </span>
                    <span
                        className="mt-0.5 text-[13px] font-black"
                        style={{ color: accentColor }}
                    >
                        {formatNumber(quantityAfter)}
                    </span>
                </div>

                <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-white/10" />

                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold text-gray-400 dark:text-white/40">
                        حداقل
                    </span>
                    <span className="mt-0.5 text-[12px] font-black text-amber-600 dark:text-amber-400">
                        {formatNumber(transaction.minimum_stock)}
                    </span>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold text-gray-400 dark:text-white/40">
                        حداکثر
                    </span>
                    <span className="mt-0.5 text-[12px] font-black text-indigo-600 dark:text-indigo-400">
                        {formatNumber(transaction.maximum_stock)}
                    </span>
                </div>
            </div>

            <div className="relative z-[1] mt-3 flex flex-col gap-2 border-t border-gray-100 pt-2.5 dark:border-white/[0.06]">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex items-center gap-1.5">
                        <User size={11} className="text-gray-400" />
                        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                            {transaction.performed_by_name || "نامشخص"}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <CalendarDays size={11} className="text-gray-400" />
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                            {formatDate(transaction.transaction_date)}
                        </span>
                    </div>
                </div>

                {transaction.note && (
                    <div className="flex items-start gap-1.5 rounded-xl bg-indigo-50 px-2.5 py-2 dark:bg-indigo-500/10">
                        <FileText size={11} className="mt-0.5 shrink-0 text-indigo-500" />
                        <span className="text-[11px] font-medium leading-5 text-indigo-700 dark:text-indigo-300">
                            {transaction.note}
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}