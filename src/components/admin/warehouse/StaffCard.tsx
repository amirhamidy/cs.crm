"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Loader2, Power, Trash2, User, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import type { ApiWarehouseStaff } from "@/types/warehouse";

interface StaffCardProps {
    staff: ApiWarehouseStaff;
    index: number;
    onUpdated: (staff: ApiWarehouseStaff) => void;
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

export default function StaffCard({ staff, index, onUpdated, onDeleted }: StaffCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [error, setError] = useState("");

    async function handleToggle() {
        setToggling(true);
        setError("");
        try {
            const { data } = await axiosInstance.patch<ApiWarehouseStaff>(
                `/warehouse/api/v1/staff/${staff.id}/update/`,
                { is_active: !staff.is_active }
            );
            onUpdated(data);
        } catch (err) {
            setError(getErrorMessage(err, "خطا در تغییر وضعیت"));
        } finally {
            setToggling(false);
        }
    }

    async function handleDelete() {
        setDeleting(true);
        setError("");
        try {
            await axiosInstance.delete(`/warehouse/api/v1/staff/${staff.id}/delete/`);
            onDeleted(staff.id);
            setShowConfirm(false);
        } catch (err) {
            setError(getErrorMessage(err, "خطا در حذف کارمند"));
        } finally {
            setDeleting(false);
        }
    }

    const cardBg = isDark ? "rgba(255,255,255,0.03)" : "#fafafa";
    const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)";
    const textColor = isDark ? "#f1f5f9" : "#1e293b";
    const mutedText = isDark ? "#94a3b8" : "#64748b";

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
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
                            id={`staff-border-${staff.id}`}
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
                        stroke="url(#staff-border-${staff.id})"
                        strokeWidth="1.4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileHover={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.45, ease: "easeInOut" }}
                    />
                </svg>

                <div className="flex min-w-0 items-center gap-3">
                    <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                            background: isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)",
                        }}
                    >
                        <User size={17} className="text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                        <h3
                            className="truncate text-[13px] font-extrabold"
                            style={{ color: textColor }}
                        >
                            {staff.full_name}
                        </h3>
                        <span
                            className={`mt-1 inline-flex items-center rounded-lg px-2 py-1 text-[12px] font-bold ${staff.is_active
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : isDark
                                        ? "bg-gray-700/30 text-gray-400"
                                        : "bg-gray-200 text-gray-500"
                                }`}
                        >
                            {staff.is_active ? "فعال" : "غیرفعال"}
                        </span>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                    <button
                        type="button"
                        onClick={handleToggle}
                        disabled={toggling}
                        className="flex h-9 w-9 items-center justify-center rounded-xl transition-transform active:scale-90 hover:bg-amber-100/50 disabled:opacity-50"
                        style={{
                            background: isDark ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.08)",
                            color: "#f59e0b",
                        }}
                        title="تغییر وضعیت"
                    >
                        {toggling ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowConfirm(true)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl transition-transform active:scale-90 hover:bg-red-100/50"
                        style={{
                            background: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
                            color: "#ef4444",
                        }}
                        title="حذف"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </motion.div>

            {error && (
                <p className="mt-1 text-center text-[12px] font-semibold text-red-500">{error}</p>
            )}

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
                            className="w-full max-w-[340px] rounded-[2rem] p-5"
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
                                        حذف کارمند انبار
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={deleting}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)",
                                        color: mutedText,
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <p
                                className="text-[12.5px] leading-6"
                                style={{ color: mutedText }}
                            >
                                <span className="font-extrabold" style={{ color: textColor }}>
                                    {staff.full_name}
                                </span>{" "}
                                از لیست کارمندان انبار حذف خواهد شد.
                            </p>

                            <div className="mt-5 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={deleting}
                                    className="flex-1 rounded-2xl py-2.5 text-[12.5px] font-bold"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)",
                                        color: mutedText,
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