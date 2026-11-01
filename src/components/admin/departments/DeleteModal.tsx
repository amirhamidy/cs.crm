"use client";

import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { Backdrop } from "@/components/ui/Backdrop";
import { panelMotion } from "@/lib/motion";
import { X, Loader, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";

interface Props {
    open: boolean;
    title: string;
    description: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function DeleteModal({ open, title, description, loading = false, onConfirm, onCancel }: Props) {
    const reduced = useReducedMotion() ?? false;
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
<Backdrop onClick={loading ? undefined : onCancel} />
                    <m.div {...panelMotion(false, reduced)} className="relative w-full max-w-[360px] rounded-[2rem] overflow-hidden border p-5"
                        style={{
                            background: isDark ? "#111827" : "#ffffff",
                            borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
                            boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
                        }}
                        dir="rtl"
                    >
                        <div
                            className="flex items-center justify-between px-2 py-2 border-b"
                            style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
                        >
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)" }}
                                >
                                    <Trash2 size={14} className="text-red-500" />
                                </div>
                                <h3 className="text-[13.5px] font-extrabold text-gray-900 dark:text-white">{title}</h3>
                            </div>
                            <button
                                onClick={onCancel}
                                disabled={loading}
                                className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40"
                                style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                                type="button"
                            >
                                <X size={13} />
                            </button>
                        </div>

                        <div className="px-2 py-4 flex flex-col gap-4">
                            <p className="text-[12.5px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                {description}
                            </p>

                            <div className="flex gap-2">
                                <button
                                    onClick={onCancel}
                                    disabled={loading}
                                    className="flex-1 py-2.5 rounded-2xl text-[12.5px] font-bold transition-colors disabled:opacity-40"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                                        color: isDark ? "#9ca3af" : "#6b7280",
                                    }}
                                    type="button"
                                >
                                    انصراف
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={loading}
                                    className="flex-1 py-2.5 rounded-2xl text-[12.5px] font-bold text-white flex items-center justify-center transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                                    style={{
                                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                        boxShadow: "0 4px 14px rgba(239,68,68,0.3)",
                                    }}
                                    type="button"
                                >
                                    {loading ? <Loader size={15} className="animate-spin" /> : "حذف"}
                                </button>
                            </div>
                        </div>
                    </m.div>
                </div>
            )}
        </AnimatePresence>
    );
}
