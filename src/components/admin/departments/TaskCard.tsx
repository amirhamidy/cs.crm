"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlarmClock,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FileText,
    FolderKanban,
    Loader2,
    MessageSquareText,
    MoreHorizontal,
    Pencil,
    Trash2,
    UsersRound,
    X,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import {
    JALALI_MONTHS,
    pad2,
    toJalali,
    toPersianDigits,
} from "@/lib/jalali";
import type { Employee, Task } from "./types";
import TaskAssignees from "./TaskAssignees";
import TimeRangeModal from "@/components/customcomponents/tasks/TimeRangeModal";
import AdminTaskNotesModal from "@/components/customcomponents/tasks/AdminTaskNotesModal";

type TaskWithStep = Omit<Task, "current_step" | "assigned_employee"> & {
    current_step?: number | string | { id: number | string } | null;
    current_step_name?: string;
    department_name?: string;
    assigned_employee?:
    | number
    | string
    | { id: number | string }
    | Array<number | string | { id: number | string }>
    | null;
    case?:
    | string
    | number
    | {
        id?: number | string;
        title?: string;
        name?: string;
    }
    | null;
    case_name?: string;
    attachments?: unknown[];
    files?: unknown[];
    started_at?: string | null;
    deadline?: string | null;
};

interface TaskCardProps {
    task: TaskWithStep;
    accent?: string;
    index?: number;
    deleting?: boolean;
    employees?: Employee[];
    canManageDeadline?: boolean;
    onEdit?: (task: Task) => void;
    onDelete?: (taskId: number) => Promise<boolean | void> | boolean | void;
    onUpdated?: (task: Task) => void;
    onReorder?: (dragIndex: number, hoverIndex: number) => void;
}

interface DeadlineResponse {
    started_at: string | null;
    deadline: string | null;
}

const getRelationId = (value: unknown): number | null => {
    if (value === null || value === undefined) return null;

    if (typeof value === "object" && "id" in value) {
        const id = (value as { id?: unknown }).id;
        const normalized = Number(id);
        return Number.isFinite(normalized) ? normalized : null;
    }

    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : null;
};

const getAssigneeIds = (value: TaskWithStep["assigned_employee"]) => {
    if (!value) return [];

    const values = Array.isArray(value) ? value : [value];

    return values
        .map(getRelationId)
        .filter((id): id is number => id !== null);
};

const formatJalali = (value?: string | null) => {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return null;

    const [jy, jm, jd] = toJalali(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    );

    return {
        full: `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`,
        short: `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]}`,
        time: `${toPersianDigits(pad2(date.getHours()))}:${toPersianDigits(
            pad2(date.getMinutes())
        )}`,
    };
};

const getDeadlineState = (deadline?: string | null) => {
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
        label: "در زمان‌بندی",
        color: "text-emerald-600 dark:text-emerald-400",
        background: "bg-emerald-50 dark:bg-emerald-500/10",
        icon: CheckCircle2,
    };
};

const getStatusMeta = (status?: string) => {
    const normalized = status?.toLowerCase().trim();

    if (
        ["completed", "complete", "done", "finished", "تکمیل شده"].includes(
            normalized ?? ""
        )
    ) {
        return {
            label: "تکمیل شده",
            color: "text-emerald-600 dark:text-emerald-400",
            background: "bg-emerald-50 dark:bg-emerald-500/10",
        };
    }

    if (
        ["cancelled", "canceled", "لغو شده", "لغو"].includes(
            normalized ?? ""
        )
    ) {
        return {
            label: "لغو شده",
            color: "text-red-500 dark:text-red-400",
            background: "bg-red-50 dark:bg-red-500/10",
        };
    }

    if (
        ["pending", "waiting", "در انتظار"].includes(normalized ?? "")
    ) {
        return {
            label: "در انتظار",
            color: "text-amber-600 dark:text-amber-400",
            background: "bg-amber-50 dark:bg-amber-500/10",
        };
    }

    return {
        label: "در حال انجام",
        color: "text-indigo-600 dark:text-indigo-400",
        background: "bg-indigo-50 dark:bg-indigo-500/10",
    };
};

export default function TaskCard({
    task,
    accent = "#6366f1",
    index = 0,
    deleting = false,
    employees,
    canManageDeadline = true,
    onEdit,
    onDelete,
    onUpdated,
}: TaskCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deadlineLoading, setDeadlineLoading] = useState(false);
    const [deadlineError, setDeadlineError] = useState<string | null>(null);
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [notesModalOpen, setNotesModalOpen] = useState(false);
    const [schedule, setSchedule] = useState<DeadlineResponse>({
        started_at: task.started_at ?? null,
        deadline: task.deadline ?? task.due_date ?? null,
    });

    const taskId = getRelationId(task.id);
    const stepId = getRelationId(task.current_step);

    const assigneeIds = useMemo(
        () => getAssigneeIds(task.assigned_employee),
        [task.assigned_employee]
    );

    const deadlineDate = formatJalali(schedule.deadline);
    const startedDate = formatJalali(schedule.started_at);
    const createdDate = formatJalali(task.created_at);
    const statusMeta = getStatusMeta(task.status);
    const deadlineState = getDeadlineState(schedule.deadline);
    const DeadlineIcon = deadlineState.icon;

    const caseTitle =
        typeof task.case === "object" && task.case !== null
            ? task.case.title || task.case.name
            : task.case_name;

    const filesCount =
        (Array.isArray(task.attachments) ? task.attachments.length : 0) +
        (Array.isArray(task.files) ? task.files.length : 0);

    useEffect(() => {
        setSchedule({
            started_at: task.started_at ?? null,
            deadline: task.deadline ?? task.due_date ?? null,
        });
    }, [task.started_at, task.deadline, task.due_date]);

    useEffect(() => {
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
    }, [stepId, taskId]);

    const handleDelete = async () => {
        if (!taskId || !onDelete) return;

        setDeleteLoading(true);

        try {
            await onDelete(taskId);
            setConfirmDelete(false);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleTimeSubmit = async (startedAt: string, deadline: string) => {
        if (!taskId || !stepId) {
            setDeadlineError("اطلاعات مرحلهٔ تسک معتبر نیست");
            return;
        }

        setDeadlineLoading(true);
        setDeadlineError(null);

        try {
            await axiosInstance.patch(
                `/tasks/api/v1/tasks/${taskId}/steps/${stepId}/deadline/patch/`,
                {
                    started_at: startedAt,
                    deadline,
                }
            );

            const nextSchedule = {
                started_at: startedAt,
                deadline,
            };

            setSchedule(nextSchedule);
            setTimeModalOpen(false);

            onUpdated?.({
                ...task,
                started_at: startedAt,
                deadline,
                due_date: deadline,
            } as Task);
        } catch {
            setDeadlineError("ذخیرهٔ بازهٔ زمانی انجام نشد، دوباره تلاش کن");
        } finally {
            setDeadlineLoading(false);
        }
    };

    return (
        <>
            <motion.article
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.28,
                    delay: Math.min(index * 0.04, 0.2),
                }}
                className="group relative overflow-hidden rounded-[1.8rem] border border-gray-100 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.035)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] dark:border-white/[0.07] dark:bg-[#111a2d] dark:shadow-none"
            >
                <div
                    className="absolute inset-y-0 right-0 w-1"
                    style={{
                        background: `linear-gradient(180deg, ${accent}, ${accent}45)`,
                    }}
                />

                <div className="mb-3 flex items-start justify-between gap-3 pl-1">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                        <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusMeta.background} ${statusMeta.color}`}
                        >
                            {statusMeta.label}
                        </span>

                        <span
                            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${deadlineState.background} ${deadlineState.color}`}
                        >
                            <DeadlineIcon size={10} />
                            {deadlineState.label}
                        </span>
                    </div>

                    <div className="relative shrink-0">
                        <button
                            type="button"
                            onClick={() => setMenuOpen((current) => !current)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:bg-white/[0.05] dark:text-white/40 dark:hover:bg-white/[0.1] dark:hover:text-white"
                        >
                            <MoreHorizontal size={17} />
                        </button>

                        <AnimatePresence>
                            {menuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.94, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.94, y: -4 }}
                                    className="absolute left-0 top-10 z-20 min-w-[145px] rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl dark:border-white/[0.08] dark:bg-[#172137]"
                                >
                                    {onEdit && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMenuOpen(false);
                                                onEdit(task as Task);
                                            }}
                                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-right text-[11px] font-bold text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-white/65 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                                        >
                                            <Pencil size={13} />
                                            ویرایش تسک
                                        </button>
                                    )}

                                    {onDelete && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMenuOpen(false);
                                                setConfirmDelete(true);
                                            }}
                                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-right text-[11px] font-bold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                                        >
                                            <Trash2 size={13} />
                                            حذف تسک
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <h3 className="line-clamp-2 text-[14px] font-extrabold leading-6 text-gray-900 dark:text-white">
                    {task.title || task.name || "تسک بدون عنوان"}
                </h3>

                {task.description && (
                    <p className="mt-2 line-clamp-2 text-[11.5px] font-medium leading-5 text-gray-400 dark:text-white/40">
                        {task.description}
                    </p>
                )}

                <div className="mt-4 flex flex-col gap-2.5">
                    {(task.department_name || caseTitle) && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {task.department_name && (
                                <div className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-2.5 py-1.5 text-[10px] font-bold text-gray-500 dark:bg-white/[0.04] dark:text-white/45">
                                    <FolderKanban size={11} />
                                    <span className="max-w-[130px] truncate">
                                        {task.department_name}
                                    </span>
                                </div>
                            )}

                            {caseTitle && (
                                <div className="flex items-center gap-1.5 rounded-xl bg-violet-50 px-2.5 py-1.5 text-[10px] font-bold text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                                    <FileText size={11} />
                                    <span className="max-w-[130px] truncate">
                                        {caseTitle}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {deadlineDate && (
                        <div className="flex items-center justify-between gap-2 rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
                            <div className="flex min-w-0 items-center gap-2 text-gray-500 dark:text-white/45">
                                <CalendarDays size={13} />
                                <div className="min-w-0">
                                    <p className="text-[9.5px] font-bold">
                                        مهلت انجام
                                    </p>
                                    <p
                                        className={`mt-0.5 text-[11px] font-extrabold ${deadlineState.color}`}
                                    >
                                        {deadlineDate.full} · {deadlineDate.time}
                                    </p>
                                </div>
                            </div>

                            {startedDate && (
                                <div className="border-r border-gray-200 pr-2 text-left dark:border-white/[0.08]">
                                    <p className="text-[9px] font-bold text-gray-400">
                                        شروع
                                    </p>
                                    <p className="mt-0.5 text-[10px] font-bold text-gray-500 dark:text-white/50">
                                        {startedDate.short}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {assigneeIds.length > 0 && (
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-white/35">
                                <UsersRound size={12} />
                                مسئولین
                            </div>

                            <TaskAssignees
                                ids={assigneeIds}
                                size="sm"
                                limit={4}
                            />
                        </div>
                    )}
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3.5 dark:border-white/[0.06]">
                    <button
                        type="button"
                        onClick={() => setNotesModalOpen(true)}
                        disabled={!taskId}
                        className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-50 text-[10.5px] font-extrabold text-indigo-600 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                    >
                        <MessageSquareText size={13} />
                        یادداشت‌ها
                    </button>

                    {canManageDeadline && (
                        <button
                            type="button"
                            onClick={() => setTimeModalOpen(true)}
                            disabled={!taskId || !stepId}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/[0.05] dark:text-white/45 dark:hover:bg-white/[0.1] dark:hover:text-indigo-300"
                            title="تنظیم بازهٔ زمانی"
                        >
                            <Clock3 size={15} />
                        </button>
                    )}

                    {filesCount > 0 && (
                        <div className="flex h-9 items-center gap-1 rounded-xl bg-gray-50 px-2.5 text-[10px] font-extrabold text-gray-500 dark:bg-white/[0.05] dark:text-white/45">
                            <FileText size={13} />
                            {toPersianDigits(filesCount)}
                        </div>
                    )}
                </div>

                {createdDate && (
                    <p className="mt-3 text-[9.5px] font-medium text-gray-300 dark:text-white/20">
                        ایجاد شده در {createdDate.full}
                    </p>
                )}
            </motion.article>

            <TimeRangeModal
                open={timeModalOpen}
                initialStartedAt={schedule.started_at}
                initialDeadline={schedule.deadline}
                loading={deadlineLoading}
                error={deadlineError}
                onClose={() => {
                    if (!deadlineLoading) {
                        setDeadlineError(null);
                        setTimeModalOpen(false);
                    }
                }}
                onSubmit={handleTimeSubmit}
            />

            {taskId && (
                <AdminTaskNotesModal
                    isOpen={notesModalOpen}
                    onClose={() => setNotesModalOpen(false)}
                    taskId={taskId}
                    taskTitle={task.title || task.name || "تسک بدون عنوان"}
                />
            )}

            <AnimatePresence>
                {confirmDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
                        onClick={() =>
                            !deleteLoading && setConfirmDelete(false)
                        }
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.94, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 10 }}
                            onClick={(event) => event.stopPropagation()}
                            className="w-full max-w-sm rounded-[2rem] border border-gray-100 bg-white p-6 text-right shadow-2xl dark:border-white/[0.08] dark:bg-[#111a2d]"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10">
                                <Trash2 size={19} />
                            </div>

                            <h4 className="mt-4 text-[14px] font-extrabold text-gray-900 dark:text-white">
                                حذف تسک
                            </h4>

                            <p className="mt-2 text-[11.5px] font-medium leading-6 text-gray-400 dark:text-white/40">
                                مطمئنی می‌خواهی این تسک را حذف کنی؟ این عملیات
                                قابل بازگشت نیست.
                            </p>

                            <div className="mt-5 flex gap-2">
                                <button
                                    type="button"
                                    disabled={deleteLoading || deleting}
                                    onClick={() => setConfirmDelete(false)}
                                    className="flex h-10 flex-1 items-center justify-center rounded-full bg-gray-100 text-[11.5px] font-extrabold text-gray-500 transition-colors hover:bg-gray-200 dark:bg-white/[0.06] dark:text-white/50 dark:hover:bg-white/[0.1]"
                                >
                                    انصراف
                                </button>

                                <button
                                    type="button"
                                    disabled={deleteLoading || deleting}
                                    onClick={handleDelete}
                                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-red-500 text-[11.5px] font-extrabold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                                >
                                    {deleteLoading || deleting ? (
                                        <Loader2
                                            size={14}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Trash2 size={14} />
                                    )}
                                    حذف
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
