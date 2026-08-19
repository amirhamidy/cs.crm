"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, Loader, Plus, RefreshCw, Search } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import { Task, TaskStatus } from "@/types/task";
import { Department } from "@/types/department";
import TaskCard from "@/components/customcomponents/tasks/TaskCard";
import CreateTaskModal from "@/components/customcomponents/tasks/CreateTaskModal";
import EditTaskModal from "@/components/customcomponents/tasks/EditTaskModal";
import { taskStatusLabels } from "@/components/customcomponents/shared/constants";
import type { Customer } from '@/types/customer';
import type { Employee } from '@/types/employee';

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
    const [tasks, setTasks] = useState<Task[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
    const [search, setSearch] = useState("");
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
        const query = search.trim().toLowerCase();
        return tasks.filter((task) => {
            const matchesStatus =
                statusFilter === "ALL" || task.status === statusFilter;
            const matchesSearch =
                !query ||
                task.title?.toLowerCase().includes(query) ||
                task.description?.toLowerCase().includes(query);
            return matchesStatus && matchesSearch;
        });
    }, [tasks, search, statusFilter]);

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
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }, []);

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10">
                        <ClipboardList
                            size={16}
                            className="text-indigo-500 dark:text-indigo-400"
                        />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                            وظایف
                        </h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-400 dark:text-gray-500">
                            {loading
                                ? "در حال بارگذاری..."
                                : `${departments.length} دپارتمان فعال در سیستم`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                    <button
                        type="button"
                        onClick={fetchAll}
                        disabled={loading}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-gray-300"
                        title="بارگذاری مجدد"
                    >
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowCreate(true)}
                        className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-[12.5px] font-bold text-white transition-all duration-200 hover:bg-blue-100 hover:text-blue-600 dark:bg-blue-500 dark:hover:bg-blue-500/15 dark:hover:text-blue-300 sm:flex-none"
                    >
                        <Plus size={13} strokeWidth={2.5} />
                        <span className="whitespace-nowrap">افزودن وظیفه</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search
                        size={13}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="جستجو در وظایف..."
                        className="h-9 w-full rounded-xl border border-gray-200 bg-white pr-8 pl-3 text-[12.5px] text-gray-800 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-blue-500 dark:focus:ring-blue-500/10"
                    />
                </div>

                <div className="flex gap-1.5 flex-wrap">
                    {statusOptions.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setStatusFilter(opt.value)}
                            className={`h-8 rounded-lg px-3 text-[11.5px] font-semibold transition-colors ${statusFilter === opt.value
                                ? "bg-blue-600 text-white dark:bg-blue-500"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader size={22} className="animate-spin text-indigo-500" />
                    <p className="text-[12.5px] text-gray-400 dark:text-gray-500">
                        در حال دریافت لیست وظایف...
                    </p>
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20">
                    <p className="text-[13px] text-gray-400 dark:text-gray-500">
                        تسکی با این مشخصات پیدا نشد
                    </p>
                </div>
            ) : (
                <motion.div
                    layout
                    className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredTasks.map((task, i) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                index={i}
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
                        employees={employees}
                        onClose={() => setEditingTask(null)}
                        onSuccess={handleEditSuccess}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
