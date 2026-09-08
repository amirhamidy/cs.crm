"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
    Clock,
    CheckCircle,
    AlertTriangle,
    Package,
    User,
    CalendarDays,
    FileText,
    ChevronLeft,
    Paperclip,
} from "lucide-react";
import { ApiOrderTask } from "@/types/warehouse";
import { formatDate } from "@/utils/warehouseEmployee";
import PermissionTooltip from "./PermissionTooltip";

interface WarehouseEmployeeOrderTaskCardProps {
    orderTask: ApiOrderTask;
    index: number;
    isStaff: boolean;
    canChangeStatus?: boolean;
    onUpdate: (orderTask: ApiOrderTask) => void;
}

export default function WarehouseEmployeeOrderTaskCard({
    orderTask,
    index,
    isStaff,
    canChangeStatus = false,
    onUpdate,
}: WarehouseEmployeeOrderTaskCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const statusConfig = {
        in_progress: {
            label: "در حال انجام",
            icon: Clock,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            border: "border-blue-400/15",
        },
        completed: {
            label: "تکمیل‌شده",
            icon: CheckCircle,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
            border: "border-emerald-400/15",
        },
        cancelled: {
            label: "لغو‌شده",
            icon: AlertTriangle,
            color: "text-red-400",
            bg: "bg-red-400/10",
            border: "border-red-400/15",
        },
    } as const;

    const config =
        statusConfig[orderTask.status as keyof typeof statusConfig] ||
        statusConfig.in_progress;

    const Icon = config.icon;

    const textColor = isDark ? "#ffffff" : "#1e293b";
    const mutedText = isDark ? "rgba(255,255,255,0.4)" : "#94a3b8";
    const borderColor = isDark
        ? "rgba(255,255,255,0.07)"
        : "rgba(15,23,42,0.07)";

    const isCompleted = orderTask.status === "completed";
    const isCancelled = orderTask.status === "cancelled";
    const canUpdate = isStaff && canChangeStatus && !isCompleted && !isCancelled;

    const permissionMessage = !isStaff
        ? "برای تغییر وضعیت باید به‌عنوان کارمند انبار ثبت‌شده باشید"
        : !canChangeStatus
            ? "شما سطح دسترسی تغییر وضعیت سفارش‌های انبارداری را ندارید"
            : "";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.04 }}
            className="relative rounded-2xl border p-4 transition hover:border-indigo-200/50"
            style={{
                borderColor,
                background: isDark ? "#0f172a" : "#f8fafc",
            }}
        >
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
                <defs>
                    <linearGradient
                        id={`order-card-border-${orderTask.id}`}
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
                    stroke={`url(#order-card-border-${orderTask.id})`}
                    strokeWidth="1.4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileHover={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.45, ease: "easeInOut" }}
                />
            </svg>

            <div className="flex items-start gap-3">
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${config.bg} ${config.color}`}
                >
                    <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p
                                className="truncate text-sm font-bold"
                                style={{ color: textColor }}
                            >
                                {orderTask.title}
                            </p>

                            <p
                                className="mt-1 text-xs"
                                style={{ color: mutedText }}
                            >
                                سفارش #{orderTask.id} —{" "}
                                {orderTask.department?.name || "بدون دپارتمان"}
                            </p>
                        </div>

                        <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${config.bg} ${config.color} ${config.border}`}
                        >
                            {config.label}
                        </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div
                            className="rounded-xl p-2"
                            style={{
                                background: isDark
                                    ? "rgba(255,255,255,0.025)"
                                    : "rgba(15,23,42,0.025)",
                            }}
                        >
                            <p
                                className="text-[9px]"
                                style={{ color: mutedText }}
                            >
                                <Package className="inline h-3 w-3" /> محصول
                            </p>

                            <p
                                className="mt-0.5 truncate text-[11px] font-semibold"
                                style={{
                                    color: isDark
                                        ? "rgba(255,255,255,0.7)"
                                        : "#64748b",
                                }}
                            >
                                {orderTask.product || "—"}
                            </p>
                        </div>

                        <div
                            className="rounded-xl p-2"
                            style={{
                                background: isDark
                                    ? "rgba(255,255,255,0.025)"
                                    : "rgba(15,23,42,0.025)",
                            }}
                        >
                            <p
                                className="text-[9px]"
                                style={{ color: mutedText }}
                            >
                                تعداد
                            </p>

                            <p
                                className="mt-0.5 text-[11px] font-semibold"
                                style={{
                                    color: isDark
                                        ? "rgba(255,255,255,0.7)"
                                        : "#64748b",
                                }}
                            >
                                {orderTask.quantity} /{" "}
                                {orderTask.completed_quantity || 0}
                            </p>
                        </div>

                        <div
                            className="rounded-xl p-2"
                            style={{
                                background: isDark
                                    ? "rgba(255,255,255,0.025)"
                                    : "rgba(15,23,42,0.025)",
                            }}
                        >
                            <p
                                className="text-[9px]"
                                style={{ color: mutedText }}
                            >
                                <User className="inline h-3 w-3" /> ایجادکننده
                            </p>

                            <p
                                className="mt-0.5 truncate text-[11px] font-semibold"
                                style={{
                                    color: isDark
                                        ? "rgba(255,255,255,0.7)"
                                        : "#64748b",
                                }}
                            >
                                {orderTask.created_by?.username || "—"}
                            </p>
                        </div>

                        <div
                            className="rounded-xl p-2"
                            style={{
                                background: isDark
                                    ? "rgba(255,255,255,0.025)"
                                    : "rgba(15,23,42,0.025)",
                            }}
                        >
                            <p
                                className="text-[9px]"
                                style={{ color: mutedText }}
                            >
                                <CalendarDays className="inline h-3 w-3" /> تاریخ
                            </p>

                            <p
                                className="mt-0.5 text-[11px] font-semibold"
                                style={{
                                    color: isDark
                                        ? "rgba(255,255,255,0.7)"
                                        : "#64748b",
                                }}
                            >
                                {formatDate(orderTask.created_at)}
                            </p>
                        </div>
                    </div>

                    {orderTask.note && (
                        <div
                            className="mt-2 flex items-start gap-1.5 rounded-xl p-2"
                            style={{
                                background: isDark
                                    ? "rgba(255,255,255,0.025)"
                                    : "rgba(15,23,42,0.025)",
                            }}
                        >
                            <FileText
                                className="mt-0.5 h-3 w-3 shrink-0"
                                style={{ color: mutedText }}
                            />

                            <p
                                className="line-clamp-2 text-[10px] leading-4"
                                style={{
                                    color: isDark
                                        ? "rgba(255,255,255,0.45)"
                                        : "#94a3b8",
                                }}
                            >
                                {orderTask.note}
                            </p>
                        </div>
                    )}

                    {orderTask.performed_by && (
                        <div className="mt-2 flex items-center gap-1.5">
                            <span
                                className="text-[10px]"
                                style={{ color: mutedText }}
                            >
                                انجام‌دهنده:
                            </span>

                            <span className="text-[11px] font-semibold text-emerald-400">
                                {orderTask.performed_by.full_name}
                            </span>
                        </div>
                    )}

                    {orderTask.attachments &&
                        orderTask.attachments.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {orderTask.attachments.map((att) => (
                                    <a
                                        key={att.id}
                                        href={att.file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 rounded-xl border px-2 py-1 text-[10px] transition hover:border-indigo-400/50"
                                        style={{
                                            borderColor,
                                            color: mutedText,
                                        }}
                                    >
                                        <Paperclip className="h-3 w-3" />
                                        پیوست {att.id}
                                    </a>
                                ))}
                            </div>
                        )}

                    <div className="mt-3 flex items-center gap-2">
                        <PermissionTooltip
                            allowed={canUpdate}
                            message={permissionMessage}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    if (canUpdate) {
                                        onUpdate(orderTask);
                                    }
                                }}
                                disabled={isCompleted || isCancelled}
                                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10.5px] font-bold transition"
                                style={{
                                    background: canUpdate
                                        ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                                        : isDark
                                            ? "rgba(255,255,255,0.04)"
                                            : "rgba(15,23,42,0.04)",
                                    color: canUpdate ? "#fff" : mutedText,
                                    cursor: canUpdate
                                        ? "pointer"
                                        : "not-allowed",
                                }}
                            >
                                {isCompleted
                                    ? "تکمیل‌شده ✓"
                                    : isCancelled
                                        ? "لغو‌شده ✕"
                                        : "تعیین وضعیت"}

                                {canUpdate &&
                                    !isCompleted &&
                                    !isCancelled && (
                                        <ChevronLeft className="h-3 w-3" />
                                    )}
                            </button>
                        </PermissionTooltip>

                        {orderTask.deadline && (
                            <span
                                className="flex items-center gap-1 text-[10px]"
                                style={{ color: mutedText }}
                            >
                                <CalendarDays className="h-3 w-3" />
                                مهلت: {formatDate(orderTask.deadline)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
