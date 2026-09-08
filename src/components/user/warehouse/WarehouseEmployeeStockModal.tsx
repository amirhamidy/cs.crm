"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownCircle, ArrowUpCircle, Boxes, Loader, X } from "lucide-react";
import { useTheme } from "next-themes";
import type { AxiosError } from "axios";
import axiosInstance from "@/lib/axiosInstance";
import {
    ApiProduct,
    ApiStockTransaction,
    STOCK_OUT_REASON_OPTIONS,
    StockOutReason,
} from "@/types/warehouse";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    product: ApiProduct;
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

        if (Array.isArray(value) && typeof value[0] === "string") {
            return value[0];
        }
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
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

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

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (!performedById) {
            setError("اطلاعات کارمند انبار یافت نشد");
            return;
        }

        if (!quantity || Number(quantity) <= 0) {
            setError("تعداد معتبر وارد کنید");
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

            if (mode === "out") {
                payload.reason = reason;
            }

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

    const colors = {
        bg: isDark ? "#0f172a" : "#ffffff",
        border: isDark
            ? "rgba(255,255,255,0.06)"
            : "rgba(15,23,42,0.06)",
        text: isDark ? "#f1f5f9" : "#1e293b",
        muted: isDark ? "#94a3b8" : "#64748b",
        input: isDark
            ? "rgba(255,255,255,0.04)"
            : "rgba(15,23,42,0.035)",
    };

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
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                        }}
                        dir="rtl"
                    >
                        <div className="flex items-center justify-between px-7 pb-4 pt-7">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <div
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
                                    style={{
                                        background:
                                            mode === "in"
                                                ? "rgba(16,185,129,0.1)"
                                                : "rgba(239,68,68,0.1)",
                                    }}
                                >
                                    <Boxes
                                        size={16}
                                        className={
                                            mode === "in"
                                                ? "text-emerald-500"
                                                : "text-red-500"
                                        }
                                    />
                                </div>

                                <div className="min-w-0">
                                    <h3
                                        className="truncate text-[14px] font-extrabold"
                                        style={{ color: colors.text }}
                                    >
                                        {product.name}
                                    </h3>

                                    <p
                                        className="mt-0.5 text-[12px]"
                                        style={{ color: colors.muted }}
                                    >
                                        مدیریت موجودی محصول
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={loading}
                                onClick={onClose}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl disabled:opacity-40"
                                style={{
                                    background: colors.input,
                                    color: colors.muted,
                                }}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <div className="px-7">
                            <div
                                className="flex gap-1 rounded-2xl p-1"
                                style={{ background: colors.input }}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode("in");
                                        setError("");
                                    }}
                                    className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12.5px] font-extrabold"
                                    style={{
                                        color:
                                            mode === "in"
                                                ? "#059669"
                                                : colors.muted,
                                    }}
                                >
                                    {mode === "in" && (
                                        <motion.div
                                            layoutId="employee-stock-mode"
                                            className="absolute inset-0 rounded-xl"
                                            style={{
                                                background: isDark
                                                    ? "rgba(255,255,255,0.06)"
                                                    : "#ffffff",
                                            }}
                                        />
                                    )}

                                    <ArrowDownCircle
                                        size={14}
                                        className="relative"
                                    />

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
                                    className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12.5px] font-extrabold"
                                    style={{
                                        color:
                                            mode === "out"
                                                ? "#dc2626"
                                                : colors.muted,
                                    }}
                                >
                                    {mode === "out" && (
                                        <motion.div
                                            layoutId="employee-stock-mode"
                                            className="absolute inset-0 rounded-xl"
                                            style={{
                                                background: isDark
                                                    ? "rgba(255,255,255,0.06)"
                                                    : "#ffffff",
                                            }}
                                        />
                                    )}

                                    <ArrowUpCircle
                                        size={14}
                                        className="relative"
                                    />

                                    <span className="relative">
                                        کاهش موجودی
                                    </span>
                                </button>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-4 px-7 pb-7 pt-5"
                            autoComplete="off"
                        >
                            <label className="flex flex-col gap-1.5">
                                <span
                                    className="px-1 text-[12px] font-bold"
                                    style={{ color: colors.muted }}
                                >
                                    تعداد
                                </span>

                                <input
                                    type="number"
                                    min="0.01"
                                    step="any"
                                    value={quantity}
                                    onChange={(e) => {
                                        setQuantity(e.target.value);
                                        setError("");
                                    }}
                                    className="h-11 rounded-2xl border px-4 text-[13px] font-semibold outline-none transition-all"
                                    style={{
                                        background: colors.input,
                                        borderColor: colors.border,
                                        color: colors.text,
                                    }}
                                    dir="ltr"
                                />
                            </label>

                            {mode === "out" && (
                                <label className="flex flex-col gap-1.5">
                                    <span
                                        className="px-1 text-[12px] font-bold"
                                        style={{ color: colors.muted }}
                                    >
                                        دلیل خروج
                                    </span>

                                    <select
                                        value={reason}
                                        onChange={(e) =>
                                            setReason(
                                                e.target
                                                    .value as StockOutReason
                                            )
                                        }
                                        className="h-11 rounded-2xl border px-4 text-[13px] font-semibold outline-none"
                                        style={{
                                            background: colors.input,
                                            borderColor: colors.border,
                                            color: colors.text,
                                        }}
                                    >
                                        {STOCK_OUT_REASON_OPTIONS.map(
                                            (item) => (
                                                <option
                                                    key={item.value}
                                                    value={item.value}
                                                >
                                                    {item.label}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>
                            )}

                            <label className="flex flex-col gap-1.5">
                                <span
                                    className="px-1 text-[12px] font-bold"
                                    style={{ color: colors.muted }}
                                >
                                    توضیحات
                                </span>

                                <textarea
                                    value={note}
                                    onChange={(e) =>
                                        setNote(e.target.value)
                                    }
                                    rows={3}
                                    className="resize-none rounded-2xl border px-4 py-3 text-[13px] font-semibold outline-none"
                                    style={{
                                        background: colors.input,
                                        borderColor: colors.border,
                                        color: colors.text,
                                    }}
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
                                className="flex items-center justify-center rounded-full py-3 text-[13px] font-bold text-white disabled:opacity-50"
                                style={{
                                    background:
                                        mode === "in"
                                            ? "linear-gradient(135deg,#10b981,#059669)"
                                            : "linear-gradient(135deg,#ef4444,#dc2626)",
                                }}
                            >
                                {loading ? (
                                    <Loader
                                        size={18}
                                        className="animate-spin"
                                    />
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