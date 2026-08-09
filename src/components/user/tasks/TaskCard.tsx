"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftCircle, ArrowRightCircle, Clock3, CheckCircle2, Layers3, BadgeInfo } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import TaskActionModal from "./TaskActionModal";

export interface ApiTask {
    id: number;
    title: string;
    description?: string;
    case: number;
    department: number;
    department_name?: string;
    current_step: number;
    current_step_name?: string;
    assigned_employee: number;
    assigned_employee_name?: string;
    status: "in_progress" | "completed" | string;
    created_at?: string;
    completed_at?: string;
    updated_at?: string;
}

interface TaskCardProps {
    task: ApiTask;
    index: number;
    onUpdated: (task: ApiTask) => void;
    onRemoved?: (id: number) => void;
    canGoPrev?: boolean;
    canGoNext?: boolean;
    prevEndpoint?: string;   // مثلا: "backward" یا "revert"
    nextEndpoint?: string;   // پیش‌فرض: advance
}

function formatFaDate(date?: string) {
    if (!date) return "نامشخص";
    return new Date(date).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
}

function getStatusMeta(status: string) {
    if (status === "completed") {
        return {
            label: "تکمیل شده",
            color: "bg-emerald-500/10 text-emerald-500",
            dot: "bg-emerald-500",
        };
    }

    return {
        label: "در حال انجام",
        color: "bg-indigo-500/10 text-indigo-500",
        dot: "bg-indigo-500",
    };
}

export default function TaskCard({
    task,
    index,
    onUpdated,
    canGoPrev = true,
    canGoNext = true,
    prevEndpoint = "backward",
    nextEndpoint = "advance",
}: TaskCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [hovered, setHovered] = useState(false);
    const [openModal, setOpenModal] = useState<null | "next" | "prev">(null);
    const [submitting, setSubmitting] = useState(false);

    const meta = useMemo(() => getStatusMeta(task.status), [task.status]);

    const subtitle = [
        task.department_name ? `دپارتمان: ${task.department_name}` : null,
        task.current_step_name ? `مرحله: ${task.current_step_name}` : null,
        task.assigned_employee_name ? `کارمند: ${task.assigned_employee_name}` : null,
    ]
        .filter(Boolean)
        .join(" • ");

    async function submitAction(direction: "next" | "prev", data: { note: string; files: File[] }) {
        setSubmitting(true);

        try {
            const formData = new FormData();

            if (data.note.trim()) {
                formData.append("note", data.note.trim());
            }

            data.files.forEach((file) => {
                formData.append("files", file);
            });

            const endpoint =
                direction === "next"
                    ? `/tasks/api/v1/tasks/${task.id}/${nextEndpoint}/`
                    : `/tasks/api/v1/tasks/${task.id}/${prevEndpoint}/`;

            const res = await axiosInstance.post<ApiTask>(endpoint, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            onUpdated(res.data);
            setOpenModal(null);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.22, delay: index * 0.04 }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                className="relative rounded-3xl p-4 flex flex-col gap-4 overflow-hidden"
                style={{
                    border: isDark
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "1px solid rgba(0,0,0,0.06)",
                    background: isDark ? "rgba(255,255,255,0.02)" : "#fafafa",
                    minHeight: 160,
                }}
            >
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                        <linearGradient
                            id={`taskBorder-${task.id}`}
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
                        rx="20"
                        ry="20"
                        fill="none"
                        stroke={`url(#taskBorder-${task.id})`}
                        strokeWidth="1.4"
                        pathLength="1"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={hovered ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                        transition={{ duration: 0.55, ease: "easeInOut" }}
                    />
                </svg>

                <div className="flex items-start justify-between gap-3 z-10">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${meta.color}`}
                            >
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dot} ml-1`} />
                                {meta.label}
                            </span>

                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
                                #{task.id}
                            </span>
                        </div>

                        <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white leading-tight truncate">
                            {task.title}
                        </h3>

                        <p className="text-[11.5px] text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">
                            {subtitle || "بدون اطلاعات تکمیلی"}
                        </p>
                    </div>

                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-indigo-500/10 dark:bg-indigo-500/15">
                        <Layers3 size={18} className="text-indigo-500" />
                    </div>
                </div>

                <div
                    className="grid grid-cols-2 gap-2 pt-1"
                >
                    <div
                        className="rounded-2xl p-3 border"
                        style={{
                            borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                            background: isDark ? "rgba(255,255,255,0.02)" : "#fff",
                        }}
                    >
                        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-[11px]">
                            <BadgeInfo size={12} />
                            دپارتمان
                        </div>
                        <p className="mt-1 text-[12.5px] font-bold text-gray-800 dark:text-gray-100 truncate">
                            {task.department_name || "نامشخص"}
                        </p>
                    </div>

                    <div
                        className="rounded-2xl p-3 border"
                        style={{
                            borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                            background: isDark ? "rgba(255,255,255,0.02)" : "#fff",
                        }}
                    >
                        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-[11px]">
                            <Clock3 size={12} />
                            مرحله
                        </div>
                        <p className="mt-1 text-[12.5px] font-bold text-gray-800 dark:text-gray-100 truncate">
                            {task.current_step_name || "نامشخص"}
                        </p>
                    </div>
                </div>

                <div
                    className="pt-3 border-t flex items-center justify-between gap-2"
                    style={{
                        borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                    }}
                >
                    <p className="text-[11.5px] text-gray-400 dark:text-gray-500">
                        ایجاد شده: {formatFaDate(task.created_at)}
                    </p>

                    <div className="flex items-center gap-2">
                        {canGoPrev && (
                            <button
                                type="button"
                                onClick={() => setOpenModal("prev")}
                                disabled={submitting}
                                className="h-9 px-3 rounded-xl flex items-center gap-2 text-[12px] font-bold transition-colors disabled:opacity-40"
                                style={{
                                    background: isDark
                                        ? "rgba(236,72,153,0.10)"
                                        : "rgba(236,72,153,0.07)",
                                    color: isDark ? "#f9a8d4" : "#db2777",
                                }}
                            >
                                <ArrowRightCircle size={14} />
                                مرحله قبل
                            </button>
                        )}

                        {canGoNext && (
                            <button
                                type="button"
                                onClick={() => setOpenModal("next")}
                                disabled={submitting}
                                className="h-9 px-3 rounded-xl flex items-center gap-2 text-[12px] font-bold text-white disabled:opacity-40"
                                style={{
                                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                    boxShadow: "0 4px 14px rgba(99,102,241,0.28)",
                                }}
                            >
                                <ArrowLeftCircle size={14} />
                                مرحله بعد
                            </button>
                        )}
                    </div>
                </div>

                <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-indigo-500/60" />
            </motion.div>

            <TaskActionModal
                isOpen={openModal === "next"}
                onClose={() => setOpenModal(null)}
                direction="next"
                title="ارسال به مرحله بعد"
                description="یادداشت و فایل‌ها را ثبت کن و تسک را جلو ببر"
                onSubmit={(data) => submitAction("next", data)}
            />

            <TaskActionModal
                isOpen={openModal === "prev"}
                onClose={() => setOpenModal(null)}
                direction="prev"
                title="برگرداندن به مرحله قبل"
                description="یادداشت و فایل‌ها را ثبت کن و تسک را عقب ببر"
                onSubmit={(data) => submitAction("prev", data)}
            />
        </>
    );
}
