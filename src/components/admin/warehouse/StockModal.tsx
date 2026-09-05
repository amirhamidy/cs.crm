"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownCircle, ArrowUpCircle, Loader, X } from "lucide-react";
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
                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    {product.name}
                                </h3>
                                <p className="mt-0.5 text-[11px] text-gray-400">ثبت تراکنش انبار</p>
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

                        <div className="mb-6 flex gap-2 rounded-2xl bg-gray-100 p-1 dark:bg-white/[0.05]">
                            <button
                                type="button"
                                onClick={() => setMode("in")}
                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-extrabold transition-colors ${
                                    mode === "in"
                                        ? "bg-white text-emerald-600 shadow-sm dark:bg-[#1e293b]"
                                        : "text-gray-400"
                                }`}
                            >
                                <ArrowDownCircle size={14} />
                                ورود کالا
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode("out")}
                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-extrabold transition-colors ${
                                    mode === "out"
                                        ? "bg-white text-red-500 shadow-sm dark:bg-[#1e293b]"
                                        : "text-gray-400"
                                }`}
                            >
                                <ArrowUpCircle size={14} />
                                خروج کالا
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-5">
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
                                <p className="text-center text-[11.5px] font-semibold text-red-500 -mt-2">
                                    {error}
                                </p>
                            )}

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileTap={{ scale: 0.97 }}
                                className={`flex items-center justify-center rounded-full py-3 text-sm font-bold text-white transition-colors disabled:opacity-50 ${
                                    mode === "in"
                                        ? "bg-emerald-600 hover:bg-emerald-500"
                                        : "bg-red-600 hover:bg-red-500"
                                }`}
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