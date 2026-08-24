"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    AlarmClock,
    ArrowLeftCircle,
    ArrowRightCircle,
    Ban,
    Building2,
    CalendarDays,
    CheckCircle2,
    Clock3,
    History,
    Layers3,
    Loader2,
    MessageSquareText,
    RotateCcw,
    ShoppingBag,
    XCircle,
    ClipboardList,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import TaskNotesModal from "./TaskNotesModal";
import TaskActionModal from "./TaskActionModal";
import TaskLogsModal from "./TaskLogsModal";
import ActionBtn from "./ActionBtn";
import { toJalali, toPersianDigits, JALALI_MONTHS, pad2 } from "@/lib/jalali";
import { useEmployeeInfo } from "@/hooks/useEmployeeInfo";
import type { UserTask } from "./types";

interface TaskWithSchedule extends UserTask {
    started_at?: string | null;
    deadline?: string | null;
    due_date?: string | null;
    customer_name?: string | null;
    customer_phone?: string | null;
}

interface TaskCardProps {
    task: UserTask;
    accent?: string;
    onUpdated: (task: UserTask) => void;
    isDragging?: boolean;
}

interface DeadlineResponse {
    started_at: string | null;
    deadline: string | null;
}

interface CaseResponse {
    customer: number;
    customer_name?: string | null;
}

interface CustomerResponse {
    full_name?: string | null;
    name?: string | null;
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

type ModalType =
    | "next"
    | "prev"
    | "sold"
    | "cancel"
    | "unsold"
    | "uncancel"
    | "uncomplete";

const modalMetaMap: Record<ModalType, { title: string; desc: string }> = {
    next: {
        title: "ارسال به مرحله بعد",
        desc: "تسک به مرحله بعدی منتقل می‌شود",
    },
    prev: {
        title: "برگشت به مرحله قبل",
        desc: "تسک به مرحله قبلی برمی‌گردد",
    },
    sold: {
        title: "ثبت فروش",
        desc: "این تسک به عنوان فروش رفته ثبت می‌شود",
    },
    cancel: {
        title: "لغو تسک",
        desc: "این تسک لغو خواهد شد",
    },
    unsold: {
        title: "لغو فروش",
        desc: "وضعیت تسک به در حال انجام برمی‌گردد",
    },
    uncancel: {
        title: "بازگشت از لغو",
        desc: "وضعیت تسک به در حال انجام برمی‌گردد",
    },
    uncomplete: {
        title: "بازگشت از تکمیل",
        desc: "وضعیت تسک به در حال انجام برمی‌گردد",
    },
};

const LOG_ACTION_META: Record<
    string,
    {
        label: string;
        color: string;
        bg: string;
        icon: typeof History;
    }
> = {
    advanced: {
        label: "انتقال به بعد",
        color: "#6366f1",
        bg: "rgba(99,102,241,0.14)",
        icon: ArrowLeftCircle,
    },
    reverted: {
        label: "بازگشت به قبل",
        color: "#ec4899",
        bg: "rgba(236,72,153,0.14)",
        icon: ArrowRightCircle,
    },
    sold: {
        label: "فروش ثبت شد",
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.14)",
        icon: ShoppingBag,
    },
    unsold: {
        label: "فروش لغو شد",
        color: "#64748b",
        bg: "rgba(100,116,139,0.14)",
        icon: XCircle,
    },
    cancelled: {
        label: "تسک لغو شد",
        color: "#ef4444",
        bg: "rgba(239,68,68,0.14)",
        icon: Ban,
    },
    uncancelled: {
        label: "بازگشت از لغو",
        color: "#f87171",
        bg: "rgba(248,113,113,0.14)",
        icon: RotateCcw,
    },
    completed: {
        label: "تسک تکمیل شد",
        color: "#10b981",
        bg: "rgba(16,185,129,0.14)",
        icon: CheckCircle2,
    },
    uncompleted: {
        label: "بازگشت از تکمیل",
        color: "#34d399",
        bg: "rgba(52,211,153,0.14)",
        icon: RotateCcw,
    },
    created: {
        label: "ایجاد تسک",
        color: "#8b5cf6",
        bg: "rgba(139,92,246,0.14)",
        icon: ClipboardList,
    },
};

function formatFaDate(date?: string) {
    if (!date) return "نامشخص";
    return new Date(date).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function formatJalali(value?: string | null) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const [jy, jm, jd] = toJalali(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    ) as [number, number, number];
    return {
        full: `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`,
        short: `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]}`,
        time: `${toPersianDigits(pad2(date.getHours()))}:${toPersianDigits(pad2(date.getMinutes()))}`,
    };
}

function formatJalaliShort(value?: string | null) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
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
            color: "text-gray-400 dark:text-white/35",
            background: "bg-gray-100 dark:bg-white/[0.05]",
            icon: Clock3,
        };
    }
    const target = new Date(deadline).getTime();
    const now = Date.now();
    const diff = target - now;
    const hours = diff / (1000 * 60 * 60);
    if (diff < 0) {
        return {
            label: "منقضی شده",
            color: "text-red-500 dark:text-red-400",
            background: "bg-red-50 dark:bg-red-500/10",
            icon: AlarmClock,
        };
    }
    if (hours <= 24) {
        return {
            label: "فوری",
            color: "text-amber-600 dark:text-amber-400",
            background: "bg-amber-50 dark:bg-amber-500/10",
            icon: AlarmClock,
        };
    }
    return {
        label: "در زمانبندی",
        color: "text-emerald-600 dark:text-emerald-400",
        background: "bg-emerald-50 dark:bg-emerald-500/10",
        icon: CheckCircle2,
    };
}

function getStatusMeta(status: string) {
    switch (status) {
        case "completed":
            return {
                label: "تکمیل شده",
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
                dot: "bg-emerald-500",
            };
        case "sold":
            return {
                label: "فروش رفته",
                color: "text-amber-500",
                bg: "bg-amber-500/10",
                dot: "bg-amber-500",
            };
        case "cancelled":
            return {
                label: "لغو شده",
                color: "text-red-500",
                bg: "bg-red-500/10",
                dot: "bg-red-500",
            };
        default:
            return {
                label: "در حال انجام",
                color: "text-indigo-500",
                bg: "bg-indigo-500/10",
                dot: "bg-indigo-500",
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

function InfoRow({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: React.ReactNode;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
    return (
        <div className="flex items-baseline gap-1.5 text-[11px]">
            {Icon && (
                <Icon
                    size={11}
                    className="mt-0.5 shrink-0 text-gray-400 dark:text-white/30"
                />
            )}
            <span className="shrink-0 font-semibold text-gray-400 dark:text-white/35">
                {label}:
            </span>
            <span className="truncate font-bold text-gray-700 dark:text-white/80">
                {value}
            </span>
        </div>
    );
}

function LatestLogAuthor({ employeeId }: { employeeId?: number }) {
    const { data, loading } = useEmployeeInfo(employeeId ?? 0);
    if (!employeeId) {
        return <span className="font-bold">نامشخص</span>;
    }
    if (loading) {
        return <span className="font-bold">در حال دریافت...</span>;
    }
    return (
        <span className="font-bold">
            {data?.full_name ??
                data?.username ??
                `کارمند ${toPersianDigits(employeeId)}`}
        </span>
    );
}

function parseBackendError(err: unknown): string {
    const error = err as { response?: { data?: unknown } };
    const data = error?.response?.data;
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

export default function UserTaskCard({
    task,
    accent = "#6366f1",
    onUpdated,
    isDragging,
}: TaskCardProps) {
    const taskExt = task as TaskWithSchedule;

    const [openModal, setOpenModal] = useState<ModalType | null>(null);
    const [logsOpen, setLogsOpen] = useState(false);
    const [notesOpen, setNotesOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [blockMsg, setBlockMsg] = useState<string | null>(null);
    const [latestLog, setLatestLog] = useState<LatestLog | null>(null);
    const [logsLoading, setLogsLoading] = useState(true);
    const [customerName, setCustomerName] = useState<string | null>(
        taskExt.customer_name ?? null
    );

    const [schedule, setSchedule] = useState<DeadlineResponse>({
        started_at: taskExt.started_at ?? null,
        deadline: taskExt.deadline ?? taskExt.due_date ?? null,
    });

    const meta = useMemo(() => getStatusMeta(task.status), [task.status]);

    const isSold = task.status === "sold";
    const isCancelled = task.status === "cancelled";
    const isCompleted = task.status === "completed";
    const isActive = task.status === "in_progress";

    const deadlineDate = formatJalali(schedule.deadline);
    const startedDate = formatJalali(schedule.started_at);
    const deadlineState = getDeadlineState(schedule.deadline);
    const DeadlineIcon = deadlineState.icon;

    const latestMeta = latestLog ? logMetaOf(latestLog.action) : null;
    const LatestIcon = latestMeta?.icon;

    const fetchLatestLog = useCallback(() => {
        setLogsLoading(true);
        axiosInstance
            .get<LatestLog[]>(`/tasks/api/v1/tasks/${task.id}/logs/`)
            .then((response) => {
                setLatestLog(response.data?.[0] ?? null);
            })
            .catch(() => {
                setLatestLog(null);
            })
            .finally(() => {
                setLogsLoading(false);
            });
    }, [task.id]);

    useEffect(() => {
        fetchLatestLog();
    }, [fetchLatestLog]);

    useEffect(() => {
        const taskId = Number(task.id);
        const stepId = Number(task.current_step);
        if (!taskId || !stepId) return;
        axiosInstance
            .get<DeadlineResponse>(
                `/tasks/api/v1/tasks/${taskId}/steps/${stepId}/deadline/`
            )
            .then((response) => {
                setSchedule({
                    started_at: response.data?.started_at ?? null,
                    deadline: response.data?.deadline ?? null,
                });
            })
            .catch(() => undefined);
    }, [task.id, task.current_step]);

    useEffect(() => {
        const caseId = taskExt.case;
        if (!caseId || customerName) return;

        axiosInstance
            .get<CaseResponse>(`/tasks/api/v1/cases/${caseId}/`)
            .then(({ data: caseData }) => {
                if (caseData.customer_name) {
                    setCustomerName(caseData.customer_name);
                    return null;
                }
                if (caseData.customer) {
                    return axiosInstance.get<CustomerResponse>(
                        `/customers/api/v1/customers/${caseData.customer}/`
                    );
                }
                return null;
            })
            .then((res) => {
                if (res?.data) {
                    setCustomerName(res.data.full_name ?? res.data.name ?? null);
                }
            })
            .catch(() => undefined);
    }, [taskExt.case, customerName]);

    async function syncCustomerToActive() {
        const caseId = taskExt.case;
        if (!caseId) return;
        try {
            const { data: caseData } = await axiosInstance.get<CaseResponse>(
                `/tasks/api/v1/cases/${caseId}/`
            );
            if (!caseData.customer) return;
            await axiosInstance.patch(
                `/customers/api/v1/customers/${caseData.customer}/update/`,
                { status: 2 }
            );
        } catch {
            setBlockMsg("مشتری آپدیت نشد، بعدا دستی چک کن");
        }
    }

    async function markAsSold(): Promise<UserTask> {
        const { data } = await axiosInstance.patch<{ status: string }>(
            `/tasks/api/v1/tasks/${task.id}/mark-as-sold/`,
            { status: "sold" }
        );
        await syncCustomerToActive();
        return {
            ...task,
            status: data.status as UserTask["status"],
        };
    }

    async function resetToInProgress(): Promise<UserTask> {
        const { data } = await axiosInstance.put<UserTask>(
            `/tasks/api/v1/tasks/${task.id}/update/`,
            {
                title: task.title,
                description: task.description,
                status: "in_progress",
                assigned_employee: task.assigned_employee,
            }
        );
        return { ...task, ...data };
    }

    async function advanceRevertOrCancel(
        direction: "next" | "prev" | "cancel",
        data: { note: string; files: File[] }
    ): Promise<UserTask> {
        const endpoint =
            direction === "next"
                ? "advance"
                : direction === "prev"
                    ? "revert"
                    : "cancel";

        const formData = new FormData();
        if (data.note.trim()) {
            formData.append("note", data.note.trim());
        }
        data.files.forEach((file) => {
            formData.append("files", file);
        });

        const { data: responseData } = await axiosInstance.post<UserTask>(
            `/tasks/api/v1/tasks/${task.id}/${endpoint}/`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
        return { ...task, ...responseData };
    }

    async function submitAction(
        direction: ModalType,
        data: { note: string; files: File[] }
    ) {
        setSubmitting(true);
        setBlockMsg(null);
        try {
            let updated: UserTask;
            switch (direction) {
                case "sold":
                    updated = await markAsSold();
                    break;
                case "unsold":
                case "uncancel":
                case "uncomplete":
                    updated = await resetToInProgress();
                    break;
                default:
                    updated = await advanceRevertOrCancel(direction, data);
            }
            onUpdated(updated);
            fetchLatestLog();
            setOpenModal(null);
        } catch (error) {
            throw new Error(parseBackendError(error));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <motion.div
                layout
                className="group relative flex flex-col gap-0 overflow-hidden rounded-[1.8rem] border border-gray-100 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.035)] transition-all duration-300 select-none hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] dark:border-white/[0.07] dark:bg-[#111a2d] dark:shadow-none"
                style={{ opacity: isDragging ? 0.35 : 1 }}
            >
                <div
                    className="absolute inset-y-0 right-0 w-1"
                    style={{
                        background: `linear-gradient(180deg, ${accent}, ${accent}45)`,
                    }}
                />

                <div className="mb-3 flex items-center justify-between gap-2 pl-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span
                            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${deadlineState.background} ${deadlineState.color}`}
                        >
                            <DeadlineIcon size={10} />
                            {deadlineState.label}
                        </span>

                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${meta.bg} ${meta.color}`}
                        >
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setLogsOpen(true)}
                        onPointerDown={(event) => event.stopPropagation()}
                        className="inline-flex h-7 items-center gap-1 rounded-xl bg-gray-50 px-2 text-[10px] font-extrabold text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:bg-white/[0.05] dark:text-white/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                    >
                        <History size={11} />
                        تاریخچه
                    </button>
                </div>

                <h3 className="line-clamp-2 text-[14px] font-extrabold leading-snug text-gray-900 dark:text-white">
                    {task.title}
                </h3>

                {task.description && (
                    <p className="mt-1.5 line-clamp-2 text-[11.5px] font-medium leading-5 text-gray-400 dark:text-white/40">
                        {task.description}
                    </p>
                )}

                <div className="mt-3 flex flex-col gap-1.5 rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
                    {customerName && (
                        <InfoRow
                            label="نام مشتری"
                            value={customerName}
                            icon={Building2}
                        />
                    )}

                    {task.current_step_name && (
                        <InfoRow
                            label="مرحله جاری"
                            value={task.current_step_name}
                            icon={Layers3}
                        />
                    )}

                    {task.department_name && (
                        <InfoRow
                            label="دپارتمان"
                            value={task.department_name}
                            icon={Building2}
                        />
                    )}

                    <InfoRow
                        label="تاریخ ثبت"
                        value={formatFaDate(task.created_at)}
                        icon={CalendarDays}
                    />
                </div>

                <div className="mt-3.5 flex flex-col gap-2.5">
                    {deadlineDate ? (
                        <div className="flex items-center justify-between gap-2 rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
                            <div className="flex min-w-0 items-center gap-2 text-gray-500 dark:text-white/45">
                                <CalendarDays size={13} />
                                <div className="min-w-0">
                                    <p className="text-[9.5px] font-bold">مهلت انجام</p>
                                    <p className={`mt-0.5 text-[11px] font-extrabold ${deadlineState.color}`}>
                                        {deadlineDate.full} · {deadlineDate.time}
                                    </p>
                                </div>
                            </div>

                            {startedDate && (
                                <div className="border-r border-gray-200 pr-2 text-left dark:border-white/[0.08]">
                                    <p className="text-[9px] font-bold text-gray-400">شروع</p>
                                    <p className="mt-0.5 text-[10px] font-bold text-gray-500 dark:text-white/50">
                                        {startedDate.short}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-600">
                            <CalendarDays size={12} />
                            <span>ایجاد: {formatFaDate(task.created_at)}</span>
                        </div>
                    )}

                    {logsLoading ? (
                        <div className="flex items-center gap-2 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-[10.5px] font-semibold text-gray-400">
                            <Loader2 size={12} className="animate-spin" />
                            در حال دریافت آخرین یادداشت...
                        </div>
                    ) : latestLog && latestMeta && LatestIcon ? (
                        <div
                            className="flex flex-col gap-1.5 rounded-2xl p-2.5"
                            style={{
                                background: `${latestMeta.color}0a`,
                                border: `1px solid ${latestMeta.color}25`,
                            }}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span
                                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold"
                                    style={{
                                        background: latestMeta.bg,
                                        color: latestMeta.color,
                                    }}
                                >
                                    <LatestIcon size={10} />
                                    {latestMeta.label}
                                </span>

                                <span className="text-[9.5px] font-semibold text-slate-500">
                                    {formatJalaliShort(latestLog.created_at)}
                                </span>
                            </div>

                            {latestLog.note && (
                                <p className="line-clamp-2 text-[11px] font-medium leading-5 text-gray-600 dark:text-gray-300">
                                    {latestLog.note}
                                </p>
                            )}

                            <p className="text-[9.5px] font-semibold text-gray-400">
                                ثبت‌کننده:{" "}
                                <LatestLogAuthor employeeId={latestLog.employee?.[0]} />
                            </p>
                        </div>
                    ) : null}

                    {blockMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-xl bg-orange-500/10 px-3 py-2 text-center text-[11px] font-bold text-orange-400"
                        >
                            {blockMsg}
                        </motion.div>
                    )}
                </div>

                <div
                    className="mt-4 flex flex-col gap-1.5 border-t border-gray-100 pt-3 dark:border-white/[0.06]"
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
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

                            <div className="pointer-events-none grid grid-cols-2 gap-1.5 opacity-40">
                                <button
                                    type="button"
                                    className="flex h-8 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-pink-500/5 text-[11px] font-bold text-pink-400"
                                >
                                    <ArrowRightCircle size={13} />
                                    مرحله قبل
                                </button>

                                <button
                                    type="button"
                                    className="flex h-8 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-indigo-500/5 text-[11px] font-bold text-indigo-400"
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
                                className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-50 text-[10.5px] font-extrabold text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                            >
                                <MessageSquareText size={13} />
                                یادداشت‌ها و فایل‌ها
                            </button>
                        </>
                    ) : null}
                </div>
            </motion.div>

            {(
                [
                    "next",
                    "prev",
                    "sold",
                    "cancel",
                    "unsold",
                    "uncancel",
                    "uncomplete",
                ] as ModalType[]
            ).map((direction) => (
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

            <TaskLogsModal
                isOpen={logsOpen}
                onClose={() => setLogsOpen(false)}
                taskId={task.id}
                taskTitle={task.title}
            />

            <TaskNotesModal
                isOpen={notesOpen}
                onClose={() => setNotesOpen(false)}
                taskId={task.id}
                taskTitle={task.title}
            />
        </>
    );
}