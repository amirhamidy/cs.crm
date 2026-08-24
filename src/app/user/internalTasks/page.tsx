"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, Loader, Plus, RefreshCw, Search } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import { Task, TaskStatus } from "@/types/task";
import { Department } from "@/types/department";
import InternalTaskCard from "@/components/customcomponents/tasks/InternalTaskCard";
import CreateInternalTaskModal from "@/components/customcomponents/tasks/CreateInternalTaskModal";
import EditInternalTaskModal from "@/components/customcomponents/tasks/EditInternalTaskModal";
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

export default function AdminInternalTasksPage() {
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
                    axiosInstance.get<ListResponse<Task>>("/tasks/api/v1/internal-tasks/"),
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
                await axiosInstance.delete(`/tasks/api/v1/internal-tasks/${taskId}/`);
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
                            وظایف درون سازمانی
                        </h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-400 dark:text-gray-500">
                            {loading
                                ? "در حال بارگذاری..."
                                : `${tasks.length} وظیفه درون سازمانی`}
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div
                    className="flex h-10 items-center gap-2 rounded-2xl px-3"
                    style={{
                        background: "rgba(15,23,42,0.04)",
                        border: "1px solid rgba(15,23,42,0.06)",
                    }}
                >
                    <Search size={14} className="text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="جستجوی وظایف..."
                        className="h-full w-full bg-transparent text-[12.5px] text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-100"
                    />
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {statusOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setStatusFilter(option.value)}
                            className={`rounded-xl px-3 py-1.5 text-[11.5px] font-bold transition-colors ${
                                statusFilter === option.value
                                    ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5"
                            }`}
                        >
                            {option.label}
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
                        وظیفه‌ای با این مشخصات پیدا نشد
                    </p>
                </div>
            ) : (
                <motion.div
                    layout
                    className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredTasks.map((task, i) => (
                            <InternalTaskCard
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
                    <CreateInternalTaskModal
                        isOpen={showCreate}
                        onClose={() => setShowCreate(false)}
                        onSuccess={handleCreateSuccess}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {editingTask && (
                    <EditInternalTaskModal
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