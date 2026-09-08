"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Pencil, Tags, Trash2, X } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import type { ApiCategory } from "@/types/warehouse";
import CategoryModal from "./CategoryModal";

interface CategoryCardProps {
    category: ApiCategory;
    index: number;
    onUpdated: (category: ApiCategory) => void;
    onDeleted: (id: number) => void;
}

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;
    if (!data) return fallback;
    const keys = ["detail", "message", "error"];
    for (const key of keys) {
        const val = data[key];
        if (typeof val === "string") return val;
    }
    return fallback;
}

export default function CategoryCard({ category, index, onUpdated, onDeleted }: CategoryCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [showEdit, setShowEdit] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    async function handleDelete() {
        setDeleting(true);
        setError("");
        try {
            await axiosInstance.delete(`/warehouse/api/v1/products/categories/${category.id}/delete/`);
            onDeleted(category.id);
            setShowConfirm(false);
        } catch (err) {
            setError(getErrorMessage(err, "خطا در حذف دسته‌بندی"));
        } finally {
            setDeleting(false);
        }
    }

    const cardBg = isDark ? "rgba(255,255,255,0.03)" : "#fafafa";
    const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)";
    const textColor = isDark ? "#f1f5f9" : "#1e293b";

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="relative flex items-center justify-between gap-3 rounded-3xl p-4 transition-all hover:border-indigo-200/50"
                style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                }}
            >
                {/* Animated border - ایندیگو/بنفش */}
                <svg className="pointer-events-none absolute inset-0 h-full w-full">
                    <defs>
                        <linearGradient
                            id={`category-border-${category.id}`}
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
                        rx="23"
                        ry="23"
                        fill="none"
                        stroke="url(#category-border-${category.id})"
                        strokeWidth="1.4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileHover={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.45, ease: "easeInOut" }}
                    />
                </svg>

                <div className="flex min-w-0 items-center gap-3">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                            background: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                        }}
                    >
                        <Tags size={16} className="text-indigo-500" />
                    </div>
                    <span
                        className="truncate text-[13px] font-extrabold"
                        style={{ color: textColor }}
                    >
                        {category.name}
                    </span>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setShowEdit(true)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl transition-transform active:scale-90 hover:bg-indigo-100/50"
                        style={{
                            background: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                            color: "#6366f1",
                        }}
                        title="ویرایش"
                    >
                        <Pencil size={13} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowConfirm(true)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl transition-transform active:scale-90 hover:bg-red-100/50"
                        style={{
                            background: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
                            color: "#ef4444",
                        }}
                        title="حذف"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </motion.div>

            <CategoryModal
                isOpen={showEdit}
                onClose={() => setShowEdit(false)}
                category={category}
                onSaved={(updated) => {
                    onUpdated(updated);
                    setShowEdit(false);
                }}
            />

            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !deleting && setShowConfirm(false)}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{
                            background: "rgba(15,23,42,0.5)",
                            backdropFilter: "blur(4px)",
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 16 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[360px] rounded-[2rem] p-5"
                            style={{
                                background: isDark ? "#0f172a" : "#ffffff",
                                border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(15,23,42,0.06)",
                            }}
                            dir="rtl"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="flex h-9 w-9 items-center justify-center rounded-2xl"
                                        style={{
                                            background: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
                                        }}
                                    >
                                        <Trash2 size={15} className="text-red-500" />
                                    </div>
                                    <h3
                                        className="text-[13.5px] font-extrabold"
                                        style={{ color: textColor }}
                                    >
                                        حذف دسته‌بندی
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={deleting}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)",
                                        color: isDark ? "#94a3b8" : "#475569",
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <p
                                className="text-[12.5px] leading-6"
                                style={{ color: isDark ? "#94a3b8" : "#475569" }}
                            >
                                دسته‌بندی{" "}
                                <span className="font-extrabold" style={{ color: textColor }}>
                                    {category.name}
                                </span>{" "}
                                حذف خواهد شد.
                            </p>

                            {error && (
                                <p className="mt-3 text-[12px] font-semibold text-red-500">{error}</p>
                            )}

                            <div className="mt-5 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={deleting}
                                    className="flex-1 rounded-2xl py-2.5 text-[12.5px] font-bold"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)",
                                        color: isDark ? "#94a3b8" : "#475569",
                                    }}
                                >
                                    انصراف
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-red-600 py-2.5 text-[12.5px] font-bold text-white disabled:opacity-60 hover:bg-red-500"
                                >
                                    {deleting ? <Loader2 size={14} className="animate-spin" /> : "حذف کن"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}