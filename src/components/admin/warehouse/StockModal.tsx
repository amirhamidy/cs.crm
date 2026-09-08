"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownCircle, ArrowUpCircle, Boxes, Loader, X } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import {
    ApiProduct,
    ApiStockTransaction,
    ApiWarehouseStaff,
    STOCK_OUT_REASON_OPTIONS,
    StockOutReason,
} from "@/types/warehouse";
import { FloatingInput, FloatingSelect, FloatingTextarea } from "./FormControls";

interface StockModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: ApiProduct;
    staff: ApiWarehouseStaff[];
    onCompleted: (transaction: ApiStockTransaction) => void;
}

type Mode = "in" | "out";

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;
    if (!data) return fallback;
    const keys = ["detail", "quantity", "reason", "message", "error", "non_field_errors"];
    for (const key of keys) {
        const val = data[key];
        if (typeof val === "string") return val;
        if (Array.isArray(val) && typeof val[0] === "string") return val[0];
    }
    return fallback;
}

export default function StockModal({ isOpen, onClose, product, staff, onCompleted }: StockModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [mode, setMode] = useState<Mode>("in");
    const [performedById, setPerformedById] = useState("");
    const [quantity, setQuantity] = useState("");
    const [note, setNote] = useState("");
    const [reason, setReason] = useState<StockOutReason>("sale");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        setMode("in");
        setPerformedById("");
        setQuantity("");
        setNote("");
        setReason("sale");
        setError("");
    }, [isOpen]);

    function handleClose() {
        if (loading) return;
        onClose();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!performedById || !quantity) {
            setError("تعداد و ثبت‌کننده الزامی است");
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

            const { data } = await axiosInstance.post<ApiStockTransaction>(endpoint, payload);
            onCompleted(data);
            onClose();
        } catch (err) {
            setError(getErrorMessage(err, "خطا در ثبت تراکنش انبار"));
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
                        <div className="flex items-center justify-between px-8 pb-4 pt-8">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                                    style={{
                                        background: mode === "in"
                                            ? (isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)")
                                            : (isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)"),
                                    }}
                                >
                                    <Boxes
                                        size={15}
                                        className={mode === "in" ? "text-emerald-500" : "text-red-500"}
                                    />
                                </div>
                                <div>
                                    <h3
                                        className="truncate text-[14px] font-extrabold"
                                        style={{ color: textColor }}
                                    >
                                        {product.name}
                                    </h3>
                                    <p className="mt-0.5 text-[12px]" style={{ color: mutedText }}>
                                        ثبت تراکنش انبار
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

                        {/* Mode Toggle - ایندیگو/بنفش */}
                        <div className="px-8">
                            <div
                                className="flex gap-1 rounded-2xl p-1"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setMode("in")}
                                    className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12.5px] font-extrabold transition-colors"
                                    style={{
                                        color: mode === "in" ? "#059669" : mutedText,
                                    }}
                                >
                                    {mode === "in" && (
                                        <motion.div
                                            layoutId="stock-mode-pill"
                                            className="absolute inset-0 rounded-xl"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.06)" : "#ffffff",
                                                boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
                                            }}
                                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                        />
                                    )}
                                    <ArrowDownCircle size={14} className="relative" />
                                    <span className="relative">ورود کالا</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode("out")}
                                    className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12.5px] font-extrabold transition-colors"
                                    style={{
                                        color: mode === "out" ? "#dc2626" : mutedText,
                                    }}
                                >
                                    {mode === "out" && (
                                        <motion.div
                                            layoutId="stock-mode-pill"
                                            className="absolute inset-0 rounded-xl"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.06)" : "#ffffff",
                                                boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
                                            }}
                                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                        />
                                    )}
                                    <ArrowUpCircle size={14} className="relative" />
                                    <span className="relative">خروج کالا</span>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-4 px-8 pb-8 pt-5">
                            <FloatingSelect
                                label="ثبت‌کننده"
                                id="stock_performed_by"
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
                                label="تعداد"
                                id="stock_quantity"
                                type="number"
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
                                    onChange={(e) => setReason(e.target.value as StockOutReason)}
                                    dir="rtl"
                                >
                                    {STOCK_OUT_REASON_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </FloatingSelect>
                            )}

                            <FloatingTextarea
                                label="توضیحات"
                                id="stock_note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                dir="rtl"
                            />

                            {error && (
                                <p className="-mt-1 text-center text-[12px] font-semibold text-red-500">
                                    {error}
                                </p>
                            )}

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileTap={{ scale: 0.97 }}
                                className={`flex items-center justify-center rounded-full py-3 text-[13px] font-bold text-white transition-colors disabled:opacity-50 ${mode === "in"
                                        ? "hover:bg-emerald-500"
                                        : "hover:bg-red-500"
                                    }`}
                                style={{
                                    background: mode === "in"
                                        ? "linear-gradient(135deg, #10b981, #059669)"
                                        : "linear-gradient(135deg, #ef4444, #dc2626)",
                                }}
                            >
                                {loading ? (
                                    <Loader size={18} className="animate-spin" />
                                ) : mode === "in" ? (
                                    "ثبت ورود کالا"
                                ) : (
                                    "ثبت خروج کالا"
                                )}
                            </motion.button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}