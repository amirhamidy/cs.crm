"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2 } from "lucide-react";

const ACCENT_COLORS = [
    "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
    "#10b981", "#ef4444", "#06b6d4", "#f97316",
];

let colorIndex = 0;
function nextAccent() {
    const color = ACCENT_COLORS[colorIndex % ACCENT_COLORS.length];
    colorIndex++;
    return color;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; description: string; accent: string }) => void;
}

export default function AddDepartmentDrawer({ open, onClose, onSubmit }: Props) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = () => {
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), description: description.trim(), accent: nextAccent() });
        setName("");
        setDescription("");
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0f1729] border-l border-white/10 z-50 flex flex-col"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/20">
                                    <Building2 className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">دپارتمان جدید</h2>
                                    <p className="text-xs text-white/40">ایجاد و پیکربندی دپارتمان</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm text-white/70">نام دپارتمان</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                    placeholder="مثال: تیم امداد میدانی"
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-white/70">
                                    توضیحات <span className="text-white/30">(اختیاری)</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="شرح مختصری از وظایف این دپارتمان..."
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors text-sm resize-none"
                                />
                            </div>

                            <AnimatePresence>
                                {name.trim() && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3"
                                    >
                                        <p className="text-xs text-white/40">پیش‌نمایش کارت</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-500/20">
                                                <Building2 className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-white truncate">{name}</p>
                                                {description && (
                                                    <p className="text-xs text-white/40 truncate mt-0.5">{description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-400">
                                                ۰ مرحله
                                            </span>
                                            <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-400">
                                                ۰ عضو
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="p-6 border-t border-white/10 flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmit}
                                disabled={!name.trim()}
                                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                ایجاد دپارتمان
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="px-5 py-3 rounded-xl text-sm text-white/60 bg-white/5 hover:bg-white/10 transition-all"
                            >
                                انصراف
                            </motion.button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
