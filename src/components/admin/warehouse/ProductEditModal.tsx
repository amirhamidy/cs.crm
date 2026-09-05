"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader, Pencil, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import { ApiCategory, ApiProduct, unitDetailKey } from "@/types/warehouse";
import { FloatingInput, FloatingSelect } from "./FormControls";

interface ProductEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: ApiProduct;
    categories: ApiCategory[];
    onUpdated: (product: ApiProduct) => void;
}

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;
    if (!data) return fallback;
    const keys = ["detail", "name", "sale_price", "category", "message", "error", "non_field_errors"];
    for (const key of keys) {
        const val = data[key];
        if (typeof val === "string") return val;
        if (Array.isArray(val) && typeof val[0] === "string") return val[0];
    }
    return fallback;
}

export default function ProductEditModal({
    isOpen,
    onClose,
    product,
    categories,
    onUpdated,
}: ProductEditModalProps) {
    const [name, setName] = useState("");
    const [salePrice, setSalePrice] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [quantityPerUnit, setQuantityPerUnit] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        setName(product.name || "");
        setSalePrice(String(product.sale_price ?? ""));
        setCategoryId(String(product.category ?? ""));
        const detail = product[unitDetailKey(product.unit_type)] as { quantity_per_unit: number } | null | undefined;
        setQuantityPerUnit(String(detail?.quantity_per_unit ?? ""));
        setError("");
    }, [isOpen, product]);

    function handleClose() {
        if (loading) return;
        onClose();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || !salePrice || !categoryId) {
            setError("تمام فیلدها الزامی است");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const payload: Record<string, unknown> = {
                name: name.trim(),
                sale_price: salePrice,
                category: Number(categoryId),
                unit_type: product.unit_type,
            };

            const unitDetail = product[unitDetailKey(product.unit_type)] as { id: number } | null | undefined;
            if (unitDetail?.id) {
                payload[`${product.unit_type}_unit`] = unitDetail.id;
                payload[`${product.unit_type}_unit_data`] = {
                    quantity_per_unit: Number(quantityPerUnit),
                };
            }

            const { data } = await axiosInstance.put<ApiProduct>(
                `/warehouse/api/v1/products/${product.id}/update/`,
                payload
            );
            onUpdated(data);
            onClose();
        } catch (err) {
            setError(getErrorMessage(err, "خطا در ویرایش محصول"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="w-full max-w-sm rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                    <Pencil size={15} className="text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        ویرایش محصول
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-gray-400">
                                        بروزرسانی اطلاعات محصول
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-5">
                            <FloatingInput
                                label="نام محصول"
                                id="edit_product_name"
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setError("");
                                }}
                                dir="rtl"
                            />
                            <FloatingInput
                                label="قیمت فروش (تومان)"
                                id="edit_product_price"
                                type="number"
                                value={salePrice}
                                onChange={(e) => {
                                    setSalePrice(e.target.value);
                                    setError("");
                                }}
                                dir="ltr"
                            />
                            <FloatingSelect
                                label="دسته‌بندی"
                                id="edit_product_category"
                                value={categoryId}
                                onChange={(e) => {
                                    setCategoryId(e.target.value);
                                    setError("");
                                }}
                                dir="rtl"
                            >
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </FloatingSelect>
                            <FloatingInput
                                label="تعداد در هر بسته"
                                id="edit_product_qty_per_unit"
                                type="number"
                                value={quantityPerUnit}
                                onChange={(e) => {
                                    setQuantityPerUnit(e.target.value);
                                    setError("");
                                }}
                                dir="ltr"
                            />

                            {error && (
                                <p className="text-center text-[11.5px] font-semibold text-red-500 -mt-2">
                                    {error}
                                </p>
                            )}

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center justify-center rounded-full bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                            >
                                {loading ? <Loader size={18} className="animate-spin" /> : "ذخیره تغییرات"}
                            </motion.button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}