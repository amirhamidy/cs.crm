"use client";

import { useMemo, useState } from "react";
import { Boxes, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { ApiStockInfo } from "@/types/warehouse";
import {
    matchesSearch,
    getStockProductName,
    formatNumber,
} from "@/utils/warehouseEmployee";

interface Props {
    stockInfos: ApiStockInfo[];
}

export default function WarehouseEmployeeStock({ stockInfos }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [search, setSearch] = useState("");

    const filtered = useMemo(
        () =>
            stockInfos.filter((stock) => {
                const data = stock as unknown as Record<string, unknown>;

                return matchesSearch(
                    [
                        data.id,
                        data.code,
                        data.unit,
                        data.unit_name,
                        getStockProductName(stock),
                    ],
                    search
                );
            }),
        [stockInfos, search]
    );

    const textColor = isDark ? "#ffffff" : "#1e293b";
    const mutedText = isDark ? "rgba(255,255,255,0.4)" : "#94a3b8";

    return (
        <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2
                        className="flex items-center gap-2 text-base font-bold"
                        style={{ color: textColor }}
                    >
                        <Boxes className="h-5 w-5 text-indigo-400" />
                        موجودی انبار
                    </h2>

                    <p
                        className="mt-1 text-xs"
                        style={{ color: mutedText }}
                    >
                        وضعیت لحظه‌ای موجودی کالاها
                    </p>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search
                        className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                        style={{ color: mutedText }}
                    />

                    <input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                        }}
                        placeholder="جستجوی کالا..."
                        className="h-11 w-full rounded-xl border pr-10 pl-3 text-sm outline-none"
                        style={{
                            borderColor: isDark
                                ? "rgba(255,255,255,0.07)"
                                : "rgba(15,23,42,0.07)",
                            background: isDark
                                ? "rgba(255,255,255,0.03)"
                                : "rgba(15,23,42,0.03)",
                            color: textColor,
                        }}
                    />
                </div>
            </div>

            {filtered.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    {filtered.map((stock, index) => {
                        const data =
                            stock as unknown as Record<string, unknown>;

                        const current = Number(
                            data.current_quantity ??
                            data.quantity ??
                            data.stock ??
                            0
                        );

                        const maximum = Number(
                            data.maximum_stock ??
                            data.maximum_quantity ??
                            data.max_quantity ??
                            data.max_stock ??
                            0
                        );

                        const minimum = Number(
                            data.minimum_stock ??
                            data.minimum_quantity ??
                            data.min_quantity ??
                            data.min_stock ??
                            0
                        );

                        const percentage =
                            maximum > 0
                                ? Math.min(
                                    Math.max(
                                        (current / maximum) * 100,
                                        0
                                    ),
                                    100
                                )
                                : 0;

                        const isCritical = current <= minimum;

                        return (
                            <motion.div
                                key={String(data.id)}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.2,
                                    delay: index * 0.04,
                                }}
                                className="relative rounded-2xl border p-4 transition hover:border-indigo-200/50"
                                style={{
                                    borderColor: isDark
                                        ? "rgba(255,255,255,0.07)"
                                        : "rgba(15,23,42,0.07)",
                                    background: isDark
                                        ? "#0f172a"
                                        : "#f8fafc",
                                }}
                            >
                                <svg className="pointer-events-none absolute inset-0 h-full w-full">
                                    <defs>
                                        <linearGradient
                                            id={`stock-border-${String(data.id)}`}
                                            x1="100%"
                                            y1="100%"
                                            x2="0%"
                                            y2="0%"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#6366f1"
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="#8b5cf6"
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
                                        stroke={`url(#stock-border-${String(data.id)})`}
                                        strokeWidth="1.4"
                                        initial={{
                                            pathLength: 0,
                                            opacity: 0,
                                        }}
                                        whileHover={{
                                            pathLength: 1,
                                            opacity: 1,
                                        }}
                                        transition={{
                                            duration: 0.45,
                                            ease: "easeInOut",
                                        }}
                                    />
                                </svg>

                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-400">
                                        <Boxes className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p
                                                    className="truncate text-sm font-bold"
                                                    style={{
                                                        color: textColor,
                                                    }}
                                                >
                                                    {getStockProductName(stock)}
                                                </p>

                                                {data.code != null && (
                                                    <p
                                                        className="mt-1 text-[10px]"
                                                        style={{
                                                            color: mutedText,
                                                        }}
                                                    >
                                                        {String(data.code)}
                                                    </p>
                                                )}
                                            </div>

                                            <span
                                                className={`shrink-0 rounded-full border px-2 py-1 text-[10px] ${isCritical
                                                        ? "border-red-400/15 bg-red-400/10 text-red-300"
                                                        : "border-emerald-400/15 bg-emerald-400/10 text-emerald-300"
                                                    }`}
                                            >
                                                {isCritical
                                                    ? "بحرانی"
                                                    : "موجود"}
                                            </span>
                                        </div>

                                        <div className="mt-4 flex items-end justify-between">
                                            <div>
                                                <p
                                                    className="text-[10px]"
                                                    style={{
                                                        color: mutedText,
                                                    }}
                                                >
                                                    موجودی فعلی
                                                </p>

                                                <p
                                                    className="mt-1 text-xl font-bold"
                                                    style={{
                                                        color: textColor,
                                                    }}
                                                >
                                                    {formatNumber(current)}
                                                </p>
                                            </div>

                                            <div className="text-left">
                                                <p
                                                    className="text-[10px]"
                                                    style={{
                                                        color: mutedText,
                                                    }}
                                                >
                                                    ظرفیت
                                                </p>

                                                <p
                                                    className="mt-1 text-xs"
                                                    style={{
                                                        color: isDark
                                                            ? "rgba(255,255,255,0.55)"
                                                            : "#64748b",
                                                    }}
                                                >
                                                    {maximum > 0
                                                        ? formatNumber(
                                                            maximum
                                                        )
                                                        : "نامشخص"}
                                                </p>
                                            </div>
                                        </div>

                                        <div
                                            className="mt-4 h-2 overflow-hidden rounded-full"
                                            style={{
                                                background: isDark
                                                    ? "rgba(255,255,255,0.06)"
                                                    : "rgba(15,23,42,0.06)",
                                            }}
                                        >
                                            <div
                                                className={`h-full rounded-full transition-all ${isCritical
                                                        ? "bg-red-400"
                                                        : "bg-indigo-400"
                                                    }`}
                                                style={{
                                                    width: `${percentage}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div
                    className="rounded-2xl border border-dashed px-6 py-14 text-center"
                    style={{
                        borderColor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(15,23,42,0.08)",
                        background: isDark ? "#0f172a" : "#f8fafc",
                    }}
                >
                    <Boxes
                        className="mx-auto h-9 w-9"
                        style={{ color: mutedText }}
                    />

                    <p
                        className="mt-3 text-sm"
                        style={{
                            color: isDark
                                ? "rgba(255,255,255,0.45)"
                                : "#94a3b8",
                        }}
                    >
                        موجودی موردی پیدا نشد
                    </p>
                </div>
            )}
        </section>
    );
}