"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    CalendarDays,
    ClipboardX,
    Clock,
    Loader,
    Loader2,
    Paperclip,
    Trash2,
    UserRound,
    X,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { InternalTask, InternalTaskStatus, EmployeeRef } from "./types";
import { toJalali, toPersianDigits, JALALI_MONTHS, pad2 } from "@/lib/jalali";
import api from "@/lib/axiosInstance";
import InternalTimeRangeModal from "./InternalTimeRangeModal";

const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#3b82f6", "#6366f1"],
    ["#8b5cf6", "#ec4899"],
    ["#06b6d4", "#6366f1"],
    ["#f59e0b", "#ef4444"],
    ["#10b981", "#3b82f6"],
    ["#f472b6", "#ec4899"],
    ["#8b5cf6", "#f59e0b"],
    ["#3b82f6", "#06b6d4"],
    ["#ef4444", "#f59e0b"],
];

export const STATUS_CONFIG: Record<InternalTaskStatus, { label: string; className: string }> = {
    in_progress: {
        label: "در حال انجام",
        className: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    },
    completed: {
        label: "انجام شده",
        className: "border-blue-500/20 bg-blue-500/10 text-blue-400",
    },
    cancelled: {
        label: "لغو شده",
        className: "border-red-500/20 bg-red-500/10 text-red-400",
    },
};
type DeadlineUrgency = "overdue" | "critical" | "soon" | "normal" | null;

function getDeadlineUrgency(deadline: string | null | undefined): DeadlineUrgency {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    const hours = diff / (1000 * 60 * 60);
    if (diff < 0) return "overdue";
    if (hours <= 6) return "critical";
    if (hours <= 24) return "soon";
    return "normal";
}

const URGENCY_ACCENT: Record<Exclude<DeadlineUrgency, null | "normal">, string> = {
    overdue: "#ef4444",
    critical: "#f97316",
    soon: "#eab308",
};

const URGENCY_LABEL: Record<Exclude<DeadlineUrgency, null | "normal">, string> = {
    overdue: "منقضی شده",
    critical: "فوری",
    soon: "امروز",
};

interface StepDeadline {
    started_at: string | null;
    deadline: string | null;
}

function formatJalaliDate(iso?: string | null) {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const [jy, jm, jd] = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)} ساعت ${toPersianDigits(
        pad2(d.getHours())
    )}:${toPersianDigits(pad2(d.getMinutes()))}`;
}

function getGradient(id: number) {
    return AVATAR_GRADIENTS[Math.abs(id) % AVATAR_GRADIENTS.length];
}

function Chip({ isDark, children }: { isDark: boolean; children: React.ReactNode }) {
    return (
        <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
            style={{
                border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                color: isDark ? "#94a3b8" : "#64748b",
            }}
        >
            {children}
        </div>
    );
}

function EmployeeChip({ employee, isDark }: { employee: EmployeeRef; isDark: boolean }) {
    const gradient = getGradient(employee.id);
    const name = employee.full_name || `کارمند ${employee.id}`;

    return (
        <div
            className="flex items-center gap-1.5 rounded-full py-0.5 pl-2 pr-0.5"
            style={{
                border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            }}
        >
            <span
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold text-white"
                style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
            >
                <UserRound size={11} />
            </span>
            <span
                className="text-[10.5px] font-bold"
                style={{ color: isDark ? "#cbd5e1" : "#475569" }}
            >
                {name}
            </span>
        </div>
    );
}

interface SentTaskCardProps {
    task: InternalTask;
    index?: number;
    onEdit?: (task: InternalTask) => void;
    onUpdated?: (task: InternalTask) => void;
    onDelete?: (taskId: number) => Promise<boolean> | void | Promise<void>;
    isDeleting?: boolean;
}

export default function SentTaskCard({
    task,
    index = 0,
    onDelete,
    onUpdated,
    isDeleting = false,
}: SentTaskCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [hovered, setHovered] = useState(false);
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [savingTime, setSavingTime] = useState(false);
    const [timeError, setTimeError] = useState<string | null>(null);
    const [stepDeadline, setStepDeadline] = useState<StepDeadline>({
        started_at: task.started_at ?? null,
        deadline: task.deadline ?? null,
    });
    const assignedEmployees: EmployeeRef[] = Array.isArray(task.assigned_to)
    ? task.assigned_to
    : [];
    const [loadingDeadline, setLoadingDeadline] = useState(false);
    const [, forceTick] = useState(0);

    const status: InternalTaskStatus = (task.status as InternalTaskStatus) || "in_progress";
    const statusConfig = STATUS_CONFIG[status] ?? {
        label: "در حال انجام",
        className: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    };

    const isActiveTask = !["completed", "cancelled", "sold"].includes(status);
    const urgency = isActiveTask ? getDeadlineUrgency(stepDeadline.deadline) : null;
    const accent = urgency && urgency !== "normal" ? URGENCY_ACCENT[urgency] : null;

    useEffect(() => {
        let cancelled = false;
        setLoadingDeadline(true);

        api.get(`/tasks/api/v1/internal-tasks/${task.id}/deadline/`)
            .then((res) => {
                if (cancelled) return;
                const data = res.data?.data ?? res.data;
                setStepDeadline({
                    started_at: data?.started_at ?? task.started_at ?? null,
                    deadline: data?.deadline ?? task.deadline ?? null,
                });
            })
            .catch(() => {
                if (!cancelled) {
                    setStepDeadline({
                        started_at: task.started_at ?? null,
                        deadline: task.deadline ?? null,
                    });
                }
            })
            .finally(() => {
                if (!cancelled) setLoadingDeadline(false);
            });

        return () => {
            cancelled = true;
        };
    }, [task.id, task.started_at, task.deadline]);

    useEffect(() => {
        if (!stepDeadline.deadline || !isActiveTask) return;
        const interval = setInterval(() => forceTick((t) => t + 1), 60000);
        return () => clearInterval(interval);
    }, [stepDeadline.deadline, isActiveTask]);

    const startedAtLabel = formatJalaliDate(stepDeadline.started_at);
    const deadlineLabel = formatJalaliDate(stepDeadline.deadline);

    async function handleDelete() {
        if (!onDelete) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            await onDelete(task.id);
            setShowConfirm(false);
        } catch {
            setDeleteError("خطا در حذف تیکت. دوباره تلاش کنید.");
        } finally {
            setDeleting(false);
        }
    }

    async function handleTimeSubmit(startedAt: string, deadline: string) {
        setSavingTime(true);
        setTimeError(null);
        try {
            const res = await api.patch(
                `/tasks/api/v1/internal-tasks/${task.id}/deadline/patch/`,
                { started_at: startedAt, deadline }
            );
            const data = res.data?.data ?? res.data;
            const updatedStartedAt = data?.started_at ?? startedAt;
            const updatedDeadline = data?.deadline ?? deadline;

            setStepDeadline({
                started_at: updatedStartedAt,
                deadline: updatedDeadline,
            });

            onUpdated?.({
                ...task,
                started_at: updatedStartedAt,
                deadline: updatedDeadline,
            });

            setTimeModalOpen(false);
        } catch {
            setTimeError("خطا در ثبت بازه زمانی");
        } finally {
            setSavingTime(false);
        }
    }

    function handleCloseConfirm() {
        if (deleting) return;
        setShowConfirm(false);
        setDeleteError(null);
    }

    const effectiveDeleting = deleting || isDeleting;

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                className="relative flex flex-col gap-3 overflow-hidden rounded-[2rem] p-4"
                style={{
                    border: accent
                        ? `1px solid color-mix(in srgb, ${accent} 40%, transparent)`
                        : isDark
                            ? "1px solid rgba(255,255,255,0.06)"
                            : "1px solid rgba(0,0,0,0.06)",
                    background: accent
                        ? `color-mix(in srgb, ${accent} ${urgency === "overdue" ? 7 : urgency === "critical" ? 5 : 4}%, ${isDark ? "#0f172a" : "#fafafa"})`
                        : isDark
                            ? "rgba(255,255,255,0.02)"
                            : "#fafafa",
                    minHeight: "130px",
                    opacity: effectiveDeleting ? 0.45 : 1,
                    pointerEvents: effectiveDeleting ? "none" : undefined,
                    boxShadow: accent
                        ? `0 0 0 1px color-mix(in srgb, ${accent} 15%, transparent), 0 4px 24px color-mix(in srgb, ${accent} 12%, transparent)`
                        : isDark
                            ? "0 2px 24px rgba(0,0,0,0.2)"
                            : "0 2px 16px rgba(0,0,0,0.04)",
                    transition: "border-color 0.4s ease, background 0.4s ease, box-shadow 0.4s ease",
                }}
            >
                {urgency === "overdue" && (
                    <motion.div
                        className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
                        style={{
                            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                        }}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                )}

                <svg
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    style={{ borderRadius: "2rem" }}
                >
                    <defs>
                        <linearGradient
                            id={`borderGrad-internal-${task.id}`}
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
                        rx="30"
                        ry="30"
                        fill="none"
                        stroke={`url(#borderGrad-internal-${task.id})`}
                        strokeWidth="1.5"
                        pathLength="1"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={hovered ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                        transition={{ duration: 0.55, ease: "easeInOut" }}
                    />
                </svg>

                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] font-bold ${statusConfig.className}`}
                        >
                            <span
                                className={`h-1.5 w-1.5 rounded-full bg-current ${status === "in_progress" ? "animate-pulse" : ""}`}
                            />
                            {statusConfig.label}
                        </span>
                        {accent && (
                            <span
                                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                                style={{
                                    color: accent,
                                    background: `color-mix(in srgb, ${accent} 12%, transparent)`,
                                    border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
                                }}
                            >
                                <motion.span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ background: accent }}
                                    animate={urgency !== "soon" ? { opacity: [1, 0.3, 1] } : undefined}
                                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                                />
                                {URGENCY_LABEL[urgency as Exclude<DeadlineUrgency, null | "normal">]}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setTimeModalOpen(true)}
                            className="flex h-7 w-7 items-center justify-center rounded-xl transition-colors"
                            style={{
                                background: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.07)",
                                color: isDark ? "#a5b4fc" : "#6366f1",
                            }}
                            title="تعیین بازه زمانی"
                        >
                            <Clock size={11} />
                        </button>
                        {onDelete && (
                            <button
                                type="button"
                                onClick={() => setShowConfirm(true)}
                                disabled={effectiveDeleting}
                                className="flex h-7 w-7 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
                                style={{
                                    background: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.07)",
                                    color: "#ef4444",
                                }}
                                title="حذف تسک"
                            >
                                {effectiveDeleting ? (
                                    <Loader2 size={11} className="animate-spin" />
                                ) : (
                                    <Trash2 size={11} />
                                )}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <h3
                        className="text-[13.5px] font-extrabold leading-tight"
                        style={{ color: isDark ? "#f1f5f9" : "#1e293b" }}
                    >
                        {task.title}
                    </h3>
                    {task.description ? (
                        <p
                            className="line-clamp-2 text-[12px] leading-6"
                            style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                        >
                            {task.description}
                        </p>
                    ) : null}
                </div>

                <div
                    className="mt-auto flex flex-wrap items-center gap-2 border-t pt-2.5"
                    style={{
                        borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                    }}
                >
                    {assignedEmployees.length > 0 ? (
                        assignedEmployees.map((emp) => (
                            <EmployeeChip key={emp.id} employee={emp} isDark={isDark} />
                        ))
                    ) : (
                        <div
                            className="flex items-center gap-1.5 rounded-full py-0.5 pl-2 pr-0.5"
                            style={{
                                border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
                                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                            }}
                        >
                            <span
                                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold text-white"
                                style={{ background: `linear-gradient(135deg, #6366f1, #8b5cf6)` }}
                            >
                                <UserRound size={11} />
                            </span>
                            <span
                                className="text-[10.5px] font-bold"
                                style={{ color: isDark ? "#cbd5e1" : "#475569" }}
                            >
                                بدون مسئول
                            </span>
                        </div>
                    )}

                    {task.attachments && task.attachments.length > 0 ? (
                        <Chip isDark={isDark}>
                            <Paperclip size={11} />
                            {task.attachments.length}
                        </Chip>
                    ) : null}
                </div>

                <div
                    className="flex flex-col gap-1.5 rounded-[1.25rem] px-3 py-2.5"
                    style={{
                        background: accent
                            ? `color-mix(in srgb, ${accent} 8%, transparent)`
                            : isDark
                                ? "rgba(99,102,241,0.06)"
                                : "rgba(99,102,241,0.05)",
                        border: accent
                            ? `1px solid color-mix(in srgb, ${accent} 25%, transparent)`
                            : isDark
                                ? "1px solid rgba(99,102,241,0.12)"
                                : "1px solid rgba(99,102,241,0.1)",
                        transition: "background 0.4s ease, border-color 0.4s ease",
                    }}
                >
                    {loadingDeadline ? (
                        <div
                            className="flex items-center gap-2 text-[10.5px] font-semibold"
                            style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                        >
                            <Loader2 size={12} className="animate-spin" />
                            در حال دریافت زمان‌بندی...
                        </div>
                    ) : startedAtLabel || deadlineLabel ? (
                        <>
                            {startedAtLabel && (
                                <div
                                    className="flex items-center gap-2 text-[11px] font-bold"
                                    style={{
                                        color: accent ?? (isDark ? "#a5b4fc" : "#6366f1"),
                                    }}
                                >
                                    <CalendarDays size={13} />
                                    <span>شروع: {startedAtLabel}</span>
                                </div>
                            )}
                            {deadlineLabel && (
                                <div
                                    className="flex items-center gap-2 text-[11px] font-bold"
                                    style={{ color: accent ?? "#ef4444" }}
                                >
                                    <Clock size={13} />
                                    <span>مهلت: {deadlineLabel}</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div
                            className="flex items-center gap-2 text-[10.5px] font-semibold"
                            style={{ color: isDark ? "#64748b" : "#94a3b8" }}
                        >
                            <Clock size={12} />
                            زمان‌بندی تعیین نشده
                        </div>
                    )}
                </div>
            </motion.div>

            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{
                            background: "rgba(0,0,0,0.45)",
                            backdropFilter: "blur(3px)",
                        }}
                        onClick={handleCloseConfirm}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 16 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                            onClick={(e) => e.stopPropagation()}
                            dir="rtl"
                            className="flex w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
                        >
                            <div className="flex shrink-0 items-center justify-between px-8 pb-6 pt-8">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10">
                                        <Trash2 size={15} className="text-red-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                            حذف تیکت
                                        </h3>
                                        <p className="mt-0.5 text-[11px] text-gray-400">
                                            این عملیات قابل بازگشت نیست
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCloseConfirm}
                                    disabled={deleting}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            <div className="flex-1 px-8 pb-2">
                                <p className="text-[12.5px] font-semibold leading-6 text-gray-500 dark:text-gray-400">
                                    تیکت{" "}
                                    <span className="font-extrabold text-gray-900 dark:text-white">
                                        {task.title}
                                    </span>{" "}
                                    برای همیشه حذف خواهد شد.
                                </p>

                                <AnimatePresence>
                                    {deleteError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 4 }}
                                            className="mt-4 flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10"
                                        >
                                            <ClipboardX
                                                size={14}
                                                className="mt-0.5 shrink-0 text-red-500"
                                            />
                                            <p className="flex-1 text-[11.5px] font-semibold leading-5 text-red-500 dark:text-red-400">
                                                {deleteError}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex shrink-0 items-center gap-2 px-8 pb-8 pt-5">
                                <button
                                    type="button"
                                    onClick={handleCloseConfirm}
                                    disabled={deleting}
                                    className="flex h-11 flex-1 items-center justify-center rounded-full bg-gray-100 text-[13px] font-bold text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-40 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08]"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-red-600 text-[13px] font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-40"
                                >
                                    {deleting ? (
                                        <Loader size={14} className="animate-spin" />
                                    ) : (
                                        <>
                                            <Trash2 size={13} strokeWidth={2.5} />
                                            حذف کن
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <InternalTimeRangeModal
                open={timeModalOpen}
                initialStartedAt={stepDeadline.started_at}
                initialDeadline={stepDeadline.deadline}
                loading={savingTime}
                error={timeError}
                onClose={() => setTimeModalOpen(false)}
                onSubmit={handleTimeSubmit}
            />
        </>
    );
}
