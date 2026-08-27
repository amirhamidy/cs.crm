"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Ban,
    CheckCircle2,
    Clock3,
    History,
    MessageSquareText,
    Paperclip,
    RotateCcw,
    UserRound,
} from "lucide-react";
import { JALALI_MONTHS, pad2, toJalali, toPersianDigits } from "@/lib/jalali";
import type { InternalTask, InternalTaskAttachment, InternalTaskStatus } from "./types";
import { updateInternalTaskStatus } from "./Api";
import AttachmentUploadModal from "./Attachmentuploadmodal";
import AttachmentsViewModal from "./Attachmentsviewmodal";

function formatJalali(value?: string | null): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const [jy, jm, jd] = toJalali(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    ) as [number, number, number];
    return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)} - ${toPersianDigits(pad2(date.getHours()))}:${toPersianDigits(pad2(date.getMinutes()))}`;
}

function getDeadlineState(deadline?: string | null) {
    if (!deadline) {
        return {
            label: "بدون مهلت",
            color: "text-gray-400 dark:text-gray-500",
            background: "bg-gray-50 dark:bg-white/[0.03]",
        };
    }
    const diff = new Date(deadline).getTime() - Date.now();
    const hours = diff / (1000 * 60 * 60);
    if (diff < 0) {
        return {
            label: "منقضی شده",
            color: "text-red-500 dark:text-red-400",
            background: "bg-red-50 dark:bg-red-500/10",
        };
    }
    if (hours <= 24) {
        return {
            label: "فوری",
            color: "text-amber-600 dark:text-amber-400",
            background: "bg-amber-50 dark:bg-amber-500/10",
        };
    }
    return {
        label: "در زمانبندی",
        color: "text-emerald-600 dark:text-emerald-400",
        background: "bg-emerald-50 dark:bg-emerald-500/10",
    };
}

export default function ReceivedTaskCard({
    task,
    onUpdated,
}: {
    task: InternalTask;
    onUpdated: (task: InternalTask) => void;
}) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [attachmentsOpen, setAttachmentsOpen] = useState(false);

    const isCompleted = task.status === "completed";
    const isCancelled = task.status === "cancelled";

    const deadlineState = getDeadlineState(task.deadline);
    const deadlineDate = formatJalali(task.deadline);
    const createdDate = formatJalali(task.created_at);

    async function toggleStatus() {
        setSubmitting(true);
        setError(null);
        try {
            const nextStatus: InternalTaskStatus =
                isCompleted || isCancelled ? "in_progress" : "completed";
            const { data } = await updateInternalTaskStatus(task.id, {
                title: task.title,
                description: task.description,
                status: nextStatus,
                assigned_to: task.assigned_to.map((item) => item.id),
            });
            onUpdated({ ...task, status: data.status ?? nextStatus });
        } catch {
            setError("خطا در ثبت تغییرات");
        } finally {
            setSubmitting(false);
        }
    }

    async function cancelTask() {
        setSubmitting(true);
        setError(null);
        try {
            const { data } = await updateInternalTaskStatus(task.id, {
                title: task.title,
                description: task.description,
                status: "cancelled",
                assigned_to: task.assigned_to.map((item) => item.id),
            });
            onUpdated({ ...task, status: data.status ?? "cancelled" });
        } catch {
            setError("خطا در ثبت تغییرات");
        } finally {
            setSubmitting(false);
        }
    }

    function getStatusBadge() {
        if (isCompleted) {
            return {
                label: "انجام شده",
                dot: "bg-emerald-500",
                badge: "bg-emerald-500/10 text-emerald-500",
            };
        }
        if (isCancelled) {
            return {
                label: "لغو شده",
                dot: "bg-red-500",
                badge: "bg-red-500/10 text-red-500",
            };
        }
        return {
            label: "در حال انجام",
            dot: "bg-indigo-500",
            badge: "bg-indigo-500/10 text-indigo-500",
        };
    }

    const statusBadge = getStatusBadge();

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col gap-3 rounded-[1.8rem] border border-gray-100 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.035)] dark:border-white/[0.07] dark:bg-[#111a2d]"
            >
                <div className="flex items-center justify-between gap-2">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusBadge.badge}`}
                    >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dot}`} />
                        {statusBadge.label}
                    </span>

                    <button
                        type="button"
                        onClick={() => setAttachmentsOpen(true)}
                        className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 text-[10px] font-extrabold text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:bg-white/[0.05] dark:text-white/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                    >
                        <Paperclip size={11} />
                        {task.attachments.length}
                    </button>
                </div>

                <h3 className="line-clamp-2 text-[14px] font-extrabold leading-snug text-gray-900 dark:text-white">
                    {task.title}
                </h3>

                {task.description && (
                    <p className="line-clamp-3 text-[12px] font-medium leading-relaxed text-gray-500 dark:text-white/40">
                        {task.description}
                    </p>
                )}

                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-600">
                    <UserRound size={12} />
                    <span>ارسال کننده: {task.created_by}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-600">
                    <History size={12} />
                    <span>ایجاد: {createdDate}</span>
                </div>

                <div
                    className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 ${deadlineState.background}`}
                >
                    <Clock3 size={13} className={deadlineState.color} />
                    <div>
                        <p className={`text-[11px] font-extrabold ${deadlineState.color}`}>
                            {deadlineState.label}
                        </p>
                        {deadlineDate && (
                            <p className="mt-0.5 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                {deadlineDate}
                            </p>
                        )}
                    </div>
                </div>

                {error && (
                    <p className="rounded-xl bg-red-500/10 px-3 py-2 text-center text-[11px] font-bold text-red-500">
                        {error}
                    </p>
                )}

                <div className="mt-1 flex flex-col gap-1.5 border-t border-gray-100 pt-3 dark:border-white/[0.06]">
                    {!isCancelled && (
                        <button
                            type="button"
                            onClick={toggleStatus}
                            disabled={submitting}
                            className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-[11px] font-extrabold text-white transition-opacity disabled:opacity-50 ${isCompleted ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                        >
                            {isCompleted ? (
                                <>
                                    <RotateCcw size={13} />
                                    بازگشت به در حال انجام
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={13} />
                                    علامت‌گذاری به عنوان انجام‌شده
                                </>
                            )}
                        </button>
                    )}

                    {isCancelled && (
                        <button
                            type="button"
                            onClick={toggleStatus}
                            disabled={submitting}
                            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 text-[11px] font-extrabold text-white transition-opacity disabled:opacity-50"
                        >
                            <RotateCcw size={13} />
                            بازگشت به در حال انجام
                        </button>
                    )}

                    {!isCancelled && !isCompleted && (
                        <button
                            type="button"
                            onClick={cancelTask}
                            disabled={submitting}
                            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-red-50 text-[10.5px] font-extrabold text-red-500 transition-colors hover:bg-red-100 disabled:opacity-50 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                        >
                            <Ban size={13} />
                            لغو تسک
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setUploadOpen(true)}
                        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-50 text-[10.5px] font-extrabold text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                    >
                        <MessageSquareText size={13} />
                        یادداشت و فایل
                    </button>
                </div>
            </motion.div>

            <AttachmentUploadModal
                isOpen={uploadOpen}
                onClose={() => setUploadOpen(false)}
                task={task}
                onUploaded={(attachments: InternalTaskAttachment[]) => {
                    onUpdated({
                        ...task,
                        attachments: [...task.attachments, ...attachments],
                    });
                    setUploadOpen(false);
                }}
            />

            <AttachmentsViewModal
                isOpen={attachmentsOpen}
                onClose={() => setAttachmentsOpen(false)}
                task={task}
            />
        </>
    );
}