"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GitBranch } from "lucide-react";

const STAGE_COLORS = [
    "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
    "#10b981", "#ef4444", "#06b6d4", "#f97316",
];

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; color: string }) => void;
}

export default function AddStageDrawer({ open, onClose, onSubmit }: Props) {
    const [name, setName] = useState("");
    const [color, setColor] = useState(STAGE_COLORS[0]);

    const handleSubmit = () => {
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), color });
        setName("");
        setColor(STAGE_COLORS[0]);
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
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300"
                                    style={{ backgroundColor: `${color}20` }}
                                >
                                    <GitBranch className="w-5 h-5 transition-colors duration-300" style={{ color }} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">مرحله جدید</h2>
                                    <p className="text-xs text-white/40">افزودن مرحله به دپارتمان</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm text-white/70">نام مرحله</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                    placeholder="مثال: ارزیابی اولیه"
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors text-sm"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm text-white/70">رنگ مرحله</label>
                                <div className="flex flex-wrap gap-3">
                                    {STAGE_COLORS.map((c) => (
                                        <motion.button
                                            key={c}
                                            whileHover={{ scale: 1.15 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setColor(c)}
                                            className="relative w-9 h-9 rounded-xl"
                                            style={{ backgroundColor: c }}
                                        >
                                            <AnimatePresence>
                                                {color === c && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        exit={{ scale: 0 }}
                                                        className="absolute inset-0 rounded-xl ring-2 ring-white ring-offset-2 ring-offset-[#0f1729]"
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
                                        className="rounded-xl border p-4"
                                        style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}
                                    >
                                        <p className="text-xs text-white/40 mb-3">پیش‌نمایش</p>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{ backgroundColor: color }}
                                            />
                                            <span className="text-sm text-white">{name}</span>
                                            <span
                                                className="mr-auto text-xs px-2 py-0.5 rounded-lg"
                                                style={{ backgroundColor: `${color}20`, color }}
                                            >
                                                مرحله جدید
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
                                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ backgroundColor: color }}
                            >
                                افزودن مرحله
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
