"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
    ReceiptText,
    User,
    CalendarDays,
    Package,
    ArrowLeft,
    Hash,
    CheckCircle2,
} from "lucide-react";
import {
    formatDate,
    formatNumber,
    getStatusLabel,
    getStatusTone,
    type SalesInvoice,
} from "@/utils/warehouseEmployee";

interface Props {
    invoice: SalesInvoice;
    index: number;
    onOpen: (invoice: SalesInvoice) => void;
}

export default function OrderInvoiceCard({ invoice, index, onOpen }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [hovered, setHovered] = useState(false);

    const tone = getStatusTone(invoice.status);
    const statusColors = {
        success: {
            bg: isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)",
            text: isDark ? "#6ee7b7" : "#059669",
        },
        warning: {
            bg: isDark ? "rgba(234,179,8,0.12)" : "rgba(234,179,8,0.08)",
            text: isDark ? "#fde047" : "#ca8a04",
        },
        danger: {
            bg: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
            text: isDark ? "#fca5a5" : "#dc2626",
        },
        neutral: {
            bg: isDark ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.08)",
            text: isDark ? "#cbd5e1" : "#475569",
        },
    }[tone];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, delay: index * 0.04 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            onClick={() => onOpen(invoice)}
            className="relative flex cursor-pointer flex-col justify-between overflow-visible rounded-3xl p-4"
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
                        id={`inv-border-${invoice.orderTaskId}`}
                        x1="100%"
                        y1="100%"
                        x2="0%"
                        y2="0%"
                    >
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
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
                    stroke={`url(#inv-border-${invoice.orderTaskId})`}
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

            <div className="relative z-[1] flex items-start gap-3">
                <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                        background: isDark
                            ? "rgba(99,102,241,0.14)"
                            : "rgba(99,102,241,0.08)",
                    }}
                >
                    <ReceiptText size={18} className="text-indigo-500" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                                {invoice.invoiceNumber}
                            </h3>
                            <p className="mt-1 truncate text-[11.5px] font-bold text-gray-500 dark:text-gray-400">
                                {invoice.customerName}
                            </p>
                        </div>
                        <span
                            className="shrink-0 rounded-xl px-2 py-1 text-[10.5px] font-extrabold"
                            style={{ background: statusColors.bg, color: statusColors.text }}
                        >
                            {getStatusLabel(invoice.status)}
                        </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <div className="flex items-center gap-1.5">
                            <User size={11} className="text-gray-400" />
                            <span className="text-[10.5px] font-semibold text-gray-600 dark:text-gray-300">
                                {invoice.departmentName}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CalendarDays size={11} className="text-gray-400" />
                            <span className="text-[10.5px] font-semibold text-gray-500 dark:text-gray-400">
                                {formatDate(invoice.archivedAt)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {invoice.title && invoice.title !== "—" && (
                <div
                    className="relative z-[1] mt-3 rounded-2xl px-3 py-2"
                    style={{
                        background: isDark
                            ? "rgba(255,255,255,0.025)"
                            : "rgba(15,23,42,0.025)",
                    }}
                >
                    <p className="line-clamp-1 text-[11px] font-bold text-gray-600 dark:text-gray-300">
                        {invoice.title}
                    </p>
                </div>
            )}

            <div className="relative z-[1] mt-3 grid grid-cols-3 gap-2">
                <div
                    className="flex flex-col items-center rounded-2xl px-2 py-2"
                    style={{
                        background: isDark
                            ? "rgba(99,102,241,0.08)"
                            : "rgba(99,102,241,0.05)",
                    }}
                >
                    <Package size={11} className="text-indigo-500" />
                    <p className="mt-1 text-[9px] font-bold text-gray-500 dark:text-white/40">
                        تعداد کل
                    </p>
                    <p className="text-[12px] font-black text-gray-900 dark:text-white">
                        {formatNumber(invoice.totalQuantity)}
                    </p>
                </div>

                <div
                    className="flex flex-col items-center rounded-2xl px-2 py-2"
                    style={{
                        background: isDark
                            ? "rgba(6,182,212,0.08)"
                            : "rgba(6,182,212,0.05)",
                    }}
                >
                    <Hash size={11} className="text-cyan-500" />
                    <p className="mt-1 text-[9px] font-bold text-gray-500 dark:text-white/40">
                        تعداد ردیف
                    </p>
                    <p className="text-[12px] font-black text-cyan-600 dark:text-cyan-400">
                        {formatNumber(invoice.lines.length)}
                    </p>
                </div>

                <div
                    className="flex flex-col items-center rounded-2xl px-2 py-2"
                    style={{
                        background: isDark
                            ? "rgba(16,185,129,0.08)"
                            : "rgba(16,185,129,0.05)",
                    }}
                >
                    <CheckCircle2 size={11} className="text-emerald-500" />
                    <p className="mt-1 text-[9px] font-bold text-gray-500 dark:text-white/40">
                        جمع کل
                    </p>
                    <p className="text-[12px] font-black text-emerald-600 dark:text-emerald-400">
                        {formatNumber(invoice.total)}
                    </p>
                </div>
            </div>

            <div className="relative z-[1] mt-3 flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-2 dark:bg-white/[0.025]">
                <span className="text-[10.5px] font-bold text-gray-500 dark:text-gray-400">
                    مشاهده فاکتور کامل
                </span>
                <ArrowLeft size={13} className="text-indigo-500" />
            </div>
        </motion.div>
    );
}