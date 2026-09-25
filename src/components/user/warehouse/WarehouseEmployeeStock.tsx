"use client";

import { useMemo, useState } from "react";
import {
    AlertTriangle,
    Boxes,
    CheckCircle2,
    Package,
    Search,
    X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { ApiStockInfo } from "@/types/warehouse";
import { matchesSearch, formatNumber } from "@/utils/warehouseEmployee";

interface Props {
    stockInfos: ApiStockInfo[];
    /**
     * نقشه‌ی اختیاری برای نمایش نام محصول بر اساس productId
     * اگه والد پاس بده، به جای fallback استفاده می‌شه
     */
    productNames?: Record<number, string>;
}

type StockStatus = "critical" | "low" | "healthy";

const GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#3b82f6", "#6366f1"],
    ["#8b5cf6", "#ec4899"],
    ["#06b6d4", "#6366f1"],
    ["#10b981", "#14b8a6"],
    ["#f59e0b", "#ef4444"],
] as const;

function gradientOf(seed: number) {
    return GRADIENTS[Math.abs(seed) % GRADIENTS.length];
}

/* ────────────────────── استخراج نام محصول از هر شکلی ────────────────────── */
function extractProductName(
    stock: ApiStockInfo,
    productNames?: Record<number, string>
): string {
    const data = stock as unknown as Record<string, unknown>;

     const productId = Number(data.product ?? data.product_id);
    if (productNames && Number.isFinite(productId)) {
        const named = productNames[productId];
        if (named) return named;
    }

     const direct =
        data.product_name ??
        data.product_title ??
        data.name ??
        data.title;
    if (typeof direct === "string" && direct.trim()) return direct.trim();

     for (const key of ["product_detail", "product_obj", "product_data"]) {
        const nested = data[key];
        if (nested && typeof nested === "object") {
            const n = nested as Record<string, unknown>;
            const name = n.name ?? n.title;
            if (typeof name === "string" && name.trim()) return name.trim();
        }
    }

     if (Number.isFinite(productId)) return `محصول #${productId}`;
    return "محصول بدون نام";
}

/* ────────────────────── محاسبه‌ی وضعیت ────────────────────── */
function getStatus(current: number, minimum: number, maximum: number): StockStatus {
    if (minimum > 0 && current <= minimum) return "critical";
    if (maximum > 0 && current / maximum < 0.35) return "low";
    return "healthy";
}

const STATUS_STYLE: Record<
    StockStatus,
    { label: string; border: string; bg: string; text: string; icon: typeof AlertTriangle }
> = {
    critical: {
        label: "بحرانی",
        border: "border-red-400/20 dark:border-red-500/20",
        bg: "bg-red-50 dark:bg-red-500/10",
        text: "text-red-500 dark:text-red-400",
        icon: AlertTriangle,
    },
    low: {
        label: "کم",
        border: "border-amber-400/20 dark:border-amber-500/20",
        bg: "bg-amber-50 dark:bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-400",
        icon: AlertTriangle,
    },
    healthy: {
        label: "سالم",
        border: "border-emerald-400/20 dark:border-emerald-500/20",
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        text: "text-emerald-600 dark:text-emerald-400",
        icon: CheckCircle2,
    },
};

/* ============================== component ============================== */

export default function WarehouseEmployeeStock({
    stockInfos,
    productNames,
}: Props) {
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
                        extractProductName(stock, productNames),
                    ],
                    search
                );
            }),
        [stockInfos, search, productNames]
    );

    const textColor = isDark ? "#ffffff" : "#1e293b";
    const mutedText = isDark ? "rgba(255,255,255,0.4)" : "#94a3b8";

    return (
        <section className="space-y-4">
            {/* header + search */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                        <Boxes size={15} className="text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                            موجودی انبار
                        </h2>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                            {filtered.length} کالا • وضعیت لحظه‌ای موجودی
                        </p>
                    </div>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search
                        size={14}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="جستجوی کالا..."
                        className="h-11 w-full rounded-2xl border border-gray-100 bg-gray-50 pr-10 pl-9 text-[12.5px] font-bold text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-blue-500/50"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 dark:bg-white/[0.06] dark:hover:text-gray-200"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* list */}
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
                                    Math.max((current / maximum) * 100, 0),
                                    100
                                )
                                : 0;

                        const status = getStatus(current, minimum, maximum);
                        const statusStyle = STATUS_STYLE[status];
                        const StatusIcon = statusStyle.icon;

                        const productName = extractProductName(
                            stock,
                            productNames
                        );
                        const productId = Number(
                            data.product ?? data.product_id ?? data.id
                        );
                        const [g1, g2] = gradientOf(
                            Number.isFinite(productId) ? productId : index
                        );

                        return (
                            <motion.div
                                key={String(data.id)}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.2,
                                    delay: index * 0.04,
                                }}
                                whileHover={{ y: -2 }}
                                className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-4 transition-colors hover:border-blue-200/60 dark:border-white/[0.06] dark:bg-[#0f172a] dark:hover:border-blue-500/20"
                            >
                                {/* نوار رنگی بالای کارت */}
                                <div
                                    className="pointer-events-none absolute inset-x-0 top-0 h-[3px] opacity-60 transition-opacity group-hover:opacity-100"
                                    style={{
                                        background: `linear-gradient(90deg, transparent, ${g1}, ${g2}, transparent)`,
                                    }}
                                />

                                <div className="flex items-start gap-3">
                                    {/* آواتار محصول با gradient */}
                                    <div
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
                                        style={{
                                            background: `linear-gradient(135deg, ${g1}, ${g2})`,
                                        }}
                                    >
                                        <Package size={18} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        {/* نام + وضعیت */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                                                    {productName}
                                                </p>
                                                {data.code != null && (
                                                    <p className="mt-0.5 text-[10.5px] font-semibold text-gray-400">
                                                        کد: {String(data.code)}
                                                    </p>
                                                )}
                                            </div>

                                            <span
                                                className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10.5px] font-bold ${statusStyle.border} ${statusStyle.bg} ${statusStyle.text}`}
                                            >
                                                <StatusIcon size={11} />
                                                {statusStyle.label}
                                            </span>
                                        </div>

                                        {/* اعداد */}
                                        <div className="mt-3.5 flex items-end justify-between">
                                            <div>
                                                <p className="text-[10.5px] font-semibold text-gray-400">
                                                    موجودی فعلی
                                                </p>
                                                <p className="mt-0.5 text-[20px] font-extrabold leading-none text-gray-900 dark:text-white">
                                                    {formatNumber(current)}
                                                </p>
                                            </div>

                                            <div className="text-left">
                                                <p className="text-[10.5px] font-semibold text-gray-400">
                                                    ظرفیت
                                                </p>
                                                <p className="mt-0.5 text-[12.5px] font-bold text-gray-500 dark:text-gray-400">
                                                    {maximum > 0
                                                        ? formatNumber(maximum)
                                                        : "نامشخص"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* progress bar */}
                                        <div className="mt-3 flex items-center gap-2">
                                            <div
                                                className="h-1.5 flex-1 overflow-hidden rounded-full"
                                                style={{
                                                    background: isDark
                                                        ? "rgba(255,255,255,0.06)"
                                                        : "rgba(15,23,42,0.06)",
                                                }}
                                            >
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                        width: `${percentage}%`,
                                                    }}
                                                    transition={{
                                                        duration: 0.6,
                                                        ease: "easeOut",
                                                        delay:
                                                            index * 0.04 + 0.1,
                                                    }}
                                                    className="h-full rounded-full"
                                                    style={{
                                                        background:
                                                            status ===
                                                                "critical"
                                                                ? "linear-gradient(90deg,#ef4444,#f97316)"
                                                                : status ===
                                                                    "low"
                                                                    ? "linear-gradient(90deg,#f59e0b,#eab308)"
                                                                    : `linear-gradient(90deg, ${g1}, ${g2})`,
                                                    }}
                                                />
                                            </div>
                                            <span
                                                className={`shrink-0 text-[10.5px] font-bold ${status === "critical"
                                                        ? "text-red-500"
                                                        : status === "low"
                                                            ? "text-amber-500"
                                                            : "text-gray-400"
                                                    }`}
                                            >
                                                {Math.round(percentage)}٪
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-14 text-center dark:border-white/[0.08] dark:bg-white/[0.02]">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-white/[0.06]">
                        <Boxes size={24} className="text-gray-300 dark:text-gray-500" />
                    </div>
                    <p className="mt-3 text-[12.5px] font-bold text-gray-400">
                        {search
                            ? "نتیجه‌ای برای جستجوی شما پیدا نشد"
                            : "موجودی موردی پیدا نشد"}
                    </p>
                </div>
            )}
        </section>
    );
}