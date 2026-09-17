"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownCircle, ArrowUpCircle, Loader, X } from "lucide-react";
import type { AxiosError } from "axios";
import axiosInstance from "@/lib/axiosInstance";
import {
    ApiCategory,
    ApiProduct,
    ApiStockTransaction,
    STOCK_OUT_REASON_OPTIONS,
    StockOutReason,
} from "@/types/warehouse";
import { FloatingInput, FloatingSelect } from "./FormControls";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    product: ApiProduct;
    categories: ApiCategory[];
    performedById: number | string;
    onCompleted: (transaction: ApiStockTransaction) => void;
}

type Mode = "in" | "out";

function getErrorMessage(error: unknown) {
    const data = (error as AxiosError<Record<string, unknown>>).response?.data;
    if (!data) return "خطا در ثبت تراکنش انبار";
    for (const key of [
        "detail",
        "quantity",
        "reason",
        "message",
        "error",
        "non_field_errors",
    ]) {
        const value = data[key];
        if (typeof value === "string") return value;
        if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }
    return "خطا در ثبت تراکنش انبار";
}

export default function WarehouseEmployeeStockModal({
    isOpen,
    onClose,
    product,
    performedById,
    onCompleted,
}: Props) {
    const [mode, setMode] = useState<Mode>("in");
    const [quantity, setQuantity] = useState("");
    const [reason, setReason] = useState<StockOutReason>("sale");

    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        setMode("in");
        setQuantity("");
        setReason("sale");
        setNote("");
        setError("");
    }, [isOpen]);

    function handleClose() {
        if (loading) return;
        onClose();
    }

    const quantityValid = Number(quantity) > 0;
    const noteValid = note.trim().length > 0;
    const canSubmit = quantityValid && noteValid && !loading;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!performedById) {
            setError("اطلاعات کارمند انبار یافت نشد");
            return;
        }
        if (!quantityValid) {
            setError("تعداد معتبر وارد کنید");
            return;
        }
        if (!noteValid) {
            setError("توضیحات الزامی است");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const endpoint =
                mode === "in"
                    ? "/warehouse/api/v1/process/stock/in/"
                    : "/warehouse/api/v1/process/stock/out/";

            const payload: Record<string, unknown> = {
                product_id: product.id,
                performed_by_id: Number(performedById),
                quantity: Number(quantity),
                note: note.trim(),
            };

            if (mode === "out") payload.reason = reason;

            const { data } = await axiosInstance.post<ApiStockTransaction>(
                endpoint,
                payload
            );

            onCompleted(data);
            onClose();
        } catch (err) {
            setError(getErrorMessage(err));
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
                        className="w-full max-w-sm overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                    >
                        <div className="flex items-center justify-between px-8 pb-6 pt-8">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${mode === "in"
                                        ? "bg-emerald-50 dark:bg-emerald-500/10"
                                        : "bg-red-50 dark:bg-red-500/10"
                                        }`}
                                >
                                    {mode === "in" ? (
                                        <ArrowDownCircle
                                            size={15}
                                            className="text-emerald-500"
                                        />
                                    ) : (
                                        <ArrowUpCircle
                                            size={15}
                                            className="text-red-500"
                                        />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="truncate text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        {product.name}
                                    </h3>
                                    <p className="mt-0.5 text-[12px] text-gray-400">
                                        مدیریت موجودی محصول
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            autoComplete="off"
                            className="flex flex-col gap-4 px-8 pb-8"
                        >
                            {/* mode toggle — سبک، هم‌رنگ با بقیه */}
                            <div className="flex gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-white/[0.04]">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode("in");
                                        setError("");
                                    }}
                                    className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-bold transition-colors"
                                    style={{
                                        color:
                                            mode === "in" ? "#059669" : undefined,
                                    }}
                                >
                                    {mode === "in" && (
                                        <motion.div
                                            layoutId="stock-mode-pill"
                                            className="absolute inset-0 rounded-xl bg-white shadow-sm dark:bg-white/[0.08]"
                                        />
                                    )}
                                    <span className="relative">
                                        افزایش موجودی
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode("out");
                                        setError("");
                                    }}
                                    className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-bold transition-colors"
                                    style={{
                                        color:
                                            mode === "out" ? "#dc2626" : undefined,
                                    }}
                                >
                                    {mode === "out" && (
                                        <motion.div
                                            layoutId="stock-mode-pill"
                                            className="absolute inset-0 rounded-xl bg-white shadow-sm dark:bg-white/[0.08]"
                                        />
                                    )}
                                    <span className="relative">
                                        کاهش موجودی
                                    </span>
                                </button>
                            </div>

                            <FloatingInput
                                label="تعداد"
                                id="stock_quantity"
                                type="number"
                                min="0.01"
                                step="any"
                                value={quantity}
                                onChange={(e) => {
                                    setQuantity(e.target.value);
                                    setError("");
                                }}
                                dir="ltr"
                            />

                            {mode === "out" && (
                                <FloatingSelect
                                    label="دلیل خروج"
                                    id="stock_reason"
                                    value={reason}
                                    onChange={(e) => {
                                        setReason(
                                            e.target.value as StockOutReason
                                        );
                                        setError("");
                                    }}
                                    dir="rtl"
                                >
                                    {STOCK_OUT_REASON_OPTIONS.map((item) => (
                                        <option
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </option>
                                    ))}
                                </FloatingSelect>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <FloatingInput
                                    label="توضیحات *"
                                    id="stock_note"
                                    type="text"
                                    value={note}
                                    onChange={(e) => {
                                        setNote(e.target.value);
                                        setError("");
                                    }}
                                    dir="rtl"
                                />
                                {!noteValid && (
                                    <span className="px-2 text-[11px] font-semibold text-gray-400">
                                        وارد کردن توضیحات الزامی است
                                    </span>
                                )}
                            </div>

                            {error && (
                                <p className="-mt-1 text-center text-[12px] font-semibold text-red-500">
                                    {error}
                                </p>
                            )}

                            <motion.button
                                type="submit"
                                disabled={!canSubmit}
                                whileTap={{ scale: 0.97 }}
                                className={`flex items-center justify-center rounded-full py-3 text-[13px] font-bold text-white transition-colors disabled:opacity-50 ${mode === "in"
                                    ? "bg-emerald-600 hover:bg-emerald-500"
                                    : "bg-red-600 hover:bg-red-500"
                                    }`}
                            >
                                {loading ? (
                                    <Loader size={18} className="animate-spin" />
                                ) : mode === "in" ? (
                                    "ثبت افزایش موجودی"
                                ) : (
                                    "ثبت کاهش موجودی"
                                )}
                            </motion.button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}