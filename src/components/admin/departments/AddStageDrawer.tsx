"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GitBranch, CheckCircle2 } from "lucide-react";
import { Department } from "./types";

interface Props {
    open: boolean;
    department: Department | null;
    onClose: () => void;
    onSubmit: (data: { name: string }) => void;
}

export default function AddStageModal({ open, department, onClose, onSubmit }: Props) {
    const [name, setName] = useState("");
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
                <>
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        onClick={handleClose}
                        className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                    />

                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, scale: 0.93, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.93, y: 16 }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-md flex flex-col
                                bg-white dark:bg-[#0f0f13]
                                border border-gray-200 dark:border-white/10
                                rounded-2xl shadow-2xl"
                            dir="rtl"
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 flex-shrink-0">
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                        مرحله جدید
                                    </h2>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                        {department?.name ?? ""}
                                    </p>
                                </div>
                                <button
                                    onClick={handleClose}
                                    disabled={success}
                                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:text-gray-300
                                        hover:bg-gray-100 dark:hover:bg-white/10
                                        transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex-1 px-6 py-5 space-y-4">
                                <div className="space-y-1.5">
                                    <div className="relative">
                                        <GitBranch size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                                        <input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                            placeholder="مثال: ارزیابی اولیه"
                                            className="w-full rounded-xl pr-9 pl-3 py-2.5 text-sm
                                                bg-gray-50 dark:bg-white/5
                                                border border-gray-200 dark:border-white/10
                                                text-gray-900 dark:text-white
                                                placeholder:text-gray-400 dark:placeholder:text-gray-500
                                                focus:border-blue-400 dark:focus:border-blue-500
                                                focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20
                                                outline-none transition-all duration-200"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex-shrink-0">
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
                                        >
                                            <button
                                                onClick={handleSubmit}
                                                disabled={!name.trim()}
                                                className="w-full py-2.5 rounded-4xl text-sm font-medium
                                                    text-white transition-all duration-200
                                                    disabled:opacity-40 disabled:cursor-not-allowed
                                                    bg-blue-500 hover:bg-blue-600
                                                    shadow-lg shadow-blue-500/25"
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