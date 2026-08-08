"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GitBranch } from "lucide-react";
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
            Number.isFinite(parsedOrder) && parsedOrder > 0
                ? Math.floor(parsedOrder)
                : 1;

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
                <>
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        onClick={onClose}
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
                            className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-white dark:bg-[#0f0f13] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl pointer-events-auto"
                            dir="rtl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                                        style={{
                                            background: `linear-gradient(135deg, ${accent}cc, ${accent}66)`,
                                        }}
                                    >
                                        <GitBranch size={14} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                            ویرایش مرحله
                                        </h2>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                            مشخصات مرحله را ویرایش کنید
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                                {/* Name */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                                        نام مرحله
                                    </label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="نام مرحله..."
                                        className="w-full rounded-xl px-3 py-2.5 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 outline-none transition-all duration-200"
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                                        توضیحات
                                        <span className="text-gray-400 dark:text-gray-600 mr-1">(اختیاری)</span>
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="توضیحات مرحله..."
                                        rows={3}
                                        className="w-full rounded-xl px-3 py-2.5 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 outline-none transition-all duration-200 resize-none"
                                    />
                                </div>

                                {/* Order */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                                        ترتیب مرحله
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={order}
                                        onChange={(e) => setOrder(e.target.value)}
                                        className="w-full rounded-xl px-3 py-2.5 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 outline-none transition-all duration-200"
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10">
                                <button
                                    onClick={handleSubmit}
                                    disabled={!canSubmit}
                                    className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                                    style={{
                                        backgroundColor: accent,
                                        boxShadow: `0 8px 20px ${accent}30`,
                                    }}
                                >
                                    ذخیره تغییرات
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
