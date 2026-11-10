"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Archive, ClipboardList, Plus } from "lucide-react";
import PageHeader, { HEADER_BTN_PRIMARY, HEADER_BTN_SECONDARY, HEADER_BTN_SUCCESS } from "@/components/ui/PageHeader";
import { CountSkeleton, TaskCardSkeleton } from "@/components/ui/skeletons";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import { metaApi, tasksApi } from "@/lib/api";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import Pagination from "@/components/ui/Pagination";
import dynamic from "next/dynamic";
import type { Task, TaskStatus } from "@/types/task";
import type { Department } from "@/types/department";
import TaskCard from "@/components/user/tasks/TaskCardx";


const CreateTaskModal = dynamic(() => import("@/components/user/tasks/CreateTaskModal"), {
    ssr: false,
    loading: () => null,
});
const CreateNoCaseTaskModal = dynamic(() => import("@/components/tasks/CreateNoCaseTaskModal"), {
    ssr: false,
    loading: () => null,
});
const EditTaskModal = dynamic(() => import("@/components/tasks/EditTaskModal"), {
    ssr: false,
    loading: () => null,
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
            <PageHeader
                icon={ClipboardList}
                title="وظایف در حال انجام"
                subtitle={loading ? <CountSkeleton /> : `${list.count} وظیفه`}
                search={{ value: list.search, onChange: list.setSearch, placeholder: "جستجو در وظایف..." }}
                leading={
                    <button type="button" onClick={() => router.push("/user/Ticketarchive")} className={HEADER_BTN_SECONDARY}>
                        <Archive size={15} />
                        بایگانی
                    </button>
                }
                onRefresh={() => void fetchAll()}
                refreshing={list.loading}
            >
                <button type="button" onClick={() => setShowCreate(true)} className={HEADER_BTN_PRIMARY}>
                    <Plus size={15} />
                    افزودن وظیفه
                </button>
                <button type="button" onClick={() => setShowCreateNoCase(true)} className={HEADER_BTN_SUCCESS}>
                    <Plus size={15} />
                    ایجاد وظیفه بدون پرونده
                </button>
            </PageHeader>

            {loading ? (
                <TaskCardSkeleton count={6} className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3" />
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
