"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, ClipboardList, Loader, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import { useAuthStore } from "@/store/authStore";
import type { Task, TaskStatus } from "@/types/task";
import type { Customer } from "@/types/customer";
import type { Department } from "@/types/department";
import type { Employee } from "@/types/employee";
import TaskCard from "@/components/user/tasks/TaskCardx";
import CreateTaskModal from "@/components/user/tasks/CreateTaskModal";
import EditTaskModal from "@/components/user/tasks/EditTaskModal";

type ListResponse<T> = T[] | { results?: T[]; data?: T[] };

const ACTIVE_STATUS = "in_progress" as TaskStatus;

function extractList<T>(data: ListResponse<T> | undefined | null): T[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
        if (Array.isArray((data as any).results)) return (data as any).results;
        if (Array.isArray((data as any).data)) return (data as any).data;
    }
    return [];
}

function parseAssignedEmployees(raw: unknown): number[] {
    const ids: number[] = [];
    const push = (value: unknown) => {
        const id = Number(value);
        if (!isNaN(id) && id > 0) ids.push(id);
    };
    if (Array.isArray(raw)) {
        raw.forEach((item) =>
            typeof item === "object" && item !== null
                ? push((item as any).id ?? (item as any).employee ?? (item as any).user)
                : push(item)
        );
    } else if (typeof raw === "object" && raw !== null) {
        push((raw as any).id ?? (raw as any).employee ?? (raw as any).user);
    } else if (raw !== null && raw !== undefined) {
        push(raw);
    }
    return ids;
}

export default function UserTasksPage() {
    const router = useRouter();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const userId = useAuthStore((s) => s.userId);
    const username = useAuthStore((s) => s.username);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);

            const [tasksRes, customersRes, departmentsRes, employeesRes] = await Promise.all([
                axiosInstance.get<ListResponse<Task>>(apiRoutes.tasks),
                axiosInstance.get<ListResponse<Customer>>(apiRoutes.customers),
                axiosInstance.get<ListResponse<Department>>(apiRoutes.departments),
                axiosInstance.get<ListResponse<Employee>>("/accounts/api/v1/employee/list/"),
            ]);

            const employeeList = extractList<Employee>(employeesRes.data);
            const taskList = extractList<Task>(tasksRes.data);

            const matchedEmployee = employeeList.find(
                (emp: any) =>
                    (username && emp.username === username) ||
                    (userId && Number(emp.user_id ?? emp.user ?? emp.user_detail?.id) === Number(userId)) ||
                    (userId && Number(emp.id) === Number(userId))
            );

            const empId = matchedEmployee ? Number(matchedEmployee.id) : null;

            const detailedTasks = await Promise.all(
                taskList.map(async (task) => {
                    try {
                        const { data } = await axiosInstance.get<Task>(`/tasks/api/v1/tasks/${task.id}/`);
                        return { ...task, ...data };
                    } catch {
                        return task;
                    }
                })
            );

            const scoped = empId
                ? detailedTasks.filter((task: any) => {
                    const assigned = parseAssignedEmployees(task.assigned_employee);
                    const creatorId = Number(task.created_by ?? task.creator ?? task.user);
                    return assigned.includes(empId) || (userId && creatorId === Number(userId));
                })
                : detailedTasks;

            setTasks(scoped.filter((task) => task.status === ACTIVE_STATUS));
            setCustomers(extractList(customersRes.data));
            setDepartments(extractList(departmentsRes.data));
            setEmployees(employeeList);
        } catch {
            setTasks([]);
            setCustomers([]);
            setDepartments([]);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    }, [userId, username]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const filteredTasks = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return tasks;
        return tasks.filter(
            (task) => task.title?.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query)
        );
    }, [tasks, search]);

    const handleDelete = useCallback(
        async (taskId: number) => {
            try {
                await axiosInstance.delete(apiRoutes.deleteTask(taskId));
                setTasks((prev) => prev.filter((t) => t.id !== taskId));
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

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10">
                        <ClipboardList size={16} className="text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-[14px] font-extrabold text-gray-900 dark:text-white">وظایف در حال انجام</h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-400 dark:text-gray-500">
                            {loading ? "در حال بارگذاری..." : `${filteredTasks.length} وظیفه`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                    <button
                        type="button"
                        onClick={() => router.push("/dashboard/tasks/archive")}
                        className="flex h-9 items-center gap-1.5 rounded-xl bg-gray-100 px-3 text-[11.5px] font-bold text-gray-500 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
                    >
                        <Archive size={13} />
                        بایگانی
                    </button>

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

            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجو در عنوان یا توضیحات..."
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[12.5px] text-gray-700 outline-none transition-colors focus:border-indigo-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
            />

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader size={22} className="animate-spin text-indigo-500" />
                    <p className="text-[12.5px] text-gray-400 dark:text-gray-500">در حال دریافت لیست وظایف...</p>
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20">
                    <p className="text-[13px] text-gray-400 dark:text-gray-500">تسک در حال انجامی برای شما یافت نشد</p>
                </div>
            ) : (
                <motion.div layout className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                        {filteredTasks.map((task) => (
                            <TaskCard key={task.id} task={task} employees={employees} onEdit={() => setEditingTask(task)} onDelete={handleDelete} />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            <AnimatePresence>
                {showCreate && (
                    <CreateTaskModal open={showCreate} onClose={() => setShowCreate(false)} onSuccess={handleCreateSuccess} departments={departments} />
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