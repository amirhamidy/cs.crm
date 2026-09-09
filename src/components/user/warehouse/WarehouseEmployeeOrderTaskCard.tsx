"use client";

import { useMemo, useState } from "react";
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock3,
    FileText,
    Package,
    User,
    XCircle,
} from "lucide-react";
import { useTheme } from "next-themes";
import { ApiOrderTask } from "@/types/warehouse";
import WarehouseEmployeeOrderTaskStatusModal from "./WarehouseEmployeeOrderTaskStatusModal";
import {
    formatDate,
    formatNumber,
    getStatusLabel,
    getStatusTone,
    getTaskProductName,
} from "@/utils/warehouseEmployee";

interface Props {
    orderTask: ApiOrderTask;
    index: number;
    isStaff: boolean;
    staffId: number | string | null;
    canChangeStatus: boolean;
    onUpdate?: (orderTask: ApiOrderTask) => void;
    onRefresh?: () => Promise<void> | void;
}

function getObjectValue(
    value: unknown,
    key: string
) {
    if (
        value &&
        typeof value === "object"
    ) {
        return String(
            (value as Record<string, unknown>)[key] ?? ""
        );
    }

    return "";
}

export default function WarehouseEmployeeOrderTaskCard({
    orderTask,
    index,
    isStaff,
    staffId,
    canChangeStatus,
    onUpdate,
    onRefresh,
}: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [modalOpen, setModalOpen] = useState(false);

    const assignedEmployee = Array.isArray(orderTask.assigned_employee)
        ? orderTask.assigned_employee[0]
        : null;

    const assignedEmployeeName =
        assignedEmployee?.full_name ?? "";

    const orderData = orderTask as ApiOrderTask & {
        product?: unknown;
        product_name?: string;
        product_title?: string;
        task_title?: string;
    };

    const productName = useMemo(() => {
        return (
            getObjectValue(orderData.product, "title") ||
            getObjectValue(orderData.product, "name") ||
            orderData.product_name ||
            orderData.product_title ||
            (typeof orderData.product === "string"
                ? orderData.product
                : "") ||
            "محصول نامشخص"
        );
    }, [
        orderData.product,
        orderData.product_name,
        orderData.product_title,
    ]);

    const statusTone = getStatusTone(orderTask.status);

    const statusStyles = {
        completed: {
            bg: isDark
                ? "rgba(34,197,94,0.12)"
                : "rgba(34,197,94,0.08)",
            border: isDark
                ? "rgba(34,197,94,0.22)"
                : "rgba(34,197,94,0.16)",
            text: "#22c55e",
        },
        cancelled: {
            bg: isDark
                ? "rgba(239,68,68,0.12)"
                : "rgba(239,68,68,0.08)",
            border: isDark
                ? "rgba(239,68,68,0.22)"
                : "rgba(239,68,68,0.16)",
            text: "#ef4444",
        },
        in_progress: {
            bg: isDark
                ? "rgba(99,102,241,0.14)"
                : "rgba(99,102,241,0.08)",
            border: isDark
                ? "rgba(99,102,241,0.24)"
                : "rgba(99,102,241,0.16)",
            text: "#818cf8",
        },
    };

    const currentStatusStyle =
        statusStyles[
        orderTask.status as keyof typeof statusStyles
        ] ?? statusStyles.in_progress;

    const refresh = async () => {
        if (onRefresh) {
            await onRefresh();
            return;
        }

        if (onUpdate) {
            onUpdate(orderTask);
        }
    };

    const canComplete =
        canChangeStatus &&
        orderTask.status !== "completed" &&
        orderTask.status !== "cancelled";

    const canCancel =
        canChangeStatus &&
        orderTask.status !== "completed" &&
        orderTask.status !== "cancelled";

    const cardBackground = isDark
        ? "rgba(15,23,42,0.88)"
        : "#ffffff";

    const borderColor = isDark
        ? "rgba(255,255,255,0.07)"
        : "rgba(15,23,42,0.07)";

    const primaryText = isDark
        ? "#ffffff"
        : "#0f172a";

    const secondaryText = isDark
        ? "rgba(255,255,255,0.55)"
        : "#64748b";

    const softBackground = isDark
        ? "rgba(255,255,255,0.035)"
        : "#f8fafc";

    return (
        <>
            <article
                className="group relative overflow-hidden rounded-[24px] border p-4 transition-all duration-200 hover:-translate-y-[1px] sm:p-5"
                style={{
                    background: cardBackground,
                    borderColor,
                    boxShadow: isDark
                        ? "0 18px 50px rgba(0,0,0,0.18)"
                        : "0 12px 35px rgba(15,23,42,0.06)",
                }}
            >
                <div
                    className="absolute inset-x-0 top-0 h-[2px]"
                    style={{
                        background:
                            "linear-gradient(90deg, #6366f1, #8b5cf6, #3b82f6)",
                    }}
                />

                <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[9px] font-bold"
                                    style={{
                                        color: "#818cf8",
                                        background: isDark
                                            ? "rgba(99,102,241,0.12)"
                                            : "rgba(99,102,241,0.08)",
                                    }}
                                >
                                    <ClipboardList className="h-3 w-3" />
                                    تسک #{orderTask.id}
                                </span>

                                <span
                                    className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-semibold"
                                    style={{
                                        color: currentStatusStyle.text,
                                        background: currentStatusStyle.bg,
                                        borderColor:
                                            currentStatusStyle.border,
                                    }}
                                >
                                    {orderTask.status === "completed" ? (
                                        <CheckCircle2 className="h-3 w-3" />
                                    ) : orderTask.status === "cancelled" ? (
                                        <XCircle className="h-3 w-3" />
                                    ) : (
                                        <Clock3 className="h-3 w-3" />
                                    )}

                                    {getStatusLabel(orderTask.status)}
                                </span>
                            </div>

                            <h3
                                className="truncate text-[14px] font-extrabold sm:text-[16px]"
                                style={{ color: primaryText }}
                            >
                                {orderTask.title || "بدون عنوان"}
                            </h3>

                            {orderData.task_title &&
                                orderData.task_title !==
                                orderTask.title && (
                                    <p
                                        className="mt-1 truncate text-[10px]"
                                        style={{
                                            color: secondaryText,
                                        }}
                                    >
                                        {orderData.task_title}
                                    </p>
                                )}
                        </div>

                        <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                            style={{
                                background: isDark
                                    ? "rgba(99,102,241,0.1)"
                                    : "rgba(99,102,241,0.07)",
                                color: "#818cf8",
                            }}
                        >
                            <Package className="h-5 w-5" />
                        </div>
                    </div>

                    <div
                        className="rounded-2xl border p-3.5 sm:p-4"
                        style={{
                            borderColor: isDark
                                ? "rgba(99,102,241,0.16)"
                                : "rgba(99,102,241,0.12)",
                            background: isDark
                                ? "linear-gradient(135deg, rgba(99,102,241,0.09), rgba(139,92,246,0.05))"
                                : "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.035))",
                        }}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p
                                    className="mb-1 text-[8px] font-bold"
                                    style={{
                                        color: "#818cf8",
                                    }}
                                >
                                    درخواست محصول
                                </p>

                                <p
                                    className="truncate text-[12px] font-extrabold"
                                    style={{
                                        color: primaryText,
                                    }}
                                >
                                    {productName}
                                </p>
                            </div>

                            <div className="shrink-0 text-left">
                                <p
                                    className="text-[8px]"
                                    style={{
                                        color: secondaryText,
                                    }}
                                >
                                    تعداد
                                </p>

                                <p
                                    className="mt-0.5 text-[14px] font-extrabold"
                                    style={{
                                        color: primaryText,
                                    }}
                                >
                                    {formatNumber(
                                        orderTask.quantity ?? 0
                                    )}
                                </p>
                            </div>
                        </div>

                        {orderTask.completed_quantity !== null &&
                            orderTask.completed_quantity !== undefined && (
                                <div className="mt-3 flex items-center justify-between border-t pt-3"
                                    style={{
                                        borderColor: isDark
                                            ? "rgba(255,255,255,0.07)"
                                            : "rgba(15,23,42,0.06)",
                                    }}
                                >
                                    <span
                                        className="text-[9px]"
                                        style={{
                                            color: secondaryText,
                                        }}
                                    >
                                        تعداد انجام‌شده
                                    </span>

                                    <span
                                        className="text-[12px] font-bold"
                                        style={{
                                            color: "#22c55e",
                                        }}
                                    >
                                        {formatNumber(
                                            orderTask.completed_quantity
                                        )}
                                    </span>
                                </div>
                            )}
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {orderTask.case?.title && (
                            <div
                                className="flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5"
                                style={{
                                    background: softBackground,
                                }}
                            >
                                <ClipboardList
                                    className="h-4 w-4 shrink-0"
                                    style={{
                                        color: "#818cf8",
                                    }}
                                />

                                <div className="min-w-0">
                                    <p
                                        className="text-[7px]"
                                        style={{
                                            color: secondaryText,
                                        }}
                                    >
                                        پرونده
                                    </p>

                                    <p
                                        className="truncate text-[10px] font-semibold"
                                        style={{
                                            color: primaryText,
                                        }}
                                    >
                                        {orderTask.case.title}
                                    </p>
                                </div>
                            </div>
                        )}

                        {orderTask.customer?.full_name && (
                            <div
                                className="flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5"
                                style={{
                                    background: softBackground,
                                }}
                            >
                                <User
                                    className="h-4 w-4 shrink-0"
                                    style={{
                                        color: "#8b5cf6",
                                    }}
                                />

                                <div className="min-w-0">
                                    <p
                                        className="text-[7px]"
                                        style={{
                                            color: secondaryText,
                                        }}
                                    >
                                        مشتری
                                    </p>

                                    <p
                                        className="truncate text-[10px] font-semibold"
                                        style={{
                                            color: primaryText,
                                        }}
                                    >
                                        {orderTask.customer.full_name}
                                    </p>
                                </div>
                            </div>
                        )}

                        {orderTask.department?.name && (
                            <div
                                className="flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5"
                                style={{
                                    background: softBackground,
                                }}
                            >
                                <Package
                                    className="h-4 w-4 shrink-0"
                                    style={{
                                        color: "#3b82f6",
                                    }}
                                />

                                <div className="min-w-0">
                                    <p
                                        className="text-[7px]"
                                        style={{
                                            color: secondaryText,
                                        }}
                                    >
                                        واحد
                                    </p>

                                    <p
                                        className="truncate text-[10px] font-semibold"
                                        style={{
                                            color: primaryText,
                                        }}
                                    >
                                        {orderTask.department.name}
                                    </p>
                                </div>
                            </div>
                        )}

                        {assignedEmployeeName && (
                            <div
                                className="flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5"
                                style={{
                                    background: softBackground,
                                }}
                            >
                                <User
                                    className="h-4 w-4 shrink-0"
                                    style={{
                                        color: "#6366f1",
                                    }}
                                />

                                <div className="min-w-0">
                                    <p
                                        className="text-[7px]"
                                        style={{
                                            color: secondaryText,
                                        }}
                                    >
                                        انباردار
                                    </p>

                                    <p
                                        className="truncate text-[10px] font-semibold"
                                        style={{
                                            color: primaryText,
                                        }}
                                    >
                                        {assignedEmployeeName}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between"
                        style={{
                            borderColor: isDark
                                ? "rgba(255,255,255,0.06)"
                                : "rgba(15,23,42,0.06)",
                        }}
                    >
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            {orderTask.current_step?.name && (
                                <div className="flex max-w-full items-center gap-1.5">
                                    <AlertCircle
                                        className="h-3 w-3 shrink-0"
                                        style={{
                                            color: "#818cf8",
                                        }}
                                    />

                                    <span
                                        className="truncate text-[9px]"
                                        style={{
                                            color: secondaryText,
                                        }}
                                    >
                                        {orderTask.current_step.name}
                                    </span>
                                </div>
                            )}

                            {orderTask.created_at && (
                                <div className="flex items-center gap-1.5">
                                    <CalendarDays
                                        className="h-3 w-3 shrink-0"
                                        style={{
                                            color: secondaryText,
                                        }}
                                    />

                                    <span
                                        className="text-[9px]"
                                        style={{
                                            color: secondaryText,
                                        }}
                                    >
                                        {formatDate(
                                            orderTask.created_at
                                        )}
                                    </span>
                                </div>
                            )}

                            {orderTask.note && (
                                <div className="flex max-w-full items-center gap-1.5">
                                    <FileText
                                        className="h-3 w-3 shrink-0"
                                        style={{
                                            color: secondaryText,
                                        }}
                                    />

                                    <span
                                        className="max-w-[260px] truncate text-[9px]"
                                        style={{
                                            color: secondaryText,
                                        }}
                                    >
                                        {orderTask.note}
                                    </span>
                                </div>
                            )}
                        </div>

                        {(canComplete || canCancel) && (
                            <button
                                type="button"
                                onClick={() => setModalOpen(true)}
                                className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-[10px] font-bold text-white transition hover:opacity-90 sm:w-auto"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #6366f1, #7c3aed)",
                                    boxShadow:
                                        "0 8px 20px rgba(99,102,241,0.2)",
                                }}
                            >
                                <ClipboardList className="h-4 w-4" />
                                تغییر وضعیت
                            </button>
                        )}
                    </div>
                </div>
            </article>

            <WarehouseEmployeeOrderTaskStatusModal
                open={modalOpen}
                orderTask={orderTask}
                performedBy={staffId}
                initialStatus="completed"
                onClose={() => setModalOpen(false)}
                onSuccess={refresh}
            />
        </>
    );
}