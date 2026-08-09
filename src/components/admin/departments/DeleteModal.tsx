"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";

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
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    return (
        <AnimatePresence>
            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{
                        background: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(2px)",
                    }}
                    onClick={loading ? undefined : onCancel}
                >
                    <motion.div
                        initial={{ scale: 0.93, y: 16 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.93, y: 16 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-[400px] rounded-3xl overflow-hidden border"
                        style={{
                            background: isDark ? "#0f172a" : "#ffffff",
                            borderColor: isDark
                                ? "rgba(255,255,255,0.07)"
                                : "rgba(0,0,0,0.06)",
                            boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
                        }}
                        dir="rtl"
                    >
                        <div
                            className="px-5 py-4 border-b flex items-center justify-between"
                            style={{
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(0,0,0,0.06)",
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                    <AlertTriangle size={15} className="text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        {title}
                                    </h3>
                                </div>
                            </div>

                            <button
                                onClick={onCancel}
                                disabled={loading}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40"
                                style={{
                                    background: isDark
                                        ? "rgba(255,255,255,0.05)"
                                        : "rgba(0,0,0,0.04)",
                                }}
                                type="button"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <div className="p-5">
                            <p className="text-[13px] leading-7 text-gray-600 dark:text-gray-400">
                                {description}
                            </p>
                        </div>

                        <div
                            className="px-5 py-4 border-t flex items-center gap-2"
                            style={{
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(0,0,0,0.06)",
                            }}
                        >
                            <button
                                onClick={onCancel}
                                disabled={loading}
                                className="flex-1 py-2.5 rounded-xl text-[12.5px] font-bold transition-colors disabled:opacity-40"
                                style={{
                                    background: isDark
                                        ? "rgba(255,255,255,0.05)"
                                        : "rgba(0,0,0,0.04)",
                                    color: isDark ? "#cbd5e1" : "#475569",
                                }}
                                type="button"
                            >
                                انصراف
                            </button>

                            <button
                                onClick={onConfirm}
                                disabled={loading}
                                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
                                style={{
                                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                    boxShadow: "0 4px 14px rgba(239,68,68,0.28)",
                                }}
                                type="button"
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
            )}
        </AnimatePresence>
    );
}
