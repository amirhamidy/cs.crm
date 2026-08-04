"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GitBranch, CheckCircle2 } from "lucide-react";
import { Department } from "./types";

const STAGE_COLORS = [
    "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
    "#10b981", "#ef4444", "#06b6d4", "#f97316",
];

interface Props {
    open: boolean;
    department: Department | null;
    onClose: () => void;
    onSubmit: (data: { name: string; color: string }) => void;
}

export default function AddStageModal({ open, department, onClose, onSubmit }: Props) {
    const [name, setName] = useState("");
    const [color, setColor] = useState(STAGE_COLORS[0]);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    const handleClose = () => {
        if (success) return;
        setName("");
        setColor(STAGE_COLORS[0]);
        onClose();
    };

    const handleSubmit = () => {
        if (!name.trim()) return;
        setSuccess(true);
        setTimeout(() => {
            onSubmit({ name: name.trim(), color });
            setSuccess(false);
            setName("");
            setColor(STAGE_COLORS[0]);
            onClose();
        }, 1400);
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
                        onClick={handleClose}
                        className="fixed inset-0 z-40 bg-black/30 dark:bg-black/60 backdrop-blur-sm"
                    />

                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, scale: 0.93, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.93, y: 16 }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-md max-h-[90vh] flex flex-col
                                bg-white dark:bg-[#141414]
                                border border-gray-200 dark:border-white/[0.08]
                                rounded-2xl shadow-2xl"
                            dir="rtl"
                        >
                            <div
                                className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none"
                                style={{ background: color }}
                            />

                            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] flex-shrink-0">
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                        مرحله جدید
                                    </h2>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        {department?.name ?? ""}
                                    </p>
                                </div>
                                <button
                                    onClick={handleClose}
                                    disabled={success}
                                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white
                                        hover:bg-gray-100 dark:hover:bg-white/[0.06]
                                        transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="relative z-10 flex-1 overflow-y-auto px-6 py-5 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                        نام مرحله
                                    </label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                        placeholder="مثال: ارزیابی اولیه"
                                        className="w-full rounded-xl px-3 py-2.5 text-sm
                                            bg-gray-50 dark:bg-white/[0.04]
                                            border border-gray-200 dark:border-white/10
                                            text-gray-800 dark:text-white
                                            placeholder:text-gray-400 dark:placeholder:text-gray-600
                                            focus:border-gray-400 dark:focus:border-white/30
                                            focus:ring-2 focus:ring-gray-100 dark:focus:ring-white/5
                                            outline-none transition-all duration-200"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                        رنگ مرحله
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
                                        {STAGE_COLORS.map((c) => (
                                            <motion.button
                                                key={c}
                                                whileHover={{ scale: 1.15 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setColor(c)}
                                                className="relative w-8 h-8 rounded-xl"
                                                style={{ background: c }}
                                            >
                                                <AnimatePresence>
                                                    {color === c && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            exit={{ scale: 0 }}
                                                            className="absolute inset-0 rounded-xl ring-2 ring-white dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-[#141414]"
                                                        />
                                                    )}
                                                </AnimatePresence>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {name.trim() && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 8 }}
                                            className="rounded-xl border p-3 flex items-center gap-2.5"
                                            style={{
                                                borderColor: `${color}30`,
                                                background: `${color}08`,
                                            }}
                                        >
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                                            <span className="text-sm text-gray-800 dark:text-white font-medium">{name}</span>
                                            <span
                                                className="mr-auto text-[10px] px-2 py-0.5 rounded-full font-medium"
                                                style={{
                                                    background: `${color}20`,
                                                    color: color,
                                                }}
                                            >
                                                پیش‌نمایش
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="relative z-10 px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] flex-shrink-0">
                                <AnimatePresence mode="wait">
                                    {success ? (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="flex items-center justify-center gap-2 py-3 rounded-xl
                                                bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium"
                                        >
                                            <CheckCircle2 size={16} />
                                            مرحله با موفقیت اضافه شد
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="actions"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex gap-3"
                                        >
                                            <button
                                                onClick={handleClose}
                                                className="flex-1 py-2.5 rounded-xl text-sm font-medium
                                                    text-gray-500 dark:text-gray-400
                                                    bg-gray-100 dark:bg-white/[0.05]
                                                    hover:bg-gray-200 dark:hover:bg-white/[0.09]
                                                    transition-colors duration-200"
                                            >
                                                انصراف
                                            </button>
                                            <button
                                                onClick={handleSubmit}
                                                disabled={!name.trim()}
                                                className="flex-1 py-2.5 rounded-xl text-sm font-medium
                                                    text-white transition-all duration-200
                                                    disabled:opacity-40 disabled:cursor-not-allowed"
                                                style={{
                                                    background: color,
                                                    boxShadow: `0 4px 16px ${color}40`,
                                                }}
                                            >
                                                افزودن مرحله
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}