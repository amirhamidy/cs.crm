"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, Loader, Plus, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import { Task, TaskStatus } from "@/types/task";
import { Department } from "@/types/department";
import TaskCard from "@/components/customcomponents/tasks/TaskCard";
import CreateTaskModal from "@/components/customcomponents/tasks/CreateTaskModal";
import EditTaskModal from "@/components/customcomponents/tasks/EditTaskModal";
import { taskStatusLabels } from "@/components/customcomponents/shared/constants";
import type { Customer } from "@/types/customer";
import type { Employee } from "@/types/employee";

type ListResponse<T> = T[] | { results?: T[]; data?: T[] };

function extractList<T>(data: ListResponse<T>): T[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
        if (Array.isArray((data as { results?: T[] }).results))
            return (data as { results: T[] }).results;
        if (Array.isArray((data as { data?: T[] }).data))
            return (data as { data: T[] }).data;
    }
    return [];
}

export default function AdminTasksPage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [tasks, setTasks] = useState<Task[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
    const [showCreate, setShowCreate] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            const [tasksRes, customersRes, departmentsRes, employeesRes] =
                await Promise.all([
                    axiosInstance.get<ListResponse<Task>>(apiRoutes.tasks),
                    axiosInstance.get<ListResponse<Customer>>(apiRoutes.customers),
                    axiosInstance.get<ListResponse<Department>>(apiRoutes.departments),
                    axiosInstance.get<ListResponse<Employee>>(apiRoutes.employees),
                ]);

            setTasks(extractList(tasksRes.data));
            setCustomers(extractList(customersRes.data));
            setDepartments(extractList(departmentsRes.data));
            setEmployees(extractList(employeesRes.data));
        } catch {
            setTasks([]);
            setCustomers([]);
            setDepartments([]);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const statusOptions = useMemo(
        () => [
            { value: "ALL" as const, label: "همه" },
            ...(Object.entries(taskStatusLabels) as [TaskStatus, string][]).map(
                ([value, label]) => ({ value, label })
            ),
        ],
        []
    );

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            return (
                statusFilter === "ALL" ||
                task.status === statusFilter
            );
        });
    }, [tasks, statusFilter]);

    const handleDelete = useCallback(
        async (taskId: number): Promise<boolean> => {
            try {
                await axiosInstance.delete(apiRoutes.deleteTask(taskId));
                setTasks((prev) => prev.filter((t) => t.id !== taskId));
                return true;
            } catch {
                await fetchAll();
                throw new Error("delete failed");
            }
        },
        [fetchAll]
    );

    const handleCreateSuccess = useCallback(() => {
        setShowCreate(false);
        fetchAll();
    }, [fetchAll]);

    const handleEditSuccess = useCallback(() => {
        setEditingTask(null);
        fetchAll();
    }, [fetchAll]);

    const handleTaskUpdated = useCallback((updated: Task) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === updated.id ? updated : t))
        );
    }, []);

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,0.14)"
                                : "rgba(99,102,241,0.08)",
                        }}
                    >
                        <ClipboardList
                            size={18}
                            className="text-indigo-500"
                        />
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                            وظایف
                        </h1>

                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
                            {loading
                                ? "در حال بارگذاری..."
                                : `${tasks.length} وظیفه ثبت شده`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={fetchAll}
                        disabled={loading}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl transition-colors disabled:opacity-50"
                        style={{
                            background: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(15,23,42,0.05)",
                            color: isDark ? "#cbd5e1" : "#475569",
                        }}
                        title="بارگذاری مجدد"
                    >
                        <RefreshCw
                            size={15}
                            className={loading ? "animate-spin" : ""}
                        />
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowCreate(true)}
                        className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-700"
                    >
                        <Plus size={15} />
                        افزودن وظیفه
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {statusOptions.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatusFilter(opt.value)}
                        className={`rounded-xl px-3.5 py-1.5 text-[11.5px] font-bold transition-all duration-200 ${statusFilter === opt.value
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            }`}
                        style={{
                            background:
                                statusFilter === opt.value
                                    ? undefined
                                    : isDark
                                        ? "rgba(255,255,255,0.04)"
                                        : "rgba(15,23,42,0.04)",
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader
                        size={24}
                        className="animate-spin text-indigo-500"
                    />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">
                        در حال دریافت لیست وظایف...
                    </p>
                </div>
            )}

            {!loading && filteredTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                    <ClipboardList
                        size={28}
                        className="text-gray-300 dark:text-gray-700"
                    />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">
                        هنوز وظیفه‌ای ثبت نشده
                    </p>
                </div>
            )}

            {!loading && filteredTasks.length > 0 && (
                <motion.div
                    layout
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredTasks.map((task, index) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                index={index}
                                employees={employees}
                                onEdit={(t) => setEditingTask(t)}
                                onDelete={handleDelete}
                                onUpdated={handleTaskUpdated}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            <AnimatePresence>
                {showCreate && (
                    <CreateTaskModal
                        isOpen={showCreate}
                        onClose={() => setShowCreate(false)}
                        onSuccess={handleCreateSuccess}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {editingTask && (
                    <EditTaskModal
                        task={editingTask}
                        customers={customers}
                        departments={departments}
                        onClose={() => setEditingTask(null)}
                        onSuccess={handleEditSuccess}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}