"use client";

import { useState } from "react";
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
    Paperclip,
    Loader2,
    X,
    RotateCcw,
    Upload,
} from "lucide-react";
import type { AxiosError } from "axios";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiOrderTask } from "@/types/warehouse";
import { formatDate } from "@/utils/warehouseEmployee";
import PermissionTooltip from "./PermissionTooltip";

interface WarehouseEmployeeOrderTaskCardProps {
    orderTask: ApiOrderTask;
    index: number;
    isStaff: boolean;
    staffId?: number | null;
    canChangeStatus?: boolean;
    onUpdate: (orderTask: ApiOrderTask) => void;
}

type ActionType = "complete" | "cancel" | "reopen" | null;

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;

    if (!data) {
        return fallback;
    }

    for (const key of [
        "detail",
        "note",
        "message",
        "error",
        "non_field_errors",
        "assigned_to",
        "received_quantity",
        "file",
    ]) {
        const value = data[key];

        if (typeof value === "string") {
            return value;
        }

        if (Array.isArray(value)) {
            const first = value[0];

            if (typeof first === "string") {
                return first;
            }

            if (
                first &&
                typeof first === "object"
            ) {
                return JSON.stringify(first);
            }
        }

        if (
            value &&
            typeof value === "object"
        ) {
            return JSON.stringify(value);
        }
    }

    return fallback;
}

export default function WarehouseEmployeeOrderTaskCard({
    orderTask,
    index,
    isStaff,
    staffId = null,
    canChangeStatus = false,
    onUpdate,
}: WarehouseEmployeeOrderTaskCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [action, setAction] = useState<ActionType>(null);
    const [note, setNote] = useState("");
    const [receivedQuantity, setReceivedQuantity] = useState(
        String(orderTask.quantity ?? "")
    );
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const statusConfig = {
        pending: {
            label: "در انتظار",
            icon: Clock,
            color: "text-amber-400",
            bg: "bg-amber-400/10",
            border: "border-amber-400/15",
        },
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

    const normalizedStatus = String(orderTask.status ?? "")
        .trim()
        .toLowerCase();

    const config =
        statusConfig[
        normalizedStatus as keyof typeof statusConfig
        ] ?? statusConfig.pending;

    const Icon = config.icon;

    const textColor = isDark ? "#ffffff" : "#1e293b";
    const mutedText = isDark
        ? "rgba(255,255,255,0.4)"
        : "#94a3b8";

    const borderColor = isDark
        ? "rgba(255,255,255,0.07)"
        : "rgba(15,23,42,0.07)";

    const isCompleted = normalizedStatus === "completed";
    const isCancelled = normalizedStatus === "cancelled";
    const isPending = normalizedStatus === "pending";
    const isInProgress = normalizedStatus === "in_progress";

    const canAct = isPending || isInProgress;
    const canUpdate = isStaff && canChangeStatus && !!staffId;

    const permissionMessage = !isStaff
        ? "برای تغییر وضعیت باید به‌عنوان کارمند انبار ثبت‌شده باشید"
        : !staffId
            ? "شناسه کارمند انبار شما در دسترس نیست"
            : !canChangeStatus
                ? "شما سطح دسترسی تغییر وضعیت سفارش‌های انبارداری را ندارید"
                : "";

    function openActionModal(nextAction: ActionType) {
        if (!canUpdate || loading) {
            return;
        }

        setAction(nextAction);
        setNote("");
        setFile(null);
        setError("");

        if (nextAction === "complete") {
            setReceivedQuantity(
                String(
                    orderTask.quantity ??
                    orderTask.completed_quantity ??
                    ""
                )
            );
        }
    }

    function closeActionModal() {
        if (loading) {
            return;
        }

        setAction(null);
        setNote("");
        setFile(null);
        setError("");
    }

    function handleFileChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const selectedFile = event.target.files?.[0] ?? null;
        setFile(selectedFile);
    }

    async function handleAction() {
        if (!action || loading || !orderTask.id) {
            return;
        }

        if (!staffId) {
            setError("شناسه کارمند انبار پیدا نشد.");
            return;
        }

        if (action === "complete") {
            const quantity = Number(receivedQuantity);

            if (
                !receivedQuantity.trim() ||
                !Number.isFinite(quantity) ||
                quantity < 0
            ) {
                setError(
                    "لطفاً مقدار دریافت‌شده را به‌صورت صحیح وارد کنید."
                );
                return;
            }
        }

        setLoading(true);
        setError("");

        const endpoint = `/warehouse/api/v1/task/${orderTask.id}/${action}/`;
        const formData = new FormData();

        formData.append("assigned_to", String(staffId));

        if (action === "complete") {
            formData.append(
                "received_quantity",
                String(Number(receivedQuantity))
            );
        }

        formData.append("note", note.trim());

        if (file) {
            formData.append("file", file);
        }

        console.group("Warehouse Order Task Status Debug");
        console.log("Action:", action);
        console.log("Order Task ID:", orderTask.id);
        console.log("Staff ID:", staffId);
        console.log("Endpoint:", endpoint);
        console.log("Current Status:", normalizedStatus);
        console.log(
            "Received Quantity:",
            action === "complete"
                ? Number(receivedQuantity)
                : null
        );
        console.log("Note:", note.trim());
        console.log("File:", file);
        console.log(
            "FormData Entries:",
            Array.from(formData.entries()).map(
                ([key, value]) => [
                    key,
                    value instanceof File
                        ? {
                            name: value.name,
                            type: value.type,
                            size: value.size,
                        }
                        : value,
                ]
            )
        );

        try {
            const response =
                await axiosInstance.post<ApiOrderTask>(
                    endpoint,
                    formData
                );

            console.log(
                "Response Status:",
                response.status
            );
            console.log(
                "Response Headers:",
                response.headers
            );
            console.log(
                "Response Data:",
                response.data
            );

            console.groupEnd();

            onUpdate(response.data);

            setAction(null);
            setNote("");
            setFile(null);
            setError("");
        } catch (err) {
            const axiosError = err as AxiosError;

            console.error(
                "Warehouse Order Task Status Error:",
                err
            );
            console.error(
                "Response Status:",
                axiosError.response?.status
            );
            console.error(
                "Response Data:",
                axiosError.response?.data
            );
            console.error(
                "Response Headers:",
                axiosError.response?.headers
            );
            console.error(
                "Request URL:",
                axiosError.config?.url
            );
            console.error(
                "Request Method:",
                axiosError.config?.method
            );
            console.error(
                "Request Headers:",
                axiosError.config?.headers
            );
            console.error(
                "Request Payload:",
                axiosError.config?.data
            );

            console.groupEnd();

            setError(
                getErrorMessage(
                    err,
                    "تغییر وضعیت وظیفه با خطا مواجه شد."
                )
            );
        } finally {
            setLoading(false);
        }
    }

    const actionConfig = {
        complete: {
            title: "تکمیل وظیفه",
            description:
                "مقدار واقعی دریافت‌شده را وارد کنید.",
            button: "تکمیل وظیفه",
            icon: CheckCircle,
            color: "#10b981",
            background: "rgba(16,185,129,.1)",
        },
        cancel: {
            title: "لغو وظیفه",
            description:
                "آیا مطمئن هستید که می‌خواهید این وظیفه را لغو کنید؟",
            button: "لغو وظیفه",
            icon: AlertTriangle,
            color: "#ef4444",
            background: "rgba(239,68,68,.1)",
        },
        reopen: {
            title: "بازگشایی وظیفه",
            description:
                "این وظیفه دوباره از حالت لغوشده خارج می‌شود.",
            button: "بازگشایی وظیفه",
            icon: RotateCcw,
            color: "#6366f1",
            background: "rgba(99,102,241,.1)",
        },
    } as const;

    const currentAction = action
        ? actionConfig[action]
        : null;

    const ActionIcon = currentAction?.icon;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.2,
                    delay: index * 0.04,
                }}
                className="relative rounded-2xl border p-4 transition hover:border-indigo-200/50"
                style={{
                    borderColor,
                    background: isDark
                        ? "#0f172a"
                        : "#f8fafc",
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
                            <stop
                                offset="0%"
                                stopColor="#6366f1"
                            />
                            <stop
                                offset="100%"
                                stopColor="#8b5cf6"
                            />
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
                        initial={{
                            pathLength: 0,
                            opacity: 0,
                        }}
                        whileHover={{
                            pathLength: 1,
                            opacity: 1,
                        }}
                        transition={{
                            duration: 0.45,
                            ease: "easeInOut",
                        }}
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
                                    style={{
                                        color: textColor,
                                    }}
                                >
                                    {orderTask.title}
                                </p>

                                <p
                                    className="mt-1 text-xs"
                                    style={{
                                        color: mutedText,
                                    }}
                                >
                                    سفارش #{orderTask.id} —{" "}
                                    {orderTask.department?.name ||
                                        "بدون دپارتمان"}
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
                                    style={{
                                        color: mutedText,
                                    }}
                                >
                                    <Package className="inline h-3 w-3" />{" "}
                                    محصول
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
                                    style={{
                                        color: mutedText,
                                    }}
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
                                    style={{
                                        color: mutedText,
                                    }}
                                >
                                    <User className="inline h-3 w-3" />{" "}
                                    ایجادکننده
                                </p>

                                <p
                                    className="mt-0.5 truncate text-[11px] font-semibold"
                                    style={{
                                        color: isDark
                                            ? "rgba(255,255,255,0.7)"
                                            : "#64748b",
                                    }}
                                >
                                    {orderTask.created_by?.username ||
                                        "—"}
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
                                    style={{
                                        color: mutedText,
                                    }}
                                >
                                    <CalendarDays className="inline h-3 w-3" />{" "}
                                    تاریخ
                                </p>

                                <p
                                    className="mt-0.5 text-[11px] font-semibold"
                                    style={{
                                        color: isDark
                                            ? "rgba(255,255,255,0.7)"
                                            : "#64748b",
                                    }}
                                >
                                    {formatDate(
                                        orderTask.created_at
                                    )}
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
                                    style={{
                                        color: mutedText,
                                    }}
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
                                    style={{
                                        color: mutedText,
                                    }}
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
                                    {orderTask.attachments.map(
                                        (att) => (
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
                                        )
                                    )}
                                </div>
                            )}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <PermissionTooltip
                                allowed={canUpdate}
                                message={permissionMessage}
                            >
                                {canAct ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openActionModal(
                                                    "complete"
                                                )
                                            }
                                            disabled={
                                                !canUpdate ||
                                                loading
                                            }
                                            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10.5px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50"
                                            style={{
                                                background: canUpdate
                                                    ? "linear-gradient(135deg,#10b981,#059669)"
                                                    : isDark
                                                        ? "rgba(255,255,255,0.04)"
                                                        : "rgba(15,23,42,0.04)",
                                                color: canUpdate
                                                    ? "#fff"
                                                    : mutedText,
                                            }}
                                        >
                                            <CheckCircle className="h-3.5 w-3.5" />
                                            انجام شد
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                openActionModal(
                                                    "cancel"
                                                )
                                            }
                                            disabled={
                                                !canUpdate ||
                                                loading
                                            }
                                            className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[10.5px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50"
                                            style={{
                                                background: isDark
                                                    ? "rgba(239,68,68,.06)"
                                                    : "rgba(239,68,68,.05)",
                                                borderColor: isDark
                                                    ? "rgba(239,68,68,.14)"
                                                    : "rgba(239,68,68,.12)",
                                                color: "#ef4444",
                                            }}
                                        >
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            لغو
                                        </button>
                                    </>
                                ) : isCancelled ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            openActionModal(
                                                "reopen"
                                            )
                                        }
                                        disabled={
                                            !canUpdate ||
                                            loading
                                        }
                                        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10.5px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                                        style={{
                                            background:
                                                "linear-gradient(135deg,#6366f1,#8b5cf6)",
                                        }}
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        بازگشایی
                                    </button>
                                ) : isCompleted ? (
                                    <span
                                        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10.5px] font-bold"
                                        style={{
                                            background: isDark
                                                ? "rgba(16,185,129,.07)"
                                                : "rgba(16,185,129,.06)",
                                            color: "#10b981",
                                        }}
                                    >
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        تکمیل‌شده
                                    </span>
                                ) : (
                                    <span
                                        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10.5px] font-bold"
                                        style={{
                                            background: isDark
                                                ? "rgba(245,158,11,.07)"
                                                : "rgba(245,158,11,.06)",
                                            color: "#f59e0b",
                                        }}
                                    >
                                        <Clock className="h-3.5 w-3.5" />
                                        در انتظار
                                    </span>
                                )}
                            </PermissionTooltip>

                            {orderTask.deadline && (
                                <span
                                    className="flex items-center gap-1 text-[10px]"
                                    style={{
                                        color: mutedText,
                                    }}
                                >
                                    <CalendarDays className="h-3 w-3" />
                                    مهلت:{" "}
                                    {formatDate(
                                        orderTask.deadline
                                    )}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {action && currentAction && ActionIcon && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto px-4 py-6"
                    style={{
                        background: "rgba(15,23,42,.55)",
                        backdropFilter: "blur(5px)",
                    }}
                    onClick={closeActionModal}
                >
                    <motion.div
                        initial={{
                            opacity: 0,
                            scale: 0.96,
                            y: 10,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                        }}
                        transition={{
                            duration: 0.2,
                        }}
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                        dir="rtl"
                        className="my-auto w-full max-w-sm rounded-[1.75rem] border p-6 shadow-2xl"
                        style={{
                            background: isDark
                                ? "#0f172a"
                                : "#ffffff",
                            borderColor,
                        }}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                                    style={{
                                        background:
                                            currentAction.background,
                                        color:
                                            currentAction.color,
                                    }}
                                >
                                    <ActionIcon className="h-5 w-5" />
                                </div>

                                <div>
                                    <h3
                                        className="text-sm font-extrabold"
                                        style={{
                                            color: textColor,
                                        }}
                                    >
                                        {currentAction.title}
                                    </h3>

                                    <p
                                        className="mt-1 text-[10.5px]"
                                        style={{
                                            color: mutedText,
                                        }}
                                    >
                                        {currentAction.description}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeActionModal}
                                disabled={loading}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl disabled:opacity-40"
                                style={{
                                    background: isDark
                                        ? "rgba(255,255,255,.05)"
                                        : "rgba(15,23,42,.05)",
                                    color: mutedText,
                                }}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {action === "complete" && (
                            <div className="mt-5">
                                <label
                                    className="mb-1.5 block text-[11.5px] font-bold"
                                    style={{
                                        color: mutedText,
                                    }}
                                >
                                    مقدار دریافت‌شده
                                </label>

                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={
                                            receivedQuantity
                                        }
                                        onChange={(e) =>
                                            setReceivedQuantity(
                                                e.target.value
                                            )
                                        }
                                        disabled={loading}
                                        className="h-12 w-full rounded-2xl border px-4 text-[13px] font-bold outline-none disabled:opacity-60"
                                        style={{
                                            background:
                                                isDark
                                                    ? "rgba(255,255,255,.035)"
                                                    : "rgba(15,23,42,.025)",
                                            borderColor,
                                            color: textColor,
                                        }}
                                        placeholder="مثلاً 10"
                                    />
                                </div>

                                <p
                                    className="mt-1.5 text-[10px]"
                                    style={{
                                        color: mutedText,
                                    }}
                                >
                                    درخواست‌شده:{" "}
                                    {orderTask.quantity ?? 0}
                                </p>
                            </div>
                        )}

                        <div className="mt-5">
                            <label
                                className="mb-1.5 block text-[11.5px] font-bold"
                                style={{
                                    color: mutedText,
                                }}
                            >
                                توضیح عملیات
                            </label>

                            <textarea
                                value={note}
                                onChange={(e) =>
                                    setNote(e.target.value)
                                }
                                disabled={loading}
                                rows={4}
                                placeholder={
                                    action === "complete"
                                        ? "مثلاً کالا تحویل انبار شد..."
                                        : action === "cancel"
                                            ? "مثلاً درخواست توسط واحد مربوطه لغو شد..."
                                            : "مثلاً ادامه انجام درخواست مورد نیاز است..."
                                }
                                className="w-full resize-none rounded-2xl border px-4 py-3 text-[12.5px] font-medium outline-none placeholder:text-slate-400 disabled:opacity-60"
                                style={{
                                    background: isDark
                                        ? "rgba(255,255,255,.035)"
                                        : "rgba(15,23,42,.025)",
                                    borderColor,
                                    color: textColor,
                                }}
                            />
                        </div>

                        <div className="mt-4">
                            <label
                                htmlFor={`warehouse-task-file-${orderTask.id}`}
                                className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[11px] font-bold transition hover:border-indigo-400/50"
                                style={{
                                    borderColor,
                                    background: isDark
                                        ? "rgba(255,255,255,.025)"
                                        : "rgba(15,23,42,.025)",
                                    color: mutedText,
                                }}
                            >
                                <Upload className="h-4 w-4" />

                                {file
                                    ? file.name
                                    : "افزودن فایل پیوست"}
                            </label>

                            <input
                                id={`warehouse-task-file-${orderTask.id}`}
                                type="file"
                                onChange={handleFileChange}
                                disabled={loading}
                                className="hidden"
                            />

                            {file && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFile(null)
                                    }
                                    disabled={loading}
                                    className="mt-2 text-[10px] font-semibold text-red-400"
                                >
                                    حذف فایل
                                </button>
                            )}
                        </div>

                        {error && (
                            <div
                                className="mt-3 rounded-xl px-3 py-2 text-center text-[11px] font-semibold leading-5"
                                style={{
                                    background:
                                        "rgba(239,68,68,.07)",
                                    color: "#ef4444",
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <div className="mt-5 flex gap-2">
                            <button
                                type="button"
                                onClick={closeActionModal}
                                disabled={loading}
                                className="flex h-11 flex-1 items-center justify-center rounded-2xl border text-[12px] font-bold disabled:opacity-50"
                                style={{
                                    background: isDark
                                        ? "rgba(255,255,255,.035)"
                                        : "rgba(15,23,42,.025)",
                                    borderColor,
                                    color: mutedText,
                                }}
                            >
                                انصراف
                            </button>

                            <button
                                type="button"
                                onClick={handleAction}
                                disabled={
                                    loading ||
                                    (action ===
                                        "complete" &&
                                        !receivedQuantity.trim())
                                }
                                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl text-[12px] font-bold text-white disabled:opacity-50"
                                style={{
                                    background: `linear-gradient(135deg,${currentAction.color},${currentAction.color})`,
                                }}
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <ActionIcon className="h-4 w-4" />
                                        {currentAction.button}
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
}