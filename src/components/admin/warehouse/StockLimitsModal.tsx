"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { apiErrorMessage, updateStockLimits } from "@/lib/warehouseApi";
import type { ApiStockInfo } from "@/types/warehouse";

interface StockLimitsModalProps {
    isOpen: boolean;
    stock: ApiStockInfo | null;
    onClose: () => void;
    onSaved: () => void;
}

const inputClass =
    "h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-[13px] font-bold text-gray-900 outline-none transition-colors focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white";

export default function StockLimitsModal({
    isOpen,
    stock,
    onClose,
    onSaved,
}: StockLimitsModalProps) {
    const [minimum, setMinimum] = useState("");
    const [maximum, setMaximum] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen || !stock) return;
        setMinimum(String(stock.minimum_stock ?? 0));
        setMaximum(String(stock.maximum_stock ?? 0));
        setError("");
    }, [isOpen, stock]);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!stock) return;

        const min = Number(minimum);
        const max = Number(maximum);

        if (minimum.trim() === "" || maximum.trim() === "" || !Number.isFinite(min) || !Number.isFinite(max)) {
            setError("مقادیر وارد شده معتبر نیستند");
            return;
        }

        if (min < 0 || max < 0) {
            setError("مقادیر نمی‌توانند منفی باشند");
            return;
        }

        if (min > max) {
            setError("حداقل موجودی نمی‌تواند بیشتر از حداکثر موجودی باشد");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await updateStockLimits(stock.id, {
                minimum_stock: min,
                maximum_stock: max,
            });
            onSaved();
        } catch (err) {
            setError(apiErrorMessage(err, "خطا در ویرایش حداقل و حداکثر موجودی"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && stock && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onClick={() => !loading && onClose()}
                    dir="rtl"
                >
                    <motion.form
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={handleSubmit}
                        className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                                    <ShieldCheck size={18} />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        ویرایش حداقل و حداکثر
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                                        {stock.product_name}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <label className="block">
                                <span className="mb-1.5 block text-[11px] font-bold text-gray-500 dark:text-gray-400">
                                    حداقل موجودی
                                </span>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    value={minimum}
                                    onChange={(e) => setMinimum(e.target.value)}
                                    className={inputClass}
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-[11px] font-bold text-gray-500 dark:text-gray-400">
                                    حداکثر موجودی
                                </span>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    value={maximum}
                                    onChange={(e) => setMaximum(e.target.value)}
                                    className={inputClass}
                                />
                            </label>
                        </div>

                        {error && (
                            <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-[11.5px] font-bold text-red-500">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-[13px] font-bold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {loading && <Loader2 size={15} className="animate-spin" />}
                            ذخیره تغییرات
                        </button>
                    </motion.form>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
