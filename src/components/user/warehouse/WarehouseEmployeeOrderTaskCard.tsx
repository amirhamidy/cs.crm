"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
    AlertCircle,
    ArrowRight,
    Building2,
    CheckCircle2,
    ClipboardList,
    Clock3,
    FileText,
    Package,
    User,
    XCircle,
} from "lucide-react";
import { ApiOrderTask, ApiProduct } from "@/types/warehouse";
import WarehouseEmployeeOrderTaskStatusModal from "./WarehouseEmployeeOrderTaskStatusModal";
import {
    formatDate,
    formatNumber,
    getStatusLabel,
    getStatusTone,
} from "@/utils/warehouseEmployee";

interface Props {
    orderTask: ApiOrderTask;
    products: ApiProduct[];
    index: number;
    isStaff: boolean;
    staffId: number | string | null;
    canChangeStatus: boolean;
    onUpdate?: (orderTask: ApiOrderTask) => void;
    onRefresh?: () => Promise<void> | void;
}

const AVATAR_GRADIENTS = [
    ["#6366f1", "#3b82f6"],
    ["#06b6d4", "#3b82f6"],
    ["#10b981", "#059669"],
    ["#8b5cf6", "#6366f1"],
    ["#f43f5e", "#e11d48"],
] as const;

export default function WarehouseEmployeeOrderTaskCard({
    orderTask,
    products,
    index,
    isStaff,
    staffId,
    canChangeStatus,
    onUpdate,
    onRefresh,
}: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [hovered, setHovered] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    const assignedEmployee = Array.isArray(orderTask.assigned_employee)
        ? orderTask.assigned_employee[0]
        : null;
    const assignedEmployeeName = assignedEmployee?.full_name ?? "";

    const orderData = orderTask as ApiOrderTask & {
        product?: unknown;
        product_name?: string;
        product_title?: string;
        task_title?: string;
    };

    const productName = useMemo(() => {
        const rawProduct = orderData.product;

        if (typeof rawProduct === "number") {
            const found = (products ?? []).find((p) => p.id === rawProduct);
            if (found) return found.name;
        }

        if (rawProduct && typeof rawProduct === "object") {
            const obj = rawProduct as Record<string, unknown>;
            if (obj.title) return String(obj.title);
            if (obj.name) return String(obj.name);
        }

        if (orderData.product_name) return orderData.product_name;
        if (orderData.product_title) return orderData.product_title;

        return "محصول نامشخص";
    }, [orderData.product, orderData.product_name, orderData.product_title, products ?? []]);

    const statusTone = getStatusTone(orderTask.status);
    const statusLabel = getStatusLabel(orderTask.status);

    const statusConfig = {
        completed: {
            bg: isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)",
            text: isDark ? "#6ee7b7" : "#059669",
            icon: CheckCircle2,
            gradient: ["#10b981", "#059669"],
        },
        cancelled: {
            bg: isDark ? "rgba(244,63,94,0.12)" : "rgba(244,63,94,0.08)",
            text: isDark ? "#fda4af" : "#e11d48",
            icon: XCircle,
            gradient: ["#f43f5e", "#e11d48"],
        },
        in_progress: {
            bg: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
            text: isDark ? "#a5b4fc" : "#4f46e5",
            icon: Clock3,
            gradient: ["#6366f1", "#3b82f6"],
        },
        pending: {
            bg: isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.08)",
            text: isDark ? "#93c5fd" : "#2563eb",
            icon: AlertCircle,
            gradient: ["#3b82f6", "#2563eb"],
        },
    };

    const currentStatus = statusConfig[statusTone as keyof typeof statusConfig] || statusConfig.pending;
    const StatusIcon = currentStatus.icon;
    const [start, end] = AVATAR_GRADIENTS[orderTask.id % AVATAR_GRADIENTS.length];

    const qty = Number(orderTask.quantity ?? 0);
    const completed = Number(orderTask.completed_quantity ?? 0);
    const progress = qty > 0 ? Math.min(100, Math.round((completed / qty) * 100)) : 0;

    const refresh = async () => {
        if (onRefresh) {
            await onRefresh();
            return;
        }
        if (onUpdate) {
            onUpdate(orderTask);
        }
    };

    const canComplete = canChangeStatus && orderTask.status !== "completed" && orderTask.status !== "cancelled";
    const canCancel = canChangeStatus && orderTask.status !== "completed" && orderTask.status !== "cancelled";

    const customerName = orderTask.customer?.full_name || "نامشخص";
    const departmentName = orderTask.department?.name || "نامشخص";
    const responsibleName = assignedEmployeeName || orderTask.performed_by?.full_name || "تعیین نشده";
    const stepName = orderTask.current_step?.name || orderData.task_title || "نامشخص";

    return (
        <>
            <motion.article
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                className="relative flex min-h-[160px] flex-col justify-between overflow-visible rounded-3xl p-3.5"
                style={{
                    background: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
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
                            id={`order-border-${orderTask.id}`}
                            x1="100%"
                            y1="100%"
                            x2="0%"
                            y2="0%"
                        >
                            <stop offset="0%" stopColor={currentStatus.gradient[0]} />
                            <stop offset="100%" stopColor={currentStatus.gradient[1]} />
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
                        stroke={`url(#order-border-${orderTask.id})`}
                        strokeWidth="1.4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={hovered ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                        transition={{ duration: 0.45, ease: "easeInOut" }}
                    />
                </svg>

                <div className="relative z-[1] flex items-start justify-between gap-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[13px] font-extrabold text-white shadow-lg"
                            style={{
                                background: `linear-gradient(135deg, ${start}, ${end})`,
                            }}
                        >
                            <Package size={16} strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="truncate text-[12.5px] font-extrabold text-gray-900 dark:text-white">
                                {orderTask.title || "بدون عنوان"}
                            </h3>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span
                                    className="inline-flex items-center gap-1 rounded-xl px-2 py-0.5 text-[10px] font-extrabold"
                                    style={{ background: currentStatus.bg, color: currentStatus.text }}
                                >
                                    <StatusIcon size={9} />
                                    {statusLabel}
                                </span>
                                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                                    سفارش #{formatNumber(orderTask.id)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-[1] mt-3 rounded-2xl bg-gray-50 p-2.5 dark:bg-white/[0.03]">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <p className="text-[9.5px] font-bold text-gray-400 dark:text-white/40">
                                محصول درخواستی
                            </p>
                            <p className="mt-0.5 truncate text-[12px] font-black text-gray-800 dark:text-gray-100">
                                {productName}
                            </p>
                        </div>
                        <div className="shrink-0 text-left">
                            <p className="text-[9.5px] font-bold text-gray-400 dark:text-white/40">
                                تعداد
                            </p>
                            <p className="mt-0.5 text-[13px] font-black text-gray-900 dark:text-white">
                                {formatNumber(qty)}
                            </p>
                        </div>
                    </div>

                    {orderTask.completed_quantity !== null && orderTask.completed_quantity !== undefined && (
                        <div className="mt-2.5">
                            <div className="mb-1 flex items-center justify-between">
                                <span className="text-[9.5px] font-bold text-gray-400 dark:text-white/40">
                                    پیشرفت انجام
                                </span>
                                <span className="text-[10.5px] font-black" style={{ color: currentStatus.text }}>
                                    {formatNumber(completed)} از {formatNumber(qty)} ({progress}٪)
                                </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.6, delay: index * 0.04 }}
                                    className="h-full rounded-full"
                                    style={{
                                        background: `linear-gradient(90deg, ${currentStatus.gradient[0]}, ${currentStatus.gradient[1]})`,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative z-[1] mt-3 grid grid-cols-2 gap-1.5">
                    <div className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-2 py-1.5 dark:bg-white/[0.03]">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/10">
                            <User size={10} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[8.5px] font-bold text-gray-400 dark:text-white/40">مشتری</p>
                            <p className="truncate text-[10.5px] font-black text-gray-700 dark:text-gray-200">
                                {customerName}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-2 py-1.5 dark:bg-white/[0.03]">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/10">
                            <Building2 size={10} className="text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[8.5px] font-bold text-gray-400 dark:text-white/40">واحد</p>
                            <p className="truncate text-[10.5px] font-black text-gray-700 dark:text-gray-200">
                                {departmentName}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-2 py-1.5 dark:bg-white/[0.03]">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
                            <ClipboardList size={10} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[8.5px] font-bold text-gray-400 dark:text-white/40">مسئول</p>
                            <p className="truncate text-[10.5px] font-black text-gray-700 dark:text-gray-200">
                                {responsibleName}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-2 py-1.5 dark:bg-white/[0.03]">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/10">
                            <Clock3 size={10} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[8.5px] font-bold text-gray-400 dark:text-white/40">مرحله</p>
                            <p className="truncate text-[10.5px] font-black text-gray-700 dark:text-gray-200">
                                {stepName}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="relative z-[1] mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2">
                        <Clock3 size={10} className="text-gray-400" />
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                            {formatDate(orderTask.created_at)}
                        </span>
                        {orderTask.note && (
                            <div className="group/note relative flex items-center gap-1">
                                <FileText size={10} className="text-gray-400" />
                                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                                    یادداشت
                                </span>
                                <div className="pointer-events-none absolute bottom-full right-0 mb-2 hidden w-48 rounded-xl bg-gray-900 p-2 text-[10px] text-white shadow-xl group-hover/note:block dark:bg-gray-800">
                                    {orderTask.note}
                                </div>
                            </div>
                        )}
                    </div>

                    {(canComplete || canCancel) && (
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setModalOpen(true)}
                            className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10.5px] font-extrabold text-white transition-shadow"
                            style={{
                                background: `linear-gradient(135deg, ${currentStatus.gradient[0]}, ${currentStatus.gradient[1]})`,
                                boxShadow: `0 4px 12px -2px ${currentStatus.gradient[1]}60`,
                            }}
                        >
                            <ArrowRight size={11} />
                            تغییر وضعیت
                        </motion.button>
                    )}
                </div>
            </motion.article>

            <AnimatePresence>
                {modalOpen && (
                    <WarehouseEmployeeOrderTaskStatusModal
                        open={modalOpen}
                        orderTask={orderTask}
                        products={products}
                        performedBy={staffId}
                        initialStatus="completed"
                        onClose={() => setModalOpen(false)}
                        onSuccess={refresh}
                    />
                )}
            </AnimatePresence>
        </>
    );
}