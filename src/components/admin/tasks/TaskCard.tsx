"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Pencil, X } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";

interface Task {
    id: number;
    title: string;
    description: string;
    department: number;
    case: number;
}

interface TaskCardProps {
    task?: Task;
    index: number;
    onDelete: (id: number) => void;
    onEdit: (task: Task) => void; // هدایت به مدال ادیت در کامپوننت والد
}

const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#3b82f6", "#6366f1"],
    ["#8b5cf6", "#ec4899"],
    ["#06b6d4", "#6366f1"],
    ["#f59e0b", "#ef4444"],
];

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;
    if (!data) return fallback;

    const possibleKeys = ["detail", "message", "error", "non_field_errors"];
    for (const key of possibleKeys) {
        const value = data[key];
        if (typeof value === "string") return value;
        if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }

    return fallback;
}

export default function TaskCard({
    task,
    index,
    onDelete,
    onEdit,
}: TaskCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [hovered, setHovered] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    if (
        !task ||
        typeof task.id !== "number" ||
        typeof task.title !== "string"
    ) {
        return null;
    }

    const taskTitle = task.title.trim() || "بدون عنوان";
    const gradient = AVATAR_GRADIENTS[task.id % AVATAR_GRADIENTS.length];
    const start = gradient[0];
    const end = gradient[1];

    async function handleDelete() {
        setDeleting(true);
        setDeleteError("");
        try {
            await axiosInstance.delete(`/tasks/api/v1/tasks/${task.id}/delete`);
            onDelete(task.id);
            setShowConfirm(false);
        } catch (err) {
            setDeleteError(getErrorMessage(err, "خطا در حذف تسک"));
        } finally {
            setDeleting(false);
        }
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                className="relative rounded-2xl p-4 flex flex-col justify-between gap-3 overflow-hidden"
                style={{
                    border: isDark
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "1px solid rgba(0,0,0,0.06)",
                    minHeight: "140px",
                    background: isDark ? "rgba(255,255,255,0.02)" : "#fafafa",
                }}
            >
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ borderRadius: "1rem" }}
                >
                    <defs>
                        <linearGradient
                            id={`borderGrad-${task.id}`}
                            x1="100%"
                            y1="100%"
                            x2="0%"
                            y2="0%"
                        >
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                    <motion.rect
                        x="1"
                        y="1"
                        width="calc(100% - 2px)"
                        height="calc(100% - 2px)"
                        rx="15"
                        ry="15"
                        fill="none"
                        stroke={`url(#borderGrad-${task.id})`}
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

                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                    <button
                        onClick={() => onEdit(task)}
                        className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,0.1)"
                                : "rgba(99,102,241,0.07)",
                            color: isDark ? "#a5b4fc" : "#6366f1",
                        }}
                        title="ویرایش"
                        type="button"
                    >
                        <Pencil size={11} />
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
                        title="حذف"
                        type="button"
                    >
                        <Trash2 size={11} />
                    </button>
                </div>

                <div className="flex items-start gap-3 pt-1">
                    <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-[15px] font-extrabold flex-shrink-0"
                        style={{
                            background: `linear-gradient(135deg, ${start}, ${end})`,
                        }}
                    >
                        {taskTitle.charAt(0)}
                    </div>
                    <div className="flex flex-col gap-1 min-w-0 pr-8">
                        <p className="text-[13.5px] font-extrabold text-gray-800 dark:text-gray-100 leading-tight truncate">
                            {taskTitle}
                        </p>
                        <p className="text-[11.5px] text-gray-400 dark:text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                            {task.description || "بدون توضیحات"}
                        </p>
                    </div>
                </div>

                <div
                    className="pt-2.5 border-t mt-auto"
                    style={{
                        borderColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)",
                    }}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-[11.5px] text-gray-400 dark:text-gray-500">
                            کیس مرتبط: {task.case || "نامشخص"}
                        </p>
                        <span
                            className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                            style={{
                                background: isDark
                                    ? "rgba(99,102,241,0.12)"
                                    : "rgba(99,102,241,0.07)",
                                color: isDark ? "#a5b4fc" : "#6366f1",
                            }}
                        >
                            دپارتمان {task.department}
                        </span>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{
                            background: "rgba(0,0,0,0.5)",
                            backdropFilter: "blur(2px)",
                        }}
                        onClick={() => !deleting && setShowConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 12 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 12 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="w-full max-w-[320px] rounded-2xl overflow-hidden border"
                            style={{
                                background: isDark ? "#0f172a" : "#ffffff",
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.07)"
                                    : "rgba(0,0,0,0.07)",
                                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                            dir="rtl"
                        >
                            <div
                                className="flex items-center justify-between px-5 py-4 border-b"
                                style={{
                                    borderColor: isDark
                                        ? "rgba(255,255,255,0.06)"
                                        : "rgba(0,0,0,0.06)",
                                }}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                                        style={{
                                            background: isDark
                                                ? "rgba(239,68,68,0.12)"
                                                : "rgba(239,68,68,0.08)",
                                        }}
                                    >
                                        <Trash2 size={14} className="text-red-500" />
                                    </div>
                                    <h3 className="text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                                        حذف تسک
                                    </h3>
                                </div>
                                <button
                                    onClick={() => !deleting && setShowConfirm(false)}
                                    className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    style={{
                                        background: isDark
                                            ? "rgba(255,255,255,0.05)"
                                            : "rgba(0,0,0,0.04)",
                                    }}
                                    type="button"
                                >
                                    <X size={13} />
                                </button>
                            </div>

                            <div className="px-5 py-4 flex flex-col gap-4">
                                <p className="text-[12.5px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                    تسک{" "}
                                    <span className="font-extrabold text-gray-800 dark:text-gray-200">
                                        {taskTitle}
                                    </span>{" "}
                                    حذف خواهد شد. این عملیات قابل بازگشت نیست.
                                </p>

                                {deleteError && (
                                    <p className="text-[11.5px] text-red-500 dark:text-red-400 font-semibold text-center">
                                        {deleteError}
                                    </p>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            !deleting && setShowConfirm(false)
                                        }
                                        disabled={deleting}
                                        className="flex-1 py-2.5 rounded-xl text-[12.5px] font-bold transition-colors disabled:opacity-40"
                                        style={{
                                            background: isDark
                                                ? "rgba(255,255,255,0.05)"
                                                : "rgba(0,0,0,0.04)",
                                            color: isDark ? "#94a3b8" : "#64748b",
                                        }}
                                        type="button"
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="flex-1 py-2.5 rounded-xl text-[12.5px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, #ef4444, #dc2626)",
                                            boxShadow:
                                                "0 4px 14px rgba(239,68,68,0.3)",
                                        }}
                                        type="button"
                                    >
                                        {deleting ? (
                                            <>
                                                <svg
                                                    className="w-3.5 h-3.5 animate-spin"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                >
                                                    <circle
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        strokeOpacity="0.25"
                                                    />
                                                    <path
                                                        d="M12 2a10 10 0 0 1 10 10"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                در حال حذف...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 size={13} />
                                                حذف کن
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
