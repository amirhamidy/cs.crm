"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Archive, ClipboardList, Loader, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import type { Task, TaskStatus } from "@/types/task";
import type { Department } from "@/types/department";
import type { Employee } from "@/types/employee";
import TaskCard from "@/components/user/tasks/TaskCardx";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { fetchPage } from "@/lib/api/_core";
import { cached, listAll, metaApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Pagination from "@/components/ui/Pagination";

const ACTIVE_STATUS = "in_progress" as TaskStatus;
const PAGE_SIZE = 12;

const CreateTaskModal = dynamic(() => import("@/components/user/tasks/CreateTaskModal"), {
    ssr: false,
    loading: () => null,
});
const CreateNoCaseTaskModal = dynamic(() => import("@/components/customcomponents/tasks/CreateNoCaseTaskModal"), {
    ssr: false,
    loading: () => null,
});
const EditTaskModal = dynamic(() => import("@/components/user/tasks/EditTaskModal"), {
    ssr: false,
    loading: () => null,
});

function parseAssignedEmployees(raw: unknown): number[] {
    const values = Array.isArray(raw) ? raw : [raw];

    return values
        .map((item) => {
            if (typeof item === "object" && item !== null) {
                const record = item as Record<string, unknown>;
                return Number(record.id ?? record.employee ?? record.user);
            }
            return Number(item);
        })
        .filter((id) => Number.isFinite(id) && id > 0);
}

async function mapLimit<T, R>(
    items: T[],
    limit: number,
    mapper: (item: T) => Promise<R>,
): Promise<R[]> {
    const results = new Array<R>(items.length);
    let cursor = 0;

    const worker = async () => {
        while (cursor < items.length) {
            const index = cursor++;
            results[index] = await mapper(items[index]);
        }
    };

    await Promise.all(
        Array.from({ length: Math.min(limit, items.length) }, worker),
    );

    return results;
}

export default function UserTasksPage() {
    const router = useRouter();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [showCreateNoCase, setShowCreateNoCase] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [taskDetails, setTaskDetails] = useState<Map<number, Task>>(new Map());
    const [employeeId, setEmployeeId] = useState<number | null>(null);
    const [employeeLoading, setEmployeeLoading] = useState(true);
    const userId = useAuthStore((state) => state.userId);
    const username = useAuthStore((state) => state.username);

    const list = usePaginatedList<Task>(
        (params, signal) =>
            fetchPage<Task>(
                apiRoutes.tasks,
                { ...params, status: ACTIVE_STATUS },
                signal,
            ),
        { pageSize: PAGE_SIZE, scrollTop: true },
    );

    const visibleTasks = useMemo(() => {
        if (!employeeId) return list.data;

        return list.data.filter((task) => {
            const record = task as Task & {
                created_by?: unknown;
                creator?: unknown;
                user?: unknown;
            };
            const assigned = parseAssignedEmployees(record.assigned_employee);
            const creatorId = Number(record.created_by ?? record.creator ?? record.user);

            return assigned.includes(employeeId) || (!!userId && creatorId === Number(userId));
        });
    }, [list.data, employeeId, userId]);

    const tasks = useMemo(
        () => visibleTasks.map((task) => ({ ...task, ...taskDetails.get(task.id) })),
        [visibleTasks, taskDetails],
    );
    const loading = list.loading || employeeLoading;

    useEffect(() => {
        let cancelled = false;

        cached(
            "user-tasks:employees",
            () => listAll<Employee>("/accounts/api/v1/employee/list/"),
            5 * 60_000,
        ).then((employeeList) => {
            if (cancelled) return;
            const matched = employeeList.find((employee) => {
                const record = employee as Employee & {
                    user_id?: number | string;
                    user?: number | string;
                };
                return (
                    (username && employee.username === username) ||
                    (userId && Number(record.user_id ?? record.user ?? employee.user_detail?.id) === Number(userId)) ||
                    (userId && Number(employee.id) === Number(userId))
                );
            });
            setEmployeeId(matched ? Number(matched.id) : null);
            setEmployeeLoading(false);
        }).catch(() => {
            if (!cancelled) setEmployeeLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [userId, username]);

    useEffect(() => {
        if (!employeeLoading && !visibleTasks.length && list.data.length && !list.loading && list.page < list.totalPages) {
            list.setPage(list.page + 1);
        }
    }, [employeeLoading, visibleTasks.length, list.data.length, list.loading, list.page, list.totalPages, list.setPage]);

    useEffect(() => {
        if (!visibleTasks.length) {
            setTaskDetails(new Map());
            return;
        }

        const controller = new AbortController();
        const { signal } = controller;

        void mapLimit(visibleTasks, 4, async (task) => {
            try {
                const { data } = await axiosInstance.get<Task>(
                    `/tasks/api/v1/tasks/${task.id}/`,
                    { signal, priority: "low" },
                );
                return { id: task.id, data };
            } catch {
                return null;
            }
        }).then((details) => {
            if (signal.aborted) return;
            setTaskDetails(new Map(
                details
                    .filter((item): item is { id: number; data: Task } => item !== null)
                    .map((item) => [item.id, item.data]),
            ));
        }).catch(() => undefined);

        return () => controller.abort();
    }, [visibleTasks]);

    useEffect(() => {
        let cancelled = false;

        metaApi.departments()
            .then((departmentList) => {
                if (cancelled) return;
                setDepartments(departmentList);
            })
            .catch(() => undefined);

        return () => {
            cancelled = true;
        };
    }, []);

    const refreshTasks = useCallback(() => {
        list.refetch();
    }, [list.refetch]);

    const handleDelete = useCallback(async (taskId: number) => {
        try {
            await axiosInstance.delete(apiRoutes.deleteTask(taskId));
            list.refetch();
        } catch {
            list.refetch();
            throw new Error("delete failed");
        }
    }, [list.refetch]);

    const handleCreateSuccess = useCallback(() => {
        setShowCreate(false);
        refreshTasks();
    }, [refreshTasks]);

    const handleCreateNoCaseSuccess = useCallback(() => {
        setShowCreateNoCase(false);
        refreshTasks();
    }, [refreshTasks]);

    const handleEditSuccess = useCallback(() => {
        setEditingTask(null);
        refreshTasks();
    }, [refreshTasks]);

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
                            {loading ? "در حال بارگذاری..." : `${tasks.length} وظیفه`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <button type="button" onClick={() => router.push("/user/Ticketarchive")} className="flex h-9 items-center gap-1.5 rounded-xl bg-gray-100 px-3 text-[11.5px] font-bold text-gray-500 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10">
                        <Archive size={13} /> بایگانی
                    </button>
                    <button type="button" onClick={refreshTasks} disabled={loading} className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-gray-300" title="بارگذاری مجدد">
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
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
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader size={22} className="animate-spin text-indigo-500" />
                    <p className="text-[12.5px] text-gray-400 dark:text-gray-500">در حال دریافت لیست وظایف...</p>
                </div>
            ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20">
                    <p className="text-[13px] text-gray-400 dark:text-gray-500">تسک در حال انجامی برای شما یافت نشد</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} onEdit={() => setEditingTask(task)} onDelete={handleDelete} />
                    ))}
                </div>
            )}

            {list.totalPages > 1 && (
                <Pagination
                    page={list.page}
                    totalPages={list.totalPages}
                    onChange={list.setPage}
                />
            )}

            <AnimatePresence>
                {showCreate && <CreateTaskModal open={showCreate} onClose={() => setShowCreate(false)} onSuccess={handleCreateSuccess} departments={departments} />}
            </AnimatePresence>
            <AnimatePresence>
                {showCreateNoCase && <CreateNoCaseTaskModal isOpen={showCreateNoCase} onClose={() => setShowCreateNoCase(false)} onSuccess={handleCreateNoCaseSuccess} />}
            </AnimatePresence>
            <AnimatePresence>
                {editingTask && <EditTaskModal task={editingTask} departments={departments} onClose={() => setEditingTask(null)} onSuccess={handleEditSuccess} />}
            </AnimatePresence>
        </div>
    );
}
