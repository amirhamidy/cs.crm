"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Archive, Check, ClipboardList, Eye, Plus } from "lucide-react";
import PageHeader, { HEADER_BTN_PRIMARY, HEADER_BTN_SECONDARY, HEADER_BTN_SUCCESS } from "@/components/ui/PageHeader";
import { useSearchParams, useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import { metaApi, tasksApi } from "@/lib/api";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import Pagination from "@/components/ui/Pagination";
import { CountSkeleton, TaskCardSkeleton } from "@/components/ui/skeletons";
import { Task, TaskStatus } from "@/types/task";
import { Department } from "@/types/department";
import dynamic from "next/dynamic";
import SuspenseWrapper from "@/components/SuspenseWrapper";
import TaskCard from "@/components/tasks/TaskCard";


const CreateTaskModal = dynamic(() => import("@/components/tasks/CreateTaskModal"), {
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

function AdminTasksPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const list = usePaginatedList<Task>((params, signal) => tasksApi.page({ ...params, status: ACTIVE_STATUS } as never, signal), { pageSize: 12, scrollTop: true });
    const [removed, setRemoved] = useState<Set<number>>(new Set());
    const [patched, setPatched] = useState<Map<number, Task>>(new Map());
    const tasks = useMemo(
        () => list.data.filter((t) => !removed.has(t.id) && t.status === ACTIVE_STATUS).map((t) => patched.get(t.id) ?? t),
        [list.data, removed, patched]
    );
    const [departments, setDepartments] = useState<Department[]>([]);
    const loading = list.loading;
    const [showCreate, setShowCreate] = useState(false);
    const [showCreateNoCase, setShowCreateNoCase] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [highlightedTaskId, setHighlightedTaskId] = useState<number | null>(null);
    const [viewedTaskId, setViewedTaskId] = useState<number | null>(null);

    
    const fetchAll = useCallback(() => {
        setRemoved(new Set());
        setPatched(new Map());
        tasksApi.invalidate();
        list.refetch();
    }, [list.refetch]);

    
    useEffect(() => {
        metaApi.departments().then(setDepartments).catch(() => setDepartments([]));
    }, []);

    useEffect(() => {
        const taskParam = searchParams.get("task");
        if (!taskParam || loading || !tasks.length) return;

        const targetId = Number(taskParam);
        if (!Number.isFinite(targetId)) return;

        const targetTask = tasks.find((task) => task.id === targetId);
        if (!targetTask) return;

        setViewedTaskId(null);
        setHighlightedTaskId(targetTask.id);
    }, [searchParams, loading, tasks]);

    const handleDelete = useCallback(
        async (taskId: number): Promise<boolean> => {
            try {
                await axiosInstance.delete(apiRoutes.deleteTask(taskId));
                setRemoved((prev) => new Set(prev).add(taskId));
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

    const handleCreateNoCaseSuccess = useCallback(() => {
        setShowCreateNoCase(false);
        fetchAll();
    }, [fetchAll]);

    const handleEditSuccess = useCallback(() => {
        setEditingTask(null);
        fetchAll();
    }, [fetchAll]);

    const handleTaskUpdated = useCallback((updated: Task) => {
        if (updated.status !== ACTIVE_STATUS) setRemoved((prev) => new Set(prev).add(updated.id));
        else setPatched((prev) => new Map(prev).set(updated.id, updated));
    }, []);

    const handleTaskViewed = useCallback(
        (taskId: number) => {
            setHighlightedTaskId(null);
            setViewedTaskId(taskId);

            setTimeout(() => {
                setViewedTaskId(null);
                const params = new URLSearchParams(searchParams.toString());
                params.delete("task");
                router.replace(params.toString() ? `?${params.toString()}` : window.location.pathname, { scroll: false });
            }, 1000);
        },
        [router, searchParams]
    );

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
            <PageHeader
                icon={ClipboardList}
                title="وظایف در حال انجام"
                subtitle={loading ? <CountSkeleton /> : `${list.count} وظیفه`}
                search={{ value: list.search, onChange: list.setSearch, placeholder: "جستجو در وظایف..." }}
                leading={
                    <button type="button" onClick={() => router.push("/admin/archive")} className={HEADER_BTN_SECONDARY}>
                        <Archive size={15} />
                        بایگانی
                    </button>
                }
                onRefresh={fetchAll}
                refreshing={loading}
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

            {loading && <TaskCardSkeleton count={6} />}

            {!loading && tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                    <ClipboardList size={28} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">تسک در حال انجامی وجود ندارد</p>
                </div>
            )}

            {!loading && tasks.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <>
                        {tasks.map((task, index) => {
                            const isHighlighted = highlightedTaskId === task.id;
                            const isViewed = viewedTaskId === task.id;

                            return (
                                <m.div
                                    key={task.id}
                                    className="relative"
                                    animate={{ scale: isHighlighted ? [1, 1.012, 1] : 1 }}
                                    transition={isHighlighted ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
                                >
                                    {isHighlighted && (
                                        <>
                                            <m.div
                                                className="pointer-events-none absolute -inset-1 z-0 rounded-[26px] bg-red-500/20 blur-xl"
                                                animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.98, 1.03, 0.98] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                            />
                                            <m.div
                                                className="pointer-events-none absolute inset-0 z-10 rounded-[24px]"
                                                animate={{
                                                    boxShadow: [
                                                        "0 0 0 1px rgba(239,68,68,0.5), 0 0 15px rgba(239,68,68,0.15)",
                                                        "0 0 0 2px rgba(239,68,68,0.9), 0 0 30px rgba(239,68,68,0.35)",
                                                        "0 0 0 1px rgba(239,68,68,0.5), 0 0 15px rgba(239,68,68,0.15)",
                                                    ],
                                                }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                            />
                                        </>
                                    )}

                                    <div className={`relative z-20 ${isHighlighted ? "pointer-events-none [&_*:hover]:!border-transparent [&_*:hover]:!ring-0 [&_*:hover]:!shadow-none" : ""}`}>
                                        <TaskCard task={task} index={index} onEdit={(t) => setEditingTask(t)} onDelete={handleDelete} onUpdated={handleTaskUpdated} />
                                    </div>

                                    <AnimatePresence>
                                        {isHighlighted && (
                                            <m.button
                                                type="button"
                                                onClick={() => handleTaskViewed(task.id)}
                                                className="absolute bottom-3 left-3 z-40 flex items-center gap-2 overflow-hidden rounded-xl px-3 py-2 text-[11px] font-extrabold text-white"
                                                style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)", boxShadow: "0 8px 22px rgba(185,28,28,.35)" }}
                                                initial={{ opacity: 0, scale: 0.7, y: 8 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.7, y: 8 }}
                                                whileTap={{ scale: 0.94 }}
                                            >
                                                <m.span className="h-1.5 w-1.5 rounded-full bg-white" animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 0.8, repeat: Infinity }} />
                                                <Eye size={13} />
                                                مشاهده شد
                                            </m.button>
                                        )}
                                    </AnimatePresence>

                                    <AnimatePresence>
                                        {isViewed && (
                                            <m.div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.05 }} transition={{ duration: 0.35 }}>
                                                <m.div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.05 }} transition={{ duration: 0.45, ease: "easeInOut" }}>
                                                    <Check size={21} strokeWidth={3} />
                                                </m.div>
                                            </m.div>
                                        )}
                                    </AnimatePresence>
                                </m.div>
                            );
                        })}
                    </>
                </div>
            )}

            {list.totalPages > 1 && <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />}

            <AnimatePresence>
                {showCreate && <CreateTaskModal isOpen={showCreate} onClose={() => setShowCreate(false)} onSuccess={handleCreateSuccess} />}
            </AnimatePresence>

            <AnimatePresence>
                {showCreateNoCase && <CreateNoCaseTaskModal isOpen={showCreateNoCase} onClose={() => setShowCreateNoCase(false)} onSuccess={handleCreateNoCaseSuccess} />}
            </AnimatePresence>

            <AnimatePresence>
                {editingTask && (
                    <EditTaskModal task={editingTask} departments={departments} onClose={() => setEditingTask(null)} onSuccess={handleEditSuccess} />
                )}
            </AnimatePresence>
        </div>
    );
}

export default function AdminTasksPage() {
    return (
        <SuspenseWrapper fallback={<TaskCardSkeleton />}>
            <AdminTasksPageContent />
        </SuspenseWrapper>
    );
}