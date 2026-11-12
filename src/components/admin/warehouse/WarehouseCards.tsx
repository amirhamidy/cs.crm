"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    BellRing,
    Boxes,
    ChevronLeft,
    ChevronRight,
    Package,
    ShieldCheck,
} from "lucide-react";

import {
    formatDate,
    formatNumber,
    getDeadlineDate,
    getQuantityFromStock,
    getStockProductName,
} from "@/utils/warehouseEmployee";
import type { ApiOrderTaskDeadline, ApiStockInfo } from "@/types/warehouse";

export const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#ec4899", "#8b5cf6"],
    ["#06b6d4", "#3b82f6"],
    ["#10b981", "#14b8a6"],
    ["#f59e0b", "#ef4444"],
] as const;

export const cardBg = (dark: boolean) =>
    dark ? "rgba(255,255,255,0.03)" : "#fafafa";

export const cardBorder = (dark: boolean) =>
    dark
        ? "1px solid rgba(255,255,255,0.06)"
        : "1px solid rgba(15,23,42,0.06)";

export const cardShadow = (dark: boolean) =>
    dark
        ? "0 8px 30px rgba(0,0,0,0.22)"
        : "0 8px 24px rgba(15,23,42,0.05)";

export const muted = (dark: boolean) =>
    dark ? "#94a3b8" : "#64748b";

type StockLevel = "critical" | "low" | "medium" | "good";

const STOCK_LEVEL_LABELS: Record<StockLevel, string> = {
    critical: "نیاز به تامین",
    low: "موجودی کم",
    medium: "متوسط",
    good: "مناسب",
};

function getStockLevel(
    current: number,
    minimum: number,
    percentage: number,
): StockLevel {
    if (current <= minimum) return "critical";
    if (percentage < 40) return "low";
    if (percentage < 80) return "medium";
    return "good";
}

function getStockColors(level: StockLevel, dark: boolean) {
    if (level === "good") {
        return {
            gradient: ["#4ade80", "#10b981"],
            text: dark ? "#6ee7b7" : "#10b981",
            ring: "#10b981",
            glow: "#10b981",
            badgeBg: dark
                ? "rgba(16,185,129,.14)"
                : "rgba(16,185,129,.1)",
        };
    }

    if (level === "medium") {
        return {
            gradient: ["#facc15", "#22c55e"],
            text: dark ? "#fde047" : "#ca8a04",
            ring: "#eab308",
            glow: "#eab308",
            badgeBg: dark
                ? "rgba(234,179,8,.14)"
                : "rgba(234,179,8,.1)",
        };
    }

    return {
        gradient: ["#f97316", "#ef4444"],
        text: dark ? "#fca5a5" : "#ef4444",
        ring: "#ef4444",
        glow: "#ef4444",
        badgeBg: dark
            ? "rgba(239,68,68,.14)"
            : "rgba(239,68,68,.1)",
    };
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    isDark,
}: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isDark: boolean;
}) {
    if (totalPages <= 1) return null;

    const pages = Array.from(
        { length: Math.min(5, totalPages) },
        (_, index) =>
            totalPages <= 5
                ? index + 1
                : currentPage <= 3
                    ? index + 1
                    : currentPage >= totalPages - 2
                        ? totalPages - 4 + index
                        : currentPage - 2 + index,
    );

    const buttonStyle = {
        background: isDark
            ? "rgba(255,255,255,.04)"
            : "rgba(15,23,42,.04)",
        color: isDark ? "#94a3b8" : "#475569",
    };

    return (
        <div className="mt-5 flex items-center justify-center gap-1.5">
            <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl disabled:opacity-40"
                style={buttonStyle}
            >
                <ChevronRight size={15} />
            </button>

            {pages.map((page) => {
                const active = page === currentPage;

                return (
                    <button
                        key={page}
                        type="button"
                        onClick={() => onPageChange(page)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-[12px] font-extrabold"
                        style={{
                            background: active
                                ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                                : buttonStyle.background,
                            color: active ? "#fff" : buttonStyle.color,
                            boxShadow: active
                                ? "0 4px 12px rgba(99,102,241,.25)"
                                : "none",
                        }}
                    >
                        {page}
                    </button>
                );
            })}

            <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl disabled:opacity-40"
                style={buttonStyle}
            >
                <ChevronLeft size={15} />
            </button>
        </div>
    );
}

export function StockCard({
    stock,
    index,
    isDark,
    productNames,
    onViewLedger,
    onEditLimits,
}: {
    stock: ApiStockInfo;
    index: number;
    isDark: boolean;
    productNames?: Record<number, string>;
    onViewLedger?: (productId: number) => void;
    onEditLimits?: (stock: ApiStockInfo) => void;
}) {
    const [hovered, setHovered] = useState(false);

    const current = Number(
        stock.current_quantity ??
        getQuantityFromStock(stock) ??
        0,
    );
    const maximum = Number(stock.maximum_stock ?? 0);
    const minimum = Number(stock.minimum_stock ?? 0);
    const initial = Number(stock.initial_quantity ?? 0);

    const percentage =
        maximum > 0
            ? Math.min(100, Math.max(0, (current / maximum) * 100))
            : 0;

    const level = getStockLevel(current, minimum, percentage);
    const colors = getStockColors(level, isDark);
    const [start, end] =
        AVATAR_GRADIENTS[stock.id % AVATAR_GRADIENTS.length];

    const productName =
        (stock as any).product_name?.trim() ||
        productNames?.[stock.product]?.trim() ||
        getStockProductName(stock) ||
        `محصول #${stock.product ?? stock.id}`;

    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const offset =
        circumference - (percentage / 100) * circumference;
    const gradientId = `stock-ring-${stock.id}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, delay: index * 0.04 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            className="relative flex min-h-[240px] flex-col overflow-visible rounded-3xl p-4"
            style={{
                background: cardBg(isDark),
                border: cardBorder(isDark),
                boxShadow: cardShadow(isDark),
            }}
        >
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
                <defs>
                    <linearGradient
                        id={`stock-border-${stock.id}`}
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
                    fill="none"
                    stroke={`url(#stock-border-${stock.id})`}
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
                <div className="flex min-w-0 items-center gap-2.5">
                    <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[14px] font-extrabold text-white shadow-lg"
                        style={{
                            background: `linear-gradient(135deg,${start},${end})`,
                        }}
                    >
                        {productName.trim().charAt(0) || "؟"}
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                            {productName}
                        </h3>

                        <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] font-semibold text-gray-500 dark:text-gray-400">
                            <Boxes size={10} />
                            <span>موجودی #{stock.id}</span>

                            {stock.unit_label && (
                                <>
                                    <span className="text-gray-300 dark:text-white/20">
                                        ·
                                    </span>
                                    <span>{stock.unit_label}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <span
                    className="relative inline-flex shrink-0 items-center gap-1 rounded-xl px-2 py-1 text-[10.5px] font-extrabold"
                    style={{
                        background: colors.badgeBg,
                        color: colors.text,
                    }}
                >
                    {(level === "critical" || level === "low") && (
                        <span className="relative flex h-1.5 w-1.5">
                            <span
                                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                                style={{ background: colors.ring }}
                            />
                            <span
                                className="relative inline-flex h-1.5 w-1.5 rounded-full"
                                style={{ background: colors.ring }}
                            />
                        </span>
                    )}
                    {STOCK_LEVEL_LABELS[level]}
                </span>
            </div>

            <div className="relative z-[1] mt-4 flex items-center justify-center">
                <div className="relative">
                    <svg width="110" height="110" className="-rotate-90">
                        <defs>
                            <linearGradient
                                id={gradientId}
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                            >
                                <stop
                                    offset="0%"
                                    stopColor={colors.gradient[0]}
                                />
                                <stop
                                    offset="100%"
                                    stopColor={colors.gradient[1]}
                                />
                            </linearGradient>
                        </defs>

                        <circle
                            cx="55"
                            cy="55"
                            r={radius}
                            fill="none"
                            stroke={
                                isDark
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(15,23,42,0.06)"
                            }
                            strokeWidth="8"
                        />

                        <motion.circle
                            cx="55"
                            cy="55"
                            r={radius}
                            fill="none"
                            stroke={`url(#${gradientId})`}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{
                                strokeDashoffset: circumference,
                            }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{
                                duration: 1,
                                delay: index * 0.04 + 0.2,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            style={{
                                filter: `drop-shadow(0 0 6px ${colors.glow}60)`,
                            }}
                        />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p
                            className="text-[22px] font-black leading-none tracking-tight"
                            style={{ color: colors.text }}
                        >
                            {formatNumber(Math.round(percentage))}
                            <span className="text-[11px] font-bold">٪</span>
                        </p>

                        <p className="mt-1 text-[9.5px] font-bold text-gray-400 dark:text-white/40">
                            پرشدگی
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative z-[1] mt-3 flex items-center justify-center gap-2">
                <Package size={12} style={{ color: colors.text }} />
                <span className="text-[11px] font-bold text-gray-500 dark:text-white/50">
                    موجودی فعلی:
                </span>
                <span className="text-[14px] font-black text-gray-900 dark:text-white">
                    {formatNumber(current)}
                </span>
                <span className="text-[10.5px] font-bold text-gray-400 dark:text-white/40">
                    از {formatNumber(maximum)}
                </span>
            </div>

            <div className="relative z-[1] mt-3 grid grid-cols-3 gap-1.5">
                {[
                    {
                        icon: <ShieldCheck size={11} className="text-amber-500" />,
                        label: "حداقل",
                        value: minimum,
                        bg: "rgba(245,158,11,0.08)",
                    },
                    {
                        icon: <Boxes size={11} className="text-indigo-500" />,
                        label: "اولیه",
                        value: initial,
                        bg: "rgba(99,102,241,0.08)",
                    },
                    {
                        icon: <Boxes size={11} className="text-emerald-500" />,
                        label: "حداکثر",
                        value: maximum,
                        bg: "rgba(16,185,129,0.08)",
                    },
                ].map((item, index) => (
                    <div
                        key={index}
                        className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2"
                        style={{
                            background: isDark
                                ? item.bg
                                : item.bg.replace("0.08", "0.06"),
                        }}
                    >
                        {item.icon}
                        <p className="text-[9px] font-bold text-gray-500 dark:text-white/40">
                            {item.label}
                        </p>
                        <p className="text-[12px] font-black text-gray-800 dark:text-white">
                            {formatNumber(item.value)}
                        </p>
                    </div>
                ))}
            </div>

            {onEditLimits && (
                <button
                    type="button"
                    onClick={() => onEditLimits(stock)}
                    className="relative z-[1] mt-3 flex items-center justify-center gap-1.5 rounded-2xl py-2 text-[11px] font-extrabold text-amber-500 transition-colors hover:bg-amber-500/10"
                >
                    ویرایش حداقل و حداکثر
                </button>
            )}

            {onViewLedger && (
                <button
                    type="button"
                    onClick={() => onViewLedger(stock.product)}
                    className="relative z-[1] mt-3 flex items-center justify-center gap-1.5 rounded-2xl py-2 text-[11px] font-extrabold text-indigo-500 transition-colors hover:bg-indigo-500/10"
                >
                    مشاهده گردش کالا
                </button>
            )}
        </motion.div>
    );
}

export function DeadlineCard({
    deadline,
    orderTitle,
    index,
    isDark,
}: {
    deadline: ApiOrderTaskDeadline;
    orderTitle: string;
    index: number;
    isDark: boolean;
}) {
    const [hovered, setHovered] = useState(false);
    const [start, end] =
        AVATAR_GRADIENTS[deadline.id % AVATAR_GRADIENTS.length];

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
                background: cardBg(isDark),
                border: cardBorder(isDark),
                boxShadow: cardShadow(isDark),
            }}
        >
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
                <defs>
                    <linearGradient
                        id={`deadline-border-${deadline.id}`}
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
                    fill="none"
                    stroke={`url(#deadline-border-${deadline.id})`}
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
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[15px] font-extrabold text-white shadow-lg"
                    style={{
                        background: `linear-gradient(135deg,${start},${end})`,
                    }}
                >
                    {orderTitle.trim().charAt(0) || "؟"}
                </div>

                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                        {orderTitle}
                    </h3>

                    <div className="mt-1 flex items-center gap-1.5 text-[10.5px] font-semibold text-gray-500 dark:text-gray-400">
                        <Package size={10} />
                        <span>
                            سفارش داخلی #{deadline.order_task ?? "—"}
                        </span>
                    </div>

                    <div className="mt-2">
                        <span
                            className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[10.5px] font-extrabold"
                            style={{
                                background: isDark
                                    ? "rgba(99,102,241,0.12)"
                                    : "rgba(99,102,241,0.08)",
                                color: isDark ? "#a5b4fc" : "#6366f1",
                            }}
                        >
                            <BellRing size={10} />
                            مهلت: {formatDate(getDeadlineDate(deadline))}
                        </span>
                    </div>
                </div>
            </div>

            <div
                className="relative z-[1] mt-4 flex items-center justify-between rounded-2xl px-3 py-2.5"
                style={{
                    background: isDark
                        ? "rgba(99,102,241,0.08)"
                        : "rgba(99,102,241,0.05)",
                }}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,0.14)"
                                : "rgba(99,102,241,0.1)",
                        }}
                    >
                        <BellRing size={12} className="text-indigo-500" />
                    </div>

                    <div>
                        <p className="text-[9.5px] font-bold text-gray-400 dark:text-white/40">
                            زمان باقی‌مانده
                        </p>
                        <p className="text-[12px] font-black text-gray-900 dark:text-white">
                            {formatDate(getDeadlineDate(deadline))}
                        </p>
                    </div>
                </div>

                <div className="text-left">
                    <p className="text-[9.5px] font-bold text-gray-400 dark:text-white/40">
                        وضعیت
                    </p>
                    <p className="text-[11.5px] font-extrabold text-indigo-500">
                        در انتظار
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
