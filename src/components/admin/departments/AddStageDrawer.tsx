"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GitBranch, CheckCircle2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Department } from "./types";

interface Props {
    open: boolean;
    department: Department | null;
    onClose: () => void;
    onSubmit: (data: { name: string }) => void;
}

export default function AddStageModal({ open, department, onClose, onSubmit }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [name, setName] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!open) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, success]);

    const handleClose = () => {
        if (success) return;
        setName("");
        onClose();
    };

    const handleSubmit = () => {
        if (!name.trim()) return;

        setSuccess(true);

        setTimeout(() => {
            onSubmit({ name: name.trim() });
            setSuccess(false);
            setName("");
            onClose();
        }, 1400);
    };

    return (
        <AnimatePresence>
            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{
                        background: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(2px)",
                    }}
                    onClick={handleClose}
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
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                    <GitBranch size={15} className="text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        مرحله جدید
                                    </h3>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                        {department?.name ?? ""}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleClose}
                                disabled={success}
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

                        <div className="p-5 space-y-4">
                            <div className="relative">
                                <input
                                    id="stage_name"
                                    placeholder=" "
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                    className="peer w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-violet-500"
                                />
                                <label
                                    htmlFor="stage_name"
                                    className={`absolute right-4 pointer-events-none transition-all duration-200 bg-white dark:bg-[#0f172a] px-1 rounded ${name.trim()
                                            ? "top-0 -translate-y-1/2 text-[11px] text-indigo-500 dark:text-violet-400"
                                            : "top-1/2 -translate-y-1/2 text-sm text-gray-400 peer-focus:top-0 peer-focus:text-[11px] peer-focus:text-indigo-500 dark:peer-focus:text-violet-400"
                                        }`}
                                >
                                    نام مرحله
                                </label>
                            </div>

                            <AnimatePresence mode="wait">
                                {success ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium"
                                    >
                                        <CheckCircle2 size={16} />
                                        مرحله با موفقیت اضافه شد
                                    </motion.div>
                                ) : (
                                    <motion.button
                                        key="actions"
                                        onClick={handleSubmit}
                                        disabled={!name.trim()}
                                        className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                                        style={{
                                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                            boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                                        }}
                                        type="button"
                                    >
                                        افزودن مرحله
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
