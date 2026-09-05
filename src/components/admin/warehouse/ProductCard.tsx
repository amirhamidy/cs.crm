"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { ArrowDownUp, Layers3, Pencil, Tag } from "lucide-react";
import { ApiCategory, ApiProduct, ApiWarehouseStaff, UNIT_TYPE_LABELS, unitDetailKey } from "@/types/warehouse";
import ProductEditModal from "./ProductEditModal";
import StockModal from "./StockModal";

interface ProductCardProps {
    product: ApiProduct;
    index: number;
    categories: ApiCategory[];
    staff: ApiWarehouseStaff[];
    onUpdated: (product: ApiProduct) => void;
    onStockChanged: (product: ApiProduct) => void;
}

const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#ec4899", "#8b5cf6"],
    ["#06b6d4", "#3b82f6"],
    ["#10b981", "#14b8a6"],
    ["#f59e0b", "#ef4444"],
] as const;

function stockBadge(product: ApiProduct) {
    if (
        product.current_stock === undefined ||
        product.current_stock === null ||
        product.minimum_stock === undefined ||
        product.minimum_stock === null
    ) {
        return null;
    }

    if (product.current_stock <= product.minimum_stock) {
        return { label: "نیاز به تامین", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
    }

    return { label: "موجودی مناسب", color: "#10b981", bg: "rgba(16,185,129,0.1)" };
}

export default function ProductCard({
    product,
    index,
    categories,
    staff,
    onUpdated,
    onStockChanged,
}: ProductCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [showEdit, setShowEdit] = useState(false);
    const [showStock, setShowStock] = useState(false);

    const [start, end] = AVATAR_GRADIENTS[product.id % AVATAR_GRADIENTS.length];
    const unitDetail = product[unitDetailKey(product.unit_type)] as { quantity_per_unit: number } | null | undefined;
    const badge = stockBadge(product);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="relative flex min-h-[168px] flex-col justify-between rounded-3xl p-4"
                style={{
                    background: isDark ? "rgba(255,255,255,0.03)" : "#fafafa",
                    border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(15,23,42,0.06)",
                    boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.22)" : "0 8px 24px rgba(15,23,42,0.05)",
                }}
            >
                <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5">
                    {badge && (
                        <span
                            className="rounded-xl px-2 py-1 text-[10px] font-extrabold"
                            style={{ background: badge.bg, color: badge.color }}
                        >
                            {badge.label}
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={() => setShowStock(true)}
                        className="flex h-7 w-7 items-center justify-center rounded-xl"
                        style={{
                            background: isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)",
                            color: "#10b981",
                        }}
                        title="ثبت تراکنش انبار"
                    >
                        <ArrowDownUp size={11} />
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowEdit(true)}
                        className="flex h-7 w-7 items-center justify-center rounded-xl"
                        style={{
                            background: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                            color: isDark ? "#a5b4fc" : "#6366f1",
                        }}
                        title="ویرایش"
                    >
                        <Pencil size={11} />
                    </button>
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
                            {UNIT_TYPE_LABELS[product.unit_type]}
                            {unitDetail ? ` · ${unitDetail.quantity_per_unit} در هر بسته` : ""}
                        </span>
                    </div>
                    {product.current_stock !== undefined && product.current_stock !== null && (
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="flex items-center gap-1 font-semibold text-gray-400 dark:text-white/35">
                                <Layers3 size={11} />
                                موجودی فعلی
                            </span>
                            <span className="font-extrabold text-gray-700 dark:text-white/80">
                                {product.current_stock}
                            </span>
                        </div>
                    )}
                </div>
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

            <StockModal
                isOpen={showStock}
                onClose={() => setShowStock(false)}
                product={product}
                staff={staff}
                onCompleted={() => {
                    onStockChanged(product);
                    setShowStock(false);
                }}
            />
        </>
    );
}