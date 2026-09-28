"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader, Trash2, X } from "lucide-react";

interface Props {
    open: boolean;
    title: string;
    description: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function QCDeleteModal({ open, title, description, loading = false, onConfirm, onCancel }: Props) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center px-4"
                    style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                    onClick={loading ? undefined : onCancel}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 16, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 16, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="w-full max-w-[360px] overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white p-5 dark:border-white/[0.07] dark:bg-[#0f172a]"
                        style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.35)" }}
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                    >
                        <div className="flex items-center justify-between border-b border-black/[0.06] px-2 py-2 dark:border-white/[0.06]">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/[0.08] dark:bg-red-500/[0.12]">
                                    <Trash2 size={14} className="text-red-500" />
                                </div>
                                <h3 className="truncate text-[13.5px] font-extrabold text-gray-900 dark:text-white">{title}</h3>
                            </div>
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={loading}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                            >
                                <X size={13} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-4 px-2 py-4">
                            <p className="text-[12.5px] leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    disabled={loading}
                                    className="flex-1 rounded-2xl bg-black/[0.04] py-2.5 text-[12.5px] font-bold text-slate-500 transition-colors disabled:opacity-40 dark:bg-white/[0.05] dark:text-slate-400"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="button"
                                    onClick={onConfirm}
                                    disabled={loading}
                                    className="flex flex-1 items-center justify-center rounded-2xl py-2.5 text-[12.5px] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                                    style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 4px 14px rgba(239,68,68,0.3)" }}
                                >
                                    {loading ? <Loader size={15} className="animate-spin" /> : "حذف"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}