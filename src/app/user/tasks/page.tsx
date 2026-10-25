"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, ClipboardList, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import { listAll, tasksApi } from "@/lib/api";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import Pagination from "@/components/ui/Pagination";
import CardSkeletonGrid from "@/components/ui/CardSkeletonGrid";
import { useAuthStore } from "@/store/authStore";
import type { Task, TaskStatus } from "@/types/task";
import type { Customer } from "@/types/customer";
import type { Department } from "@/types/department";
import type { Employee } from "@/types/employee";
import TaskCard from "@/components/user/tasks/TaskCardx";
import CreateTaskModal from "@/components/user/tasks/CreateTaskModal";
import CreateNoCaseTaskModal from "@/components/customcomponents/tasks/CreateNoCaseTaskModal";
import EditTaskModal from "@/components/user/tasks/EditTaskModal";

const ACTIVE_STATUS = "in_progress" as TaskStatus;

function parseAssignedEmployees(raw: unknown): number[] {
    const ids: number[] = [];
    const push = (value: unknown) => {
        const id = Number(value);
        if (Number.isFinite(id) && id > 0) ids.push(id);
    };
    if (Array.isArray(raw)) {
        raw.forEach((item) => push(
            typeof item === "object" && item !== null
                ? (item as any).id ?? (item as any).employee ?? (item as any).user
                : item
        ));
    } else if (raw !== null && raw !== undefined) {
        push(typeof raw === "object"
            ? (raw as any).id ?? (raw as any).employee ?? (raw as any).user
            : raw);
    }
    return ids;
}

const PAGE_SIZE = 12;

export default function UserTasksPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [metaLoading, setMetaLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showCreateNoCase, setShowCreateNoCase] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [removed, setRemoved] = useState<Set<number>>(new Set());
    const userId = useAuthStore((s) => s.userId);
    const username = useAuthStore((s) => s.username);

    // empId کارمند فعلی؛ برای محدود کردن به وظایف خودش
    const empId = useMemo(() => {
        const matched = employees.find((emp: any) =>
            (username && emp.username === username) ||
            (userId && Number(emp.user_id ?? emp.user ?? emp.user_detail?.id) === Number(userId)) ||
            (userId && Number(emp.id) === Number(userId))
        );
        return matched ? Number(matched.id) : null;
    }, [employees, username, userId]);

    // صفحه‌بندی و جستجو سمت سرور؛ جزئیات فقط برای همین صفحه (حداکثر ۱۲ مورد) خوانده می‌شود.
    const list = usePaginatedList<Task>(
        async (params, signal) => {
            const res = await tasksApi.page({ ...params, status: ACTIVE_STATUS } as never, signal);
            const detailed = await Promise.all(
                res.results.map(async (task) => {
                    try {
                        const { data } = await axiosInstance.get<Task>(`/tasks/api/v1/tasks/${task.id}/`, { signal });
                        return { ...task, ...data };
                    } catch {
                        return task;
                    }
                })
            );
            return { ...res, results: detailed };
        },
        { pageSize: PAGE_SIZE, enabled: !metaLoading, scrollTop: true }
    );

    const tasks = useMemo(() => {
        const mine = empId
            ? list.data.filter((task: any) => {
                const assigned = parseAssignedEmployees(task.assigned_employee);
                const creatorId = Number(task.created_by ?? task.creator ?? task.user);
                return assigned.includes(empId) || (!!userId && creatorId === Number(userId));
            })
            : list.data;
        return mine.filter((task) => task.status === ACTIVE_STATUS && !removed.has(task.id));
    }, [list.data, empId, userId, removed]);

    const loading = metaLoading || list.loading;

    const fetchMeta = useCallback(async () => {
        try {
            setMetaLoading(true);
            const [customerList, departmentList, employeeList] = await Promise.all([
                listAll<Customer>(apiRoutes.customers),
                listAll<Department>(apiRoutes.departments),
                listAll<Employee>("/accounts/api/v1/employee/list/"),
            ]);
            setCustomers(customerList);
            setDepartments(departmentList);
            setEmployees(employeeList);
        } catch {
            setCustomers([]);
            setDepartments([]);
            setEmployees([]);
        } finally {
            setMetaLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchMeta();
    }, [fetchMeta]);

    const fetchAll = useCallback(async () => {
        setRemoved(new Set());
        tasksApi.invalidate();
        list.refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [list.refetch]);

    const handleDelete = useCallback(async (taskId: number) => {
        try {
            await axiosInstance.delete(apiRoutes.deleteTask(taskId));
            setRemoved((prev) => new Set(prev).add(taskId));
        } catch {
            await fetchAll();
            throw new Error("delete failed");
        }
    }, [fetchAll]);

    const handleCreateSuccess = useCallback(() => {
        setShowCreate(false);
        void fetchAll();
    }, [fetchAll]);

    const handleCreateNoCaseSuccess = useCallback(() => {
        setShowCreateNoCase(false);
        void fetchAll();
    }, [fetchAll]);

    const handleEditSuccess = useCallback(() => {
        setEditingTask(null);
        void fetchAll();
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
                            {loading ? "در حال بارگذاری..." : `${list.count} وظیفه`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <button type="button" onClick={() => router.push("/user/Ticketarchive")} className="flex h-9 items-center gap-1.5 rounded-xl bg-gray-100 px-3 text-[11.5px] font-bold text-gray-500 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10">
                        <Archive size={13} /> بایگانی
                    </button>
                    <button type="button" onClick={() => void fetchAll()} disabled={list.loading} className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-gray-300" title="بارگذاری مجدد">
                        <RefreshCw size={13} className={list.loading ? "animate-spin" : ""} />
                    </button>
                    <button type="button" onClick={() => setShowCreate(true)} className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-[12.5px] font-bold text-white transition-all duration-200 hover:bg-blue-100 hover:text-blue-600 dark:bg-blue-500 dark:hover:bg-blue-500/15 dark:hover:text-blue-300 sm:flex-none">
                        <Plus size={13} strokeWidth={2.5} /><span className="whitespace-nowrap">افزودن وظیفه</span>
                    </button>
                    <button type="button" onClick={() => setShowCreateNoCase(true)} className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 text-[12.5px] font-bold text-emerald-600 transition-all duration-200 hover:bg-emerald-600 hover:text-white dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500 dark:hover:text-white sm:flex-none">
                        <Plus size={13} strokeWidth={2.5} /><span className="whitespace-nowrap">ایجاد وظیفه بدون پرونده</span>
                    </button>
                </div>
            </div>

            <input value={list.search} onChange={(e) => list.setSearch(e.target.value)} placeholder="جستجو در عنوان یا توضیحات..." className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[12.5px] text-gray-700 outline-none transition-colors focus:border-indigo-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200" />

            {loading ? (
                <CardSkeletonGrid count={6} className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3" />
            ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20">
                    <p className="text-[13px] text-gray-400 dark:text-gray-500">تسک در حال انجامی برای شما یافت نشد</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} employees={employees} onEdit={() => setEditingTask(task)} onDelete={handleDelete} />
                    ))}
                </div>
            )}

            {list.totalPages > 1 && <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />}

            <AnimatePresence>
                {showCreate && <CreateTaskModal open={showCreate} onClose={() => setShowCreate(false)} onSuccess={handleCreateSuccess} departments={departments} />}
            </AnimatePresence>
            <AnimatePresence>
                {showCreateNoCase && <CreateNoCaseTaskModal isOpen={showCreateNoCase} onClose={() => setShowCreateNoCase(false)} onSuccess={handleCreateNoCaseSuccess} />}
            </AnimatePresence>
            <AnimatePresence>
                {editingTask && <EditTaskModal task={editingTask} customers={customers} departments={departments} employees={employees} onClose={() => setEditingTask(null)} onSuccess={handleEditSuccess} />}
            </AnimatePresence>
        </div>
    );
}
