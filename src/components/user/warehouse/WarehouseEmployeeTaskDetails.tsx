"use client";

import { ArrowRight, CalendarDays, CheckCircle2, ClipboardList, Package, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { ApiWarehouseTask } from "@/types/warehouse";
import { formatDate, formatNumber, getStatusLabel, getStatusTone, getTaskProductName } from "@/utils/warehouseEmployee";

interface Props {
    task: ApiWarehouseTask | null;
    open: boolean;
    onClose: () => void;
}

interface DetailField {
    label: string;
    value: string;
}

export default function WarehouseEmployeeTaskDetails({ task, open, onClose }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    if (!open || !task) return null;

    const data = task as unknown as Record<string, unknown>;

    const status = typeof data.status === "string" || typeof data.status === "number" ? String(data.status) : "";
    const tone = getStatusTone(status);

    const expected = Number(data.expected_quantity ?? data.quantity ?? data.requested_quantity ?? 0);
    const received = Number(data.received_quantity ?? data.completed_quantity ?? 0);
    const remaining = Math.max(expected - received, 0);

    const getDisplayValue = (value: unknown): string => {
        if (value === null || value === undefined || value === "") return "—";
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
        return "—";
    };

    const description =
        typeof data.note === "string" && data.note.trim()
            ? data.note
            : typeof data.description === "string" && data.description.trim()
                ? data.description
                : "";

    const fields: DetailField[] = [
        { label: "شناسه وظیفه", value: getDisplayValue(data.id) },
        { label: "کالای مرتبط", value: getTaskProductName(task) },
        { label: "وضعیت", value: getStatusLabel(status) },
        { label: "مقدار مورد انتظار", value: formatNumber(expected) },
        { label: "مقدار دریافت شده", value: formatNumber(received) },
        { label: "مقدار باقی‌مانده", value: formatNumber(remaining) },
        { label: "شناسه سفارش", value: getDisplayValue(data.order_task_id ?? data.order_id) },
        { label: "شناسه خرید", value: getDisplayValue(data.purchase_task_id) },
        { label: "کنترل کیفیت", value: getDisplayValue(data.quality_control_id) },
        { label: "آخرین بروزرسانی", value: getDisplayValue(formatDate(data.updated_at ?? data.modified_at ?? data.created_at)) },
    ];

    const textColor = isDark ? "#ffffff" : "#1e293b";
    const mutedText = isDark ? "rgba(255,255,255,0.4)" : "#94a3b8";
    const borderColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)";

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.96 }}
                        transition={{ duration: 0.2 }}
                        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] border shadow-2xl sm:max-w-2xl sm:rounded-[28px]"
                        style={{
                            borderColor,
                            background: isDark ? "#0f172a" : "#f8fafc",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="sticky top-0 z-10 flex items-center justify-between border-b px-5 py-4 backdrop-blur-xl"
                            style={{
                                borderColor,
                                background: isDark ? "rgba(15,23,42,0.95)" : "rgba(248,250,252,0.95)",
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl transition"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
                                        color: mutedText,
                                    }}
                                >
                                    <X className="h-5 w-5" />
                                </button>

                                <div>
                                    <p className="text-sm font-bold" style={{ color: textColor }}>
                                        جزئیات وظیفه
                                    </p>
                                    <p className="mt-0.5 text-xs" style={{ color: mutedText }}>
                                        وظیفه #{getDisplayValue(data.id)}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl bg-indigo-400/10 p-2.5 text-indigo-400">
                                <ClipboardList className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="space-y-5 p-5">
                            {/* Product Info */}
                            <div
                                className="rounded-2xl border p-4"
                                style={{ borderColor, background: isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.025)" }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-400">
                                        <Package className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px]" style={{ color: mutedText }}>
                                            کالای مرتبط
                                        </p>
                                        <p className="mt-1 text-base font-bold" style={{ color: textColor }}>
                                            {getTaskProductName(task)}
                                        </p>

                                        <div className="mt-3">
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${tone === "success"
                                                        ? "border-emerald-400/15 bg-emerald-400/10 text-emerald-300"
                                                        : tone === "danger"
                                                            ? "border-red-400/15 bg-red-400/10 text-red-300"
                                                            : tone === "warning"
                                                                ? "border-amber-400/15 bg-amber-400/10 text-amber-300"
                                                                : isDark
                                                                    ? "border-white/[0.08] bg-white/[0.04] text-white/50"
                                                                    : "border-gray-200 bg-gray-100 text-gray-500"
                                                    }`}
                                            >
                                                {getStatusLabel(status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Fields Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {fields.map((field) => (
                                    <div
                                        key={field.label}
                                        className="rounded-xl border p-3"
                                        style={{
                                            borderColor,
                                            background: isDark ? "rgba(255,255,255,0.02)" : "rgba(15,23,42,0.02)",
                                        }}
                                    >
                                        <p className="text-[10px]" style={{ color: mutedText }}>
                                            {field.label}
                                        </p>
                                        <p className="mt-1 break-words text-xs font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.75)" : "#64748b" }}>
                                            {field.value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Description */}
                            {description ? (
                                <div
                                    className="rounded-2xl border p-4"
                                    style={{ borderColor, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(15,23,42,0.02)" }}
                                >
                                    <p className="text-xs" style={{ color: mutedText }}>
                                        توضیحات
                                    </p>
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7" style={{ color: isDark ? "rgba(255,255,255,0.65)" : "#64748b" }}>
                                        {description}
                                    </p>
                                </div>
                            ) : null}

                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-3">
                                <div
                                    className="rounded-2xl border p-4"
                                    style={{
                                        borderColor,
                                        background: isDark ? "rgba(16,185,129,0.05)" : "rgba(16,185,129,0.05)",
                                    }}
                                >
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-xs">دریافت شده</span>
                                    </div>
                                    <p className="mt-2 text-xl font-bold" style={{ color: textColor }}>
                                        {formatNumber(received)}
                                    </p>
                                </div>

                                <div
                                    className="rounded-2xl border p-4"
                                    style={{
                                        borderColor,
                                        background: isDark ? "rgba(245,158,11,0.05)" : "rgba(245,158,11,0.05)",
                                    }}
                                >
                                    <div className="flex items-center gap-2 text-amber-400">
                                        <CalendarDays className="h-4 w-4" />
                                        <span className="text-xs">باقی‌مانده</span>
                                    </div>
                                    <p className="mt-2 text-xl font-bold" style={{ color: textColor }}>
                                        {formatNumber(remaining)}
                                    </p>
                                </div>
                            </div>

                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition"
                                style={{
                                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                    color: "#ffffff",
                                }}
                            >
                                <ArrowRight className="h-4 w-4" />
                                بازگشت به وظایف
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}