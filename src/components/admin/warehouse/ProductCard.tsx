"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { ArrowDownUp, Boxes, Loader2, Pencil, Tag, Trash2, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import {
    ApiCategory,
    ApiProduct,
    ApiStockInfo,
    ApiWarehouseStaff,
    UNIT_TYPE_LABELS,
    unitDetailKey,
} from "@/types/warehouse";
import { useCurrentEmployee } from "@/hooks/usecurrentemployee";
import ProductEditModal from "./ProductEditModal";
import StockModal from "./StockModal";
import StockInitialModal from "./Stockinitialmodal";

interface ProductCardProps {
    product: ApiProduct;
    stockInfo: ApiStockInfo | null;
    index: number;
    categories: ApiCategory[];
    staff: ApiWarehouseStaff[];
    onUpdated: (product: ApiProduct) => void;
    onStockChanged: () => void;
    onDeleted: (id: number) => void;
}

const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#ec4899", "#8b5cf6"],
    ["#06b6d4", "#3b82f6"],
    ["#10b981", "#14b8a6"],
    ["#f59e0b", "#ef4444"],
] as const;

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;
    if (!data) return fallback;
    const keys = ["detail", "message", "error"];
    for (const key of keys) {
        const val = data[key];
        if (typeof val === "string") return val;
    }
    return fallback;
}

export default function ProductCard({
    product,
    stockInfo,
    index,
    categories,
    staff,
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
    const [tooltipVisible, setTooltipVisible] = useState(false);

    const { employee, loading: employeeLoading } = useCurrentEmployee();

    const isWarehouseStaff = !employeeLoading && !!employee && staff.some(
        (s) => (s.employee_id === employee.id || (s as unknown as { employee: number }).employee === employee.id) && s.is_active
    );

    const [start, end] = AVATAR_GRADIENTS[product.id % AVATAR_GRADIENTS.length];
    const unitDetail = product[unitDetailKey(product.unit_type)] as { quantity_per_unit: number } | null | undefined;

    const isCritical = stockInfo ? stockInfo.current_quantity <= stockInfo.minimum_stock : false;

    async function handleDelete() {
        if (!isWarehouseStaff) return;
        setDeleting(true);
        setDeleteError("");
        try {
            await axiosInstance.delete(`/warehouse/api/v1/products/${product.id}/delete/`);
            onDeleted(product.id);
        } catch (err) {
            setDeleteError(getErrorMessage(err, "خطا در حذف محصول"));
        } finally {
            setDeleting(false);
        }
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="relative flex min-h-[178px] flex-col justify-between rounded-3xl p-4"
                style={{
                    background: isDark ? "rgba(255,255,255,0.03)" : "#fafafa",
                    border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(15,23,42,0.06)",
                    boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.22)" : "0 8px 24px rgba(15,23,42,0.05)",
                }}
            >
                <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5">
                    {stockInfo && (
                        <span
                            className="rounded-xl px-2 py-1 text-[10px] font-extrabold"
                            style={{
                                background: isCritical ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                                color: isCritical ? "#ef4444" : "#10b981",
                            }}
                        >
                            {isCritical ? "نیاز به تامین" : "موجودی مناسب"}
                        </span>
                    )}

                    {stockInfo ? (
                        <button
                            type="button"
                            onClick={() => setShowStock(true)}
                            className="flex h-7 w-7 items-center justify-center rounded-xl transition-colors"
                            style={{
                                background: isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)",
                                color: "#10b981",
                            }}
                            title="ثبت تراکنش انبار"
                        >
                            <ArrowDownUp size={11} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowInitialStock(true)}
                            className="flex h-7 w-7 items-center justify-center rounded-xl transition-colors"
                            style={{
                                background: isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.08)",
                                color: "#3b82f6",
                            }}
                            title="ثبت موجودی اولیه"
                        >
                            <Boxes size={11} />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setShowEdit(true)}
                        className="flex h-7 w-7 items-center justify-center rounded-xl transition-colors"
                        style={{
                            background: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                            color: isDark ? "#a5b4fc" : "#6366f1",
                        }}
                        title="ویرایش"
                    >
                        <Pencil size={11} />
                    </button>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isWarehouseStaff) return;
                                setShowConfirm(true);
                            }}
                            onMouseEnter={() => !isWarehouseStaff && setTooltipVisible(true)}
                            onMouseLeave={() => setTooltipVisible(false)}
                            className="flex h-7 w-7 items-center justify-center rounded-xl transition-colors"
                            style={{
                                background: !isWarehouseStaff
                                    ? isDark
                                        ? "rgba(255,255,255,0.04)"
                                        : "rgba(0,0,0,0.04)"
                                    : isDark
                                        ? "rgba(239,68,68,0.12)"
                                        : "rgba(239,68,68,0.08)",
                                color: !isWarehouseStaff
                                    ? isDark
                                        ? "#4b5563"
                                        : "#9ca3af"
                                    : "#ef4444",
                                cursor: !isWarehouseStaff ? "not-allowed" : "pointer",
                            }}
                            title={isWarehouseStaff ? "حذف" : undefined}
                        >
                            <Trash2 size={11} />
                        </button>

                        <AnimatePresence>
                            {tooltipVisible && (
                                <motion.div
                                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                    className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap"
                                    dir="rtl"
                                >
                                    <div
                                        className="flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-center shadow-xl"
                                        style={{
                                            background: isDark ? "#0f172a" : "#1e293b",
                                            border: isDark
                                                ? "1px solid rgba(255,255,255,0.08)"
                                                : "1px solid rgba(0,0,0,0.12)",
                                        }}
                                    >
                                        <span className="text-[11px] font-bold text-white">
                                            عدم دسترسی به حذف
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            شما جزو پرسنل مجاز انبار نیستید
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="mt-5 flex items-center gap-3">
                    <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[15px] font-extrabold text-white"
                        style={{ background: `linear-gradient(135deg, ${start}, ${end})` }}
                    >
                        {product.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                            {product.name}
                        </h3>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                            <Tag size={10} />
                            {product.category_detail?.name ?? "بدون دسته‌بندی"}
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex flex-col gap-1.5 rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-gray-400 dark:text-white/35">قیمت فروش</span>
                        <span className="font-extrabold text-gray-700 dark:text-white/80">
                            {Number(product.sale_price).toLocaleString("fa-IR")} تومان
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-gray-400 dark:text-white/35">واحد شمارش</span>
                        <span className="font-extrabold text-gray-700 dark:text-white/80">
                            {stockInfo?.unit_label ?? UNIT_TYPE_LABELS[product.unit_type]}
                            {unitDetail ? ` · ${unitDetail.quantity_per_unit} در هر بسته` : ""}
                        </span>
                    </div>
                    {stockInfo ? (
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-gray-400 dark:text-white/35">موجودی فعلی</span>
                            <span
                                className="font-extrabold"
                                style={{ color: isCritical ? "#ef4444" : undefined }}
                            >
                                {stockInfo.current_quantity} از حداکثر {stockInfo.maximum_stock}
                            </span>
                        </div>
                    ) : (
                        <p className="text-center text-[10.5px] font-semibold text-amber-500">
                            موجودی اولیه ثبت نشده است
                        </p>
                    )}
                </div>

                {deleteError && (
                    <p className="mt-1.5 text-center text-[10.5px] font-semibold text-red-500">
                        {deleteError}
                    </p>
                )}
            </motion.div>

            <ProductEditModal
                isOpen={showEdit}
                onClose={() => setShowEdit(false)}
                product={product}
                categories={categories}
                onUpdated={(updated) => {
                    onUpdated(updated);
                    setShowEdit(false);
                }}
            />

            {stockInfo && (
                <StockModal
                    isOpen={showStock}
                    onClose={() => setShowStock(false)}
                    product={product}
                    staff={staff}
                    onCompleted={() => {
                        onStockChanged();
                        setShowStock(false);
                    }}
                />
            )}

            <StockInitialModal
                isOpen={showInitialStock}
                onClose={() => setShowInitialStock(false)}
                product={product}
                staff={staff}
                onCompleted={() => {
                    onStockChanged();
                    setShowInitialStock(false);
                }}
            />

            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !deleting && setShowConfirm(false)}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 16 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[360px] rounded-[2rem] bg-white p-5 dark:bg-[#0f172a]"
                            dir="rtl"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                                    حذف محصول
                                </h3>
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
                                    {deleting ? <Loader2 size={14} className="animate-spin" /> : "حذف کن"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
