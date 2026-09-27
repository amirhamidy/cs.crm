"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Trash2, X } from "lucide-react";
import { createPortal } from "react-dom";

interface Props {
    open: boolean;
    title: string;
    description: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function PurchasingDeleteModal({
    open,
    title,
    description,
    loading = false,
    onConfirm,
    onCancel,
}: Props) {
    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
                    onClick={() => !loading && onCancel()}
                    dir="rtl"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-sm rounded-[2rem] border border-gray-100 bg-white p-6 text-right shadow-2xl dark:border-white/[0.08] dark:bg-[#111a2d]"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10">
                                <Trash2 size={19} />
                            </div>

                            <button
                                type="button"
                                onClick={() => !loading && onCancel()}
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <h4 className="mt-4 text-[14px] font-extrabold text-gray-900 dark:text-white">
                            {title}
                        </h4>
                        <p className="mt-2 text-[11.5px] font-medium leading-6 text-gray-400 dark:text-white/40">
                            {description}
                        </p>

                        <div className="mt-5 flex gap-2">
                            <button
                                type="button"
                                disabled={loading}
                                onClick={onCancel}
                                className="flex h-10 flex-1 items-center justify-center rounded-full bg-gray-100 text-[11.5px] font-extrabold text-gray-500 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-white/[0.06] dark:text-white/50 dark:hover:bg-white/[0.1]"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                disabled={loading}
                                onClick={onConfirm}
                                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-red-500 text-[11.5px] font-extrabold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Trash2 size={14} />
                                )}
                                حذف
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}