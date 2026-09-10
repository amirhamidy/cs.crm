"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Clock3,
    FileText,
    Loader2,
    Package,
    PackageCheck,
    RotateCcw,
    ShieldCheck,
    Upload,
    User,
    X,
    XCircle,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiWarehouseTask } from "@/types/warehouse";

interface WarehouseEmployeeTaskCardProps {
    task: ApiWarehouseTask;
    index?: number;
    employeeId?: number | null;
    onUpdated?: (task: ApiWarehouseTask) => void;
}

type ActionType = "complete" | "cancel" | "reopen" | null;

const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#ec4899", "#8b5cf6"],
    ["#06b6d4", "#3b82f6"],
    ["#10b981", "#14b8a6"],
    ["#f59e0b", "#ef4444"],
] as const;

const formatNumber = (value: number | null | undefined) =>
    new Intl.NumberFormat("fa-IR").format(Number(value ?? 0));

const formatDate = (value: string | null | undefined) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
};

const getErrorMessage = (error: unknown) => {
    const axiosError = error as {
        response?: { data?: unknown };
    };
    const data = axiosError?.response?.data;

    if (!data) return "در انجام عملیات مشکلی پیش آمد.";
    if (typeof data === "string") return data;

    if (typeof data === "object" && data !== null) {
        const record = data as Record<string, unknown>;
        const directKeys = [
            "detail",
            "message",
            "error",
            "note",
            "assigned_to",
            "received_quantity",
            "file",
            "non_field_errors",
        ];

        for (const key of directKeys) {
            const value = record[key];
            if (typeof value === "string" && value.trim()) return value;
            if (Array.isArray(value) && value.length) {
                return value
                    .map((item) =>
                        typeof item === "string" ? item : JSON.stringify(item)
                    )
                    .join("، ");
            }
        }
    }

    return "در انجام عملیات مشکلی پیش آمد.";
};

const getStatusMeta = (status: string | null | undefined) => {
    const normalized = String(status ?? "").toLowerCase();

    if (normalized === "completed") {
        return {
            label: "تکمیل شده",
            icon: CheckCircle2,
            bg: "bg-emerald-50 dark:bg-emerald-500/10",
            text: "text-emerald-600 dark:text-emerald-300",
        };
    }
    if (normalized === "cancelled") {
        return {
            label: "لغو شده",
            icon: XCircle,
            bg: "bg-red-50 dark:bg-red-500/10",
            text: "text-red-600 dark:text-red-300",
        };
    }
    if (normalized === "in_progress") {
        return {
            label: "در حال انجام",
            icon: Clock3,
            bg: "bg-indigo-50 dark:bg-indigo-500/10",
            text: "text-indigo-600 dark:text-indigo-300",
        };
    }
    return {
        label: "در انتظار",
        icon: Clock3,
        bg: "bg-amber-50 dark:bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-300",
    };
};

function FloatingInput({
    label,
    id,
    value,
    onChange,
    type = "text",
    disabled,
    placeholder,
}: {
    label: string;
    id: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    disabled?: boolean;
    placeholder?: string;
}) {
    return (
        <div className="relative">
            <input
                id={id}
                type={type}
                placeholder={placeholder || " "}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="peer h-[52px] w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 pt-4 text-[12.5px] font-bold text-gray-900 outline-none transition-colors focus:border-blue-500 disabled:opacity-60 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-blue-500/50"
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-gray-400 transition-all duration-200 peer-focus:top-[15px] peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-[15px] peer-[:not(:placeholder-shown)]:text-[10px]"
            >
                {label}
            </label>
        </div>
    );
}

export default function WarehouseEmployeeTaskCard({
    task,
    index = 0,
    employeeId,
    onUpdated,
}: WarehouseEmployeeTaskCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [hovered, setHovered] = useState(false);

    const [action, setAction] = useState<ActionType>(null);
    const [receivedQuantity, setReceivedQuantity] = useState(
        task.received_quantity !== null && task.received_quantity !== undefined
            ? String(task.received_quantity)
            : String(task.expected_quantity ?? "")
    );
    const [note, setNote] = useState(task.note ?? "");
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const statusMeta = getStatusMeta(task.status);
    const StatusIcon = statusMeta.icon;

    const expected = Number(task.expected_quantity ?? 0);
    const received = Number(task.received_quantity ?? 0);

    const progress =
        expected > 0 ? Math.min(100, Math.max(0, (received / expected) * 100)) : 0;

    const normalizedStatus = String(task.status ?? "").toLowerCase();
    const isCompleted = normalizedStatus === "completed";
    const isCancelled = normalizedStatus === "cancelled";
    const isPending = normalizedStatus === "pending";

    const [start, end] = AVATAR_GRADIENTS[task.id % AVATAR_GRADIENTS.length];

    const openAction = (nextAction: ActionType) => {
        setError("");
        setFile(null);
        setReceivedQuantity(
            task.received_quantity !== null && task.received_quantity !== undefined
                ? String(task.received_quantity)
                : String(task.expected_quantity ?? "")
        );
        setNote(task.note ?? "");
        setAction(nextAction);
    };

    const closeAction = () => {
        if (submitting) return;
        setAction(null);
        setError("");
        setFile(null);
    };

    const submitAction = async () => {
        if (!action) return;
        setError("");

        if (action === "reopen") {
            try {
                setSubmitting(true);
                const response = await axiosInstance.post(
                    `/warehouse/api/v1/task/${task.id}/reopen/`
                );
                const updatedTask = response.data?.warehouse_task ?? response.data;
                if (updatedTask) onUpdated?.(updatedTask);
                setAction(null);
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setSubmitting(false);
            }
            return;
        }

        if (!employeeId) {
            setError("کارمند مسئول برای انجام این عملیات مشخص نشده است.");
            return;
        }

        const quantity = Number(receivedQuantity);
        if (receivedQuantity.trim() === "" || Number.isNaN(quantity) || quantity < 0) {
            setError("مقدار دریافت‌شده را به صورت صحیح وارد کنید.");
            return;
        }

        if (action === "cancel" && !note.trim()) {
            setError("برای لغو وظیفه، ثبت توضیحات الزامی است.");
            return;
        }

        const formData = new FormData();
        formData.append("assigned_to", String(employeeId));
        formData.append("received_quantity", String(quantity));
        if (note.trim()) formData.append("note", note.trim());
        if (file) formData.append("file", file);

        try {
            setSubmitting(true);
            const endpoint =
                action === "complete"
                    ? `/warehouse/api/v1/task/${task.id}/complete/`
                    : `/warehouse/api/v1/task/${task.id}/cancel/`;
            const response = await axiosInstance.post(endpoint, formData);
            const updatedTask = response.data?.warehouse_task ?? response.data;
            if (updatedTask) onUpdated?.(updatedTask);
            setAction(null);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const hasQualityControl =
        task.quality_control_id !== null && task.quality_control_id !== undefined;

    return (
        <>
            <motion.article
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.24) }}
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
                {/* SVG border gradient animation */}
                <svg className="pointer-events-none absolute inset-0 h-full w-full">
                    <defs>
                        <linearGradient
                            id={`task-border-${task.id}`}
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
                        stroke={`url(#task-border-${task.id})`}
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

                {/* Product Header */}
                <div className="relative z-[1] flex items-start gap-3">
                    <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[15px] font-extrabold text-white shadow-lg"
                        style={{
                            background: `linear-gradient(135deg,${start},${end})`,
                        }}
                    >
                        <Package size={18} strokeWidth={2.5} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                            {task.product_name || "محصول نامشخص"}
                        </h3>

                        <div className="mt-1 flex items-center gap-1.5 text-[10.5px] font-semibold text-gray-500 dark:text-gray-400">
                            <span>وظیفه انبار</span>
                            <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[9.5px] font-bold text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">
                                #{formatNumber(task.id)}
                            </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span
                                className={`inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[10.5px] font-extrabold ${statusMeta.bg} ${statusMeta.text}`}
                            >
                                <StatusIcon size={10} />
                                {task.status_display || statusMeta.label}
                            </span>

                            {hasQualityControl && (
                                <span className="inline-flex items-center gap-1 rounded-xl bg-violet-50 px-2 py-1 text-[10.5px] font-extrabold text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                                    <ShieldCheck size={10} />
                                    کنترل کیفیت
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="relative z-[1] mt-4 grid grid-cols-3 gap-1.5">
                    <div
                        className="rounded-2xl px-2.5 py-2"
                        style={{
                            background: isDark
                                ? "rgba(255,255,255,0.025)"
                                : "rgba(15,23,42,0.025)",
                        }}
                    >
                        <p className="text-[9.5px] font-bold text-gray-400 dark:text-white/40">
                            مورد انتظار
                        </p>
                        <p className="mt-0.5 text-[13px] font-black text-gray-800 dark:text-white">
                            {formatNumber(expected)}
                        </p>
                    </div>

                    <div
                        className="rounded-2xl px-2.5 py-2"
                        style={{
                            background: isDark
                                ? "rgba(255,255,255,0.025)"
                                : "rgba(15,23,42,0.025)",
                        }}
                    >
                        <p className="text-[9.5px] font-bold text-gray-400 dark:text-white/40">
                            دریافت‌شده
                        </p>
                        <p
                            className={`mt-0.5 text-[13px] font-black ${received >= expected && expected > 0
                                    ? "text-emerald-500"
                                    : "text-gray-800 dark:text-white"
                                }`}
                        >
                            {task.received_quantity === null ||
                                task.received_quantity === undefined
                                ? "—"
                                : formatNumber(received)}
                        </p>
                    </div>

                    <div
                        className="flex items-center gap-1.5 rounded-2xl px-2.5 py-2"
                        style={{
                            background: isDark
                                ? "rgba(255,255,255,0.025)"
                                : "rgba(15,23,42,0.025)",
                        }}
                    >
                        <div
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                            style={{
                                background: isDark
                                    ? "rgba(99,102,241,0.14)"
                                    : "rgba(99,102,241,0.1)",
                            }}
                        >
                            <User size={11} className="text-indigo-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9.5px] font-bold text-gray-400 dark:text-white/40">
                                مسئول
                            </p>
                            <p className="truncate text-[10.5px] font-bold text-gray-700 dark:text-gray-200">
                                {task.assigned_to_name || "—"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="relative z-[1] mt-3">
                    <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[10.5px] font-bold text-gray-400 dark:text-white/40">
                            میزان پیشرفت
                        </span>
                        <span
                            className="text-[10.5px] font-black"
                            style={{
                                color:
                                    progress >= 100
                                        ? "#10b981"
                                        : isDark
                                            ? "#e2e8f0"
                                            : "#334155",
                            }}
                        >
                            {formatNumber(Math.round(progress))}٪
                        </span>
                    </div>
                    <div
                        className="h-1.5 overflow-hidden rounded-full"
                        style={{
                            background: isDark
                                ? "rgba(255,255,255,.06)"
                                : "rgba(15,23,42,.06)",
                        }}
                    >
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.6, delay: index * 0.04 }}
                            className="h-full rounded-full"
                            style={{
                                background:
                                    progress >= 100
                                        ? "#10b981"
                                        : "linear-gradient(90deg,#6366f1,#8b5cf6)",
                            }}
                        />
                    </div>
                </div>

                {/* Note Preview */}
                {task.note && (
                    <div className="relative z-[1] mt-3 flex items-start gap-2 rounded-xl bg-gray-50 px-2.5 py-2 dark:bg-white/[0.025]">
                        <FileText
                            size={11}
                            className="mt-0.5 shrink-0 text-gray-400"
                        />
                        <p className="line-clamp-2 text-[10.5px] font-medium leading-5 text-gray-600 dark:text-gray-300">
                            {task.note}
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div
                    className="relative z-[1] mt-3 flex items-center justify-between border-t pt-2.5"
                    style={{
                        borderColor: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(15,23,42,0.06)",
                    }}
                >
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-white/40">
                        <span>ایجاد: {formatDate(task.created_at)}</span>
                        {task.updated_at && (
                            <span>· به‌روز: {formatDate(task.updated_at)}</span>
                        )}
                    </div>

                    {task.file && (
                        <a
                            href={task.file}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                        >
                            <FileText size={10} />
                            فایل
                        </a>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="relative z-[1] mt-3">
                    {isPending && (
                        <div className="grid grid-cols-2 gap-2">
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.97 }}
                                onClick={() => openAction("complete")}
                                className="flex h-10 items-center justify-center gap-1.5 rounded-2xl text-[12px] font-extrabold text-white transition-colors"
                                style={{
                                    background:
                                        "linear-gradient(135deg,#6366f1,#8b5cf6)",
                                    boxShadow:
                                        "0 6px 18px -4px rgba(99,102,241,0.4)",
                                }}
                            >
                                <PackageCheck size={14} />
                                انجام می‌شود
                            </motion.button>

                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.97 }}
                                onClick={() => openAction("cancel")}
                                className="flex h-10 items-center justify-center gap-1.5 rounded-2xl border text-[12px] font-extrabold transition-colors"
                                style={{
                                    color: isDark ? "#fca5a5" : "#dc2626",
                                    background: isDark
                                        ? "rgba(239,68,68,.07)"
                                        : "#fef2f2",
                                    borderColor: isDark
                                        ? "rgba(239,68,68,.2)"
                                        : "#fecaca",
                                }}
                            >
                                <XCircle size={14} />
                                انجام نمی‌شود
                            </motion.button>
                        </div>
                    )}

                    {isCancelled && (
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={() => openAction("reopen")}
                            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-2xl text-[12px] font-extrabold text-white"
                            style={{
                                background:
                                    "linear-gradient(135deg,#f59e0b,#f97316)",
                                boxShadow:
                                    "0 6px 18px -4px rgba(245,158,11,0.4)",
                            }}
                        >
                            <RotateCcw size={14} />
                            بازگشایی وظیفه
                        </motion.button>
                    )}

                    {isCompleted && (
                        <div
                            className="flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[11.5px] font-bold"
                            style={{
                                color: isDark ? "#86efac" : "#15803d",
                                background: isDark
                                    ? "rgba(34,197,94,.08)"
                                    : "#f0fdf4",
                            }}
                        >
                            <CheckCircle2 size={13} />
                            این وظیفه با موفقیت تکمیل شده است
                        </div>
                    )}
                </div>
            </motion.article>

            <AnimatePresence>
                {action && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center px-4"
                        style={{
                            background: "rgba(0,0,0,0.5)",
                            backdropFilter: "blur(4px)",
                        }}
                        onClick={closeAction}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 16 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            dir="rtl"
                            className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
                        >
                            {/* Header */}
                            <div className="flex shrink-0 items-center justify-between px-8 pb-6 pt-8">
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                                        style={{
                                            background:
                                                action === "reopen"
                                                    ? isDark
                                                        ? "rgba(245,158,11,0.14)"
                                                        : "rgba(245,158,11,0.1)"
                                                    : action === "cancel"
                                                        ? isDark
                                                            ? "rgba(239,68,68,0.14)"
                                                            : "rgba(239,68,68,0.1)"
                                                        : isDark
                                                            ? "rgba(16,185,129,0.14)"
                                                            : "rgba(16,185,129,0.1)",
                                        }}
                                    >
                                        {action === "complete" ? (
                                            <CheckCircle2
                                                size={15}
                                                className="text-emerald-500"
                                            />
                                        ) : action === "cancel" ? (
                                            <XCircle
                                                size={15}
                                                className="text-red-500"
                                            />
                                        ) : (
                                            <RotateCcw
                                                size={15}
                                                className="text-amber-500"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                            {action === "complete"
                                                ? "تکمیل وظیفه"
                                                : action === "cancel"
                                                    ? "لغو وظیفه"
                                                    : "بازگشایی وظیفه"}
                                        </h3>
                                        <p className="mt-0.5 truncate max-w-[220px] text-[11px] text-gray-400">
                                            {task.product_name || "محصول نامشخص"}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeAction}
                                    disabled={submitting}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-8 pb-2">
                                {action === "reopen" ? (
                                    <div
                                        className="rounded-2xl px-3.5 py-3 text-[11.5px] font-medium leading-6"
                                        style={{
                                            color: isDark
                                                ? "#fcd34d"
                                                : "#b45309",
                                            background: isDark
                                                ? "rgba(245,158,11,.08)"
                                                : "#fffbeb",
                                        }}
                                    >
                                        این وظیفه از حالت لغوشده خارج می‌شود و
                                        مجدداً در لیست وظایف قابل انجام قرار
                                        می‌گیرد.
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        <FloatingInput
                                            id={`task_quantity_${task.id}`}
                                            label="مقدار دریافت‌شده"
                                            type="number"
                                            value={receivedQuantity}
                                            onChange={setReceivedQuantity}
                                            disabled={submitting}
                                        />

                                        <div className="relative">
                                            <textarea
                                                value={note}
                                                onChange={(e) =>
                                                    setNote(e.target.value)
                                                }
                                                disabled={submitting}
                                                rows={3}
                                                placeholder={
                                                    action === "cancel"
                                                        ? "دلیل انجام نشدن وظیفه را وارد کنید *"
                                                        : "توضیحات اختیاری"
                                                }
                                                className="peer w-full resize-none rounded-2xl border border-gray-100 bg-gray-50 px-4 pt-6 pb-3 text-[12.5px] font-bold text-gray-900 outline-none transition-colors focus:border-blue-500 disabled:opacity-60 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-blue-500/50"
                                            />
                                            <label className="pointer-events-none absolute right-4 top-4 text-[12px] font-semibold text-gray-400 transition-all duration-200 peer-focus:top-[15px] peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-[15px] peer-[:not(:placeholder-shown)]:text-[10px]">
                                                توضیحات
                                                {action === "cancel" ? " *" : ""}
                                            </label>
                                        </div>

                                        <label className="flex h-[52px] cursor-pointer items-center gap-2.5 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-3.5 transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-white/[0.1] dark:bg-white/[0.02] dark:hover:border-blue-500/40 dark:hover:bg-blue-500/[0.05]">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm dark:bg-white/[0.06]">
                                                <Upload size={14} />
                                            </span>
                                            <span className="truncate text-[12px] font-bold text-gray-500 dark:text-gray-400">
                                                {file ? file.name : "افزودن فایل"}
                                            </span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                disabled={submitting}
                                                onChange={(e) =>
                                                    setFile(
                                                        e.target.files?.[0] ??
                                                        null
                                                    )
                                                }
                                            />
                                        </label>
                                    </div>
                                )}

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10"
                                    >
                                        <AlertCircle
                                            size={14}
                                            className="mt-0.5 shrink-0 text-red-500"
                                        />
                                        <p className="flex-1 text-[11.5px] font-semibold leading-5 text-red-500 dark:text-red-400">
                                            {error}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setError("")}
                                            className="shrink-0 text-red-400 transition-colors hover:text-red-600"
                                        >
                                            <X size={13} />
                                        </button>
                                    </motion.div>
                                )}
                            </div>

                            <div className="flex shrink-0 items-center gap-2 px-8 pb-8 pt-5">
                                {action !== "reopen" && (
                                    <button
                                        type="button"
                                        onClick={closeAction}
                                        disabled={submitting}
                                        className="flex-1 rounded-full bg-gray-100 py-3 text-[12.5px] font-bold text-gray-500 transition-colors hover:bg-gray-200 disabled:opacity-40 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08]"
                                    >
                                        انصراف
                                    </button>
                                )}

                                <motion.button
                                    type="button"
                                    whileTap={{ scale: 0.97 }}
                                    onClick={submitAction}
                                    disabled={submitting}
                                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-[13px] font-bold text-white transition-colors disabled:opacity-50"
                                    style={{
                                        background:
                                            action === "cancel"
                                                ? "linear-gradient(135deg,#ef4444,#dc2626)"
                                                : action === "reopen"
                                                    ? "linear-gradient(135deg,#f59e0b,#f97316)"
                                                    : "linear-gradient(135deg,#10b981,#059669)",
                                        boxShadow:
                                            action === "cancel"
                                                ? "0 10px 24px rgba(239,68,68,0.22)"
                                                : action === "reopen"
                                                    ? "0 10px 24px rgba(245,158,11,0.22)"
                                                    : "0 10px 24px rgba(16,185,129,0.22)",
                                    }}
                                >
                                    {submitting ? (
                                        <Loader2
                                            size={15}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <>
                                            {action === "complete" ? (
                                                <Check
                                                    size={14}
                                                    strokeWidth={3}
                                                />
                                            ) : action === "cancel" ? (
                                                <XCircle size={15} />
                                            ) : (
                                                <RotateCcw size={15} />
                                            )}
                                            {action === "complete"
                                                ? "تکمیل وظیفه"
                                                : action === "cancel"
                                                    ? "لغو وظیفه"
                                                    : "بازگشایی"}
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}