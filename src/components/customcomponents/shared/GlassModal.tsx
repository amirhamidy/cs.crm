"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ReactNode } from "react";
import { useTheme } from "next-themes";

interface GlassModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    icon?: ReactNode;
    children: ReactNode;
    maxWidth?: string;
}

export default function GlassModal({
    open,
    onClose,
    title,
    description,
    icon,
    children,
    maxWidth = "max-w-2xl",
}: GlassModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[120] flex items-center justify-center px-4"
                    style={{
                        background: isDark
                            ? "rgba(0,0,0,0.62)"
                            : "rgba(15,23,42,0.38)",
                        backdropFilter: "blur(8px)",
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 18, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 18, scale: 0.98 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                        className={`w-full ${maxWidth} overflow-hidden rounded-[2rem] border shadow-2xl`}
                        style={{
                            background: isDark ? "#0b1220" : "#ffffff",
                            borderColor: isDark
                                ? "rgba(255,255,255,0.08)"
                                : "rgba(15,23,42,0.08)",
                            boxShadow: isDark
                                ? "0 30px 80px rgba(0,0,0,0.45)"
                                : "0 30px 80px rgba(15,23,42,0.14)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                    >
                        <div
                            className="flex items-center justify-between border-b px-6 py-5 sm:px-8"
                            style={{
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(15,23,42,0.06)",
                            }}
                        >
                            <div className="flex items-center gap-3">
                                {icon && (
                                    <div
                                        className="flex h-10 w-10 items-center justify-center rounded-2xl"
                                        style={{
                                            background: isDark
                                                ? "rgba(59,130,246,0.12)"
                                                : "rgba(59,130,246,0.08)",
                                            color: isDark ? "#93c5fd" : "#2563eb",
                                        }}
                                    >
                                        {icon}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white">
                                        {title}
                                    </h3>
                                    {description && (
                                        <p className="mt-0.5 text-[11px] text-slate-400">
                                            {description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-9 w-9 items-center justify-center rounded-2xl transition-colors"
                                style={{
                                    background: isDark
                                        ? "rgba(255,255,255,0.05)"
                                        : "rgba(15,23,42,0.05)",
                                    color: isDark ? "#cbd5e1" : "#64748b",
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-6 sm:p-8">{children}</div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
