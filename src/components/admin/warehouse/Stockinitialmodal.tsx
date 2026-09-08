"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Boxes, Loader, X } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import type { ApiProduct, ApiStockInfo, ApiWarehouseStaff } from "@/types/warehouse";
import { FloatingInput, FloatingSelect } from "./FormControls";

interface StockInitialModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: ApiProduct;
    staff: ApiWarehouseStaff[];
    onCompleted: (stockInfo: ApiStockInfo) => void;
}

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;
    if (!data) return fallback;
    const keys = ["detail", "quantity", "minimum_stock", "maximum_stock", "message", "error"];
    for (const key of keys) {
        const val = data[key];
        if (typeof val === "string") return val;
        if (Array.isArray(val) && typeof val[0] === "string") return val[0];
    }
    return fallback;
}

export default function StockInitialModal({
    isOpen,
    onClose,
    product,
    staff,
    onCompleted,
}: StockInitialModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [performedById, setPerformedById] = useState("");
    const [quantity, setQuantity] = useState("");
    const [minimumStock, setMinimumStock] = useState("");
    const [maximumStock, setMaximumStock] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        setPerformedById("");
        setQuantity("");
        setMinimumStock("");
        setMaximumStock("");
        setError("");
    }, [isOpen]);

    function handleClose() {
        if (loading) return;
        onClose();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!performedById || !quantity || !minimumStock || !maximumStock) {
            setError("تمام فیلدها الزامی است");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const { data } = await axiosInstance.post<ApiStockInfo>(
                "/warehouse/api/v1/process/stock/initial/",
                {
                    product_id: product.id,
                    performed_by_id: Number(performedById),
                    quantity: Number(quantity),
                    minimum_stock: Number(minimumStock),
                    maximum_stock: Number(maximumStock),
                }
            );
            onCompleted(data);
            onClose();
        } catch (err) {
            setError(getErrorMessage(err, "خطا در ثبت موجودی اولیه"));
        } finally {
            setLoading(false);
        }
    }

    const cardBg = isDark ? "#0f172a" : "#ffffff";
    const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)";
    const textColor = isDark ? "#f1f5f9" : "#1e293b";
    const mutedText = isDark ? "#94a3b8" : "#64748b";

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{
                        background: "rgba(15,23,42,0.5)",
                        backdropFilter: "blur(4px)",
                    }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="w-full max-w-sm overflow-hidden rounded-[2rem] p-0"
                        style={{
                            background: cardBg,
                            border: `1px solid ${borderColor}`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                    >
                        <div className="flex items-center justify-between px-8 pb-6 pt-8">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                                    style={{
                                        background: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                                    }}
                                >
                                    <Boxes size={15} className="text-indigo-500" />
                                </div>
                                <div>
                                    <h3
                                        className="text-[14px] font-extrabold"
                                        style={{ color: textColor }}
                                    >
                                        ثبت موجودی اولیه
                                    </h3>
                                    <p className="mt-0.5 text-[12px]" style={{ color: mutedText }}>
                                        {product.name}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)",
                                    color: mutedText,
                                }}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-4 px-8 pb-8">
                            <FloatingSelect
                                label="ثبت‌کننده"
                                id="stock_initial_performed_by"
                                value={performedById}
                                onChange={(e) => {
                                    setPerformedById(e.target.value);
                                    setError("");
                                }}
                                dir="rtl"
                            >
                                <option value="" disabled>
                                    انتخاب کنید
                                </option>
                                {staff.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.full_name}
                                    </option>
                                ))}
                            </FloatingSelect>

                            <FloatingInput
                                label="موجودی فعلی"
                                id="stock_initial_quantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => {
                                    setQuantity(e.target.value);
                                    setError("");
                                }}
                                dir="ltr"
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <FloatingInput
                                    label="حداقل موجودی"
                                    id="stock_initial_min"
                                    type="number"
                                    value={minimumStock}
                                    onChange={(e) => {
                                        setMinimumStock(e.target.value);
                                        setError("");
                                    }}
                                    dir="ltr"
                                />
                                <FloatingInput
                                    label="حداکثر موجودی"
                                    id="stock_initial_max"
                                    type="number"
                                    value={maximumStock}
                                    onChange={(e) => {
                                        setMaximumStock(e.target.value);
                                        setError("");
                                    }}
                                    dir="ltr"
                                />
                            </div>

                            {error && (
                                <p className="-mt-1 text-center text-[12px] font-semibold text-red-500">
                                    {error}
                                </p>
                            )}

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center justify-center rounded-full py-3 text-[13px] font-bold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                                style={{
                                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                }}
                            >
                                {loading ? (
                                    <Loader size={18} className="animate-spin" />
                                ) : (
                                    "ثبت موجودی اولیه"
                                )}
                            </motion.button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}