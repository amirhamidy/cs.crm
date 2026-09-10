"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
    ArrowDownLeft,
    ArrowUpRight,
    ReceiptText,
    Search,
    User,
    CalendarDays,
    AlertCircle,
    ArrowLeft,
} from "lucide-react";
import { ApiStockTransaction } from "@/types/warehouse";
import { formatDate, formatNumber, matchesSearch } from "@/utils/warehouseEmployee";

interface WarehouseEmployeeTransactionsProps {
    transactions: ApiStockTransaction[];
}

export default function WarehouseEmployeeTransactions({
    transactions,
}: WarehouseEmployeeTransactionsProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [search, setSearch] = useState("");
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    const filtered = useMemo(
        () =>
            transactions.filter((tx) =>
                matchesSearch(
                    [
                        tx.id,
                        tx.product_name,
                        tx.performed_by_name,
                        tx.transaction_type,
                        tx.transaction_type_display,
                        tx.note,
                        tx.stock_out_reason_display,
                    ],
                    search
                )
            ),
        [transactions, search]
    );

    return (
        <section className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                            background: isDark
                                ? "rgba(16,185,129,0.14)"
                                : "rgba(16,185,129,0.08)",
                        }}
                    >
                        <ReceiptText size={18} className="text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                            تراکنش‌های انبار
                        </h2>
                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
                            سوابق ورود، خروج و اصلاحات موجودی کالا
                        </p>
                    </div>
                </div>

                <div className="relative w-full sm:w-80">
                    <Search
                        className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                        size={16}
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="جستجو در نام کالا، کاربر یا نوع تراکنش..."
                        className="h-11 w-full rounded-2xl border border-gray-100 bg-gray-50 pr-10 pl-4 text-[13px] font-bold text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-500/50 dark:focus:bg-white/[0.05]"
                    />
                </div>
            </div>

            {filtered.length > 0 ? (
                <div className="grid gap-3">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((tx, index) => {
                            const isIn = tx.transaction_type === "stock_in";
                            const isHovered = hoveredId === tx.id;

                            return (
                                <motion.div
                                    key={tx.id}
                                    layout
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    transition={{
                                        duration: 0.2,
                                        delay: index * 0.03,
                                    }}
                                    onHoverStart={() => setHoveredId(tx.id)}
                                    onHoverEnd={() => setHoveredId(null)}
                                    className="relative overflow-visible rounded-3xl p-4"
                                    style={{
                                        background: isDark
                                            ? "rgba(255,255,255,0.03)"
                                            : "#fafafa",
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
                                                id={`tx-border-${tx.id}`}
                                                x1="100%"
                                                y1="100%"
                                                x2="0%"
                                                y2="0%"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor={
                                                        isIn ? "#10b981" : "#f43f5e"
                                                    }
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopColor={
                                                        isIn ? "#059669" : "#e11d48"
                                                    }
                                                />
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
                                            stroke={`url(#tx-border-${tx.id})`}
                                            strokeWidth="1.4"
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={
                                                isHovered
                                                    ? { pathLength: 1, opacity: 1 }
                                                    : { pathLength: 0, opacity: 0 }
                                            }
                                            transition={{
                                                duration: 0.45,
                                                ease: "easeInOut",
                                            }}
                                        />
                                    </svg>

                                    <div className="relative z-[1] flex items-start gap-3">
                                        <div
                                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                                            style={{
                                                background: isIn
                                                    ? isDark
                                                        ? "rgba(16,185,129,0.14)"
                                                        : "rgba(16,185,129,0.1)"
                                                    : isDark
                                                        ? "rgba(244,63,94,0.14)"
                                                        : "rgba(244,63,94,0.1)",
                                            }}
                                        >
                                            {isIn ? (
                                                <ArrowDownLeft
                                                    size={18}
                                                    className="text-emerald-500"
                                                />
                                            ) : (
                                                <ArrowUpRight
                                                    size={18}
                                                    className="text-rose-500"
                                                />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                                                        {tx.product_name}
                                                    </h3>
                                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                                        <span
                                                            className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10.5px] font-bold"
                                                            style={{
                                                                background: isIn
                                                                    ? isDark
                                                                        ? "rgba(16,185,129,0.12)"
                                                                        : "rgba(16,185,129,0.08)"
                                                                    : isDark
                                                                        ? "rgba(244,63,94,0.12)"
                                                                        : "rgba(244,63,94,0.08)",
                                                                color: isIn
                                                                    ? isDark
                                                                        ? "#6ee7b7"
                                                                        : "#059669"
                                                                    : isDark
                                                                        ? "#fda4af"
                                                                        : "#e11d48",
                                                            }}
                                                        >
                                                            {tx.transaction_type_display}
                                                        </span>
                                                        {tx.stock_out_reason_display && (
                                                            <span className="text-[10.5px] font-semibold text-gray-500 dark:text-gray-400">
                                                                · {tx.stock_out_reason_display}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="shrink-0 text-left">
                                                    <p
                                                        className="text-[15px] font-black tracking-tight"
                                                        style={{
                                                            color: isIn
                                                                ? "#10b981"
                                                                : "#f43f5e",
                                                        }}
                                                    >
                                                        {isIn ? "+" : "-"}
                                                        {formatNumber(tx.quantity_changed)}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                                                        تعداد
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                                <div className="rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.025]">
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-white/40">
                                                        موجودی قبل
                                                    </p>
                                                    <p className="mt-1 text-[12px] font-black text-gray-700 dark:text-gray-200">
                                                        {formatNumber(tx.quantity_before)}
                                                    </p>
                                                </div>

                                                <div className="relative rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.025]">
                                                    <div className="absolute left-0 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white p-0.5 shadow-sm dark:bg-[#0f172a] sm:flex">
                                                        <ArrowLeft
                                                            size={10}
                                                            className="text-gray-400"
                                                        />
                                                    </div>
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-white/40">
                                                        موجودی بعد
                                                    </p>
                                                    <p className="mt-1 text-[12px] font-black text-gray-900 dark:text-white">
                                                        {formatNumber(tx.quantity_after)}
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.025]">
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-white/40">
                                                        حداقل مجاز
                                                    </p>
                                                    <p className="mt-1 text-[12px] font-black text-amber-600 dark:text-amber-400">
                                                        {formatNumber(tx.minimum_stock)}
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.025]">
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-white/40">
                                                        حداکثر ظرفیت
                                                    </p>
                                                    <p className="mt-1 text-[12px] font-black text-indigo-600 dark:text-indigo-400">
                                                        {formatNumber(tx.maximum_stock)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-2.5 dark:border-white/[0.06]">
                                                <div className="flex items-center gap-1.5">
                                                    <User
                                                        size={11}
                                                        className="text-gray-400"
                                                    />
                                                    <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                                                        {tx.performed_by_name}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <CalendarDays
                                                        size={11}
                                                        className="text-gray-400"
                                                    />
                                                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                                                        {formatDate(tx.transaction_date)}
                                                    </span>
                                                </div>

                                                {tx.note && (
                                                    <div className="flex w-full items-start gap-1.5 rounded-xl bg-indigo-50 px-2.5 py-2 dark:bg-indigo-500/10">
                                                        <AlertCircle
                                                            size={11}
                                                            className="mt-0.5 shrink-0 text-indigo-500"
                                                        />
                                                        <span className="text-[11px] font-medium leading-5 text-indigo-700 dark:text-indigo-300">
                                                            {tx.note}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 px-6 py-16 dark:border-white/[0.08]"
                    style={{
                        background: isDark
                            ? "rgba(255,255,255,0.02)"
                            : "#fafafa",
                    }}
                >
                    <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl"
                        style={{
                            background: isDark
                                ? "rgba(148,163,184,0.1)"
                                : "rgba(148,163,184,0.08)",
                        }}
                    >
                        <ReceiptText
                            size={24}
                            className="text-gray-400 dark:text-gray-500"
                        />
                    </div>
                    <p className="mt-4 text-[13px] font-bold text-gray-900 dark:text-white">
                        تراکنشی یافت نشد
                    </p>
                    <p className="mt-1 text-[11.5px] text-gray-500 dark:text-gray-400">
                        {search
                            ? "نتیجه‌ای برای عبارت جستجو شده وجود ندارد"
                            : "هنوز هیچ تراکنشی در سیستم ثبت نشده است"}
                    </p>
                </motion.div>
            )}
        </section>
    );
}