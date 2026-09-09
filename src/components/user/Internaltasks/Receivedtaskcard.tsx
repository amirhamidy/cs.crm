"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Ban,
    CheckCircle2,
    Clock3,
    History,
    MessageSquareText,
    RotateCcw,
    UserRound,
} from "lucide-react";
import {
    JALALI_MONTHS,
    pad2,
    toJalali,
    toPersianDigits,
} from "@/lib/jalali";
import type {
    EmployeeListItem,
    InternalTask,
    InternalTaskStatus,
} from "./types";
import {
    updateInternalTaskStatus,
} from "./Api";
import InternalTaskChatModal from "./InternalTaskChatModal";
import api from "@/lib/axiosInstance";

interface ReceivedTaskCardProps {
    task: InternalTask;
    employees: EmployeeListItem[];
    onUpdated: (task: InternalTask) => void;
}

function formatJalali(
    value?: string | null,
): string | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const [jy, jm, jd] = toJalali(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
    ) as [number, number, number];

    return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]
        } ${toPersianDigits(jy)} - ${toPersianDigits(
            pad2(date.getHours()),
        )}:${toPersianDigits(
            pad2(date.getMinutes()),
        )}`;
}

function getDeadlineState(
    deadline?: string | null,
) {
    if (!deadline) {
        return {
            label: "بدون مهلت",
            color:
                "text-gray-400 dark:text-gray-500",
            background:
                "bg-gray-50 dark:bg-white/[0.03]",
        };
    }

    const deadlineTime =
        new Date(deadline).getTime();

    if (Number.isNaN(deadlineTime)) {
        return {
            label: "بدون مهلت",
            color:
                "text-gray-400 dark:text-gray-500",
            background:
                "bg-gray-50 dark:bg-white/[0.03]",
        };
    }

    const diff =
        deadlineTime - Date.now();

    const hours =
        diff / (1000 * 60 * 60);

    if (diff < 0) {
        return {
            label: "منقضی شده",
            color:
                "text-red-500 dark:text-red-400",
            background:
                "bg-red-50 dark:bg-red-500/10",
        };
    }

    if (hours <= 24) {
        return {
            label: "فوری",
            color:
                "text-amber-600 dark:text-amber-400",
            background:
                "bg-amber-50 dark:bg-amber-500/10",
        };
    }

    return {
        label: "در زمانبندی",
        color:
            "text-emerald-600 dark:text-emerald-400",
        background:
            "bg-emerald-50 dark:bg-emerald-500/10",
    };
}

function extractBackendError(
    error: any,
): string {
    const responseData =
        error?.response?.data;

    if (
        typeof responseData ===
        "string"
    ) {
        return responseData;
    }

    if (responseData?.detail) {
        return String(
            responseData.detail,
        );
    }

    if (responseData?.message) {
        return String(
            responseData.message,
        );
    }

    if (responseData?.error) {
        return String(
            responseData.error,
        );
    }

    if (
        responseData &&
        typeof responseData ===
        "object"
    ) {
        const values =
            Object.values(
                responseData,
            );

        for (const value of values) {
            if (Array.isArray(value)) {
                if (value.length > 0) {
                    return String(
                        value[0],
                    );
                }
            }

            if (
                value !== null &&
                value !== undefined
            ) {
                return String(value);
            }
        }
    }

    switch (
    error?.response?.status
    ) {
        case 400:
            return "اطلاعات ارسالی برای تغییر وضعیت صحیح نیست.";

        case 403:
            return "شما اجازه تغییر وضعیت این تسک را ندارید.";

        case 404:
            return "مسیر تغییر وضعیت تسک پیدا نشد.";

        case 500:
            return "خطای داخلی سرور هنگام تغییر وضعیت تسک رخ داد.";

        default:
            return "خطا در تغییر وضعیت تسک.";
    }
}

export default function ReceivedTaskCard({
    task,
    employees,
    onUpdated,
}: ReceivedTaskCardProps) {
    const [currentTask, setCurrentTask] =
        useState<InternalTask>(task);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [chatOpen, setChatOpen] =
        useState(false);

    const [deadlineData, setDeadlineData] =
        useState<{
            started_at: string | null;
            deadline: string | null;
        }>({
            started_at:
                task.started_at ?? null,
            deadline:
                task.deadline ?? null,
        });

    const [loadingDeadline, setLoadingDeadline] =
        useState(false);

    useEffect(() => {
        setCurrentTask(task);

        setDeadlineData({
            started_at:
                task.started_at ?? null,
            deadline:
                task.deadline ?? null,
        });
    }, [task]);

    useEffect(() => {
        let cancelled = false;

        setLoadingDeadline(true);

        api.get(
            `/tasks/api/v1/internal_task/${task.id}/deadline/`,
        )
            .then((response) => {
                if (cancelled) {
                    return;
                }

                const data =
                    response.data?.data ??
                    response.data;

                setDeadlineData({
                    started_at:
                        data?.started_at ??
                        task.started_at ??
                        null,
                    deadline:
                        data?.deadline ??
                        task.deadline ??
                        null,
                });
            })
            .catch(() => {
                if (!cancelled) {
                    setDeadlineData({
                        started_at:
                            task.started_at ??
                            null,
                        deadline:
                            task.deadline ??
                            null,
                    });
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoadingDeadline(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [
        task.id,
        task.started_at,
        task.deadline,
    ]);

    const creator =
        employees.find(
            (employee) =>
                employee.username
                    .trim()
                    .toLowerCase() ===
                currentTask.created_by
                    .trim()
                    .toLowerCase(),
        );

    const creatorName =
        creator?.full_name ||
        currentTask.created_by ||
        "نامشخص";

    const isCompleted =
        currentTask.status ===
        "completed";

    const isCancelled =
        currentTask.status ===
        "cancelled";

    const deadlineState =
        getDeadlineState(
            deadlineData.deadline,
        );

    const deadlineDate =
        formatJalali(
            deadlineData.deadline,
        );

    const startedAtDate =
        formatJalali(
            deadlineData.started_at,
        );

    const createdDate =
        formatJalali(
            currentTask.created_at,
        );

    async function changeStatus(
        nextStatus: InternalTaskStatus,
    ) {
        if (submitting) {
            return;
        }

        setError(null);
        setSubmitting(true);

        const previousTask =
            currentTask;

        const optimisticTask: InternalTask =
        {
            ...previousTask,
            status: nextStatus,
            updated_at:
                new Date().toISOString(),
            completed_at:
                nextStatus === "completed"
                    ? new Date().toISOString()
                    : nextStatus === "in_progress"
                        ? null
                        : previousTask.completed_at,
        };

        setCurrentTask(
            optimisticTask,
        );

        onUpdated(
            optimisticTask,
        );

        try {
            const response =
                await updateInternalTaskStatus(
                    previousTask.id,
                    {
                        status: nextStatus,
                    },
                );

            const responseData =
                response.data;

            const serverStatus =
                responseData?.status ??
                nextStatus;

            const updatedTask: InternalTask =
            {
                ...previousTask,
                ...responseData,
                id: previousTask.id,
                title:
                    responseData?.title ??
                    previousTask.title,
                description:
                    responseData?.description ??
                    previousTask.description,
                status: serverStatus,
                assigned_to:
                    Array.isArray(
                        responseData?.assigned_to,
                    ) &&
                        responseData.assigned_to
                            .length > 0
                        ? responseData.assigned_to
                        : previousTask.assigned_to,
                created_by:
                    responseData?.created_by ??
                    previousTask.created_by,
                created_at:
                    responseData?.created_at ??
                    previousTask.created_at,
                updated_at:
                    responseData?.updated_at ??
                    new Date().toISOString(),
                started_at:
                    responseData?.started_at ??
                    previousTask.started_at,
                deadline:
                    responseData?.deadline ??
                    previousTask.deadline,
                completed_at:
                    responseData?.completed_at ??
                    (serverStatus === "completed"
                        ? new Date().toISOString()
                        : serverStatus ===
                            "in_progress"
                            ? null
                            : previousTask.completed_at),
                attachments:
                    Array.isArray(
                        responseData?.attachments,
                    )
                        ? responseData.attachments
                        : previousTask.attachments,
            };

            setCurrentTask(
                updatedTask,
            );

            setDeadlineData({
                started_at:
                    updatedTask.started_at ??
                    deadlineData.started_at ??
                    null,
                deadline:
                    updatedTask.deadline ??
                    deadlineData.deadline ??
                    null,
            });

            onUpdated(
                updatedTask,
            );
        } catch (err: any) {
            setCurrentTask(
                previousTask,
            );

            onUpdated(
                previousTask,
            );

            setError(
                extractBackendError(err),
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function completeTask() {
        await changeStatus("completed");
    }

    async function reopenTask() {
        await changeStatus("in_progress");
    }

    async function cancelTask() {
        await changeStatus("cancelled");
    }

    function getStatusBadge() {
        if (isCompleted) {
            return {
                label: "انجام شده",
                dot: "bg-emerald-500",
                badge:
                    "bg-emerald-500/10 text-emerald-500",
            };
        }

        if (isCancelled) {
            return {
                label: "لغو شده",
                dot: "bg-red-500",
                badge:
                    "bg-red-500/10 text-red-500",
            };
        }

        return {
            label: "در حال انجام",
            dot: "bg-indigo-500",
            badge:
                "bg-indigo-500/10 text-indigo-500",
        };
    }

    const statusBadge =
        getStatusBadge();

    return (
        <>
            <motion.div
                layout
                initial={{
                    opacity: 0,
                    y: 12,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                exit={{
                    opacity: 0,
                    scale: 0.95,
                }}
                className="flex flex-col gap-3 rounded-[1.8rem] border border-gray-100 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.035)] dark:border-white/[0.07] dark:bg-[#111a2d]"
            >
                <div className="flex items-center justify-between gap-2">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusBadge.badge}`}
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${statusBadge.dot}`}
                        />
                        {
                            statusBadge.label
                        }
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setChatOpen(true)
                        }
                        className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 text-[10px] font-extrabold text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:bg-white/[0.05] dark:text-white/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                    >
                        <MessageSquareText
                            size={11}
                        />
                        {
                            currentTask
                                .attachments
                                .length
                        }
                    </button>
                </div>

                <h3 className="line-clamp-2 text-[14px] font-extrabold leading-snug text-gray-900 dark:text-white">
                    {
                        currentTask.title
                    }
                </h3>

                {currentTask.description && (
                    <p className="line-clamp-3 text-[12px] font-medium leading-relaxed text-gray-500 dark:text-white/40">
                        {
                            currentTask.description
                        }
                    </p>
                )}

                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-600">
                    <UserRound
                        size={12}
                    />
                    <span>
                        ارسال کننده:{" "}
                        {creatorName}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-600">
                    <History
                        size={12}
                    />
                    <span>
                        ایجاد:{" "}
                        {createdDate}
                    </span>
                </div>

                {loadingDeadline ? (
                    <div className="flex items-center gap-2 rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.03]">
                        <Clock3
                            size={13}
                            className="text-gray-400"
                        />

                        <span className="text-[11px] font-semibold text-gray-400">
                            در حال دریافت زمان‌بندی...
                        </span>
                    </div>
                ) : (
                    <>
                        {startedAtDate && (
                            <div className="flex items-center gap-2 rounded-2xl bg-indigo-50 px-3 py-2.5 dark:bg-indigo-500/10">
                                <Clock3
                                    size={13}
                                    className="text-indigo-500 dark:text-indigo-400"
                                />

                                <div>
                                    <p className="text-[11px] font-extrabold text-indigo-500 dark:text-indigo-400">
                                        زمان شروع
                                    </p>

                                    <p className="mt-0.5 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                        {
                                            startedAtDate
                                        }
                                    </p>
                                </div>
                            </div>
                        )}

                        <div
                            className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 ${deadlineState.background}`}
                        >
                            <Clock3
                                size={13}
                                className={
                                    deadlineState.color
                                }
                            />

                            <div>
                                <p
                                    className={`text-[11px] font-extrabold ${deadlineState.color}`}
                                >
                                    {
                                        deadlineState.label
                                    }
                                </p>

                                {deadlineDate && (
                                    <p className="mt-0.5 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                        {
                                            deadlineDate
                                        }
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {error && (
                    <p className="rounded-xl bg-red-500/10 px-3 py-2 text-center text-[11px] font-bold text-red-500">
                        {error}
                    </p>
                )}

                <div className="relative z-10 flex flex-col gap-2 border-t border-black/5 pt-2.5 dark:border-white/[0.05]">
                    {!isCompleted &&
                        !isCancelled && (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={
                                        completeTask
                                    }
                                    disabled={
                                        submitting
                                    }
                                    className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-[10.5px] font-extrabold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                                >
                                    <CheckCircle2
                                        size={13}
                                    />
                                    انجام شد
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        cancelTask
                                    }
                                    disabled={
                                        submitting
                                    }
                                    className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 text-[10.5px] font-extrabold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                                >
                                    <Ban
                                        size={13}
                                    />
                                    لغو تیکت
                                </button>
                            </div>
                        )}

                    {(isCompleted ||
                        isCancelled) && (
                            <button
                                type="button"
                                onClick={
                                    reopenTask
                                }
                                disabled={
                                    submitting
                                }
                                className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 text-[10.5px] font-extrabold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                <RotateCcw
                                    size={13}
                                />
                                بازگشایی تیکت
                            </button>
                        )}

                    <button
                        type="button"
                        onClick={() =>
                            setChatOpen(true)
                        }
                        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-50 text-[10.5px] font-extrabold text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                    >
                        <MessageSquareText
                            size={13}
                        />
                        گفتگو و فایل‌ها
                    </button>
                </div>
            </motion.div>

            <InternalTaskChatModal
                open={chatOpen}
                task={currentTask}
                onClose={() =>
                    setChatOpen(false)
                }
                onUpdated={(
                    updatedTask,
                ) => {
                    setCurrentTask(
                        updatedTask,
                    );
                    onUpdated(
                        updatedTask,
                    );
                }}
            />
        </>
    );
}