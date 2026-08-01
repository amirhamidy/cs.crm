"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
import type { User } from "@/types/users";

interface UserCardProps {
    user: User;
    index: number;
    onView?: (user: User) => void;
    onDelete?: (user: User) => void;
}

const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#3b82f6", "#6366f1"],
    ["#8b5cf6", "#ec4899"],
    ["#06b6d4", "#6366f1"],
    ["#f59e0b", "#ef4444"],
];

export default function UserCard({ user, index, onView, onDelete }: UserCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [hovered, setHovered] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [start, end] = AVATAR_GRADIENTS[user.id % AVATAR_GRADIENTS.length];

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                className="relative rounded-2xl p-4 flex flex-col gap-3 overflow-hidden"
                style={{
                    background: "transparent",
                    border: isDark
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "1px solid rgba(0,0,0,0.06)",
                    minHeight: "130px",
                }}
            >
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ borderRadius: "1rem" }}
                >
                    <defs>
                        <linearGradient id={`borderGrad-${user.id}`} x1="100%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                    <motion.rect
                        x="1" y="1"
                        width="calc(100% - 2px)"
                        height="calc(100% - 2px)"
                        rx="15" ry="15"
                        fill="none"
                        stroke={`url(#borderGrad-${user.id})`}
                        strokeWidth="1.5"
                        pathLength="1"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={
                            hovered
                                ? { pathLength: 1, opacity: 1 }
                                : { pathLength: 0, opacity: 0 }
                        }
                        transition={{ duration: 0.55, ease: "easeInOut" }}
                    />
                </svg>

                <div className="flex items-center gap-3">
                    <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center duration-75 text-white text-[15px] font-extrabold flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${start}, ${end})` }}
                    >
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <p className="text-[13.5px] font-extrabold text-gray-800 dark:text-gray-100 leading-tight">
                            {user.name}
                        </p>
                        <span
                            className="inline-flex items-center mt-1 px-2 py-0.5 rounded-lg text-[11px] font-bold"
                            style={
                                user.role === "admin"
                                    ? {
                                        background: isDark
                                            ? "rgba(139,92,246,0.12)"
                                            : "rgba(139,92,246,0.08)",
                                        color: isDark ? "#c4b5fd" : "#7c3aed",
                                    }
                                    : {
                                        background: isDark
                                            ? "rgba(255,255,255,0.05)"
                                            : "rgba(0,0,0,0.04)",
                                        color: isDark ? "#94a3b8" : "#64748b",
                                    }
                            }
                        >
                            {user.role === "admin" ? "ادمین" : "کاربر"}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-1 pt-2 border-t border-gray-100 dark:border-white/[0.05]">
                    <p className="text-[11.5px] font-mono text-gray-400 dark:text-gray-500 truncate">
                        {user.email}
                    </p>
                    <p className="text-[11.5px] text-gray-400 dark:text-gray-500">
                        عضویت از {user.joined}
                    </p>
                </div>

                <AnimatePresence>
                    {hovered && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-3 left-3 flex items-center gap-1.5"
                        >
                            <button
                                onClick={() => onView?.(user)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-colors"
                                style={{
                                    background: isDark
                                        ? "rgba(99,102,241,0.15)"
                                        : "rgba(99,102,241,0.09)",
                                    color: isDark ? "#a5b4fc" : "#6366f1",
                                }}
                            >
                                مشاهده
                                <ArrowLeft size={11} />
                            </button>
                            <button
                                onClick={() => setShowConfirm(true)}
                                className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors"
                                style={{
                                    background: isDark
                                        ? "rgba(239,68,68,0.1)"
                                        : "rgba(239,68,68,0.07)",
                                    color: "#ef4444",
                                }}
                            >
                                <Trash2 size={12} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(1px)" }}
                        onClick={() => setShowConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.93, y: 16 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.93, y: 16 }}
                            transition={{ duration: 0.2 }}
                            className="rounded-2xl border p-5 w-full max-w-[320px] mx-4"
                            style={{
                                background: isDark ? "#0f172a" : "#ffffff",
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.07)"
                                    : "rgba(0,0,0,0.06)",
                                boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                            dir="rtl"
                        >
                            <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-3">
                                <Trash2 size={18} className="text-red-500" />
                            </div>
                            <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white mb-1">
                                حذف کاربر
                            </h3>
                            <p className="text-[12.5px] text-gray-400 dark:text-gray-500 leading-relaxed mb-5">
                                آیا مطمئنی می‌خوای{" "}
                                <span className="font-bold text-gray-700 dark:text-gray-300">
                                    {user.name}
                                </span>{" "}
                                رو حذف کنی؟ این عمل برگشت‌پذیر نیست.
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 py-2 rounded-xl text-[12.5px] font-bold border border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                                >
                                    انصراف
                                </button>
                                <button
                                    onClick={() => {
                                        setShowConfirm(false);
                                        onDelete?.(user);
                                    }}
                                    className="flex-1 py-2 rounded-xl text-[12.5px] font-bold text-white"
                                    style={{
                                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                        boxShadow: "0 4px 12px rgba(239,68,68,0.3)",
                                    }}
                                >
                                    حذف کاربر
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
