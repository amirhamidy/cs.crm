"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2, X, XCircle } from "lucide-react";
import {
    approveOrderTaskByManager,
    apiErrorMessage,
    rejectOrderTaskByManager,
} from "@/lib/warehouseApi";
import type { ApiOrderTask } from "@/types/warehouse";

interface Props {
    action: "approve" | "reject" | null;
    orderTask: ApiOrderTask;
    onClose: () => void;
    onSuccess: () => void | Promise<void>;
}

export default function ManagerDecisionModal({ action, orderTask, onClose, onSuccess }: Props) {
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const isApprove = action === "approve";
    const isOpen = action !== null;

    useEffect(() => {
        if (isOpen) {
            setNote("");
            setError("");
        }
    }, [isOpen, orderTask.id]);

    const close = () => !submitting && onClose();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!action) return;
        if (!isApprove && !note.trim()) {
            setError("ذکر دلیل رد الزامی است");
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            if (isApprove) {
                await approveOrderTaskByManager(orderTask.id, { note });
            } else {
                await rejectOrderTaskByManager(orderTask.id, note);
            }
            await onSuccess();
            onClose();
        } catch (err) {
            setError(
                apiErrorMessage(
                    err,
                    isApprove ? "تایید مدیر انجام نشد" : "رد مدیر انجام نشد",
                ),
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={close}
                >
                    <motion.form
                        dir="rtl"
                        onSubmit={handleSubmit}
                        onClick={(e) => e.stopPropagation()}
                        initial={{ scale: 0.96, y: 8 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.96, y: 8 }}
                        className="w-full max-w-md rounded-3xl bg-white p-6 dark:bg-[#0f1117]"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    {isApprove ? "تایید مدیر سفارش فروش" : "رد سفارش فروش"}
                                </h3>
                                <p className="mt-0.5 text-[11px] text-gray-400">{orderTask.title}</p>
                            </div>
                            <button type="button" onClick={close} disabled={submitting} className="text-gray-400 hover:text-gray-600">
                                <X size={16} />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-3 flex items-start gap-2 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10">
                                <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                                <p className="text-[11.5px] font-semibold text-red-500">{error}</p>
                            </div>
                        )}

                        <label className="mb-2 block text-[11.5px] font-bold text-gray-400">
                            یادداشت {!isApprove && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            placeholder={isApprove ? "توضیحات (اختیاری)" : "دلیل رد را وارد کنید..."}
                            className="w-full resize-none rounded-2xl border border-gray-100 bg-gray-50 p-3.5 text-[12.5px] font-bold text-gray-900 outline-none focus:border-blue-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white"
                        />

                        <div className="mt-5 flex gap-2">
                            <button type="button" onClick={close} disabled={submitting} className="h-11 flex-1 rounded-full bg-gray-100 text-[13px] font-bold text-gray-600 dark:bg-white/[0.05] dark:text-gray-300">
                                انصراف
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-[13px] font-bold text-white disabled:opacity-40 ${isApprove ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"}`}
                            >
                                {submitting ? <Loader2 size={15} className="animate-spin" /> : isApprove ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                {isApprove ? "تایید نهایی" : "رد سفارش"}
                            </button>
                        </div>
                    </motion.form>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
