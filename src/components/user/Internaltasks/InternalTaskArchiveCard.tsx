"use client";

import { motion } from "framer-motion";
import {
    Archive,
    Ban,
    CheckCircle2,
    Clock3,
    History,
    Ticket,
    TimerReset,
    UserRound,
} from "lucide-react";
import { useTheme } from "next-themes";

import {
    JALALI_MONTHS,
    pad2,
    toJalali,
    toPersianDigits,
} from "@/lib/jalali";
import type { InternalTaskArchive as InternalTaskArchiveType } from "./types";

type InternalTaskArchiveCardProps = {
    task: InternalTaskArchiveType;
    index: number;
    isRoutine: boolean;
};

function formatJalali(value?: string | null) {
    if (!value) return "نامشخص";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "نامشخص";

    const [jy, jm, jd] = toJalali(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
    ) as [number, number, number];

    return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(
        jy,
    )} - ${toPersianDigits(pad2(date.getHours()))}:${toPersianDigits(
        pad2(date.getMinutes()),
    )}`;
}

export default function InternalTaskArchiveCard({
    task,
    index = 0,
    isRoutine,
}: InternalTaskArchiveCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const isCompleted = task.status === "completed";

    const creator =
        task.created_by_full_name?.trim() ||
        task.created_by_username?.trim() ||
        "نامشخص";

    const finalAction =
        task.final_action_by_full_name?.trim() ||
        task.final_action_by_username?.trim() ||
        "نامشخص";

    const createdDate = formatJalali(task.task_created_at);

    const actionDate = formatJalali(
        isCompleted ? task.completed_at : task.archived_at,
    );

    const archivedDate = formatJalali(task.archived_at);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{
                duration: 0.2,
                delay: index * 0.04,
            }}
            className="group relative flex min-h-[245px] flex-col justify-between overflow-visible rounded-3xl p-4"
            style={{
                background: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "#fafafa",
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
                        id={`archive-card-border-${task.id}`}
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
                    stroke={`url(#archive-card-border-${task.id})`}
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

            <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <div
                        className="flex h-7 items-center gap-1.5 rounded-xl px-2.5"
                        style={{
                            background: isRoutine
                                ? isDark
                                    ? "rgba(139,92,246,0.14)"
                                    : "rgba(139,92,246,0.08)"
                                : isDark
                                    ? "rgba(99,102,241,0.14)"
                                    : "rgba(99,102,241,0.08)",
                            color: isRoutine
                                ? isDark
                                    ? "#c4b5fd"
                                    : "#7c3aed"
                                : isDark
                                    ? "#a5b4fc"
                                    : "#4f46e5",
                        }}
                    >
                        {isRoutine ? (
                            <TimerReset size={11} />
                        ) : (
                            <Ticket size={11} />
                        )}

                        <span className="text-[10px] font-extrabold">
                            {isRoutine ? "روتین" : "تیکت"}
                        </span>
                    </div>

                    <div
                        className="flex h-7 items-center gap-1.5 rounded-xl px-2.5"
                        style={{
                            background: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(15,23,42,0.04)",
                            color: isDark ? "#94a3b8" : "#64748b",
                        }}
                    >
                        <Archive size={10} />

                        <span className="text-[10px] font-extrabold">
                            آرشیو
                        </span>
                    </div>
                </div>

                <div
                    className="flex h-7 items-center rounded-xl px-2.5 text-[10px] font-extrabold"
                    style={{
                        background: isCompleted
                            ? isDark
                                ? "rgba(16,185,129,0.14)"
                                : "rgba(16,185,129,0.08)"
                            : isDark
                                ? "rgba(239,68,68,0.14)"
                                : "rgba(239,68,68,0.08)",
                        color: isCompleted
                            ? isDark
                                ? "#6ee7b7"
                                : "#059669"
                            : isDark
                                ? "#fca5a5"
                                : "#ef4444",
                    }}
                >
                    <div className="flex items-center gap-1.5">
                        {isCompleted ? (
                            <CheckCircle2 size={12} />
                        ) : (
                            <Ban size={12} />
                        )}

                        <span>
                            {isCompleted ? "انجام شده" : "لغو شده"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="relative z-10 mt-4 flex items-start gap-2.5">
                <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                        background: isRoutine
                            ? isDark
                                ? "rgba(139,92,246,0.12)"
                                : "rgba(139,92,246,0.07)"
                            : isDark
                                ? "rgba(99,102,241,0.12)"
                                : "rgba(99,102,241,0.07)",
                    }}
                >
                    {isRoutine ? (
                        <TimerReset
                            size={18}
                            className={
                                isDark
                                    ? "text-violet-400"
                                    : "text-violet-500"
                            }
                        />
                    ) : (
                        <Ticket
                            size={18}
                            className={
                                isDark
                                    ? "text-indigo-400"
                                    : "text-indigo-500"
                            }
                        />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="line-clamp-2 text-[13.5px] font-extrabold leading-6 text-gray-900 dark:text-white">
                            {task.title || "بدون عنوان"}
                        </h3>
                    </div>

                    <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="shrink-0 text-[10px] font-bold text-gray-400 dark:text-gray-600">
                            #{toPersianDigits(task.task_id)}
                        </span>

                        <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700" />

                        <span className="truncate text-[10px] font-semibold text-gray-400 dark:text-gray-600">
                            {isRoutine ? "تسک روتین" : "تسک داخلی"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="relative z-10 mt-4 grid grid-cols-2 gap-2">
                <div
                    className="min-w-0 rounded-2xl px-3 py-2.5"
                    style={{
                        background: isDark
                            ? "rgba(99,102,241,0.08)"
                            : "rgba(99,102,241,0.055)",
                    }}
                >
                    <div className="flex items-center gap-1.5">
                        <History
                            size={11}
                            className="shrink-0 text-indigo-500 dark:text-indigo-400"
                        />

                        <span className="text-[10px] font-extrabold text-indigo-500 dark:text-indigo-400">
                            ایجاد
                        </span>
                    </div>

                    <p className="mt-1 truncate text-[10px] font-bold text-gray-500 dark:text-gray-400">
                        {createdDate}
                    </p>
                </div>

                <div
                    className="min-w-0 rounded-2xl px-3 py-2.5"
                    style={{
                        background: isCompleted
                            ? isDark
                                ? "rgba(16,185,129,0.09)"
                                : "rgba(16,185,129,0.06)"
                            : isDark
                                ? "rgba(239,68,68,0.09)"
                                : "rgba(239,68,68,0.055)",
                    }}
                >
                    <div className="flex items-center gap-1.5">
                        {isCompleted ? (
                            <CheckCircle2
                                size={11}
                                className="shrink-0 text-emerald-500 dark:text-emerald-400"
                            />
                        ) : (
                            <Ban
                                size={11}
                                className="shrink-0 text-red-500 dark:text-red-400"
                            />
                        )}

                        <span
                            className={`text-[10px] font-extrabold ${isCompleted
                                    ? "text-emerald-500 dark:text-emerald-400"
                                    : "text-red-500 dark:text-red-400"
                                }`}
                        >
                            {isCompleted ? "انجام" : "لغو"}
                        </span>
                    </div>

                    <p className="mt-1 truncate text-[10px] font-bold text-gray-500 dark:text-gray-400">
                        {actionDate}
                    </p>
                </div>
            </div>

            <div
                className="relative z-10 mt-2 flex min-w-0 items-center gap-2 rounded-2xl px-3 py-2.5"
                style={{
                    background: isDark
                        ? "rgba(139,92,246,0.08)"
                        : "rgba(139,92,246,0.055)",
                }}
            >
                <UserRound
                    size={12}
                    className="shrink-0 text-violet-500 dark:text-violet-400"
                />

                <div className="min-w-0 flex-1">
                    <p className="text-[9.5px] font-extrabold text-violet-500 dark:text-violet-400">
                        ایجاد شده توسط
                    </p>

                    <p className="mt-0.5 truncate text-[10.5px] font-bold text-gray-600 dark:text-gray-400">
                        {creator}
                    </p>
                </div>
            </div>

            <div
                className="relative z-10 mt-2 flex min-w-0 items-center gap-2 rounded-2xl px-3 py-2.5"
                style={{
                    background: isDark
                        ? "rgba(59,130,246,0.07)"
                        : "rgba(59,130,246,0.045)",
                }}
            >
                <UserRound
                    size={12}
                    className="shrink-0 text-blue-500 dark:text-blue-400"
                />

                <div className="min-w-0 flex-1">
                    <p className="text-[9.5px] font-extrabold text-blue-500 dark:text-blue-400">
                        آخرین اقدام توسط
                    </p>

                    <p className="mt-0.5 truncate text-[10.5px] font-bold text-gray-600 dark:text-gray-400">
                        {finalAction}
                    </p>
                </div>
            </div>

            <div className="relative z-10 mt-3 flex items-center justify-between gap-2 border-t border-black/5 pt-2.5 dark:border-white/[0.05]">
                <div className="flex min-w-0 items-center gap-1.5">
                    <Clock3
                        size={11}
                        className="shrink-0 text-gray-400 dark:text-gray-600"
                    />

                    <span className="truncate text-[9.5px] font-bold text-gray-400 dark:text-gray-600">
                        بایگانی
                    </span>
                </div>

                <span className="truncate text-[9.5px] font-semibold text-gray-400 dark:text-gray-500">
                    {archivedDate}
                </span>
            </div>
        </motion.div>
    );
}