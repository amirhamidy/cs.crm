"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, Loader2, Plus, Search } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import { Task, TaskStatus } from "@/types/task";
import { Customer } from "@/types/customer";
import { Department } from "@/types/department";
import { Employee } from "@/types/employee";
import TaskCard from "@/components/customcomponents/tasks/TaskCard";
import CreateTaskModal from "@/components/customcomponents/tasks/CreateTaskModal";
import EditTaskModal from "@/components/customcomponents/tasks/EditTaskModal";
import { taskStatusLabels } from "@/components/customcomponents/shared/constants";

const getListData = <T,>(data: T[] | { results?: T[] }) => {
    return Array.isArray(data) ? data : data.results ?? [];
};

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
        setLoading(true);

        try {
            const [tasksResponse, customersResponse, departmentsResponse, employeesResponse] =
                await Promise.all([
                    axiosInstance.get(apiRoutes.tasks),
                    axiosInstance.get(apiRoutes.customers),
                    axiosInstance.get(apiRoutes.departments),
                    axiosInstance.get(apiRoutes.employees),
                ]);

            setTasks(getListData<Task>(tasksResponse.data));
            setCustomers(getListData<Customer>(customersResponse.data));
            setDepartments(getListData<Department>(departmentsResponse.data));
            setEmployees(getListData<Employee>(employeesResponse.data));
        } catch (error) {
            console.error("خطا در دریافت اطلاعات تسک‌ها:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const filteredTasks = useMemo(() => {
        const query = search.trim().toLowerCase();

        return tasks.filter((task) => {
            const matchesStatus =
                statusFilter === "ALL" || task.status === statusFilter;

            const matchesSearch =
                !query ||
                task.title.toLowerCase().includes(query) ||
                task.description?.toLowerCase().includes(query);

            return matchesStatus && matchesSearch;
        });
    }, [tasks, search, statusFilter]);

    const handleDelete = async (taskId: number) => {
        try {
            await axiosInstance.delete(apiRoutes.deleteTask(taskId));
            await fetchAll();
        } catch (error) {
            console.error("خطا در حذف تسک:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0b1220] p-4 text-white sm:p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold sm:text-3xl">مدیریت تسک‌ها</h1>
                        <p className="mt-1 text-sm text-slate-400">
                            {tasks.length} تسک ثبت شده
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 rounded-4xl bg-blue-600 px-5 py-3 text-sm font-medium transition-colors hover:bg-blue-500"
                    >
                        <Plus className="h-4 w-4" />
                        تسک جدید
                    </button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="جستجوی عنوان یا توضیحات تسک..."
                            className="w-full rounded-4xl border border-slate-700 bg-slate-900 py-3 pl-4 pr-11 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value as TaskStatus | "ALL")
                        }
                        className="rounded-4xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-blue-500"
                    >
                        <option value="ALL">همه وضعیت‌ها</option>

                        {(Object.keys(taskStatusLabels) as TaskStatus[]).map((status) => (
                            <option key={status} value={status}>
                                {taskStatusLabels[status]}
                            </option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-4xl border border-dashed border-slate-700 py-16 text-slate-500">
                        <Inbox className="h-10 w-10" />
                        <p className="text-sm">تسکی با این مشخصات پیدا نشد</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {filteredTasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onEdit={() => setEditingTask(task)}
                                onDelete={() => handleDelete(task.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <CreateTaskModal
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                onSuccess={async () => {
                    setShowCreate(false);
                    await fetchAll();
                }}
            />

            
                <EditTaskModal
                    task={editingTask}
                    customers={customers}
                    departments={departments}
                    employees={employees}
                    onClose={() => setEditingTask(null)}
                    onSuccess={async () => {
                        setEditingTask(null);
                        await fetchAll();
                    }}
                />
        </div>
    );
}
