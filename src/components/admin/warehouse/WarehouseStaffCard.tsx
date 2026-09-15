"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Power, Trash2, X } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";

interface WarehouseStaff {
    id: number;
    employee: number;
    employee_id: number;
    full_name: string;
    is_active: boolean;
    joined_at: string;
}

interface WarehouseStaffCardProps {
    staff: WarehouseStaff;
    index: number;
    onDelete: (id: number) => void;
    onUpdated: (staff: WarehouseStaff) => void;
}

export default function WarehouseStaffCard({
    staff,
    index,
    onDelete,
    onUpdated,
}: WarehouseStaffCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [hovered, setHovered] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [isActive, setIsActive] = useState(staff.is_active);
    const [statusLoading, setStatusLoading] = useState(false);

    const joinedDate = useMemo(() => {
        return new Date(staff.joined_at).toLocaleDateString("fa-IR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    }, [staff.joined_at]);

    const handleToggleActive = async () => {
        const nextStatus = !isActive;
        setStatusLoading(true);
        try {
            const { data } = await axiosInstance.patch(
                `/warehouse/api/v1/staff/${staff.id}/update/`,
                {
                    employee: staff.employee,
                    is_active: nextStatus,
                }
            );
            setIsActive(nextStatus);
            onUpdated(data);
        } catch {
            setIsActive((prev) => prev);
        } finally {
            setStatusLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await axiosInstance.delete(`/warehouse/api/v1/staff/${staff.id}/delete/`);
            onDelete(staff.id);
            setShowConfirm(false);
        } catch {
        } finally {
            setDeleting(false);
        }
    };

    const handleCloseConfirm = () => {
        if (deleting) return;
        setShowConfirm(false);
    };

    const employeeName = staff.full_name?.trim() || "بدون نام";
    const [start, end] = [
        ["#6366f1", "#8b5cf6"],
        ["#ec4899", "#8b5cf6"],
        ["#06b6d4", "#3b82f6"],
        ["#10b981", "#14b8a6"],
        ["#f59e0b", "#ef4444"],
    ][staff.id % 5];

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
                        stroke={`url(#staff-border-${staff.id})`}
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

                <div className="flex justify-start items-center gap-2">
                    <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[15px] font-extrabold text-white"
                        style={{
                            background: `linear-gradient(135deg, ${start}, ${end})`,
                        }}
                    >
                        {employeeName.charAt(0)}
                    </div>
                    <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                        {employeeName}
                    </h3>
                </div>

                <div className="my-auto mt-5 flex items-start gap-3">
                    <div className="min-w-0 flex flex-col space-y-1.5">
                        <div className="flex items-center justify-start gap-1">
                            <span className="text-[11.5px] font-semibold dark:text-gray-500">
                                نقش:
                            </span>
                            <span
                                className="inline-flex h-7 items-center rounded-xl px-2.5 text-[11px] font-bold"
                                style={{
                                    background: isDark
                                        ? "rgba(99,102,241,0.14)"
                                        : "rgba(99,102,241,0.08)",
                                    color: isDark ? "#a5b4fc" : "#6366f1",
                                }}
                            >
                                انباردار
                            </span>
                        </div>

                        <div className="flex justify-start gap-1 items-center">
                            <span className="text-[11.5px] font-semibold dark:text-gray-500">
                                تاریخ شروع:
                            </span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                {joinedDate}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-start gap-3">
                    <button
                        type="button"
                        onClick={handleToggleActive}
                        disabled={statusLoading}
                        className="relative flex h-7 w-[42px] items-center justify-between rounded-full p-[2px] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70"
                        style={{
                            background: isActive
                                ? isDark
                                    ? "rgba(16,185,129,0.22)"
                                    : "rgba(16,185,129,0.14)"
                                : isDark
                                    ? "rgba(100,116,139,0.2)"
                                    : "rgba(100,116,139,0.12)",
                            boxShadow: isActive
                                ? "inset 0 0 0 1px rgba(16,185,129,0.12)"
                                : "inset 0 0 0 1px rgba(100,116,139,0.1)",
                        }}
                        title={isActive ? "اکانت فعال است" : "اکانت غیرفعال است"}
                    >
                        <motion.span
                            animate={{ x: isActive ? 0 : 15 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="absolute left-[2px] top-[2px] flex h-[23px] w-[23px] items-center justify-center rounded-full shadow-md"
                            style={{
                                background: isActive ? "#10b981" : isDark ? "#475569" : "#94a3b8",
                                color: "#ffffff",
                            }}
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                {isActive ? (
                                    <motion.span
                                        key="check"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <Check size={12} strokeWidth={3.5} />
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key="power"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <Power size={11} strokeWidth={2.5} />
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.span>
                    </button>
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
                                        حذف انباردار
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
                                انباردار{" "}
                                <span className="font-extrabold text-gray-900 dark:text-white">
                                    {employeeName}
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
        </>
    );
}