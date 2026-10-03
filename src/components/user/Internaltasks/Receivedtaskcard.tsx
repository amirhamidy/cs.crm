"use client";

import { memo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Clock3,
    History,
    MessageSquareText,
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
import InternalTaskChatModal from "./InternalTaskChatModal";

interface ReceivedTaskCardProps {
    task: InternalTask;
    employees: EmployeeListItem[];
    isRoutine?: boolean;
    onUpdated: (task: InternalTask) => void;
}

function formatJalali(value?: string | null) {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return null;

    const [jy, jm, jd] = toJalali(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
    ) as [number, number, number];

    return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)} - ${toPersianDigits(
        pad2(date.getHours()),
    )}:${toPersianDigits(pad2(date.getMinutes()))}`;
}

function getDeadlineState(deadline?: string | null) {
    if (!deadline) {
        return {
            label: "بدون مهلت",
            color: "text-gray-400 dark:text-gray-500",
            background: "bg-gray-50 dark:bg-white/[0.03]",
        };
    }

    const time = new Date(deadline).getTime();

    if (Number.isNaN(time)) {
        return {
            label: "بدون مهلت",
            color: "text-gray-400 dark:text-gray-500",
            background: "bg-gray-50 dark:bg-white/[0.03]",
        };
    }

    const diff = time - Date.now();
    const hours = diff / 3600000;

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


function ReceivedTaskCard({
    task,
    employees,
    isRoutine = false,
    onUpdated,
}: ReceivedTaskCardProps) {
    const [currentTask, setCurrentTask] = useState(task);
    const [chatOpen, setChatOpen] = useState(false);
    const [deadlineData, setDeadlineData] = useState({
        started_at: task.started_at ?? null,
        deadline: task.deadline ?? null,
    });

    useEffect(() => {
        setCurrentTask(task);
        setDeadlineData({
            started_at: task.started_at ?? null,
            deadline: task.deadline ?? null,
        });
    }, [task]);


    const creator = employees.find(
        (employee) =>
            employee.username.trim().toLowerCase() ===
            currentTask.created_by.trim().toLowerCase(),
    );

    const creatorName =
        creator?.full_name || currentTask.created_by || "نامشخص";

    const isCompleted = currentTask.status === "completed";
    const isCancelled = currentTask.status === "cancelled";

    const deadlineState = getDeadlineState(deadlineData.deadline);
    const deadlineDate = formatJalali(deadlineData.deadline);
    const startedAtDate = formatJalali(deadlineData.started_at);
    const createdDate = formatJalali(currentTask.created_at);

    const statusBadge = isCompleted
        ? {
            label: "انجام شده",
            dot: "bg-emerald-500",
            badge: "bg-emerald-500/10 text-emerald-500",
        }
        : isCancelled
            ? {
                label: "لغو شده",
                dot: "bg-red-500",
                badge: "bg-red-500/10 text-red-500",
            }
            : {
                label: "در حال انجام",
                dot: "bg-indigo-500",
                badge: "bg-indigo-500/10 text-indigo-500",
            };

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
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${statusBadge.dot}`}
                        />
                        {statusBadge.label}
                    </span>

                    <button
                        type="button"
                        onClick={() => setChatOpen(true)}
                        className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 text-[10px] font-extrabold text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:bg-white/[0.05] dark:text-white/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                    >
                        <MessageSquareText size={11} />
                        {currentTask.attachments.length}
                    </button>
                </div>

                <h3 className="line-clamp-2 text-[14px] font-extrabold leading-snug text-gray-900 dark:text-white">
                    {currentTask.title}
                </h3>

                {currentTask.description && (
                    <p className="line-clamp-3 text-[12px] font-medium leading-relaxed text-gray-500 dark:text-white/40">
                        {currentTask.description}
                    </p>
                )}

                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-600">
                    <UserRound size={12} />
                    <span>ارسال کننده: {creatorName}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-600">
                    <History size={12} />
                    <span>ایجاد: {createdDate}</span>
                </div>

                {(
                    deadlineData.started_at || deadlineData.deadline
                ) ? (
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
                                        {startedAtDate}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div
                            className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 ${deadlineState.background}`}
                        >
                            <Clock3
                                size={13}
                                className={deadlineState.color}
                            />
                            <div>
                                <p
                                    className={`text-[11px] font-extrabold ${deadlineState.color}`}
                                >
                                    {deadlineState.label}
                                </p>

                                {deadlineDate && (
                                    <p className="mt-0.5 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                        {deadlineDate}
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-2 rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.03]">
                        <Clock3 size={13} className="text-gray-400" />
                        <span className="text-[11px] font-semibold text-gray-400">
                            زمان‌بندی تعیین نشده
                        </span>
                    </div>
                )}

                <div className="relative z-10 flex flex-col gap-2 border-t border-black/5 pt-2.5 dark:border-white/[0.05]">
                    <button
                        type="button"
                        onClick={() => setChatOpen(true)}
                        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-50 text-[10.5px] font-extrabold text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                    >
                        <MessageSquareText size={13} />
                        گفتگو و فایل‌ها
                    </button>
                </div>
            </motion.div>

            <InternalTaskChatModal
                open={chatOpen}
                task={currentTask}
                onClose={() => setChatOpen(false)}
                onUpdated={(updatedTask) => {
                    setCurrentTask(updatedTask);
                    onUpdated(updatedTask);
                }}
            />
        </>
    );
}

export default memo(ReceivedTaskCard, (prev, next) =>
    prev.task === next.task &&
    prev.employees === next.employees &&
    prev.isRoutine === next.isRoutine
);
