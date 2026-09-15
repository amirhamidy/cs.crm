"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Pencil, Trash2, X } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";

interface Category {
    id: number;
    name: string;
}

interface WarehouseCategoryCardProps {
    category: Category;
    index: number;
    onDelete: (id: number) => void;
    onUpdated: (category: Category) => void;
}

export default function WarehouseCategoryCard({
    category,
    index,
    onDelete,
    onUpdated,
}: WarehouseCategoryCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [hovered, setHovered] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState(category.name);
    const [error, setError] = useState("");

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await axiosInstance.delete(`/warehouse/api/v1/products/categories/${category.id}/delete/`);
            onDelete(category.id);
            setShowConfirm(false);
        } catch {
        } finally {
            setDeleting(false);
        }
    };

    const handleEdit = async () => {
        if (!editName.trim()) {
            setError("نام دسته‌بندی نمی‌تواند خالی باشد");
            return;
        }
        setEditing(true);
        setError("");
        try {
            const { data } = await axiosInstance.patch(
                `/warehouse/api/v1/products/categories/${category.id}/update/`,
                { name: editName.trim() }
            );
            onUpdated(data);
            setShowEdit(false);
        } catch {
            setError("خطا در ویرایش دسته‌بندی");
        } finally {
            setEditing(false);
        }
    };

    const handleCloseConfirm = () => {
        if (deleting) return;
        setShowConfirm(false);
    };

    const handleCloseEdit = () => {
        if (editing) return;
        setShowEdit(false);
        setEditName(category.name);
        setError("");
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                className="relative flex min-h-[120px] flex-col justify-between overflow-visible rounded-3xl p-4"
                style={{
                    background: isDark ? "rgba(255,255,255,0.03)" : "#fafafa",
                    border: isDark
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "1px solid rgba(15,23,42,0.06)",
                    boxShadow: isDark
                        ? "0 8px 30px rgba(0,0,0,0.22)"
                        : "0 8px 24px rgba(15,23,42,0.05)",
                }}
            >
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
                        stroke={`url(#category-border-${category.id})`}
                        strokeWidth="1.4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={
                            hovered ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }
                        }
                        transition={{ duration: 0.45, ease: "easeInOut" }}
                    />
                </svg>

                <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowEdit(true);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-xl"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,0.12)"
                                : "rgba(99,102,241,0.08)",
                            color: isDark ? "#a5b4fc" : "#6366f1",
                        }}
                        title="ویرایش"
                    >
                        <Pencil size={11} />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowConfirm(true);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-xl"
                        style={{
                            background: isDark
                                ? "rgba(239,68,68,0.12)"
                                : "rgba(239,68,68,0.08)",
                            color: "#ef4444",
                        }}
                        title="حذف"
                    >
                        <Trash2 size={11} />
                    </button>
                </div>

                <div className="flex flex-col gap-2">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[13px] font-extrabold text-white"
                        style={{
                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        }}
                    >
                        {category.name.charAt(0)}
                    </div>
                    <h3 className="truncate text-[14px] font-extrabold text-gray-900 dark:text-white">
                        {category.name}
                    </h3>
                </div>

                <div className="mt-auto">
                    <span
                        className="inline-flex items-center rounded-xl px-2.5 py-1 text-[10px] font-bold"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,0.14)"
                                : "rgba(99,102,241,0.08)",
                            color: isDark ? "#a5b4fc" : "#6366f1",
                        }}
                    >
                        دسته‌بندی محصول
                    </span>
                </div>
            </motion.div>

            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCloseConfirm}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{
                            background: "rgba(0,0,0,0.5)",
                            backdropFilter: "blur(4px)",
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 16 }}
                            transition={{ duration: 0.18 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[360px] rounded-[2rem] p-5"
                            style={{
                                background: isDark ? "#0f172a" : "#ffffff",
                                border: isDark
                                    ? "1px solid rgba(255,255,255,0.07)"
                                    : "1px solid rgba(15,23,42,0.07)",
                                boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
                            }}
                            dir="rtl"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="flex h-9 w-9 items-center justify-center rounded-2xl"
                                        style={{
                                            background: isDark
                                                ? "rgba(239,68,68,0.14)"
                                                : "rgba(239,68,68,0.08)",
                                        }}
                                    >
                                        <Trash2 size={15} className="text-red-500" />
                                    </div>
                                    <h3 className="text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                                        حذف دسته‌بندی
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCloseConfirm}
                                    disabled={deleting}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 disabled:opacity-50"
                                    style={{
                                        background: isDark
                                            ? "rgba(255,255,255,0.05)"
                                            : "rgba(15,23,42,0.05)",
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <p className="text-[12.5px] leading-6 text-gray-600 dark:text-gray-400">
                                دسته‌بندی{" "}
                                <span className="font-extrabold text-gray-900 dark:text-white">
                                    {category.name}
                                </span>{" "}
                                حذف خواهد شد. این عملیات قابل بازگشت نیست.
                            </p>
                            <div className="mt-5 flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleCloseConfirm}
                                    disabled={deleting}
                                    className="flex-1 rounded-2xl py-2.5 text-[12.5px] font-bold disabled:opacity-50"
                                    style={{
                                        background: isDark
                                            ? "rgba(255,255,255,0.05)"
                                            : "rgba(15,23,42,0.05)",
                                        color: isDark ? "#cbd5e1" : "#475569",
                                    }}
                                >
                                    انصراف
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[12.5px] font-bold text-white disabled:opacity-60"
                                    style={{
                                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                        boxShadow: "0 10px 24px rgba(239,68,68,0.22)",
                                    }}
                                >
                                    {deleting ? (
                                        <Loader2 size={15} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={13} />
                                    )}
                                    {deleting ? "" : "حذف کن"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showEdit && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCloseEdit}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{
                            background: "rgba(0,0,0,0.5)",
                            backdropFilter: "blur(4px)",
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 16 }}
                            transition={{ duration: 0.18 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[360px] rounded-[2rem] p-5"
                            style={{
                                background: isDark ? "#0f172a" : "#ffffff",
                                border: isDark
                                    ? "1px solid rgba(255,255,255,0.07)"
                                    : "1px solid rgba(15,23,42,0.07)",
                                boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
                            }}
                            dir="rtl"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="flex h-9 w-9 items-center justify-center rounded-2xl"
                                        style={{
                                            background: isDark
                                                ? "rgba(99,102,241,0.14)"
                                                : "rgba(99,102,241,0.08)",
                                        }}
                                    >
                                        <Pencil size={15} className="text-indigo-500" />
                                    </div>
                                    <h3 className="text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                                        ویرایش دسته‌بندی
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCloseEdit}
                                    disabled={editing}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 disabled:opacity-50"
                                    style={{
                                        background: isDark
                                            ? "rgba(255,255,255,0.05)"
                                            : "rgba(15,23,42,0.05)",
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => {
                                        setEditName(e.target.value);
                                        setError("");
                                    }}
                                    placeholder="نام دسته‌بندی"
                                    className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                                    dir="rtl"
                                />
                                {error && <p className="mt-2 text-[11px] font-semibold text-red-500">{error}</p>}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleCloseEdit}
                                    disabled={editing}
                                    className="flex-1 rounded-2xl py-2.5 text-[12.5px] font-bold disabled:opacity-50"
                                    style={{
                                        background: isDark
                                            ? "rgba(255,255,255,0.05)"
                                            : "rgba(15,23,42,0.05)",
                                        color: isDark ? "#cbd5e1" : "#475569",
                                    }}
                                >
                                    انصراف
                                </button>
                                <button
                                    type="button"
                                    onClick={handleEdit}
                                    disabled={editing}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[12.5px] font-bold text-white disabled:opacity-60"
                                    style={{
                                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                        boxShadow: "0 10px 24px rgba(99,102,241,0.22)",
                                    }}
                                >
                                    {editing ? (
                                        <Loader2 size={15} className="animate-spin" />
                                    ) : (
                                        <Pencil size={13} />
                                    )}
                                    {editing ? "" : "ویرایش"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}