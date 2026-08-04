"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Briefcase, CheckCircle2 } from "lucide-react";
import { Department } from "./types";

interface Props {
    open: boolean;
    department: Department | null;
    onClose: () => void;
    onSubmit: (data: { name: string; role: string }) => void;
}

export default function AddEmployeeModal({ open, department, onClose, onSubmit }: Props) {
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
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
        setRole("");
        onClose();
    };

    const handleSubmit = () => {
        if (!name.trim() || !role.trim()) return;
        setSuccess(true);
        setTimeout(() => {
            onSubmit({ name: name.trim(), role: role.trim() });
            setSuccess(false);
            setName("");
            setRole("");
            onClose();
        }, 1400);
    };

    const accent = department?.accent ?? "#3b82f6";

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
                                style={{ background: accent }}
                            />

                            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] flex-shrink-0">
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                        افزودن عضو
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
                                        نام و نام خانوادگی
                                    </label>
                                    <div className="relative">
                                        <User size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                            placeholder="مثال: علی رضایی"
                                            className="w-full rounded-xl pr-9 pl-3 py-2.5 text-sm
                                                bg-gray-50 dark:bg-white/[0.04]
                                                border border-gray-200 dark:border-white/10
                                                text-gray-800 dark:text-white
                                                placeholder:text-gray-400 dark:placeholder:text-gray-600
                                                focus:border-gray-400 dark:focus:border-white/30
                                                focus:ring-2 focus:ring-gray-100 dark:focus:ring-white/5
                                                outline-none transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                        سمت / نقش
                                    </label>
                                    <div className="relative">
                                        <Briefcase size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                            placeholder="مثال: کارشناس میدانی"
                                            className="w-full rounded-xl pr-9 pl-3 py-2.5 text-sm
                                                bg-gray-50 dark:bg-white/[0.04]
                                                border border-gray-200 dark:border-white/10
                                                text-gray-800 dark:text-white
                                                placeholder:text-gray-400 dark:placeholder:text-gray-600
                                                focus:border-gray-400 dark:focus:border-white/30
                                                focus:ring-2 focus:ring-gray-100 dark:focus:ring-white/5
                                                outline-none transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {name.trim() && role.trim() && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 8 }}
                                            className="rounded-xl border p-3 flex items-center gap-3"
                                            style={{
                                                borderColor: `${accent}30`,
                                                background: `${accent}08`,
                                            }}
                                        >
                                            <div
                                                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                                style={{
                                                    background: `linear-gradient(135deg, ${accent}30, ${accent}15)`,
                                                }}
                                            >
                                                <User size={16} style={{ color: accent }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-800 dark:text-white font-medium truncate">
                                                    {name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {role}
                                                </p>
                                            </div>
                                            <span
                                                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                                style={{
                                                    backgroundColor: `${accent}20`,
                                                    color: accent,
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
                                            عضو با موفقیت اضافه شد
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
                                                disabled={!name.trim() || !role.trim()}
                                                className="flex-1 py-2.5 rounded-xl text-sm font-medium
                                                    text-white transition-all duration-200
                                                    disabled:opacity-40 disabled:cursor-not-allowed"
                                                style={{
                                                    background: accent,
                                                    boxShadow: `0 4px 16px ${accent}40`,
                                                }}
                                            >
                                                افزودن عضو
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