"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Briefcase } from "lucide-react";
import { Department } from "./types";

interface Props {
    open: boolean;
    department: Department | null;
    onClose: () => void;
    onSubmit: (data: { name: string; role: string }) => void;
}

export default function AddEmployeeDrawer({ open, department, onClose, onSubmit }: Props) {
    const [name, setName] = useState("");
    const [role, setRole] = useState("");

    const accent = department?.accent ?? "#3b82f6";

    const handleSubmit = () => {
        if (!name.trim() || !role.trim()) return;
        onSubmit({ name: name.trim(), role: role.trim() });
        setName("");
        setRole("");
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
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: `${accent}20` }}
                                >
                                    <User className="w-5 h-5" style={{ color: accent }} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">افزودن عضو</h2>
                                    <p className="text-xs text-white/40">{department?.name}</p>
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
                                <label className="text-sm text-white/70">نام و نام خانوادگی</label>
                                <div className="relative">
                                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                        placeholder="مثال: علی رضایی"
                                        className="w-full pr-10 pl-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-white/70">سمت / نقش</label>
                                <div className="relative">
                                    <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                    <input
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                        placeholder="مثال: کارشناس میدانی"
                                        className="w-full pr-10 pl-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors text-sm"
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                                {name.trim() && role.trim() && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        className="rounded-xl border p-4"
                                        style={{ borderColor: `${accent}30`, backgroundColor: `${accent}08` }}
                                    >
                                        <p className="text-xs text-white/40 mb-2">پیش‌نمایش</p>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                                style={{ backgroundColor: `${accent}20` }}
                                            >
                                                <User className="w-4 h-4" style={{ color: accent }} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-white font-medium">{name}</p>
                                                <p className="text-xs text-white/40">{role}</p>
                                            </div>
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
                                disabled={!name.trim() || !role.trim()}
                                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ backgroundColor: accent }}
                            >
                                افزودن عضو
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
