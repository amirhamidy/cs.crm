"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Loader2 } from "lucide-react";

interface Props {
    open: boolean;
    title: string;
    description: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function DeleteModal({
    open,
    title,
    description,
    loading = false,
    onConfirm,
    onCancel,
}: Props) {
    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onCancel}
                        className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60"
                    />

                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, scale: 0.93, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.93, y: 16 }}
                            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-md bg-white dark:bg-[#0f0f13] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl pointer-events-auto"
                            dir="rtl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                        <AlertTriangle size={14} className="text-red-500" />
                                    </div>
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                        {title}
                                    </h2>
                                </div>

                                <button
                                    onClick={onCancel}
                                    disabled={loading}
                                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-5">
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {description}
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex items-center gap-3">
                                <button
                                    onClick={onCancel}
                                    disabled={loading}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    انصراف
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={loading}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all duration-150 shadow-lg shadow-red-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            در حال حذف...
                                        </>
                                    ) : (
                                        "حذف"
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
