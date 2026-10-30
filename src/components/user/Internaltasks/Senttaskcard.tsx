"use client";

import { memo, useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { useVisibleInterval } from "@/hooks/useVisibility";
import { Ban, CalendarClock, CheckCircle2, ClipboardX, Clock, Loader, Loader2, MessageSquareText, RotateCcw, Trash2, UserRound, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/authStore";
import type { InternalTask, InternalTaskStatus, EmployeeRef } from "./types";
import api from "@/lib/axiosInstance";
import TimeRangeModal from "@/components/tasks/TimeRangeModal";
import InternalTaskDeadlineModal from "./InternalTaskDeadlineModal";
import dynamic from "next/dynamic";
import LazyLoading from "@/components/ui/LazyLoading";


const InternalTaskChatModal = dynamic(() => import("./InternalTaskChatModal"), {
    ssr: false,
    loading: () => <LazyLoading />,
});
import InternalTaskActionModal from "./InternalTaskActionModal";
import { reopenInternalTask } from "./Api";

const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"], ["#3b82f6", "#6366f1"], ["#8b5cf6", "#ec4899"],
    ["#06b6d4", "#6366f1"], ["#f59e0b", "#ef4444"], ["#10b981", "#3b82f6"],
    ["#f472b6", "#ec4899"], ["#8b5cf6", "#f59e0b"], ["#3b82f6", "#06b6d4"],
    ["#ef4444", "#f59e0b"],
];

export const STATUS_CONFIG: Record<InternalTaskStatus, { label: string; className: string }> = {
    in_progress: { label: "در حال انجام", className: "border-amber-500/20 bg-amber-500/10 text-amber-400" },
    completed: { label: "انجام شده", className: "border-blue-500/20 bg-blue-500/10 text-blue-400" },
    cancelled: { label: "لغو شده", className: "border-red-500/20 bg-red-500/10 text-red-400" },
};

type DeadlineUrgency = "overdue" | "critical" | "soon" | "normal" | null;

function getDeadlineUrgency(deadline?: string | null): DeadlineUrgency {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    const hours = diff / 3600000;
    if (diff < 0) return "overdue";
    if (hours <= 6) return "critical";
    if (hours <= 24) return "soon";
    return "normal";
}

const URGENCY_ACCENT = { overdue: "#ef4444", critical: "#f97316", soon: "#eab308" };
const URGENCY_LABEL = { overdue: "منقضی شده", critical: "فوری", soon: "امروز" };

interface StepDeadline {
    started_at: string | null;
    deadline: string | null;
}

function getGradient(id: number) {
    return AVATAR_GRADIENTS[Math.abs(id) % AVATAR_GRADIENTS.length];
}

function EmployeeChip({ employee, isDark }: { employee: EmployeeRef; isDark: boolean }) {
    const name = employee.full_name?.trim() || (employee as any).username?.trim();
    if (!name) return null;
    const gradient = getGradient(Number(employee.id) || 0);
    return (
        <div className="flex items-center gap-1.5 rounded-full py-0.5 pl-2 pr-0.5" style={{
            border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        }}>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold text-white"
                style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}>
                <UserRound size={11} />
            </span>
            <span className="text-[10.5px] font-bold" style={{ color: isDark ? "#d1d5db" : "#4b5563" }}>{name}</span>
        </div>
    );
}

interface SentTaskCardProps {
    task: InternalTask;
    index?: number;
    onUpdated?: (task: InternalTask) => void;
    onDelete?: (taskId: number) => Promise<boolean> | void | Promise<void>;
    isDeleting?: boolean;
}

function SentTaskCard({ task, index = 0, onDelete, onUpdated, isDeleting = false }: SentTaskCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const userId = useAuthStore((state) => state.userId);
    const [hovered, setHovered] = useState(false);
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [deadlineModalOpen, setDeadlineModalOpen] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [savingTime, setSavingTime] = useState(false);
    const [timeError, setTimeError] = useState<string | null>(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [actionModal, setActionModal] = useState<"complete" | "cancel" | null>(null);
    const [reopening, setReopening] = useState(false);
    const [stepDeadline, setStepDeadline] = useState<StepDeadline>({
        started_at: task.started_at ?? null, deadline: task.deadline ?? null,
    });
    const [, forceTick] = useState(0);

    const assignedEmployees: EmployeeRef[] = Array.isArray(task.assigned_to)
        ? task.assigned_to.filter((employee: any) => Boolean(employee?.full_name?.trim() || employee?.username?.trim()))
        : [];

    const status = (task.status as InternalTaskStatus) || "in_progress";
    const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.in_progress;
    const isActiveTask = !["completed", "cancelled", "sold"].includes(status);
    const latestAttachment = Array.isArray(task.attachments)
        ? task.attachments.reduce<InternalTask["attachments"][number] | null>(
            (latest, attachment) => !latest || Number(attachment.id) > Number(latest.id) ? attachment : latest, null)
        : null;
    const latestAttachmentAt = latestAttachment ? Date.parse(latestAttachment.created_at) : NaN;
    const taskUpdatedAt = Date.parse(task.updated_at);
    const hasResponse = isActiveTask && latestAttachment !== null && userId !== null &&
        Number(latestAttachment.uploaded_by) !== Number(userId) &&
        (Number.isNaN(taskUpdatedAt) || Number.isNaN(latestAttachmentAt) || latestAttachmentAt >= taskUpdatedAt - 10_000);
    const urgency = isActiveTask ? getDeadlineUrgency(stepDeadline.deadline) : null;
    const accent = urgency && urgency !== "normal" ? URGENCY_ACCENT[urgency] : null;

    useEffect(() => {
        setStepDeadline({ started_at: task.started_at ?? null, deadline: task.deadline ?? null });
    }, [task.started_at, task.deadline]);

    
    useVisibleInterval(
        () => forceTick((t) => t + 1),
        60000,
        Boolean(stepDeadline.deadline) && isActiveTask,
    );

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
            const { data } = await api.patch(
                `/tasks/api/v1/internal_task/${task.id}/deadline/patch/`,
                { started_at: startedAt, deadline }
            );
            const value = data?.data ?? data;
            const updatedStartedAt = value?.started_at ?? startedAt;
            const updatedDeadline = value?.deadline ?? deadline;
            setStepDeadline({ started_at: updatedStartedAt, deadline: updatedDeadline });
            onUpdated?.({ ...task, started_at: updatedStartedAt, deadline: updatedDeadline });
            setTimeModalOpen(false);
        } catch {
            setTimeError("خطا در ثبت بازه زمانی");
        } finally {
            setSavingTime(false);
        }
    }

    function closeConfirm() {
        if (deleting) return;
        setShowConfirm(false);
        setDeleteError(null);
    }

    const effectiveDeleting = deleting || isDeleting;

    async function handleReopen() {
        if (reopening) return;
        setReopening(true);
        try {
            const { data } = await reopenInternalTask(task.id);
            onUpdated?.(data);
        } finally {
            setReopening(false);
        }
    }

    return (
        <>
            <m.div
                layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, delay: index * 0.05 }}
                onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
                className="relative flex min-h-[130px] flex-col gap-3 overflow-hidden rounded-[2rem] p-4"
                style={{
                    border: accent ? `1px solid color-mix(in srgb, ${accent} 40%, transparent)` : isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
                    background: accent ? `color-mix(in srgb, ${accent} ${urgency === "overdue" ? 7 : urgency === "critical" ? 5 : 4}%, ${isDark ? "#111827" : "#fafafa"})` : isDark ? "rgba(255,255,255,0.02)" : "#fafafa",
                    opacity: effectiveDeleting ? 0.45 : 1, pointerEvents: effectiveDeleting ? "none" : undefined,
                    boxShadow: accent ? `0 0 0 1px color-mix(in srgb, ${accent} 15%, transparent), 0 4px 24px color-mix(in srgb, ${accent} 12%, transparent)` : isDark ? "0 2px 24px rgba(0,0,0,0.2)" : "0 2px 16px rgba(0,0,0,0.04)",
                    transition: "border-color .4s ease,background .4s ease,box-shadow .4s ease",
                }}
            >
                {urgency === "overdue" && (
                    <m.div className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
                        style={{ background: `linear-gradient(90deg,transparent,${accent},transparent)` }}
                        animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2.2, repeat: Infinity }} />
                )}

                <svg className="pointer-events-none absolute inset-0 h-full w-full">
                    <defs><linearGradient id={`borderGrad-internal-${task.id}`} x1="100%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient></defs>
                    <m.rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="30" ry="30"
                        fill="none" stroke={`url(#borderGrad-internal-${task.id})`} strokeWidth="1.5" pathLength="1"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={hovered ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                        transition={{ duration: 0.55 }} />
                </svg>

                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] font-bold ${statusConfig.className}`}>
                            <span className={`h-1.5 w-1.5 rounded-full bg-current ${status === "in_progress" ? "animate-pulse" : ""}`} />
                            {statusConfig.label}
                        </span>
                        {accent && (
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                                style={{ color: accent, background: `color-mix(in srgb, ${accent} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)` }}>
                                <m.span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }}
                                    animate={urgency !== "soon" ? { opacity: [1, .3, 1] } : undefined}
                                    transition={{ duration: 1.6, repeat: Infinity }} />
                                {URGENCY_LABEL[urgency as keyof typeof URGENCY_LABEL]}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => setChatOpen(true)}
                            className="flex h-7 w-7 items-center justify-center rounded-xl transition-colors"
                            style={{ background: isDark ? "rgba(99,102,241,.1)" : "rgba(99,102,241,.07)", color: isDark ? "#a5b4fc" : "#6366f1" }}
                            title="مشاهده گفتگو و فایل‌ها"><MessageSquareText size={11} /></button>
                        <button type="button" onClick={() => setDeadlineModalOpen(true)}
                            className="flex h-7 w-7 items-center justify-center rounded-xl transition-colors"
                            style={{ background: isDark ? "rgba(99,102,241,.1)" : "rgba(99,102,241,.07)", color: isDark ? "#a5b4fc" : "#6366f1" }}
                            title="مشاهده ددلاین"><CalendarClock size={11} /></button>
<button type="button" onClick={() => setTimeModalOpen(true)}
                            className="flex h-7 w-7 items-center justify-center rounded-xl transition-colors"
                            style={{ background: isDark ? "rgba(99,102,241,.1)" : "rgba(99,102,241,.07)", color: isDark ? "#a5b4fc" : "#6366f1" }}
                            title="تعیین بازه زمانی"><Clock size={11} /></button>
                        {onDelete && (
                            <button type="button" onClick={() => setShowConfirm(true)} disabled={effectiveDeleting}
                                className="flex h-7 w-7 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
                                style={{ background: isDark ? "rgba(239,68,68,.1)" : "rgba(239,68,68,.07)", color: "#ef4444" }}
                                title="حذف تسک">{effectiveDeleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}</button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <h3 className="text-[13.5px] font-extrabold leading-tight" style={{ color: isDark ? "#f3f4f6" : "#1f2937" }}>{task.title}</h3>
                    {task.description && <p className="line-clamp-2 text-[12px] leading-6" style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>{task.description}</p>}
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-2.5" style={{ borderColor: isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.05)" }}>
                    {assignedEmployees.length ? assignedEmployees.map(emp => <EmployeeChip key={`${emp.id}-${(emp as any).username ?? ""}`} employee={emp} isDark={isDark} />) : (
                        <div className="flex items-center gap-1.5 rounded-full py-0.5 pl-2 pr-0.5" style={{ border: isDark ? "1px solid rgba(255,255,255,.06)" : "1px solid rgba(0,0,0,.06)", background: isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.03)" }}>
                            <span className="flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}><UserRound size={11} /></span>
                            <span className="text-[10.5px] font-bold" style={{ color: isDark ? "#d1d5db" : "#4b5563" }}>بدون مسئول</span>
                        </div>
                    )}
                </div>

                {isActiveTask && hasResponse && (
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setActionModal("complete")} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-[10.5px] font-extrabold text-white transition-opacity hover:opacity-90"><CheckCircle2 size={13} />تأیید انجام</button>
                        <button type="button" onClick={() => setActionModal("cancel")} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 text-[10.5px] font-extrabold text-white transition-opacity hover:opacity-90"><Ban size={13} />لغو تیکت</button>
                    </div>
                )}

                {!isActiveTask && (
                    <button type="button" onClick={() => void handleReopen()} disabled={reopening}
                        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 text-[10.5px] font-extrabold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
                        {reopening ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}بازگشایی تیکت
                    </button>
                )}
            </m.div>

            <AnimatePresence>
                {showConfirm && (
                    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{ background: "rgba(0,0,0,.45)", backdropFilter: "blur(3px)" }} onClick={closeConfirm}>
                        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                            onClick={e => e.stopPropagation()} dir="rtl"
                            className="flex w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[.06] dark:bg-[#111827]">
                            <div className="flex items-center justify-between px-8 pb-6 pt-8">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10"><Trash2 size={15} className="text-red-500" /></div>
                                    <div><h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">حذف تیکت</h3><p className="mt-0.5 text-[11px] text-gray-400">این عملیات قابل بازگشت نیست</p></div>
                                </div>
                                <button type="button" onClick={closeConfirm} disabled={deleting} className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-white/[.05]"><X size={15} /></button>
                            </div>
                            <div className="px-8 pb-2">
                                <p className="text-[12.5px] font-semibold leading-6 text-gray-500 dark:text-gray-400">تیکت <span className="font-extrabold text-gray-900 dark:text-white">{task.title}</span> برای همیشه حذف خواهد شد.</p>
                                {deleteError && <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10"><ClipboardX size={14} className="mt-0.5 text-red-500" /><p className="text-[11.5px] font-semibold leading-5 text-red-500">{deleteError}</p></div>}
                            </div>
                            <div className="flex items-center gap-2 px-8 pb-8 pt-5">
                                <button type="button" onClick={closeConfirm} disabled={deleting} className="h-11 flex-1 rounded-full bg-gray-100 text-[13px] font-bold text-gray-600 dark:bg-white/[.05] dark:text-gray-300">انصراف</button>
                                <button type="button" onClick={handleDelete} disabled={deleting} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-red-600 text-[13px] font-bold text-white">{deleting ? <Loader size={14} className="animate-spin" /> : <><Trash2 size={13} />حذف کن</>}</button>
                            </div>
                        </m.div>
                    </m.div>
                )}
            </AnimatePresence>

            {actionModal && <InternalTaskActionModal isOpen action={actionModal} task={task} onClose={() => setActionModal(null)} onDone={updatedTask => { onUpdated?.(updatedTask); setActionModal(null); }} />}
            <TimeRangeModal open={timeModalOpen} initialStartedAt={stepDeadline.started_at} initialDeadline={stepDeadline.deadline} loading={savingTime} error={timeError} onClose={() => setTimeModalOpen(false)} onSubmit={handleTimeSubmit} />
            <InternalTaskDeadlineModal
                open={deadlineModalOpen}
                onClose={() => setDeadlineModalOpen(false)}
                taskId={task.id}
                taskTitle={task.title}
                onLoaded={(d) => setStepDeadline({ started_at: d.started_at, deadline: d.deadline })}
            />
            {chatOpen && <InternalTaskChatModal open={chatOpen} task={task} onClose={() => setChatOpen(false)} onUpdated={onUpdated || (() => { })} />}
        </>
    );
}

export default memo(SentTaskCard, (prev, next) =>
    prev.task === next.task && prev.index === next.index && prev.isDeleting === next.isDeleting
);