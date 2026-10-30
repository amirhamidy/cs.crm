"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Archive, ClipboardList, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import { metaApi, tasksApi } from "@/lib/api";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import Pagination from "@/components/ui/Pagination";
import dynamic from "next/dynamic";
import CardSkeletonGrid from "@/components/ui/CardSkeletonGrid";
import LazyLoading from "@/components/ui/LazyLoading";
import type { Task, TaskStatus } from "@/types/task";
import type { Department } from "@/types/department";
import TaskCard from "@/components/user/tasks/TaskCardx";


const CreateTaskModal = dynamic(() => import("@/components/user/tasks/CreateTaskModal"), {
    ssr: false,
    loading: () => <LazyLoading />,
});
const CreateNoCaseTaskModal = dynamic(() => import("@/components/tasks/CreateNoCaseTaskModal"), {
    ssr: false,
    loading: () => <LazyLoading />,
});
const EditTaskModal = dynamic(() => import("@/components/user/tasks/EditTaskModal"), {
    ssr: false,
    loading: () => <LazyLoading />,
});

const ACTIVE_STATUS = "in_progress" as TaskStatus;

const PAGE_SIZE = 12;

export default function UserTasksPage() {
    const router = useRouter();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [showCreateNoCase, setShowCreateNoCase] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [removed, setRemoved] = useState<Set<number>>(new Set());

    
    
    const list = usePaginatedList<Task>(
        (params, signal) => tasksApi.page({ ...params, status: ACTIVE_STATUS } as never, signal),
        { pageSize: PAGE_SIZE, scrollTop: true }
    );

    const tasks = useMemo(
        () => list.data.filter((task) => task.status === ACTIVE_STATUS && !removed.has(task.id)),
        [list.data, removed]
    );

    const loading = list.loading;

    
    useEffect(() => {
        metaApi.departments().then(setDepartments).catch(() => setDepartments([]));
    }, []);

    const fetchAll = useCallback(async () => {
        setRemoved(new Set());
        tasksApi.invalidate();
        list.refetch();
        
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
                        <TaskCard key={task.id} task={task} onEdit={() => setEditingTask(task)} onDelete={handleDelete} />
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
                {editingTask && <EditTaskModal task={editingTask} departments={departments} onClose={() => setEditingTask(null)} onSuccess={handleEditSuccess} />}
            </AnimatePresence>
        </div>
    );
}
