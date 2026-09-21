"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Hash, Loader2, Pencil, Tag, Trash2, X } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import { toPersianDigits } from "@/lib/jalali";

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

const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#ec4899", "#8b5cf6"],
    ["#06b6d4", "#3b82f6"],
    ["#10b981", "#14b8a6"],
    ["#f59e0b", "#ef4444"],
] as const;

function ModalShell({
    onClose,
    children,
}: {
    onClose: () => void;
    children: ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
            dir="rtl"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[380px] rounded-[2rem] border border-gray-100 bg-white p-5 shadow-[0_24px_64px_rgba(0,0,0,0.3)] dark:border-white/[0.07] dark:bg-[#0f172a]"
            >
                {children}
            </motion.div>
        </motion.div>
    );
}

function ModalHeader({
    icon,
    iconBg,
    title,
    onClose,
    disabled,
}: {
    icon: ReactNode;
    iconBg: string;
    title: string;
    onClose: () => void;
    disabled?: boolean;
}) {
    return (
        <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
                <div
                    className={`flex h-9 w-9 items-center justify-center rounded-2xl ${iconBg}`}
                >
                    {icon}
                </div>
                <h3 className="text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                    {title}
                </h3>
            </div>

            <button
                type="button"
                onClick={onClose}
                disabled={disabled}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50 dark:bg-white/[0.05] dark:hover:text-gray-200"
            >
                <X size={14} />
            </button>
        </div>
    );
}

export default function WarehouseCategoryCard({
    category,
    index,
    onDelete,
    onUpdated,
}: WarehouseCategoryCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [mounted, setMounted] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState(category.name);
    const [error, setError] = useState("");
    const [deleteError, setDeleteError] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    const [start, end] =
        AVATAR_GRADIENTS[category.id % AVATAR_GRADIENTS.length];

    const openEdit = () => {
        setEditName(category.name);
        setError("");
        setShowEdit(true);
    };

    const openConfirm = () => {
        setDeleteError("");
        setShowConfirm(true);
    };

    const handleDelete = async () => {
        setDeleting(true);
        setDeleteError("");

        try {
            await axiosInstance.delete(
                `/warehouse/api/v1/products/categories/${category.id}/delete/`,
            );
            onDelete(category.id);
            setShowConfirm(false);
        } catch {
            setDeleteError("حذف دسته‌بندی انجام نشد. لطفاً دوباره تلاش کنید.");
        } finally {
            setDeleting(false);
        }
    };

    const handleEdit = async () => {
        const trimmed = editName.trim();

        if (!trimmed) {
            setError("نام دسته‌بندی نمی‌تواند خالی باشد");
            return;
        }

        if (trimmed === category.name) {
            setShowEdit(false);
            return;
        }

        setEditing(true);
        setError("");

        try {
            const { data } = await axiosInstance.patch(
                `/warehouse/api/v1/products/categories/${category.id}/update/`,
                { name: trimmed },
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
        setDeleteError("");
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
                className="relative flex min-h-[148px] flex-col justify-between overflow-visible rounded-3xl p-4"
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
                            hovered
                                ? { pathLength: 1, opacity: 1 }
                                : { pathLength: 0, opacity: 0 }
                        }
                        transition={{ duration: 0.45, ease: "easeInOut" }}
                    />
                </svg>

                <div className="relative z-[1] flex items-start gap-3">
                    <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[15px] font-extrabold text-white shadow-lg"
                        style={{
                            background: `linear-gradient(135deg,${start},${end})`,
                        }}
                    >
                        {category.name.trim().charAt(0) || "؟"}
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3
                            className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white"
                            title={category.name}
                        >
                            {category.name}
                        </h3>

                        <div className="mt-1 flex items-center gap-1.5 text-[10.5px] font-semibold text-gray-500 dark:text-gray-400">
                            <Tag size={10} />
                            <span>دسته‌بندی محصول</span>
                        </div>
                    </div>
                </div>

                <div
                    className="relative z-[1] mt-4 flex items-center justify-between rounded-2xl px-3 py-2.5"
                    style={{
                        background: isDark
                            ? "rgba(99,102,241,0.08)"
                            : "rgba(99,102,241,0.05)",
                    }}
                >
                    <div className="flex items-center gap-2">
                        <div
                            className="flex h-7 w-7 items-center justify-center rounded-lg"
                            style={{
                                background: isDark
                                    ? "rgba(99,102,241,0.14)"
                                    : "rgba(99,102,241,0.1)",
                            }}
                        >
                            <Hash size={12} className="text-indigo-500" />
                        </div>

                        <div>
                            <p className="text-[9.5px] font-bold text-gray-400 dark:text-white/40">
                                شناسه
                            </p>
                            <p className="text-[12px] font-black text-gray-900 dark:text-white">
                                {toPersianDigits(category.id)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.92 }}
                            onClick={openEdit}
                            title="ویرایش"
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 transition-colors hover:bg-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-300"
                        >
                            <Pencil size={13} />
                        </motion.button>

                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.92 }}
                            onClick={openConfirm}
                            title="حذف"
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20 dark:bg-red-500/15"
                        >
                            <Trash2 size={13} />
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {mounted &&
                createPortal(
                    <>
                        <AnimatePresence>
                            {showConfirm && (
                                <ModalShell onClose={handleCloseConfirm}>
                                    <ModalHeader
                                        icon={<Trash2 size={15} className="text-red-500" />}
                                        iconBg="bg-red-500/10 dark:bg-red-500/15"
                                        title="حذف دسته‌بندی"
                                        onClose={handleCloseConfirm}
                                        disabled={deleting}
                                    />

                                    <p className="text-[12.5px] leading-6 text-gray-600 dark:text-gray-400">
                                        دسته‌بندی{" "}
                                        <span className="font-extrabold text-gray-900 dark:text-white">
                                            {category.name}
                                        </span>{" "}
                                        حذف خواهد شد. این عملیات قابل بازگشت نیست.
                                    </p>

                                    <AnimatePresence>
                                        {deleteError && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 4 }}
                                                className="mt-3 flex items-start gap-2 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10"
                                            >
                                                <AlertCircle
                                                    size={14}
                                                    className="mt-0.5 shrink-0 text-red-500"
                                                />
                                                <p className="text-[11.5px] font-semibold leading-5 text-red-500 dark:text-red-400">
                                                    {deleteError}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="mt-5 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleCloseConfirm}
                                            disabled={deleting}
                                            className="flex h-11 flex-1 items-center justify-center rounded-2xl bg-gray-100 text-[12.5px] font-bold text-gray-600 transition-colors hover:text-gray-800 disabled:opacity-50 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:text-white"
                                        >
                                            انصراف
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            disabled={deleting}
                                            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl text-[12.5px] font-bold text-white disabled:opacity-60"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #ef4444, #dc2626)",
                                                boxShadow:
                                                    "0 10px 24px rgba(239,68,68,0.22)",
                                            }}
                                        >
                                            {deleting ? (
                                                <Loader2 size={15} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <Trash2 size={13} />
                                                    حذف کن
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </ModalShell>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {showEdit && (
                                <ModalShell onClose={handleCloseEdit}>
                                    <ModalHeader
                                        icon={<Pencil size={15} className="text-indigo-500" />}
                                        iconBg="bg-indigo-500/10 dark:bg-indigo-500/15"
                                        title="ویرایش دسته‌بندی"
                                        onClose={handleCloseEdit}
                                        disabled={editing}
                                    />

                                    <div className="mb-4">
                                        <label className="mb-2 block text-[11.5px] font-bold text-gray-400">
                                            نام دسته‌بندی
                                        </label>

                                        <input
                                            autoFocus
                                            type="text"
                                            value={editName}
                                            onChange={(e) => {
                                                setEditName(e.target.value);
                                                setError("");
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !editing) handleEdit();
                                            }}
                                            placeholder="نام دسته‌بندی"
                                            dir="rtl"
                                            className="h-[46px] w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 text-[12.5px] font-bold text-gray-900 outline-none transition-colors placeholder:font-medium placeholder:text-gray-400 focus:border-indigo-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-indigo-500/50"
                                        />

                                        <AnimatePresence>
                                            {error && (
                                                <motion.p
                                                    initial={{ opacity: 0, y: -4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -4 }}
                                                    className="mt-2 flex items-center gap-1 pr-1 text-[11px] font-bold text-red-500"
                                                >
                                                    <AlertCircle size={11} />
                                                    {error}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleCloseEdit}
                                            disabled={editing}
                                            className="flex h-11 flex-1 items-center justify-center rounded-2xl bg-gray-100 text-[12.5px] font-bold text-gray-600 transition-colors hover:text-gray-800 disabled:opacity-50 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:text-white"
                                        >
                                            انصراف
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleEdit}
                                            disabled={editing}
                                            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl text-[12.5px] font-bold text-white disabled:opacity-60"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                                boxShadow:
                                                    "0 10px 24px rgba(99,102,241,0.22)",
                                            }}
                                        >
                                            {editing ? (
                                                <Loader2 size={15} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <Pencil size={13} />
                                                    ذخیره
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </ModalShell>
                            )}
                        </AnimatePresence>
                    </>,
                    document.body,
                )}
        </>
    );
}