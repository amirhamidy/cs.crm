"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
    ArrowDownUp,
    Boxes,
    CalendarDays,
    Loader2,
    Package,
    Pencil,
    Tag,
    Trash2,
    X,
} from "lucide-react";
import type { AxiosError } from "axios";
import axiosInstance from "@/lib/axiosInstance";
import {
    ApiCategory,
    ApiProduct,
    ApiStockInfo,
    ApiWarehouseStaff,
    UNIT_TYPE_LABELS,
} from "@/types/warehouse";
import WarehouseEmployeeProductEditModal from "./WarehouseEmployeeProductEditModal";
import WarehouseEmployeeStockModal from "./WarehouseEmployeeStockModal";
import WarehouseEmployeeInitialStockModal from "./WarehouseEmployeeInitialStockModal";

interface ProductCardProps {
    product: ApiProduct;
    stockInfo: ApiStockInfo | null;
    index: number;
    categories: ApiCategory[];
    staff: ApiWarehouseStaff[];
    performedById?: number | null;
    onUpdated?: (product: ApiProduct) => void;
    onStockChanged?: () => void;
    onDeleted?: (id: number) => void;
}

const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#ec4899", "#8b5cf6"],
    ["#06b6d4", "#3b82f6"],
    ["#10b981", "#14b8a6"],
    ["#f59e0b", "#ef4444"],
] as const;

function getErrorMessage(err: unknown, fallback: string) {
    const data = (err as AxiosError<Record<string, unknown>>).response?.data;
    if (!data) return fallback;

    for (const key of ["detail", "message", "error", "non_field_errors"]) {
        const value = data[key];
        if (typeof value === "string") return value;
        if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }

    return fallback;
}

const formatPrice = (value: string | number) =>
    Number(value || 0).toLocaleString("fa-IR");

const formatQuantity = (value: number | null | undefined) =>
    Number(value ?? 0).toLocaleString("fa-IR");

function getUnitText(product: ApiProduct, stock: ApiStockInfo | null) {
    if (stock?.unit_label) return stock.unit_label;

    const label = UNIT_TYPE_LABELS[product.unit_type] ?? "واحد";

    if (product.unit_type === "count") {
        const quantity = product.count_unit_detail?.quantity_per_unit;
        return quantity
            ? `${label} · ${formatQuantity(quantity)} در هر بسته`
            : label;
    }

    const details = {
        weight: product.weight_unit_detail,
        volume: product.volume_unit_detail,
        area: product.area_unit_detail,
        dimension: product.dimension_unit_detail,
    };

    const quantity = details[product.unit_type]?.quantity_per_unit;

    return quantity
        ? `${label} · ${formatQuantity(quantity)} در هر واحد`
        : label;
}

export default function WarehouseEmployeeProductCard({
    product,
    stockInfo,
    index,
    categories,
    staff,
    performedById,
    onUpdated,
    onStockChanged,
    onDeleted,
}: ProductCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [showEdit, setShowEdit] = useState(false);
    const [showStock, setShowStock] = useState(false);
    const [showInitialStock, setShowInitialStock] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const [start, end] =
        AVATAR_GRADIENTS[product.id % AVATAR_GRADIENTS.length];

    const isCritical = !!stockInfo &&
        stockInfo.current_quantity <= stockInfo.minimum_stock;

    const stockPercentage = stockInfo?.maximum_stock
        ? Math.min(
              100,
              Math.max(
                  0,
                  (stockInfo.current_quantity / stockInfo.maximum_stock) * 100
              )
          )
        : 0;

    const unitText = getUnitText(product, stockInfo);

    async function handleDelete() {
        setDeleting(true);
        setDeleteError("");

        try {
            await axiosInstance.delete(
                `/warehouse/api/v1/products/${product.id}/delete/`
            );
            setShowConfirm(false);
            onDeleted?.(product.id);
        } catch (err) {
            setDeleteError(getErrorMessage(err, "خطا در حذف محصول"));
        } finally {
            setDeleting(false);
        }
    }

    const refreshStock = () => {
        onStockChanged?.();
        setShowStock(false);
        setShowInitialStock(false);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="group relative flex min-h-[245px] flex-col justify-between overflow-hidden rounded-3xl p-4"
                style={{
                    background: isDark ? "rgba(255,255,255,0.03)" : "#fff",
                    border: isDark
                        ? "1px solid rgba(255,255,255,.06)"
                        : "1px solid rgba(15,23,42,.06)",
                    boxShadow: isDark
                        ? "0 8px 30px rgba(0,0,0,.22)"
                        : "0 8px 24px rgba(15,23,42,.05)",
                }}
            >
                <svg className="pointer-events-none absolute inset-0 h-full w-full">
                    <defs>
                        <linearGradient
                            id={`employee-card-border-${product.id}`}
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
                        stroke={`url(#employee-card-border-${product.id})`}
                        strokeWidth="1.4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileHover={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.45, ease: "easeInOut" }}
                    />
                </svg>

                <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5">
                    {stockInfo && (
                        <span
                            className="rounded-xl px-2 py-1 text-[10px] font-extrabold"
                            style={{
                                background: isCritical
                                    ? "rgba(239,68,68,.1)"
                                    : "rgba(16,185,129,.1)",
                                color: isCritical ? "#ef4444" : "#10b981",
                            }}
                        >
                            {isCritical ? "نیاز به تامین" : "موجودی مناسب"}
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={() =>
                            stockInfo
                                ? setShowStock(true)
                                : setShowInitialStock(true)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-xl transition-transform active:scale-90"
                        style={{
                            background: isDark
                                ? stockInfo
                                    ? "rgba(16,185,129,.12)"
                                    : "rgba(59,130,246,.12)"
                                : stockInfo
                                  ? "rgba(16,185,129,.08)"
                                  : "rgba(59,130,246,.08)",
                            color: stockInfo ? "#10b981" : "#3b82f6",
                        }}
                        title={stockInfo ? "ثبت تراکنش انبار" : "ثبت موجودی اولیه"}
                    >
                        {stockInfo ? <ArrowDownUp size={13} /> : <Boxes size={13} />}
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowEdit(true)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl transition-transform active:scale-90"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,.12)"
                                : "rgba(99,102,241,.08)",
                            color: isDark ? "#a5b4fc" : "#6366f1",
                        }}
                        title="ویرایش"
                    >
                        <Pencil size={13} />
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowConfirm(true)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl transition-transform active:scale-90"
                        style={{
                            background: isDark
                                ? "rgba(239,68,68,.12)"
                                : "rgba(239,68,68,.08)",
                            color: "#ef4444",
                        }}
                        title="حذف"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>

                <div className="relative z-[1] mt-7 flex items-center gap-3">
                    <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[15px] font-extrabold text-white shadow-lg"
                        style={{
                            background: `linear-gradient(135deg,${start},${end})`,
                        }}
                    >
                        {product.name.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                            {product.name}
                        </h3>

                        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                            <Tag size={11} />
                            {product.category_detail?.name ?? "بدون دسته‌بندی"}
                        </div>

                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-600">
                            <Package size={10} />
                            شناسه کالا #{product.id}
                        </div>
                    </div>
                </div>

                <div className="relative z-[1] mt-3 rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
                    <div className="flex items-center justify-between text-[11.5px]">
                        <span className="font-semibold text-gray-400 dark:text-white/40">
                            قیمت فروش
                        </span>
                        <span className="font-extrabold text-gray-700 dark:text-white/85">
                            {formatPrice(product.sale_price)} تومان
                        </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3 text-[11.5px]">
                        <span className="font-semibold text-gray-400 dark:text-white/40">
                            واحد
                        </span>
                        <span className="text-left font-extrabold text-gray-700 dark:text-white/85">
                            {unitText}
                        </span>
                    </div>

                    {stockInfo ? (
                        <div className="mt-3">
                            <div className="mb-1.5 flex items-center justify-between text-[10.5px]">
                                <span className="font-semibold text-gray-400 dark:text-white/40">
                                    موجودی
                                </span>
                                <span
                                    className="font-extrabold"
                                    style={{
                                        color: isCritical
                                            ? "#ef4444"
                                            : isDark
                                              ? "#e2e8f0"
                                              : "#334155",
                                    }}
                                >
                                    {formatQuantity(stockInfo.current_quantity)} /{" "}
                                    {formatQuantity(stockInfo.maximum_stock)}
                                </span>
                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-white/[0.06]">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stockPercentage}%` }}
                                    transition={{ duration: 0.6 }}
                                    className="h-full rounded-full"
                                    style={{
                                        background: isCritical
                                            ? "#ef4444"
                                            : "linear-gradient(90deg,#6366f1,#8b5cf6)",
                                    }}
                                />
                            </div>

                            <div className="mt-2 flex items-center justify-between text-[10px]">
                                <span className="text-gray-400 dark:text-white/35">
                                    اولیه: {formatQuantity(stockInfo.initial_quantity)}
                                </span>
                                <span className="text-gray-400 dark:text-white/35">
                                    حداقل: {formatQuantity(stockInfo.minimum_stock)}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-2 text-center text-[11px] font-semibold text-amber-500">
                            موجودی اولیه ثبت نشده است
                        </div>
                    )}
                </div>

                {stockInfo?.updated_at && (
                    <div className="relative z-[1] mt-2 flex items-center justify-end gap-1 text-[9.5px] text-gray-400 dark:text-gray-600">
                        <CalendarDays size={10} />
                        آخرین بروزرسانی:{" "}
                        {new Date(stockInfo.updated_at).toLocaleDateString("fa-IR")}
                    </div>
                )}

                {deleteError && (
                    <p className="relative z-[1] mt-1.5 text-center text-[11px] font-semibold text-red-500">
                        {deleteError}
                    </p>
                )}
            </motion.div>

            <WarehouseEmployeeProductEditModal
                isOpen={showEdit}
                onClose={() => setShowEdit(false)}
                product={product}
                categories={categories}
                onUpdated={updated => {
                    onUpdated?.(updated);
                    setShowEdit(false);
                }}
            />

            {stockInfo && (
                <WarehouseEmployeeStockModal
                    isOpen={showStock}
                    onClose={() => setShowStock(false)}
                    product={product}
                    performedById={performedById ?? ""}
                    onCompleted={refreshStock}
                />
            )}

            <WarehouseEmployeeInitialStockModal
                isOpen={showInitialStock}
                onClose={() => setShowInitialStock(false)}
                product={product}
                staff={staff}
                performedById={performedById}
                onCompleted={refreshStock}
            />

            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !deleting && setShowConfirm(false)}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{
                            background: "rgba(0,0,0,.5)",
                            backdropFilter: "blur(4px)",
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 16 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-[360px] rounded-[2rem] bg-white p-5 dark:bg-[#0f172a]"
                            dir="rtl"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10">
                                        <Trash2 size={15} className="text-red-500" />
                                    </div>
                                    <h3 className="text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                                        حذف محصول
                                    </h3>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={deleting}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-white/[0.05]"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <p className="text-[12.5px] leading-6 text-gray-600 dark:text-gray-400">
                                محصول{" "}
                                <span className="font-extrabold text-gray-900 dark:text-white">
                                    {product.name}
                                </span>{" "}
                                به طور کامل از انبار حذف خواهد شد.
                            </p>

                            {deleteError && (
                                <p className="mt-3 text-center text-[12px] font-semibold leading-5 text-red-500">
                                    {deleteError}
                                </p>
                            )}

                            <div className="mt-5 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={deleting}
                                    className="flex-1 rounded-2xl bg-gray-100 py-2.5 text-[12.5px] font-bold text-gray-600 dark:bg-white/[0.05] dark:text-gray-300"
                                >
                                    انصراف
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-red-600 py-2.5 text-[12.5px] font-bold text-white disabled:opacity-60"
                                >
                                    {deleting ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        "حذف کن"
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
