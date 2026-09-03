"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, Loader, Plus, Ticket } from "lucide-react";
import { useCurrentEmployee } from "@/hooks/usecurrentemployee";
import {
    fetchEmployeeList,
    fetchInternalTasks,
    deleteInternalTask,
} from "./Api";
import type {
    EmployeeListItem,
    InternalTask,
    InternalTaskStatus,
} from "./types";
import SentTaskCard from "./Senttaskcard";
import CreateTicketModal from "./Createticketmodal";

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
    const id = Number(task.id);

    if (!Number.isFinite(id) || id <= 0) return null;

    const status: InternalTaskStatus =
        task.status === "in_progress" ||
            task.status === "completed" ||
            task.status === "cancelled"
            ? task.status
            : "in_progress";

    return {
        id,
        title: typeof task.title === "string" ? task.title : "",
        description:
            typeof task.description === "string" ? task.description : "",
        status,
        created_by:
            typeof task.created_by === "string" ? task.created_by.trim() : "",
        created_at:
            typeof task.created_at === "string" && task.created_at.trim()
                ? task.created_at
                : new Date().toISOString(),
        started_at: normalizeDateValue(task.started_at),
        deadline: normalizeDateValue(task.deadline),
        assigned_to: Array.isArray(task.assigned_to) ? task.assigned_to : [],
        attachments: Array.isArray(task.attachments)
            ? task.attachments
            : [],
    } as InternalTask;
}

function normalizeTasks(data: unknown): InternalTask[] {
    if (!Array.isArray(data)) return [];

    const map = new Map<number, InternalTask>();

    data.forEach((item) => {
        const task = normalizeTask(item);
        if (task) map.set(task.id, task);
    });

    return Array.from(map.values());
}

function getUsername(employee: unknown) {
    if (!employee || typeof employee !== "object") return "";

    const username = (employee as { username?: unknown }).username;

    return typeof username === "string" ? username.trim() : "";
}

export default function SentTicketsBoard() {
    const { employee, loading: employeeLoading } = useCurrentEmployee();

    const [tasks, setTasks] = useState<InternalTask[]>([]);
    const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

    const currentUsername = getUsername(employee);

    const loadTasks = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetchInternalTasks();
            setTasks(normalizeTasks(response.data));
        } catch {
            setTasks([]);
            setError("دریافت تیکت‌ها با خطا مواجه شد.");
        } finally {
            setLoading(false);
        }
    };

    const loadEmployees = async () => {
        try {
            const response = await fetchEmployeeList();
            setEmployees(Array.isArray(response.data) ? response.data : []);
        } catch {
            setEmployees([]);
        }
    };

    useEffect(() => {
        void loadTasks();
        void loadEmployees();
    }, []);

    const sentTasks = useMemo(() => {
        if (!currentUsername) return [];

        return tasks.filter(
            (task) => task.created_by.trim() === currentUsername
        );
    }, [tasks, currentUsername]);

    const handleUpdated = (updatedTask: InternalTask) => {
        const normalized = normalizeTask(updatedTask);
        if (!normalized) return;

        setTasks((previous) =>
            previous.map((task) =>
                task.id === normalized.id
                    ? {
                        ...task,
                        ...normalized,
                        created_at: task.created_at,
                    }
                    : task
            )
        );
    };

    const handleCreated = (createdTask: InternalTask) => {
        const normalized = normalizeTask(createdTask);

        if (!normalized) {
            void loadTasks();
            setCreateOpen(false);
            return;
        }

        setTasks((previous) => [
            normalized,
            ...previous.filter((task) => task.id !== normalized.id),
        ]);

        setCreateOpen(false);
        void loadTasks();
    };

    const handleDelete = async (taskId: number) => {
        const id = Number(taskId);

        if (!Number.isFinite(id) || id <= 0) return;

        try {
            setDeleteLoadingId(id);
            await deleteInternalTask(id);

            setTasks((previous) => previous.filter((task) => task.id !== id));
        } catch {
            setError("حذف تیکت با خطا مواجه شد.");
        } finally {
            setDeleteLoadingId(null);
        }
    };

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
                            تیکت‌های ارسال شده
                        </h3>
                        <p className="text-[11px] text-gray-400 dark:text-gray-600">
                            {sentTasks.length} تیکت
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

            {error && (
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
            )}

            {sentTasks.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.07]">
                    <LayoutGrid
                        size={28}
                        className="text-gray-300 dark:text-gray-700"
                    />
                    <p className="text-[12px] text-gray-400">
                        هنوز تیکتی ارسال نکرده‌اید.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {sentTasks.map((task, index) => (
                        <SentTaskCard
                            key={task.id}
                            task={task}
                            index={index}
                            onUpdated={handleUpdated}
                            onDelete={handleDelete}
                            isDeleting={deleteLoadingId === task.id}
                        />
                    ))}
                </div>
            )}

            <CreateTicketModal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                employees={employees}
                onCreated={handleCreated}
            />
        </div>
    );
}