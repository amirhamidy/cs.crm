"use client";

import { JSX, useEffect, useMemo, useState } from "react";
import { Inbox, LayoutGrid, Loader, Plus, Send, Ticket } from "lucide-react";
import { useCurrentEmployee } from "@/hooks/usecurrentemployee";
import {
    deleteInternalTask,
    fetchEmployeeList,
    fetchInternalTasks,
} from "./Api";
import type { EmployeeListItem, InternalTask, InternalTaskStatus } from "./types";
import SentTaskCard from "./Senttaskcard";
import ReceivedTaskCard from "./Receivedtaskcard";
import CreateTicketModal from "./Createticketmodal";

type TabType = "sent" | "received";

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
        description: typeof task.description === "string" ? task.description : "",
        status: safeStatus,
        created_by: typeof task.created_by === "string" ? task.created_by : "",
        created_at:
            typeof task.created_at === "string" && task.created_at.trim()
                ? task.created_at
                : new Date().toISOString(),
        started_at: normalizeDateValue(task.started_at),
        deadline: normalizeDateValue(task.deadline),
        assigned_to: Array.isArray(task.assigned_to) ? task.assigned_to : [],
        attachments: Array.isArray(task.attachments) ? task.attachments : [],
    } as InternalTask;
}

function normalizeTasks(data: unknown): InternalTask[] {
    if (!Array.isArray(data)) return [];

    const taskMap = new Map<number, InternalTask>();

    for (const item of data) {
        const normalizedTask = normalizeTask(item);
        if (!normalizedTask) continue;
        taskMap.set(normalizedTask.id, normalizedTask);
    }

    return Array.from(taskMap.values());
}

function getEmployeeId(employee: unknown): number | null {
    if (!employee || typeof employee !== "object") return null;

    const id = Number((employee as { id?: unknown }).id);
    return Number.isFinite(id) && id > 0 ? id : null;
}

function getEmployeeUsername(employee: unknown): string {
    if (!employee || typeof employee !== "object") return "";

    const username = (employee as { username?: unknown }).username;
    return typeof username === "string" ? username.trim() : "";
}

export default function InternalTasksBoard(): JSX.Element {
    const { employee, loading: employeeLoading } = useCurrentEmployee();

    const [tasks, setTasks] = useState<InternalTask[]>([]);
    const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);
    const [tab, setTab] = useState<TabType>("sent");
    const [createOpen, setCreateOpen] = useState(false);

    const currentUsername = getEmployeeUsername(employee);
    const currentEmployeeId = getEmployeeId(employee);

    async function loadTasks() {
        try {
            setLoading(true);
            setError(null);

            const response = await fetchInternalTasks();
            setTasks(normalizeTasks(response.data));
        } catch {
            setError("دریافت تیکت‌ها با خطا مواجه شد.");
            setTasks([]);
        } finally {
            setLoading(false);
        }
    }

    async function loadEmployees() {
        try {
            const response = await fetchEmployeeList();
            setEmployees(Array.isArray(response.data) ? response.data : []);
        } catch {
            setEmployees([]);
        }
    }

    useEffect(() => {
        void loadTasks();
        void loadEmployees();
    }, []);

    const sentTasks = useMemo(() => {
        if (!currentUsername) return [];

        return tasks.filter((task) => task.created_by?.trim() === currentUsername);
    }, [currentUsername, tasks]);

    const receivedTasks = useMemo(() => {
        if (!currentEmployeeId) return [];

        return tasks.filter((task) => {
            const assignedUsers = Array.isArray(task.assigned_to)
                ? task.assigned_to
                : [];

            return assignedUsers.some((assignedUser) => {
                const assignedUserId = Number(assignedUser?.id);
                return assignedUserId === currentEmployeeId;
            });
        });
    }, [currentEmployeeId, tasks]);

    const activeTasks = tab === "sent" ? sentTasks : receivedTasks;

    function handleTaskUpdated(updatedTask: InternalTask) {
        const normalizedUpdatedTask = normalizeTask(updatedTask);
        if (!normalizedUpdatedTask) return;

        setTasks((previousTasks) =>
            previousTasks.map((task) =>
                Number(task.id) === normalizedUpdatedTask.id
                    ? {
                        ...task,
                        ...normalizedUpdatedTask,
                        id: normalizedUpdatedTask.id,
                        created_at: task.created_at,
                        started_at:
                            normalizeDateValue(normalizedUpdatedTask.started_at) ??
                            task.started_at ??
                            null,
                        deadline:
                            normalizeDateValue(normalizedUpdatedTask.deadline) ??
                            task.deadline ??
                            null,
                        assigned_to: Array.isArray(normalizedUpdatedTask.assigned_to)
                            ? normalizedUpdatedTask.assigned_to
                            : task.assigned_to,
                        attachments: Array.isArray(normalizedUpdatedTask.attachments)
                            ? normalizedUpdatedTask.attachments
                            : task.attachments,
                    }
                    : task
            )
        );
    }

    function handleTaskCreated(createdTask: InternalTask) {
        const normalizedCreatedTask = normalizeTask(createdTask);

        if (!normalizedCreatedTask) {
            void loadTasks();
            setCreateOpen(false);
            setTab("sent");
            return;
        }

        setTasks((previousTasks) => [
            normalizedCreatedTask,
            ...previousTasks.filter(
                (task) => Number(task.id) !== normalizedCreatedTask.id
            ),
        ]);

        setCreateOpen(false);
        setTab("sent");

        void loadTasks();
    }


    async function handleDeleteTask(taskId: number) {
        const safeTaskId = Number(taskId);

        if (!Number.isFinite(safeTaskId) || safeTaskId <= 0) return;

        try {
            setDeleteLoadingId(safeTaskId);
            await deleteInternalTask(safeTaskId);

            setTasks((previousTasks) =>
                previousTasks.filter((task) => Number(task.id) !== safeTaskId)
            );
        } catch {
            setError("حذف تیکت با خطا مواجه شد.");
        } finally {
            setDeleteLoadingId(null);
        }
    }

    if (loading || employeeLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader size={22} className="animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div dir="rtl" className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10">
                        <Ticket size={17} className="text-indigo-500" />
                    </div>

                    <div>
                        <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                            تیکت‌های درون‌سازمانی
                        </h3>
                        <p className="text-[11px] text-gray-400 dark:text-gray-600">
                            {tasks.length} تیکت
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-indigo-600 px-3.5 py-2 text-[11.5px] font-bold text-white transition-colors hover:bg-indigo-500"
                >
                    <Plus size={13} />
                    تیکت جدید
                </button>
            </div>

            {error ? (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                    <p className="text-[12px] font-semibold text-red-500">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() => void loadTasks()}
                        className="rounded-xl bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-500 transition-colors hover:bg-red-500/20"
                    >
                        تلاش مجدد
                    </button>
                </div>
            ) : null}

            <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                    type="button"
                    onClick={() => setTab("sent")}
                    className={`flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2 text-[11.5px] font-bold transition-colors ${tab === "sent"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.08]"
                        }`}
                >
                    <Send size={12} />
                    <span>ارسال شده توسط من</span>
                    <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${tab === "sent"
                            ? "bg-white/20"
                            : "bg-black/5 dark:bg-white/10"
                            }`}
                    >
                        {sentTasks.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setTab("received")}
                    className={`flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2 text-[11.5px] font-bold transition-colors ${tab === "received"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.08]"
                        }`}
                >
                    <Inbox size={12} />
                    <span>ارسال شده به من</span>
                    <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${tab === "received"
                            ? "bg-white/20"
                            : "bg-black/5 dark:bg-white/10"
                            }`}
                    >
                        {receivedTasks.length}
                    </span>
                </button>
            </div>

            {activeTasks.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.07]">
                    <LayoutGrid size={28} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[12px] text-gray-400">
                        {tab === "sent"
                            ? "هنوز تیکتی ارسال نکرده‌اید."
                            : "تیکتی به شما ارجاع نشده است."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {tab === "sent"
                        ? sentTasks.map((task, index) => (
                            <SentTaskCard
                                key={task.id}
                                task={task}
                                index={index}
                                onUpdated={handleTaskUpdated}
                                onDelete={handleDeleteTask}
                                isDeleting={deleteLoadingId === task.id}
                            />
                        ))
                        : receivedTasks.map((task) => (
                            <ReceivedTaskCard
                                key={task.id}
                                task={task}
                                onUpdated={handleTaskUpdated}
                            />
                        ))}
                </div>
            )}

            <CreateTicketModal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                employees={employees}
                onCreated={handleTaskCreated}
            />
        </div>
    );
}