"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeftCircle,
    ArrowRightCircle,
    Layers3,
    ShoppingBag,
    XCircle,
    CalendarDays,
    Building2,
    CheckCircle2,
    Ban,
    RotateCcw,
    History,
    Loader2,
    MessageSquareText,
    ClipboardList,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import TaskNotesModal from "./TaskNotesModal";
import { toJalali, toPersianDigits, JALALI_MONTHS, pad2 } from "@/lib/jalali";
import { useEmployeeInfo } from "@/hooks/useEmployeeInfo";
import TaskActionModal from "./TaskActionModal";
import TaskLogsModal from "./TaskLogsModal";
import ActionBtn from "./ActionBtn";
import type { UserTask } from "./types";

interface TaskCardProps {
    task: UserTask;
    accent?: string;
    onUpdated: (task: UserTask) => void;
    isDragging?: boolean;
}

interface LatestLog {
    id: number;
    step: number;
    step_name: string;
    employee: number[];
    action: string;
    note: string;
    created_at: string;
    attachments: {
        id: number;
        file: string;
        original_file_name: string;
        uploaded_by: number;
        uploaded_by_username: string;
        created_at: string;
    }[];
}

type ModalType = "next" | "prev" | "sold" | "cancel" | "unsold" | "uncancel" | "uncomplete";

const modalMetaMap: Record<ModalType, { title: string; desc: string }> = {
    next: { title: "ارسال به مرحله بعد", desc: "تسک به مرحله بعدی منتقل می‌شود" },
    prev: { title: "برگشت به مرحله قبل", desc: "تسک به مرحله قبلی برمی‌گردد" },
    sold: { title: "ثبت فروش", desc: "این تسک به عنوان فروش رفته ثبت می‌شود" },
    cancel: { title: "لغو تسک", desc: "این تسک لغو خواهد شد" },
    unsold: { title: "لغو فروش", desc: "وضعیت تسک به در حال انجام برمی‌گردد" },
    uncancel: { title: "بازگشت از لغو", desc: "وضعیت تسک به در حال انجام برمی‌گردد" },
    uncomplete: { title: "بازگشت از تکمیل", desc: "وضعیت تسک به در حال انجام برمی‌گردد" },
};

const blockedMessage: Record<string, string> = {
    sold: "تسک فروش رفته — برای جابجایی ابتدا فروش را لغو کنید",
};

const LOG_ACTION_META: Record<string, { label: string; color: string; bg: string; icon: typeof History }> = {
    advanced: { label: "انتقال به بعد", color: "#6366f1", bg: "rgba(99,102,241,0.14)", icon: ArrowLeftCircle },
    reverted: { label: "بازگشت به قبل", color: "#ec4899", bg: "rgba(236,72,153,0.14)", icon: ArrowRightCircle },
    sold: { label: "فروش ثبت شد", color: "#f59e0b", bg: "rgba(245,158,11,0.14)", icon: ShoppingBag },
    unsold: { label: "فروش لغو شد", color: "#64748b", bg: "rgba(100,116,139,0.14)", icon: XCircle },
    cancelled: { label: "تسک لغو شد", color: "#ef4444", bg: "rgba(239,68,68,0.14)", icon: Ban },
    uncancelled: { label: "بازگشت از لغو", color: "#f87171", bg: "rgba(248,113,113,0.14)", icon: RotateCcw },
    completed: { label: "تسک تکمیل شد", color: "#10b981", bg: "rgba(16,185,129,0.14)", icon: CheckCircle2 },
    uncompleted: { label: "بازگشت از تکمیل", color: "#34d399", bg: "rgba(52,211,153,0.14)", icon: RotateCcw },
    created: { label: "ایجاد تسک", color: "#8b5cf6", bg: "rgba(139,92,246,0.14)", icon: ClipboardList },
};

function formatFaDate(date?: string) {
    if (!date) return "نامشخص";
    return new Date(date).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function formatJalaliShort(iso?: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    const [jy, jm, jd] = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)} - ${toPersianDigits(
        pad2(d.getHours())
    )}:${toPersianDigits(pad2(d.getMinutes()))}`;
}

function getStatusMeta(status: string) {
    switch (status) {
        case "completed":
            return {
                label: "تکمیل شده",
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
                dot: "bg-emerald-500",
                icon: CheckCircle2,
            };
        case "sold":
            return {
                label: "فروش رفته",
                color: "text-amber-500",
                bg: "bg-amber-500/10",
                dot: "bg-amber-500",
                icon: ShoppingBag,
            };
        case "cancelled":
            return {
                label: "لغو شده",
                color: "text-red-500",
                bg: "bg-red-500/10",
                dot: "bg-red-500",
                icon: Ban,
            };
        default:
            return {
                label: "در حال انجام",
                color: "text-indigo-500",
                bg: "bg-indigo-500/10",
                dot: "bg-indigo-500",
                icon: Layers3,
            };
    }
}

function logMetaOf(action: string) {
    return (
        LOG_ACTION_META[action] ?? {
            label: action || "ثبت رویداد",
            color: "#94a3b8",
            bg: "rgba(148,163,184,0.14)",
            icon: History,
        }
    );
}

function LatestLogAuthor({ employeeId }: { employeeId?: number }) {
    const { data, loading } = useEmployeeInfo(employeeId ?? 0);
    if (!employeeId) return <span className="font-bold">نامشخص</span>;
    if (loading) return <span className="font-bold">در حال دریافت...</span>;
    return (
        <span className="font-bold">
            {data?.full_name ?? data?.username ?? `کارمند ${toPersianDigits(employeeId)}`}
        </span>
    );
}

function parseBackendError(err: unknown): string {
    const e = err as { response?: { data?: unknown } };
    const data = e?.response?.data;
    if (!data) return "خطا در ثبت تغییرات";
    if (typeof data === "string") return data;
    if (Array.isArray(data)) return String(data[0]);
    if (typeof data === "object") {
        const first = Object.values(data as Record<string, unknown>)[0];
        if (Array.isArray(first)) return String(first[0]);
        if (typeof first === "string") return first;
    }
    return "خطا در ثبت تغییرات";
}

export default function UserTaskCard({ task, accent = "#6366f1", onUpdated, isDragging }: TaskCardProps) {
    const [openModal, setOpenModal] = useState<ModalType | null>(null);
    const [logsOpen, setLogsOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [blockMsg, setBlockMsg] = useState<string | null>(null);
    const [latestLog, setLatestLog] = useState<LatestLog | null>(null);
    const [notesOpen, setNotesOpen] = useState(false);
    const [logsLoading, setLogsLoading] = useState(true);

    const meta = useMemo(() => getStatusMeta(task.status), [task.status]);
    const isSold = task.status === "sold";
    const isCancelled = task.status === "cancelled";
    const isCompleted = task.status === "completed";
    const isActive = task.status === "in_progress";
    const StatusIcon = meta.icon;

    const fetchLatestLog = useCallback(() => {
        setLogsLoading(true);
        axiosInstance
            .get<LatestLog[]>(`/tasks/api/v1/tasks/${task.id}/logs/`)
            .then((res) => setLatestLog(res.data?.[0] ?? null))
            .catch(() => setLatestLog(null))
            .finally(() => setLogsLoading(false));
    }, [task.id]);

    useEffect(() => {
        fetchLatestLog();
    }, [fetchLatestLog]);

    async function submitAction(direction: ModalType, data: { note: string; files: File[] }) {
        setSubmitting(true);
        try {
            let updated: UserTask;
            if (direction === "sold") {
                const res = await axiosInstance.patch<{ status: string }>(
                    `/tasks/api/v1/tasks/${task.id}/mark-as-sold/`,
                    { status: "sold" }
                );
                updated = { ...task, status: res.data.status as UserTask["status"] };
            } else if (direction === "unsold" || direction === "uncancel" || direction === "uncomplete") {
                const res = await axiosInstance.put<UserTask>(`/tasks/api/v1/tasks/${task.id}/update/`, {
                    title: task.title,
                    description: task.description,
                    status: "in_progress",
                    assigned_employee: task.assigned_employee,
                });
                updated = { ...task, ...res.data };
            } else {
                const endpointMap = { next: "advance", prev: "revert", cancel: "cancel" } as const;
                const formData = new FormData();
                if (data.note.trim()) formData.append("note", data.note.trim());
                data.files.forEach((file) => formData.append("files", file));
                const res = await axiosInstance.post<UserTask>(
                    `/tasks/api/v1/tasks/${task.id}/${endpointMap[direction]}/`,
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );
                updated = { ...task, ...res.data };
            }
            onUpdated(updated);
            fetchLatestLog();
            setOpenModal(null);
        } catch (err) {
            throw new Error(parseBackendError(err));
        } finally {
            setSubmitting(false);
        }
    }

    function handleBlockedClick() {
        const message = blockedMessage[task.status];
        if (!message) return;
        setBlockMsg(message);
        setTimeout(() => setBlockMsg(null), 3000);
    }

    const latestMeta = latestLog ? logMetaOf(latestLog.action) : null;
    const LatestIcon = latestMeta?.icon;

    return (
        <>
            <motion.div
                layout
                className="group relative flex flex-col gap-0 overflow-hidden rounded-3xl select-none"
                style={{
                    opacity: isDragging ? 0.35 : 1,
                    background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    boxShadow: isDragging
                        ? `0 20px 60px rgba(0,0,0,0.4), 0 0 0 2px ${accent}60`
                        : "0 1px 3px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)",
                }}
            >
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}80)` }} />

                <div className="flex flex-col gap-3.5 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white leading-snug line-clamp-2 mb-2">
                                {task.title}
                            </h3>

                            <div className="flex items-center gap-2 flex-wrap">
                                <span
                                    className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-1 rounded-lg ${meta.bg} ${meta.color}`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                    {meta.label}
                                </span>

                                <span className="text-[10.5px] font-bold px-2 py-1 rounded-lg bg-white/5 text-gray-500">
                                    #{task.id}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => setLogsOpen(true)}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <History size={11} />
                                    تاریخچه
                                </button>
                            </div>
                        </div>

                        <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${accent}18` }}
                        >
                            <StatusIcon size={17} style={{ color: accent }} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <InfoCell icon={<Building2 size={11} />} label="دپارتمان" value={task.department_name || "نامشخص"} />
                        <InfoCell icon={<Layers3 size={11} />} label="مرحله" value={task.current_step_name || "نامشخص"} />
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-600">
                        <CalendarDays size={11} />
                        <span>{formatFaDate(task.created_at)}</span>
                    </div>

                    {logsLoading ? (
                        <div className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-[10.5px] font-semibold text-gray-400 bg-white/[0.02] border border-white/[0.05]">
                            <Loader2 size={12} className="animate-spin" />
                            در حال دریافت آخرین یادداشت...
                        </div>
                    ) : latestLog && latestMeta && LatestIcon ? (
                        <div
                            className="flex flex-col gap-2 rounded-2xl px-3 py-2.5"
                            style={{
                                background: `${latestMeta.color}12`,
                                border: `1px solid ${latestMeta.color}30`,
                            }}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
                                    style={{ background: latestMeta.bg, color: latestMeta.color }}
                                >
                                    <LatestIcon size={11} />
                                    {latestMeta.label}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500">
                                    {formatJalaliShort(latestLog.created_at)}
                                </span>
                            </div>

                            {latestLog.note && (
                                <div className="flex items-start gap-1.5">
                                    <MessageSquareText
                                        size={12}
                                        className="mt-0.5 shrink-0"
                                        style={{ color: latestMeta.color }}
                                    />
                                    <p className="text-[11px] font-semibold leading-5 text-gray-300 dark:text-gray-300">
                                        {latestLog.note}
                                    </p>
                                </div>
                            )}

                            <p className="text-[10px] font-semibold text-gray-400">
                                ثبت‌کننده: <LatestLogAuthor employeeId={latestLog.employee?.[0]} />
                            </p>
                        </div>
                    ) : null}

                    {blockMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-[11px] font-bold text-center py-2 px-3 rounded-xl bg-orange-500/10 text-orange-400"
                        >
                            {blockMsg}
                        </motion.div>
                    )}

                    <div
                        className="flex flex-col gap-1.5 pt-1 border-t border-white/5"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        {isCancelled ? (
                            <ActionBtn
                                rippleKey={`uncancel-${task.id}`}
                                active={false}
                                onClick={() => setOpenModal("uncancel")}
                                color="red"
                                icon={<RotateCcw size={13} />}
                                label="بازگشت از لغو"
                                full
                            />
                        ) : isCompleted ? (
                            <ActionBtn
                                rippleKey={`uncomplete-${task.id}`}
                                active={false}
                                onClick={() => setOpenModal("uncomplete")}
                                color="emerald"
                                icon={<RotateCcw size={13} />}
                                label="بازگشت از تکمیل"
                                full
                            />
                        ) : isSold ? (
                            <div className="flex flex-col gap-1.5">
                                <ActionBtn
                                    rippleKey={`unsold-${task.id}`}
                                    active={false}
                                    onClick={() => setOpenModal("unsold")}
                                    color="amber"
                                    icon={<XCircle size={13} />}
                                    label="لغو فروش"
                                    full
                                />
                                <div className="grid grid-cols-2 gap-1.5 opacity-40 pointer-events-none">
                                    <button
                                        type="button"
                                        className="h-8 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-bold text-pink-400 bg-pink-500/5 cursor-not-allowed"
                                    >
                                        <ArrowRightCircle size={13} />
                                        مرحله قبل
                                    </button>
                                    <button
                                        type="button"
                                        className="h-8 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-bold text-indigo-400 bg-indigo-500/5 cursor-not-allowed"
                                    >
                                        <ArrowLeftCircle size={13} />
                                        مرحله بعد
                                    </button>
                                </div>
                            </div>
                        ) : isActive ? (
                            <>
                                <ActionBtn
                                    rippleKey={`next-${task.id}`}
                                    active={false}
                                    onClick={() => setOpenModal("next")}
                                    color="accent"
                                    accentColor={accent}
                                    icon={<ArrowLeftCircle size={13} />}
                                    label="انتقال به مرحله بعد"
                                    full
                                />

                                <div className="grid grid-cols-3 gap-1.5">
                                    <ActionBtn
                                        rippleKey={`prev-${task.id}`}
                                        active={false}
                                        onClick={() => setOpenModal("prev")}
                                        color="pink"
                                        icon={<ArrowRightCircle size={13} />}
                                        label="قبل"
                                        full
                                    />
                                    <ActionBtn
                                        rippleKey={`sold-${task.id}`}
                                        active={false}
                                        onClick={() => setOpenModal("sold")}
                                        color="amber"
                                        icon={<ShoppingBag size={13} />}
                                        label="فروش"
                                        full
                                    />
                                    <ActionBtn
                                        rippleKey={`cancel-${task.id}`}
                                        active={false}
                                        onClick={() => setOpenModal("cancel")}
                                        color="red"
                                        icon={<XCircle size={13} />}
                                        label="لغو"
                                        full
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setNotesOpen(true)}
                                    className="w-full rounded-xl flex items-center justify-center gap-1.5 p-3 text-[11px] font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-colors"
                                >
                                    <MessageSquareText size={13} />
                                    مشاهده همه یادداشت‌ها، فایل‌ها و ثبت‌کنندگان
                                </button>
                            </>
                        ) : null}
                    </div>
                </div>
            </motion.div>

            {(["next", "prev", "sold", "cancel", "unsold", "uncancel", "uncomplete"] as const).map((direction) => (
                <TaskActionModal
                    key={direction}
                    isOpen={openModal === direction}
                    onClose={() => setOpenModal(null)}
                    direction={direction}
                    title={modalMetaMap[direction].title}
                    description={modalMetaMap[direction].desc}
                    onSubmit={(data) => submitAction(direction, data)}
                    submitting={submitting}
                />
            ))}

            <TaskLogsModal isOpen={logsOpen} onClose={() => setLogsOpen(false)} taskId={task.id} taskTitle={task.title} />
            <TaskNotesModal isOpen={notesOpen} onClose={() => setNotesOpen(false)} taskId={task.id} taskTitle={task.title} />
        </>
    );
}

function InfoCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-2xl p-2.5 bg-white/[0.03] border border-white/[0.05]">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1">
                {icon}
                {label}
            </div>
            <p className="text-[12px] font-bold text-gray-800 dark:text-gray-100 truncate">{value}</p>
        </div>
    );
}