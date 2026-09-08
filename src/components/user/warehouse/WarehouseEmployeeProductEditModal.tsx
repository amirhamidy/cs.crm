"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader, Pencil, X } from "lucide-react";
import { useTheme } from "next-themes";
import type { AxiosError } from "axios";
import axiosInstance from "@/lib/axiosInstance";
import {
    ApiCategory,
    ApiProduct,
    unitDetailKey,
} from "@/types/warehouse";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    product: ApiProduct;
    categories: ApiCategory[];
    onUpdated: (product: ApiProduct) => void;
}

function getErrorMessage(error: unknown) {
    const data = (error as AxiosError<Record<string, unknown>>).response?.data;

    if (!data) return "خطا در ویرایش محصول";

    for (const key of [
        "detail",
        "name",
        "sale_price",
        "category",
        "message",
        "error",
        "non_field_errors",
    ]) {
        const value = data[key];

        if (typeof value === "string") return value;

        if (Array.isArray(value) && typeof value[0] === "string") {
            return value[0];
        }
    }

    return "خطا در ویرایش محصول";
}

export default function WarehouseEmployeeProductEditModal({
    isOpen,
    onClose,
    product,
    categories,
    onUpdated,
}: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [name, setName] = useState("");
    const [salePrice, setSalePrice] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [quantityPerUnit, setQuantityPerUnit] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        const detail = product[
            unitDetailKey(product.unit_type)
        ] as { quantity_per_unit?: number } | null | undefined;

        setName(product.name ?? "");
        setSalePrice(String(product.sale_price ?? ""));
        setCategoryId(
            product.category_detail?.id
                ? String(product.category_detail.id)
                : ""
        );
        setQuantityPerUnit(
            detail?.quantity_per_unit != null
                ? String(detail.quantity_per_unit)
                : ""
        );
        setError("");
    }, [isOpen, product]);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (!name.trim()) {
            setError("نام محصول الزامی است");
            return;
        }

        if (!categoryId) {
            setError("دسته‌بندی محصول را انتخاب کنید");
            return;
        }

        if (!salePrice || Number(salePrice) < 0) {
            setError("قیمت فروش معتبر وارد کنید");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const payload: Record<string, unknown> = {
                name: name.trim(),
                sale_price: Number(salePrice),
                category: Number(categoryId),
                unit_type: product.unit_type,
            };

            const detailKey = unitDetailKey(product.unit_type);
            const currentDetail = product[detailKey] as
                | { id?: number }
                | null
                | undefined;

            if (currentDetail?.id) {
                payload[`${product.unit_type}_unit`] = currentDetail.id;
                payload[`${product.unit_type}_unit_data`] = {
                    quantity_per_unit: Number(quantityPerUnit || 1),
                };
            }

            const { data } = await axiosInstance.put<ApiProduct>(
                `/warehouse/api/v1/products/${product.id}/update/`,
                payload
            );

            onUpdated(data);
            onClose();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    const bg = isDark ? "#0f172a" : "#ffffff";
    const border = isDark
        ? "rgba(255,255,255,0.06)"
        : "rgba(15,23,42,0.06)";
    const text = isDark ? "#f1f5f9" : "#1e293b";
    const muted = isDark ? "#94a3b8" : "#64748b";
    const inputBg = isDark
        ? "rgba(255,255,255,0.04)"
        : "rgba(15,23,42,0.035)";

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => !loading && onClose()}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{
                        background: "rgba(15,23,42,0.5)",
                        backdropFilter: "blur(5px)",
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 18, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 18, scale: 0.98 }}
                        transition={{ duration: 0.25 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-sm overflow-hidden rounded-[2rem]"
                        style={{
                            background: bg,
                            border: `1px solid ${border}`,
                        }}
                        dir="rtl"
                    >
                        <div className="flex items-center justify-between px-7 pb-4 pt-7">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="flex h-9 w-9 items-center justify-center rounded-2xl"
                                    style={{
                                        background: isDark
                                            ? "rgba(99,102,241,0.12)"
                                            : "rgba(99,102,241,0.08)",
                                        color: "#6366f1",
                                    }}
                                >
                                    <Pencil size={15} />
                                </div>

                                <div>
                                    <h3
                                        className="text-[14px] font-extrabold"
                                        style={{ color: text }}
                                    >
                                        ویرایش محصول
                                    </h3>
                                    <p
                                        className="mt-0.5 text-[12px]"
                                        style={{ color: muted }}
                                    >
                                        {product.name}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={loading}
                                onClick={onClose}
                                className="flex h-8 w-8 items-center justify-center rounded-xl disabled:opacity-40"
                                style={{
                                    background: inputBg,
                                    color: muted,
                                }}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-4 px-7 pb-7 pt-3"
                            autoComplete="off"
                        >
                            <label className="flex flex-col gap-1.5">
                                <span
                                    className="px-1 text-[12px] font-bold"
                                    style={{ color: muted }}
                                >
                                    نام محصول
                                </span>
                                <input
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setError("");
                                    }}
                                    className="h-11 rounded-2xl border px-4 text-[13px] font-semibold outline-none"
                                    style={{
                                        background: inputBg,
                                        borderColor: border,
                                        color: text,
                                    }}
                                />
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span
                                    className="px-1 text-[12px] font-bold"
                                    style={{ color: muted }}
                                >
                                    قیمت فروش
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    value={salePrice}
                                    onChange={(e) => {
                                        setSalePrice(e.target.value);
                                        setError("");
                                    }}
                                    className="h-11 rounded-2xl border px-4 text-[13px] font-semibold outline-none"
                                    style={{
                                        background: inputBg,
                                        borderColor: border,
                                        color: text,
                                    }}
                                    dir="ltr"
                                />
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span
                                    className="px-1 text-[12px] font-bold"
                                    style={{ color: muted }}
                                >
                                    دسته‌بندی
                                </span>
                                <select
                                    value={categoryId}
                                    onChange={(e) => {
                                        setCategoryId(e.target.value);
                                        setError("");
                                    }}
                                    className="h-11 rounded-2xl border px-4 text-[13px] font-semibold outline-none"
                                    style={{
                                        background: inputBg,
                                        borderColor: border,
                                        color: text,
                                    }}
                                >
                                    <option value="" disabled>
                                        انتخاب دسته‌بندی
                                    </option>
                                    {categories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span
                                    className="px-1 text-[12px] font-bold"
                                    style={{ color: muted }}
                                >
                                    مقدار در هر بسته
                                </span>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="any"
                                    value={quantityPerUnit}
                                    onChange={(e) =>
                                        setQuantityPerUnit(e.target.value)
                                    }
                                    className="h-11 rounded-2xl border px-4 text-[13px] font-semibold outline-none"
                                    style={{
                                        background: inputBg,
                                        borderColor: border,
                                        color: text,
                                    }}
                                    dir="ltr"
                                />
                            </label>

                            {error && (
                                <p className="text-center text-[12px] font-semibold leading-5 text-red-500">
                                    {error}
                                </p>
                            )}

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center justify-center gap-2 rounded-full py-3 text-[13px] font-bold text-white disabled:opacity-50"
                                style={{
                                    background:
                                        "linear-gradient(135deg,#6366f1,#8b5cf6)",
                                }}
                            >
                                {loading ? (
                                    <Loader
                                        size={18}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <>
                                        <Pencil size={15} />
                                        ذخیره تغییرات
                                    </>
                                )}
                            </motion.button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}