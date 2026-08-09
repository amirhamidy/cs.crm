"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GitBranch } from "lucide-react";
import { useTheme } from "next-themes";
import { Stage } from "./types";

interface Props {
    open: boolean;
    stage: Stage | null;
    accent: string;
    onClose: () => void;
    onSubmit: (values: { name: string; description?: string; order: number }) => void;
}

export default function EditStageModal({
    open,
    stage,
    accent,
    onClose,
    onSubmit,
}: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [order, setOrder] = useState("1");

    useEffect(() => {
        if (!open || !stage) return;
        setName(stage.name);
        setDescription(stage.description ?? "");
        setOrder(String(stage.order));
    }, [open, stage]);

    useEffect(() => {
        if (!open) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    const canSubmit = name.trim().length > 0;

    const handleSubmit = () => {
        if (!canSubmit) return;

        const parsedOrder = Number(order);
        const validOrder =
            Number.isFinite(parsedOrder) && parsedOrder > 0 ? Math.floor(parsedOrder) : 1;

        onSubmit({
            name: name.trim(),
            description: description.trim() || undefined,
            order: validOrder,
        });

        onClose();
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
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.93, y: 16 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.93, y: 16 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-[420px] max-h-[90vh] flex flex-col rounded-3xl overflow-hidden border"
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
                                        ویرایش مرحله
                                    </h3>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                        مشخصات مرحله را ویرایش کنید
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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

                        <div className="p-5 space-y-4 overflow-y-auto">
                            <div className="relative">
                                <input
                                    id="edit_stage_name"
                                    placeholder=" "
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="peer w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-violet-500"
                                />
                                <label
                                    htmlFor="edit_stage_name"
                                    className={`absolute right-4 pointer-events-none transition-all duration-200 bg-white dark:bg-[#0f172a] px-1 rounded ${name.trim()
                                            ? "top-0 -translate-y-1/2 text-[11px] text-indigo-500 dark:text-violet-400"
                                            : "top-1/2 -translate-y-1/2 text-sm text-gray-400 peer-focus:top-0 peer-focus:text-[11px] peer-focus:text-indigo-500 dark:peer-focus:text-violet-400"
                                        }`}
                                >
                                    نام مرحله
                                </label>
                            </div>

                            <div className="relative">
                                <textarea
                                    id="edit_stage_description"
                                    placeholder=" "
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="peer w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none transition-all duration-200 resize-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-violet-500"
                                />
                                <label
                                    htmlFor="edit_stage_description"
                                    className={`absolute right-4 pointer-events-none transition-all duration-200 bg-white dark:bg-[#0f172a] px-1 rounded ${description.trim()
                                            ? "top-0 -translate-y-1/2 text-[11px] text-indigo-500 dark:text-violet-400"
                                            : "top-5 text-sm text-gray-400 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:text-indigo-500 dark:peer-focus:text-violet-400"
                                        }`}
                                >
                                    توضیحات
                                </label>
                            </div>

                            <div className="relative">
                                <input
                                    id="edit_stage_order"
                                    type="number"
                                    min={1}
                                    placeholder=" "
                                    value={order}
                                    onChange={(e) => setOrder(e.target.value)}
                                    className="peer w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-violet-500"
                                />
                                <label
                                    htmlFor="edit_stage_order"
                                    className={`absolute right-4 pointer-events-none transition-all duration-200 bg-white dark:bg-[#0f172a] px-1 rounded ${order.trim()
                                            ? "top-0 -translate-y-1/2 text-[11px] text-indigo-500 dark:text-violet-400"
                                            : "top-1/2 -translate-y-1/2 text-sm text-gray-400 peer-focus:top-0 peer-focus:text-[11px] peer-focus:text-indigo-500 dark:peer-focus:text-violet-400"
                                        }`}
                                >
                                    ترتیب مرحله
                                </label>
                            </div>
                        </div>

                        <div
                            className="px-5 py-4 border-t"
                            style={{
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(0,0,0,0.06)",
                            }}
                        >
                            <button
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                                className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{
                                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                    boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                                }}
                                type="button"
                            >
                                ذخیره تغییرات
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
