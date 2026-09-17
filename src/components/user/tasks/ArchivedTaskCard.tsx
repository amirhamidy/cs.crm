"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Archive,
    Ban,
    Building2,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Loader2,
    RotateCcw,
    ShoppingBag,
    User,
    X,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";

interface ArchiveTask {
    id: number;
    task_id: number;
    title: string;
    status: "completed" | "cancelled" | "sold";
    case_id: number | null;
    case_title: string;
    customer_id: number | null;
    customer_full_name: string;
    department_id: number;
    department_name: string;
    created_by_id: number | null;
    created_by_username: string;
    created_by_full_name: string;
    final_action_by_id: number | null;
    final_action_by_username: string;
    final_action_by_full_name: string;
    task_created_at: string;
    completed_at: string | null;
    archived_at: string;
}

interface Props {
    task: ArchiveTask;
    onReopened: (taskId: number) => void;
}

function formatDate(value?: string | null) {
    if (!value) return "نامشخص";

    return new Date(value).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function statusInfo(status: ArchiveTask["status"]) {
    if (status === "sold") {
        return {
            label: "فروش رفته",
            icon: ShoppingBag,
            className: "bg-amber-500/10 text-amber-500",
        };
    }

    if (status === "cancelled") {
        return {
            label: "لغو شده",
            icon: Ban,
            className: "bg-red-500/10 text-red-500",
        };
    }

    return {
        label: "تکمیل شده",
        icon: CheckCircle2,
        className: "bg-emerald-500/10 text-emerald-500",
    };
}

function parseError(error: any) {
    const data = error?.response?.data;

    if (!data) return "بازگردانی تسک با خطا مواجه شد";

    if (typeof data === "string") return data;

    const first = Object.values(data)[0];

    return Array.isArray(first)
        ? String(first[0])
        : String(first ?? "بازگردانی تسک با خطا مواجه شد");
}

export default function ArchivedTaskCard({
    task,
    onReopened,
}: Props) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const status = statusInfo(task.status);
    const StatusIcon = status.icon;

    async function reopenTask() {
        setSubmitting(true);
        setError(null);

        try {
            await axiosInstance.post(
                `/tasks/api/v1/tasks/${task.task_id}/reopen/`
            );

            setConfirmOpen(false);
            onReopened(task.task_id);
        } catch (err) {
            setError(parseError(err));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                className="group relative overflow-hidden rounded-[1.6rem] border border-gray-200 bg-white p-3.5 shadow-[0_8px_28px_rgba(15,23,42,.04)] dark:border-white/[.07] dark:bg-[#111a2d]"
            >
                <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-slate-400 to-slate-500/20" />

                <div className="mb-3 flex items-center justify-between gap-2">
                    <span
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold ${status.className}`}
                    >
                        <StatusIcon size={10} />
                        {status.label}
                    </span>

                    <span className="flex items-center gap-1 rounded-xl bg-gray-100 px-2 py-1 text-[9px] font-bold text-gray-400 dark:bg-white/[.05]">
                        <Archive size={10} />
                        آرشیو
                    </span>
                </div>

                <h3 className="line-clamp-2 text-[13.5px] font-extrabold leading-6 text-gray-900 dark:text-white">
                    {task.title}
                </h3>

                {task.case_title && (
                    <div className="mt-1.5 line-clamp-1 text-[10px] text-gray-400">
                        پرونده: {task.case_title}
                    </div>
                )}

                <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[.035]">
                    {task.customer_full_name && (
                        <InfoRow
                            icon={User}
                            label="مشتری"
                            value={task.customer_full_name}
                        />
                    )}

                    {task.department_name && (
                        <InfoRow
                            icon={Building2}
                            label="دپارتمان"
                            value={task.department_name}
                        />
                    )}

                    <InfoRow
                        icon={CalendarDays}
                        label="تاریخ ایجاد"
                        value={formatDate(task.task_created_at)}
                    />

                    <InfoRow
                        icon={Clock3}
                        label="تاریخ آرشیو"
                        value={formatDate(task.archived_at)}
                    />
                </div>

                <div className="mt-2.5 rounded-2xl bg-indigo-500/[.035] px-3 py-2.5">
                    <div className="text-[9px] font-bold text-gray-400">
                        آخرین اقدام توسط
                    </div>

                    <div className="mt-1 text-[10.5px] font-extrabold text-gray-700 dark:text-gray-200">
                        {task.final_action_by_full_name ||
                            task.final_action_by_username ||
                            "نامشخص"}
                    </div>
                </div>

                {error && (
                    <div className="mt-2 rounded-xl bg-red-500/10 px-3 py-2 text-center text-[9.5px] font-bold text-red-500">
                        {error}
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => {
                        setError(null);
                        setConfirmOpen(true);
                    }}
                    className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-500/10 text-[10px] font-extrabold text-indigo-500 transition hover:bg-indigo-500/15"
                >
                    <RotateCcw size={12} />
                    بازگشت به حالت قبل
                </button>
            </motion.div>

            {confirmOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    dir="rtl"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="w-full max-w-sm rounded-[1.7rem] border border-gray-200 bg-white p-5 shadow-2xl dark:border-white/[.08] dark:bg-[#111827]"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10">
                                        <RotateCcw
                                            size={17}
                                            className="text-indigo-500"
                                        />
                                    </div>

                                    <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                                        بازگردانی تسک
                                    </h3>
                                </div>

                                <p className="mt-3 text-[11px] leading-6 text-gray-500 dark:text-gray-400">
                                    آیا مطمئنی می‌خواهی این تسک دوباره به حالت انجام بازگردد؟
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setConfirmOpen(false)}
                                disabled={submitting}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-white/[.05]"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-white/[.035]">
                            <p className="line-clamp-2 text-[10.5px] font-bold leading-5 text-gray-600 dark:text-gray-300">
                                {task.title}
                            </p>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmOpen(false)}
                                disabled={submitting}
                                className="h-9 flex-1 rounded-xl bg-gray-100 text-[10px] font-extrabold text-gray-500 dark:bg-white/[.06] dark:text-gray-400"
                            >
                                انصراف
                            </button>

                            <button
                                type="button"
                                onClick={reopenTask}
                                disabled={submitting}
                                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-[10px] font-extrabold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting ? (
                                    <Loader2
                                        size={13}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <RotateCcw size={13} />
                                )}

                                {submitting
                                    ? "در حال بازگردانی..."
                                    : "بازگرداندن"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
}

function InfoRow({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: string;
    icon: React.ComponentType<{
        size?: number;
        className?: string;
    }>;
}) {
    return (
        <div className="flex items-center gap-1.5 text-[10px]">
            <Icon
                size={11}
                className="shrink-0 text-gray-400"
            />

            <span className="font-semibold text-gray-400">
                {label}:
            </span>

            <span className="truncate font-bold text-gray-700 dark:text-white/80">
                {value}
            </span>
        </div>
    );
}
