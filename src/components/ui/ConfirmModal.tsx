"use client";

import { useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader, X } from "lucide-react";

interface ConfirmModalProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    loading?: boolean;
    error?: string | null;
    onConfirm: () => void;
    onClose: () => void;
}

export function ConfirmModal({
    open,
    title,
    message,
    confirmLabel = "تایید",
    cancelLabel = "انصراف",
    danger = false,
    loading = false,
    error = null,
    onConfirm,
    onClose,
}: ConfirmModalProps) {
    // Close on Escape unless busy
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !loading) onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, loading, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
                    onClick={() => !loading && onClose()}
                >
                    <m.div
                        initial={{ opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="my-8 w-full max-w-sm overflow-visible rounded-[2.5rem] border border-gray-100 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#0f172a]"
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                    >
                        <div className="flex items-center justify-between px-8 pb-4 pt-8">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                                        danger
                                            ? "bg-red-50 text-red-600 dark:bg-red-500/10"
                                            : "bg-blue-50 text-blue-600 dark:bg-blue-500/10"
                                    }`}
                                >
                                    <AlertTriangle size={18} />
                                </div>
                                <h3 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                                    {title}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-4 px-8 pb-8">
                            <p className="text-[13px] leading-6 text-gray-500 dark:text-gray-400">
                                {message}
                            </p>
                            {error && (
                                <p className="rounded-2xl bg-red-50 px-4 py-2.5 text-[12px] font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
                                    {error}
                                </p>
                            )}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onConfirm}
                                    disabled={loading}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-4xl px-5 py-3 text-sm font-bold text-white transition-colors disabled:opacity-60 ${
                                        danger
                                            ? "bg-red-600 hover:bg-red-700"
                                            : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                                >
                                    {loading && (
                                        <Loader
                                            size={14}
                                            className="animate-spin"
                                        />
                                    )}
                                    {confirmLabel}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="flex-1 rounded-4xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-white/[0.08] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                                >
                                    {cancelLabel}
                                </button>
                            </div>
                        </div>
                    </m.div>
                </m.div>
            )}
        </AnimatePresence>
    );
}
