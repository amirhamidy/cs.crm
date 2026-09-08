"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
AlertCircle,
CheckCircle2,
Clock3,
FileText,
Loader2,
PackageCheck,
RotateCcw,
ShieldCheck,
Upload,
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
    hour: "2-digit",
    minute: "2-digit",
}).format(date);
 

};

const getErrorMessage = (error: unknown) => {
const axiosError = error as {
response?: {
data?: unknown;
};
};

 
const data = axiosError?.response?.data;

if (!data) {
    return "در انجام عملیات مشکلی پیش آمد.";
}

if (typeof data === "string") {
    return data;
}

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

        if (typeof value === "string" && value.trim()) {
            return value;
        }

        if (Array.isArray(value) && value.length) {
            return value
                .map(item =>
                    typeof item === "string"
                        ? item
                        : JSON.stringify(item)
                )
                .join("، ");
        }

        if (
            typeof value === "object" &&
            value !== null
        ) {
            const nested = value as Record<string, unknown>;

            const nestedMessages = Object.values(nested)
                .flatMap(item =>
                    Array.isArray(item)
                        ? item
                        : [item]
                )
                .filter(
                    item =>
                        typeof item === "string" &&
                        item.trim()
                );

            if (nestedMessages.length) {
                return nestedMessages.join("، ");
            }
        }
    }

    const messages = Object.values(record)
        .flatMap(value =>
            Array.isArray(value)
                ? value
                : [value]
        )
        .filter(
            value =>
                typeof value === "string" &&
                value.trim()
        );

    if (messages.length) {
        return messages.join("، ");
    }
}

return "در انجام عملیات مشکلی پیش آمد.";
 

};

const getStatusMeta = (
status: string | null | undefined,
dark: boolean
) => {
const normalized = String(status ?? "").toLowerCase();

 
if (normalized === "completed") {
    return {
        label: "تکمیل شده",
        icon: CheckCircle2,
        text: dark ? "#86efac" : "#15803d",
        background: dark
            ? "rgba(34,197,94,.12)"
            : "#f0fdf4",
        border: dark
            ? "rgba(34,197,94,.22)"
            : "#bbf7d0",
    };
}

if (normalized === "cancelled") {
    return {
        label: "لغو شده",
        icon: XCircle,
        text: dark ? "#fca5a5" : "#dc2626",
        background: dark
            ? "rgba(239,68,68,.12)"
            : "#fef2f2",
        border: dark
            ? "rgba(239,68,68,.22)"
            : "#fecaca",
    };
}

if (normalized === "in_progress") {
    return {
        label: "در حال انجام",
        icon: Clock3,
        text: dark ? "#93c5fd" : "#2563eb",
        background: dark
            ? "rgba(59,130,246,.12)"
            : "#eff6ff",
        border: dark
            ? "rgba(59,130,246,.22)"
            : "#bfdbfe",
    };
}

return {
    label: "در انتظار",
    icon: Clock3,
    text: dark ? "#fcd34d" : "#b45309",
    background: dark
        ? "rgba(245,158,11,.12)"
        : "#fffbeb",
    border: dark
        ? "rgba(245,158,11,.22)"
        : "#fde68a",
};
 

};

export default function WarehouseEmployeeTaskCard({
task,
index = 0,
employeeId,
onUpdated,
}: WarehouseEmployeeTaskCardProps) {
const { resolvedTheme } = useTheme();
const dark = resolvedTheme === "dark";

 
const [action, setAction] = useState<ActionType>(null);
const [receivedQuantity, setReceivedQuantity] = useState(
    task.received_quantity !== null &&
    task.received_quantity !== undefined
        ? String(task.received_quantity)
        : String(task.expected_quantity ?? "")
);
const [note, setNote] = useState(task.note ?? "");
const [file, setFile] = useState<File | null>(null);
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState("");

const statusMeta = getStatusMeta(task.status, dark);
const StatusIcon = statusMeta.icon;

const expected = Number(task.expected_quantity ?? 0);
const received = Number(task.received_quantity ?? 0);

const progress =
    expected > 0
        ? Math.min(
              100,
              Math.max(0, (received / expected) * 100)
          )
        : 0;

const normalizedStatus = String(
    task.status ?? ""
).toLowerCase();

const openAction = (nextAction: ActionType) => {
    setError("");
    setFile(null);
    setReceivedQuantity(
        task.received_quantity !== null &&
            task.received_quantity !== undefined
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

            const updatedTask =
                response.data?.warehouse_task ??
                response.data;

            if (updatedTask) {
                onUpdated?.(updatedTask);
            }

            setAction(null);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }

        return;
    }

    if (!employeeId) {
        setError(
            "کارمند مسئول برای انجام این عملیات مشخص نشده است."
        );
        return;
    }

    const quantity = Number(receivedQuantity);

    if (
        receivedQuantity.trim() === "" ||
        Number.isNaN(quantity) ||
        quantity < 0
    ) {
        setError(
            "مقدار دریافت‌شده را به صورت صحیح وارد کنید."
        );
        return;
    }

    if (
        action === "cancel" &&
        !note.trim()
    ) {
        setError(
            "برای لغو وظیفه، ثبت توضیحات الزامی است."
        );
        return;
    }

    const formData = new FormData();

    formData.append(
        "assigned_to",
        String(employeeId)
    );

    formData.append(
        "received_quantity",
        String(quantity)
    );

    if (note.trim()) {
        formData.append("note", note.trim());
    }

    if (file) {
        formData.append("file", file);
    }

    try {
        setSubmitting(true);

        const endpoint =
            action === "complete"
                ? `/warehouse/api/v1/task/${task.id}/complete/`
                : `/warehouse/api/v1/task/${task.id}/cancel/`;

        const response = await axiosInstance.post(
            endpoint,
            formData
        );

        const updatedTask =
            response.data?.warehouse_task ??
            response.data;

        if (updatedTask) {
            onUpdated?.(updatedTask);
        }

        setAction(null);
    } catch (err) {
        setError(getErrorMessage(err));
    } finally {
        setSubmitting(false);
    }
};

return (
    <>
        <motion.article
            initial={{
                opacity: 0,
                y: 12,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            transition={{
                duration: 0.28,
                delay: Math.min(index * 0.04, 0.24),
            }}
            className="rounded-[24px] border p-4 sm:p-5"
            style={{
                background: dark
                    ? "#111c31"
                    : "#ffffff",
                borderColor: dark
                    ? "rgba(255,255,255,.07)"
                    : "rgba(15,23,42,.07)",
                boxShadow: dark
                    ? "0 16px 45px rgba(0,0,0,.16)"
                    : "0 12px 35px rgba(15,23,42,.06)",
            }}
        >
            <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span
                                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold"
                                style={{
                                    color: statusMeta.text,
                                    background:
                                        statusMeta.background,
                                    borderColor:
                                        statusMeta.border,
                                }}
                            >
                                <StatusIcon size={14} />
                                {task.status_display ||
                                    statusMeta.label}
                            </span>

                            {task.quality_control_id !== null &&
                                task.quality_control_id !==
                                    undefined && (
                                    <span
                                        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold"
                                        style={{
                                            color: dark
                                                ? "#c4b5fd"
                                                : "#6d28d9",
                                            background: dark
                                                ? "rgba(139,92,246,.12)"
                                                : "#f5f3ff",
                                            borderColor: dark
                                                ? "rgba(139,92,246,.25)"
                                                : "#ddd6fe",
                                        }}
                                    >
                                        <ShieldCheck size={14} />
                                        کنترل کیفیت #{formatNumber(
                                            task.quality_control_id
                                        )}
                                    </span>
                                )}
                        </div>

                        <h3
                            className="truncate text-[16px] font-extrabold sm:text-[17px]"
                            style={{
                                color: dark
                                    ? "#f8fafc"
                                    : "#0f172a",
                            }}
                        >
                            {task.product_name ||
                                "محصول نامشخص"}
                        </h3>

                        <div
                            className="mt-1 text-[12px] font-medium"
                            style={{
                                color: dark
                                    ? "#64748b"
                                    : "#94a3b8",
                            }}
                        >
                            وظیفه انبار #{formatNumber(task.id)}
                        </div>
                    </div>

                    <div
                        className="shrink-0 rounded-2xl border px-4 py-3"
                        style={{
                            background: dark
                                ? "rgba(255,255,255,.025)"
                                : "#f8fafc",
                            borderColor: dark
                                ? "rgba(255,255,255,.06)"
                                : "#e2e8f0",
                        }}
                    >
                        <div
                            className="text-[11px] font-semibold"
                            style={{
                                color: dark
                                    ? "#64748b"
                                    : "#94a3b8",
                            }}
                        >
                            آخرین بروزرسانی
                        </div>
                        <div
                            className="mt-1 text-[12px] font-bold"
                            style={{
                                color: dark
                                    ? "#cbd5e1"
                                    : "#475569",
                            }}
                        >
                            {formatDate(task.updated_at)}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div
                        className="rounded-2xl border p-4"
                        style={{
                            background: dark
                                ? "rgba(255,255,255,.025)"
                                : "#f8fafc",
                            borderColor: dark
                                ? "rgba(255,255,255,.06)"
                                : "#e2e8f0",
                        }}
                    >
                        <div
                            className="text-[11px] font-semibold"
                            style={{
                                color: dark
                                    ? "#64748b"
                                    : "#94a3b8",
                            }}
                        >
                            مقدار مورد انتظار
                        </div>
                        <div
                            className="mt-1 text-[18px] font-black"
                            style={{
                                color: dark
                                    ? "#f8fafc"
                                    : "#0f172a",
                            }}
                        >
                            {formatNumber(expected)}
                        </div>
                    </div>

                    <div
                        className="rounded-2xl border p-4"
                        style={{
                            background: dark
                                ? "rgba(255,255,255,.025)"
                                : "#f8fafc",
                            borderColor: dark
                                ? "rgba(255,255,255,.06)"
                                : "#e2e8f0",
                        }}
                    >
                        <div
                            className="text-[11px] font-semibold"
                            style={{
                                color: dark
                                    ? "#64748b"
                                    : "#94a3b8",
                            }}
                        >
                            مقدار دریافت‌شده
                        </div>
                        <div
                            className="mt-1 text-[18px] font-black"
                            style={{
                                color:
                                    received >= expected &&
                                    expected > 0
                                        ? dark
                                            ? "#86efac"
                                            : "#15803d"
                                        : dark
                                          ? "#f8fafc"
                                          : "#0f172a",
                            }}
                        >
                            {task.received_quantity === null ||
                            task.received_quantity ===
                                undefined
                                ? "—"
                                : formatNumber(received)}
                        </div>
                    </div>
                </div>

                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <span
                            className="text-[11px] font-bold"
                            style={{
                                color: dark
                                    ? "#64748b"
                                    : "#94a3b8",
                            }}
                        >
                            میزان پیشرفت
                        </span>
                        <span
                            className="text-[11px] font-black"
                            style={{
                                color: dark
                                    ? "#cbd5e1"
                                    : "#475569",
                            }}
                        >
                            {formatNumber(
                                Math.round(progress)
                            )}
                            ٪
                        </span>
                    </div>

                    <div
                        className="h-2 overflow-hidden rounded-full"
                        style={{
                            background: dark
                                ? "rgba(255,255,255,.07)"
                                : "#e2e8f0",
                        }}
                    >
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{
                                width: `${progress}%`,
                            }}
                            transition={{
                                duration: 0.6,
                            }}
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                        />
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div
                        className="rounded-2xl border p-4"
                        style={{
                            background: dark
                                ? "rgba(255,255,255,.025)"
                                : "#f8fafc",
                            borderColor: dark
                                ? "rgba(255,255,255,.06)"
                                : "#e2e8f0",
                        }}
                    >
                        <div
                            className="text-[11px] font-semibold"
                            style={{
                                color: dark
                                    ? "#64748b"
                                    : "#94a3b8",
                            }}
                        >
                            مسئول وظیفه
                        </div>
                        <div
                            className="mt-1 text-[13px] font-bold"
                            style={{
                                color: dark
                                    ? "#cbd5e1"
                                    : "#475569",
                            }}
                        >
                            {task.assigned_to_name ||
                                "تعیین نشده"}
                        </div>
                    </div>

                    <div
                        className="rounded-2xl border p-4"
                        style={{
                            background: dark
                                ? "rgba(255,255,255,.025)"
                                : "#f8fafc",
                            borderColor: dark
                                ? "rgba(255,255,255,.06)"
                                : "#e2e8f0",
                        }}
                    >
                        <div
                            className="text-[11px] font-semibold"
                            style={{
                                color: dark
                                    ? "#64748b"
                                    : "#94a3b8",
                            }}
                        >
                            تاریخ ایجاد
                        </div>
                        <div
                            className="mt-1 text-[13px] font-bold"
                            style={{
                                color: dark
                                    ? "#cbd5e1"
                                    : "#475569",
                            }}
                        >
                            {formatDate(task.created_at)}
                        </div>
                    </div>
                </div>

                {task.quality_control_id !== null &&
                    task.quality_control_id !==
                        undefined && (
                        <div
                            className="flex items-center gap-3 rounded-2xl border p-4"
                            style={{
                                background: dark
                                    ? "rgba(139,92,246,.07)"
                                    : "#faf5ff",
                                borderColor: dark
                                    ? "rgba(139,92,246,.18)"
                                    : "#e9d5ff",
                            }}
                        >
                            <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                                style={{
                                    background: dark
                                        ? "rgba(139,92,246,.14)"
                                        : "#f3e8ff",
                                    color: dark
                                        ? "#c4b5fd"
                                        : "#7c3aed",
                                }}
                            >
                                <ShieldCheck size={19} />
                            </div>

                            <div className="min-w-0">
                                <div
                                    className="text-[12px] font-extrabold"
                                    style={{
                                        color: dark
                                            ? "#ddd6fe"
                                            : "#6d28d9",
                                    }}
                                >
                                    این وظیفه از کنترل کیفیت ایجاد شده
                                </div>
                                <div
                                    className="mt-1 text-[11px] font-medium"
                                    style={{
                                        color: dark
                                            ? "#8b82a6"
                                            : "#8b5cf6",
                                    }}
                                >
                                    شناسه کنترل کیفیت: #
                                    {formatNumber(
                                        task.quality_control_id
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                {task.note && (
                    <div
                        className="rounded-2xl border p-4"
                        style={{
                            background: dark
                                ? "rgba(255,255,255,.025)"
                                : "#f8fafc",
                            borderColor: dark
                                ? "rgba(255,255,255,.06)"
                                : "#e2e8f0",
                        }}
                    >
                        <div className="mb-2 flex items-center gap-2">
                            <FileText
                                size={15}
                                style={{
                                    color: dark
                                        ? "#94a3b8"
                                        : "#64748b",
                                }}
                            />
                            <span
                                className="text-[11px] font-bold"
                                style={{
                                    color: dark
                                        ? "#94a3b8"
                                        : "#64748b",
                                }}
                            >
                                توضیحات
                            </span>
                        </div>

                        <p
                            className="whitespace-pre-wrap text-[12px] font-medium leading-6"
                            style={{
                                color: dark
                                    ? "#cbd5e1"
                                    : "#475569",
                            }}
                        >
                            {task.note}
                        </p>
                    </div>
                )}

                {task.file && (
                    <a
                        href={task.file}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-2xl border p-4 transition hover:opacity-80"
                        style={{
                            background: dark
                                ? "rgba(255,255,255,.025)"
                                : "#f8fafc",
                            borderColor: dark
                                ? "rgba(255,255,255,.06)"
                                : "#e2e8f0",
                        }}
                    >
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl"
                            style={{
                                background: dark
                                    ? "rgba(59,130,246,.12)"
                                    : "#eff6ff",
                                color: dark
                                    ? "#93c5fd"
                                    : "#2563eb",
                            }}
                        >
                            <FileText size={18} />
                        </div>

                        <div>
                            <div
                                className="text-[12px] font-bold"
                                style={{
                                    color: dark
                                        ? "#e2e8f0"
                                        : "#334155",
                                }}
                            >
                                فایل پیوست
                            </div>
                            <div
                                className="mt-1 text-[11px]"
                                style={{
                                    color: dark
                                        ? "#64748b"
                                        : "#94a3b8",
                                }}
                            >
                                مشاهده فایل
                            </div>
                        </div>
                    </a>
                )}

                {normalizedStatus === "pending" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={() =>
                                openAction("complete")
                            }
                            className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-[13px] font-extrabold text-white transition hover:opacity-90"
                        >
                            <PackageCheck size={17} />
                            انجام می‌شود
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                openAction("cancel")
                            }
                            className="flex h-11 items-center justify-center gap-2 rounded-2xl border text-[13px] font-extrabold transition hover:opacity-80"
                            style={{
                                color: dark
                                    ? "#fca5a5"
                                    : "#dc2626",
                                background: dark
                                    ? "rgba(239,68,68,.07)"
                                    : "#fef2f2",
                                borderColor: dark
                                    ? "rgba(239,68,68,.2)"
                                    : "#fecaca",
                            }}
                        >
                            <XCircle size={17} />
                            انجام نمی‌شود
                        </button>
                    </div>
                )}

                {normalizedStatus === "cancelled" && (
                    <button
                        type="button"
                        onClick={() =>
                            openAction("reopen")
                        }
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-[13px] font-extrabold text-white transition hover:opacity-90"
                    >
                        <RotateCcw size={17} />
                        بازگشایی وظیفه
                    </button>
                )}

                {normalizedStatus === "completed" && (
                    <div
                        className="flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[12px] font-bold"
                        style={{
                            color: dark
                                ? "#86efac"
                                : "#15803d",
                            background: dark
                                ? "rgba(34,197,94,.07)"
                                : "#f0fdf4",
                            borderColor: dark
                                ? "rgba(34,197,94,.18)"
                                : "#bbf7d0",
                        }}
                    >
                        <CheckCircle2 size={16} />
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
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onMouseDown={event => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeAction();
                        }
                    }}
                >
                    <motion.div
                        initial={{
                            opacity: 0,
                            scale: 0.96,
                            y: 12,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.96,
                            y: 12,
                        }}
                        transition={{
                            duration: 0.2,
                        }}
                        className="w-full max-w-lg overflow-hidden rounded-[28px] border"
                        style={{
                            background: dark
                                ? "#111827"
                                : "#ffffff",
                            borderColor: dark
                                ? "rgba(255,255,255,.08)"
                                : "rgba(15,23,42,.08)",
                            boxShadow:
                                "0 30px 80px rgba(0,0,0,.25)",
                        }}
                    >
                        <div className="flex items-center justify-between border-b p-5"
                            style={{
                                borderColor: dark
                                    ? "rgba(255,255,255,.07)"
                                    : "#e2e8f0",
                            }}
                        >
                            <div>
                                <h3
                                    className="text-[16px] font-black"
                                    style={{
                                        color: dark
                                            ? "#f8fafc"
                                            : "#0f172a",
                                    }}
                                >
                                    {action === "complete"
                                        ? "تکمیل وظیفه"
                                        : action === "cancel"
                                          ? "لغو وظیفه"
                                          : "بازگشایی وظیفه"}
                                </h3>

                                <p
                                    className="mt-1 text-[11px]"
                                    style={{
                                        color: dark
                                            ? "#64748b"
                                            : "#94a3b8",
                                    }}
                                >
                                    {task.product_name ||
                                        "محصول نامشخص"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeAction}
                                disabled={submitting}
                                className="flex h-9 w-9 items-center justify-center rounded-xl transition hover:opacity-70"
                                style={{
                                    background: dark
                                        ? "rgba(255,255,255,.06)"
                                        : "#f1f5f9",
                                    color: dark
                                        ? "#cbd5e1"
                                        : "#475569",
                                }}
                            >
                                <X size={17} />
                            </button>
                        </div>

                        {action === "reopen" ? (
                            <div className="p-5">
                                <div
                                    className="rounded-2xl border p-4 text-[12px] font-medium leading-6"
                                    style={{
                                        color: dark
                                            ? "#cbd5e1"
                                            : "#475569",
                                        background: dark
                                            ? "rgba(245,158,11,.06)"
                                            : "#fffbeb",
                                        borderColor: dark
                                            ? "rgba(245,158,11,.16)"
                                            : "#fde68a",
                                    }}
                                >
                                    این وظیفه از حالت لغوشده خارج می‌شود و
                                    مجدداً در لیست وظایف قابل انجام قرار
                                    می‌گیرد.
                                </div>

                                {error && (
                                    <div
                                        className="mt-4 flex items-start gap-2 rounded-2xl border p-3 text-[11px] font-bold leading-5"
                                        style={{
                                            color: dark
                                                ? "#fca5a5"
                                                : "#dc2626",
                                            background: dark
                                                ? "rgba(239,68,68,.07)"
                                                : "#fef2f2",
                                            borderColor: dark
                                                ? "rgba(239,68,68,.18)"
                                                : "#fecaca",
                                        }}
                                    >
                                        <AlertCircle
                                            size={16}
                                            className="mt-0.5 shrink-0"
                                        />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={submitAction}
                                    disabled={submitting}
                                    className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-[13px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting ? (
                                        <Loader2
                                            size={17}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <RotateCcw
                                            size={17}
                                        />
                                    )}
                                    بازگشایی وظیفه
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 p-5">
                                <div>
                                    <label
                                        className="mb-2 block text-[11px] font-bold"
                                        style={{
                                            color: dark
                                                ? "#94a3b8"
                                                : "#64748b",
                                        }}
                                    >
                                        مقدار دریافت‌شده
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={
                                            receivedQuantity
                                        }
                                        onChange={event =>
                                            setReceivedQuantity(
                                                event.target
                                                    .value
                                            )
                                        }
                                        disabled={submitting}
                                        className="h-11 w-full rounded-2xl border px-4 text-[13px] font-bold outline-none"
                                        style={{
                                            color: dark
                                                ? "#f8fafc"
                                                : "#0f172a",
                                            background: dark
                                                ? "rgba(255,255,255,.04)"
                                                : "#f8fafc",
                                            borderColor: dark
                                                ? "rgba(255,255,255,.08)"
                                                : "#e2e8f0",
                                        }}
                                    />
                                </div>

                                <div>
                                    <label
                                        className="mb-2 block text-[11px] font-bold"
                                        style={{
                                            color: dark
                                                ? "#94a3b8"
                                                : "#64748b",
                                        }}
                                    >
                                        توضیحات
                                        {action === "cancel" &&
                                            " *"}
                                    </label>

                                    <textarea
                                        value={note}
                                        onChange={event =>
                                            setNote(
                                                event.target.value
                                            )
                                        }
                                        disabled={submitting}
                                        rows={4}
                                        placeholder={
                                            action ===
                                            "cancel"
                                                ? "دلیل انجام نشدن وظیفه را وارد کنید"
                                                : "توضیحات اختیاری"
                                        }
                                        className="w-full resize-none rounded-2xl border px-4 py-3 text-[12px] font-medium leading-6 outline-none"
                                        style={{
                                            color: dark
                                                ? "#f8fafc"
                                                : "#0f172a",
                                            background: dark
                                                ? "rgba(255,255,255,.04)"
                                                : "#f8fafc",
                                            borderColor: dark
                                                ? "rgba(255,255,255,.08)"
                                                : "#e2e8f0",
                                        }}
                                    />
                                </div>

                                <div>
                                    <label
                                        className="mb-2 block text-[11px] font-bold"
                                        style={{
                                            color: dark
                                                ? "#94a3b8"
                                                : "#64748b",
                                        }}
                                    >
                                        فایل پیوست
                                    </label>

                                    <label
                                        className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3"
                                        style={{
                                            color: dark
                                                ? "#cbd5e1"
                                                : "#475569",
                                            background: dark
                                                ? "rgba(255,255,255,.04)"
                                                : "#f8fafc",
                                            borderColor: dark
                                                ? "rgba(255,255,255,.08)"
                                                : "#e2e8f0",
                                        }}
                                    >
                                        <Upload size={17} />

                                        <span className="min-w-0 flex-1 truncate text-[11px] font-bold">
                                            {file
                                                ? file.name
                                                : "انتخاب فایل"}
                                        </span>

                                        <input
                                            type="file"
                                            className="hidden"
                                            disabled={
                                                submitting
                                            }
                                            onChange={event =>
                                                setFile(
                                                    event
                                                        .target
                                                        .files?.[0] ??
                                                        null
                                                )
                                            }
                                        />
                                    </label>
                                </div>

                                {error && (
                                    <div
                                        className="flex items-start gap-2 rounded-2xl border p-3 text-[11px] font-bold leading-5"
                                        style={{
                                            color: dark
                                                ? "#fca5a5"
                                                : "#dc2626",
                                            background: dark
                                                ? "rgba(239,68,68,.07)"
                                                : "#fef2f2",
                                            borderColor: dark
                                                ? "rgba(239,68,68,.18)"
                                                : "#fecaca",
                                        }}
                                    >
                                        <AlertCircle
                                            size={16}
                                            className="mt-0.5 shrink-0"
                                        />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={submitAction}
                                    disabled={submitting}
                                    className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-[13px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting ? (
                                        <Loader2
                                            size={17}
                                            className="animate-spin"
                                        />
                                    ) : action ===
                                      "complete" ? (
                                        <CheckCircle2
                                            size={17}
                                        />
                                    ) : (
                                        <XCircle
                                            size={17}
                                        />
                                    )}

                                    {action === "complete"
                                        ? "تکمیل وظیفه"
                                        : "لغو وظیفه"}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </>
);

}
