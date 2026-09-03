"use client";

import { JSX, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Inbox,
    LayoutGrid,
    Loader,
    MessageSquareText,
    RefreshCw,
    Ticket,
    Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
    fetchEmployeeList,
    fetchInternalTasks,
} from "./Api";
import type {
    EmployeeListItem,
    InternalTask,
    InternalTaskStatus,
    EmployeeRef,
} from "./types";
import AdminInternalTaskChatModal from "./AdminInternalTaskChatModal";

type AdminEmployee = EmployeeListItem & {
    id?: number;
    username?: string;
    full_name?: string;
};

function normalizeDateValue(value: unknown): string | null {
    if (!value) return null;

    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed || null;
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString();
    }

    return null;
}

function normalizeTask(item: unknown): InternalTask | null {
    if (!item || typeof item !== "object") return null;

    const task = item as Partial<InternalTask>;
    const taskId = Number(task.id);

    if (!Number.isFinite(taskId) || taskId <= 0) return null;

    const status = task.status;

    const safeStatus: InternalTaskStatus =
        status === "in_progress" ||
            status === "completed" ||
            status === "cancelled"
            ? status
            : "in_progress";

    return {
        id: taskId,
        title: typeof task.title === "string" ? task.title : "",
        description:
            typeof task.description === "string"
                ? task.description
                : "",
        status: safeStatus,
        created_by:
            typeof task.created_by === "string"
                ? task.created_by
                : "",
        created_at:
            typeof task.created_at === "string" &&
                task.created_at.trim()
                ? task.created_at
                : new Date().toISOString(),
        updated_at:
            typeof task.updated_at === "string"
                ? task.updated_at
                : undefined,
        started_at: normalizeDateValue(task.started_at),
        deadline: normalizeDateValue(task.deadline),
        assigned_to: Array.isArray(task.assigned_to)
            ? task.assigned_to
            : [],
        attachments: Array.isArray(task.attachments)
            ? task.attachments
            : [],
    } as InternalTask;
}

function normalizeTasks(data: unknown): InternalTask[] {
    if (!Array.isArray(data)) return [];

    const map = new Map<number, InternalTask>();

    for (const item of data) {
        const task = normalizeTask(item);

        if (task) {
            map.set(task.id, task);
        }
    }

    return Array.from(map.values());
}

function formatDate(value?: string | null) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat("fa-IR", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function getStatusConfig(status: InternalTaskStatus) {
    if (status === "completed") {
        return {
            label: "انجام شده",
            className:
                "border-blue-500/20 bg-blue-500/10 text-blue-400",
        };
    }

    if (status === "cancelled") {
        return {
            label: "لغو شده",
            className:
                "border-red-500/20 bg-red-500/10 text-red-400",
        };
    }

    return {
        label: "در حال انجام",
        className:
            "border-amber-500/20 bg-amber-500/10 text-amber-400",
    };
}

const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#3b82f6", "#6366f1"],
    ["#8b5cf6", "#ec4899"],
    ["#06b6d4", "#6366f1"],
    ["#f59e0b", "#ef4444"],
    ["#10b981", "#3b82f6"],
    ["#f472b6", "#ec4899"],
    ["#8b5cf6", "#f59e0b"],
];

function getGradient(id: number) {
    return AVATAR_GRADIENTS[
        Math.abs(id) % AVATAR_GRADIENTS.length
    ];
}

function getEmployeeName(employee: AdminEmployee) {
    return (
        employee.full_name ||
        employee.username ||
        `کارمند ${employee.id ?? ""}`
    );
}

function AdminInternalTaskCard({
    task,
    index,
    employees,
    onOpen,
}: {
    task: InternalTask;
    index: number;
    employees: AdminEmployee[];
    onOpen: (task: InternalTask) => void;
}) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [hovered, setHovered] = useState(false);

    const statusConfig = getStatusConfig(task.status);

    const assignedEmployees = Array.isArray(task.assigned_to)
        ? task.assigned_to
        : [];

    const latestAttachment = [...(task.attachments ?? [])]
        .sort(
            (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
        )[0];

    const creator = employees.find(
        (employee) =>
            employee.username === task.created_by,
    );

    const creatorName = creator
        ? getEmployeeName(creator)
        : task.created_by || "کاربر";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
                duration: 0.22,
                delay: index * 0.04,
            }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            onClick={() => onOpen(task)}
            className="group relative flex min-h-[220px] cursor-pointer flex-col gap-3 overflow-hidden rounded-[2rem] p-4"
            style={{
                border: isDark
                    ? "1px solid rgba(255,255,255,0.06)"
                    : "1px solid rgba(0,0,0,0.06)",
                background: isDark
                    ? "rgba(255,255,255,0.02)"
                    : "#fafafa",
                boxShadow: isDark
                    ? "0 2px 24px rgba(0,0,0,0.2)"
                    : "0 2px 16px rgba(0,0,0,0.04)",
                transition:
                    "border-color .4s ease, box-shadow .4s ease",
            }}
        >
            <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                style={{ borderRadius: "2rem" }}
            >
                <defs>
                    <linearGradient
                        id={`admin-border-${task.id}`}
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
                    stroke={`url(#admin-border-${task.id})`}
                    strokeWidth="1.5"
                    pathLength="1"
                    initial={{
                        pathLength: 0,
                        opacity: 0,
                    }}
                    animate={
                        hovered
                            ? {
                                pathLength: 1,
                                opacity: 1,
                            }
                            : {
                                pathLength: 0,
                                opacity: 0,
                            }
                    }
                    transition={{
                        duration: 0.55,
                        ease: "easeInOut",
                    }}
                />
            </svg>

            <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] font-bold ${statusConfig.className}`}
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full bg-current ${task.status === "in_progress"
                                    ? "animate-pulse"
                                    : ""
                                }`}
                        />
                        {statusConfig.label}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpen(task);
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/[0.08] text-indigo-500 transition-all hover:bg-indigo-500/[0.14] hover:text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                    title="مشاهده گفتگو"
                >
                    <MessageSquareText size={13} />
                </button>
            </div>

            <div className="relative z-10 flex flex-col gap-1">
                <h3
                    className="line-clamp-1 text-[13.5px] font-extrabold"
                    style={{
                        color: isDark
                            ? "#f1f5f9"
                            : "#1e293b",
                    }}
                >
                    {task.title || "بدون عنوان"}
                </h3>

                {task.description ? (
                    <p
                        className="line-clamp-2 text-[11.5px] leading-6"
                        style={{
                            color: isDark
                                ? "#94a3b8"
                                : "#64748b",
                        }}
                    >
                        {task.description}
                    </p>
                ) : null}
            </div>

            <div
                className="relative z-10 flex flex-col gap-2 border-t pt-3"
                style={{
                    borderColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.05)",
                }}
            >
                <div className="flex items-center gap-2">
                    <Users
                        size={12}
                        className="shrink-0 text-indigo-500"
                    />

                    <div className="flex min-w-0 flex-wrap gap-1.5">
                        {assignedEmployees.length > 0 ? (
                            assignedEmployees.map(
                                (employee: EmployeeRef) => {
                                    const gradient =
                                        getGradient(
                                            Number(employee.id),
                                        );

                                    return (
                                        <span
                                            key={employee.id}
                                            className="flex items-center gap-1.5 rounded-full border py-0.5 pl-2 pr-0.5"
                                            style={{
                                                borderColor:
                                                    isDark
                                                        ? "rgba(255,255,255,.06)"
                                                        : "rgba(0,0,0,.06)",
                                                background:
                                                    isDark
                                                        ? "rgba(255,255,255,.035)"
                                                        : "rgba(0,0,0,.025)",
                                            }}
                                        >
                                            <span
                                                className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-extrabold text-white"
                                                style={{
                                                    background:
                                                        `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                                                }}
                                            >
                                                {employee.full_name?.slice(
                                                    0,
                                                    1,
                                                ) || "ک"}
                                            </span>

                                            <span
                                                className="max-w-[120px] truncate text-[9.5px] font-bold"
                                                style={{
                                                    color: isDark
                                                        ? "#cbd5e1"
                                                        : "#475569",
                                                }}
                                            >
                                                {employee.full_name ||
                                                    `کارمند ${employee.id}`}
                                            </span>
                                        </span>
                                    );
                                },
                            )
                        ) : (
                            <span className="text-[10px] text-gray-400">
                                بدون مسئول
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-1.5">
                        <span className="text-[9px] text-black/30 dark:text-white/25">
                            ایجادکننده:
                        </span>

                        <span className="truncate text-[10px] font-bold text-black/55 dark:text-white/50">
                            {creatorName}
                        </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                        <Inbox
                            size={11}
                            className="text-indigo-400"
                        />

                        <span className="text-[9px] font-bold text-black/35 dark:text-white/30">
                            {task.attachments?.length ?? 0} پیام
                        </span>
                    </div>
                </div>
            </div>

            <div
                className="relative z-10 mt-auto flex items-center justify-between rounded-[1.15rem] px-3 py-2.5"
                style={{
                    background: isDark
                        ? "rgba(99,102,241,.055)"
                        : "rgba(99,102,241,.045)",
                    border: isDark
                        ? "1px solid rgba(99,102,241,.1)"
                        : "1px solid rgba(99,102,241,.08)",
                }}
            >
                <div className="flex min-w-0 items-center gap-2">
                    <MessageSquareText
                        size={12}
                        className="shrink-0 text-indigo-500"
                    />

                    <span className="truncate text-[10px] font-semibold text-black/45 dark:text-white/40">
                        {latestAttachment?.note ||
                            "مشاهده گفتگوی کارکنان"}
                    </span>
                </div>

                <span className="shrink-0 text-[8px] text-black/25 dark:text-white/20">
                    {formatDate(
                        latestAttachment?.created_at ||
                        task.updated_at ||
                        task.created_at,
                    )}
                </span>
            </div>
        </motion.div>
    );
}

export default function AdminInternalTasksBoard(): JSX.Element {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [tasks, setTasks] = useState<InternalTask[]>([]);
    const [employees, setEmployees] = useState<AdminEmployee[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] =
        useState<InternalTask | null>(null);

    async function loadData(initial = false) {
        try {
            if (initial) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            setError(null);

            const [tasksResponse, employeesResponse] =
                await Promise.all([
                    fetchInternalTasks(),
                    fetchEmployeeList(),
                ]);

            setTasks(
                normalizeTasks(tasksResponse.data),
            );

            setEmployees(
                Array.isArray(employeesResponse.data)
                    ? employeesResponse.data
                    : [],
            );
        } catch {
            setError(
                "دریافت گفتگوهای کارکنان با خطا مواجه شد.",
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        void loadData(true);
    }, []);

    const sortedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => {
            const aDate = new Date(
                a.updated_at ||
                a.created_at ||
                0,
            ).getTime();

            const bDate = new Date(
                b.updated_at ||
                b.created_at ||
                0,
            ).getTime();

            return bDate - aDate;
        });
    }, [tasks]);

    function handleUpdated(updatedTask: InternalTask) {
        setTasks((previous) =>
            previous.map((task) =>
                Number(task.id) === Number(updatedTask.id)
                    ? updatedTask
                    : task,
            ),
        );

        setSelectedTask((previous) =>
            previous &&
                Number(previous.id) === Number(updatedTask.id)
                ? updatedTask
                : previous,
        );
    }

    if (loading) {
        return (
            <div
                dir="rtl"
                className="flex h-64 items-center justify-center"
            >
                <Loader
                    size={22}
                    className="animate-spin text-indigo-500"
                />
            </div>
        );
    }

    return (
        <div
            dir="rtl"
            className="flex flex-col gap-5"
        >
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10">
                        <Ticket
                            size={17}
                            className="text-indigo-500"
                        />
                    </div>

                    <div>
                        <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                            گفتگوهای کارکنان
                        </h3>

                        <p className="text-[11px] text-gray-400 dark:text-gray-600">
                            مشاهده گفتگوهای داخلی و فایل‌های رد و بدل شده
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => void loadData()}
                    disabled={refreshing}
                    className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 disabled:opacity-40 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.08]"
                    title="به‌روزرسانی"
                >
                    <RefreshCw
                        size={14}
                        className={
                            refreshing
                                ? "animate-spin"
                                : ""
                        }
                    />
                </button>
            </div>

            {error ? (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                    <p className="text-[12px] font-semibold text-red-500">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() => void loadData()}
                        className="rounded-xl bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-500"
                    >
                        تلاش مجدد
                    </button>
                </div>
            ) : null}

            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-2xl bg-indigo-500/[0.07] px-3 py-2">
                    <MessageSquareText
                        size={13}
                        className="text-indigo-500"
                    />

                    <span className="text-[11px] font-bold text-indigo-500">
                        {tasks.length} گفتگو
                    </span>
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-3 py-2 dark:bg-white/[0.05]">
                    <Users
                        size={13}
                        className="text-gray-400"
                    />

                    <span className="text-[11px] font-bold text-gray-400">
                        {employees.length} کارمند
                    </span>
                </div>
            </div>

            {sortedTasks.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.07]">
                    <LayoutGrid
                        size={28}
                        className="text-gray-300 dark:text-gray-700"
                    />

                    <p className="text-[12px] text-gray-400">
                        هنوز گفتگویی ثبت نشده است.
                    </p>
                </div>
            ) : (
                <AnimatePresence mode="popLayout">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {sortedTasks.map((task, index) => (
                            <AdminInternalTaskCard
                                key={task.id}
                                task={task}
                                index={index}
                                employees={employees}
                                onOpen={setSelectedTask}
                            />
                        ))}
                    </div>
                </AnimatePresence>
            )}

            {selectedTask ? (
                <AdminInternalTaskChatModal
                    open={true}
                    task={selectedTask}
                    employees={employees}
                    onClose={() =>
                        setSelectedTask(null)
                    }
                    onUpdated={handleUpdated}
                />
            ) : null}
        </div>
    );
}