"use client";
import { useEffect, useMemo, useState } from "react";
import {
    Inbox,
    LayoutGrid,
    Loader,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import {
    fetchEmployeeList,
    fetchInternalTasks,
} from "./Api";
import type {
    EmployeeListItem,
    InternalTask,
} from "./types";
import ReceivedTaskCard from "./Receivedtaskcard";

function normalizeDateValue(
    value: unknown,
): string | null {
    if (!value) return null;
    if (typeof value === "string") {
        return value.trim() || null;
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

    const status =
        task.status === "in_progress" ||
            task.status === "completed" ||
            task.status === "cancelled"
            ? task.status
            : "in_progress";

    return {
        id,
        title: typeof task.title === "string" ? task.title : "",
        description: typeof task.description === "string" ? task.description : "",
        status,
        created_by: typeof task.created_by === "string" ? task.created_by.trim() : "",
        created_at:
            typeof task.created_at === "string" && task.created_at.trim()
                ? task.created_at
                : new Date().toISOString(),
        updated_at: typeof task.updated_at === "string" ? task.updated_at : new Date().toISOString(),
        started_at: normalizeDateValue(task.started_at),
        deadline: normalizeDateValue(task.deadline),
        completed_at:
            typeof task.completed_at === "string" || task.completed_at === null
                ? task.completed_at
                : null,
        assigned_to: Array.isArray(task.assigned_to)
            ? task.assigned_to.map((u) => ({
                id: typeof u === "number" ? u : Number(u?.id) || 0,
                full_name: typeof u === "object" && u ? (u as any).full_name || "" : "",
            }))
            : [],
        attachments: Array.isArray(task.attachments) ? task.attachments : [],
    };
}

function normalizeTasks(data: unknown): InternalTask[] {
    if (!Array.isArray(data)) return [];
    const map = new Map<number, InternalTask>();
    for (const item of data) {
        const task = normalizeTask(item);
        if (task) map.set(task.id, task);
    }
    return Array.from(map.values());
}

export default function ReceivedTicketsBoard() {
    const { userId } = useAuthStore();
    const [tasks, setTasks] = useState<InternalTask[]>([]);
    const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadTasks = async () => {
        try {
            setLoading(true);
            setError(null);
            const [tasksRes, employeesRes] = await Promise.all([
                fetchInternalTasks(),
                fetchEmployeeList(),
            ]);

            setTasks(normalizeTasks(tasksRes.data));
            setEmployees(Array.isArray(employeesRes.data) ? employeesRes.data : []);
        } catch (err) {
            setError("دریافت تیکت‌ها با خطا مواجه شد.");
            setTasks([]);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadTasks();
    }, []);

    // نقشه‌ی user.id → employee.full_name
    const userToEmployeeName = useMemo(() => {
        const map = new Map<number, string>();
        const employeeByUsername = new Map<string, string>();
        employees.forEach((emp) => {
            if (emp.username) {
                employeeByUsername.set(emp.username.trim(), emp.full_name || emp.username);
            }
        });
        // فرض: /user/list/ همیشه قبل از employee لود می‌شود (اما ما فقط از employee استفاده می‌کنیم)
        // ولی در اینجا فقط از employee list برای نام استفاده می‌کنیم
        return employeeByUsername;
    }, [employees]);

    const receivedTasks = useMemo(() => {
        if (!userId) return [];
        return tasks.filter((task) => {
            if (!Array.isArray(task.assigned_to)) return false;
            return task.assigned_to.some((assigned) => Number(assigned.id) === Number(userId));
        }).map((task) => {
            // resolved assigned_to با full_name از employee list
            const resolvedAssigned = task.assigned_to.map((assigned) => {
                const usernameMatch = employees.find(emp => emp.id === assigned.id)?.username;
                const full_name = usernameMatch
                    ? userToEmployeeName.get(usernameMatch.trim()) || `کاربر ${assigned.id}`
                    : `کاربر ${assigned.id}`;
                return { id: assigned.id, full_name };
            });
            return { ...task, assigned_to: resolvedAssigned };
        });
    }, [tasks, userId, employees, userToEmployeeName]);

    const handleUpdated = (updatedTask: InternalTask) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
        );
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader size={22} className="animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div dir="rtl" className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10">
                    <Inbox size={17} className="text-indigo-500" />
                </div>
                <div>
                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                        تیکت‌های دریافت شده
                    </h3>
                    <p className="text-[11px] text-gray-400 dark:text-gray-600">
                        {receivedTasks.length} تیکت
                    </p>
                </div>
            </div>

            {error && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                    <p className="text-[12px] font-semibold text-red-500">{error}</p>
                    <button
                        type="button"
                        onClick={() => void loadTasks()}
                        className="rounded-xl bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-500 transition-colors hover:bg-red-500/20"
                    >
                        تلاش مجدد
                    </button>
                </div>
            )}

            {receivedTasks.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.07]">
                    <LayoutGrid size={28} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[12px] text-gray-400">تیکتی به شما ارجاع نشده است.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {receivedTasks.map((task) => (
                        <ReceivedTaskCard
                            key={task.id}
                            task={task}
                            employees={employees}
                            onUpdated={handleUpdated}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}