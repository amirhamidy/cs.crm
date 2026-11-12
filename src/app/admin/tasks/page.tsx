"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, Check, ClipboardList, Eye, Loader, Plus, RefreshCw } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import { Task, TaskStatus } from "@/types/task";
import { Department } from "@/types/department";
import SuspenseWrapper from "@/components/SuspenseWrapper";
import TaskCard from "@/components/customcomponents/tasks/TaskCard";
import type { Customer } from "@/types/customer";
import type { Employee } from "@/types/employee";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { fetchPage } from "@/lib/api/_core";
import { cached, customersApi, listAll, metaApi, tasksApi } from "@/lib/api";
import Pagination from "@/components/ui/Pagination";

const ACTIVE_STATUS = "in_progress" as TaskStatus;
const PAGE_SIZE = 12;

const CreateTaskModal = dynamic(() => import("@/components/customcomponents/tasks/CreateTaskModal"), {
    ssr: false,
    loading: () => null,
});
const CreateNoCaseTaskModal = dynamic(() => import("@/components/customcomponents/tasks/CreateNoCaseTaskModal"), {
    ssr: false,
    loading: () => null,
});
const EditTaskModal = dynamic(() => import("@/components/customcomponents/tasks/EditTaskModal"), {
    ssr: false,
    loading: () => null,
});

function AdminTasksPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customersLoaded, setCustomersLoaded] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [showCreateNoCase, setShowCreateNoCase] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [highlightedTaskId, setHighlightedTaskId] = useState<number | null>(null);
    const [viewedTaskId, setViewedTaskId] = useState<number | null>(null);
    const [deepLinkedTask, setDeepLinkedTask] = useState<Task | null>(null);
    const deepLinkRequested = useRef<string | null>(null);

    const list = usePaginatedList<Task>(
        (params, signal) =>
            fetchPage<Task>(
                apiRoutes.tasks,
                { ...params, status: ACTIVE_STATUS },
                signal,
            ),
        { pageSize: PAGE_SIZE, scrollTop: true },
    );

    const tasks = useMemo(() => {
        if (!deepLinkedTask || list.data.some((task) => task.id === deepLinkedTask.id)) {
            return list.data;
        }
        return [deepLinkedTask, ...list.data];
    }, [deepLinkedTask, list.data]);
    const loading = list.loading;

    useEffect(() => {
        let cancelled = false;

        Promise.all([
            metaApi.departments(),
            cached(
                "admin-tasks:employees",
                () => listAll<Employee>(apiRoutes.employees),
                5 * 60_000,
            ),
        ])
            .then(([departmentList, employeeList]) => {
                if (cancelled) return;
                setDepartments(departmentList);
                setEmployees(employeeList);
            })
            .catch(() => undefined);

        return () => {
            cancelled = true;
        };
    }, []);

    const refreshTasks = useCallback(() => {
        tasksApi.invalidate();
        list.refetch();
    }, [list.refetch]);

    useEffect(() => {
        if (!editingTask || customersLoaded) return;

        let cancelled = false;
        customersApi.listAll()
            .then((customerList) => {
                if (cancelled) return;
                setCustomers(customerList);
                setCustomersLoaded(true);
            })
            .catch(() => {
                if (!cancelled) setCustomersLoaded(true);
            });

        return () => {
            cancelled = true;
        };
    }, [editingTask, customersLoaded]);

    useEffect(() => {
        const taskParam = searchParams.get("task");
        if (!taskParam || loading) return;

        const targetId = Number(taskParam);
        if (!Number.isFinite(targetId)) return;

        const targetTask = list.data.find((task) => task.id === targetId);
        if (targetTask) {
            setDeepLinkedTask(null);
            setViewedTaskId(null);
            setHighlightedTaskId(targetTask.id);
            return;
        }

        if (deepLinkRequested.current === taskParam) return;
        deepLinkRequested.current = taskParam;
        let cancelled = false;

        tasksApi.get<Task>(targetId).then((targetTask) => {
            if (cancelled || targetTask.status !== ACTIVE_STATUS) return;
            setDeepLinkedTask(targetTask);
            setViewedTaskId(null);
            setHighlightedTaskId(targetTask.id);
        }).catch(() => undefined);

        return () => {
            cancelled = true;
        };
    }, [searchParams, loading, list.data]);

    const handleEdit = useCallback((task: Task) => {
        setEditingTask(task);
    }, []);

    const handleDelete = useCallback(
        async (taskId: number): Promise<boolean> => {
            try {
                await axiosInstance.delete(apiRoutes.deleteTask(taskId));
                setDeepLinkedTask((current) => current?.id === taskId ? null : current);
                refreshTasks();
                return true;
            } catch {
                refreshTasks();
                throw new Error("delete failed");
            }
        },
        [refreshTasks]
    );

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

    const handleTaskUpdated = useCallback((updated: Task) => {
        setDeepLinkedTask((current) => {
            if (current?.id !== updated.id) return current;
            return updated.status === ACTIVE_STATUS ? updated : null;
        });
        refreshTasks();
    }, [refreshTasks]);

    const handleTaskViewed = useCallback(
        (taskId: number) => {
            setHighlightedTaskId(null);
            setViewedTaskId(taskId);

            setTimeout(() => {
                setViewedTaskId(null);
                setDeepLinkedTask(null);
                deepLinkRequested.current = null;
                const params = new URLSearchParams(searchParams.toString());
                params.delete("task");
                router.replace(params.toString() ? `?${params.toString()}` : window.location.pathname, { scroll: false });
            }, 1000);
        },
        [router, searchParams]
    );

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)" }}>
                        <ClipboardList size={18} className="text-indigo-500" />
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">وظایف در حال انجام</h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">{loading ? "در حال بارگذاری..." : `${list.count} وظیفه`}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => router.push("/admin/archive")}
                        className="flex h-10 items-center gap-2 rounded-2xl px-3.5 text-[12px] font-bold transition-colors"
                        style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)", color: isDark ? "#cbd5e1" : "#475569" }}
                    >
                        <Archive size={15} />
                        بایگانی
                    </button>

                    <button
                        type="button"
                        onClick={refreshTasks}
                        disabled={loading}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl transition-colors disabled:opacity-50"
                        style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)", color: isDark ? "#cbd5e1" : "#475569" }}
                        title="بارگذاری مجدد"
                    >
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowCreate(true)}
                        className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-700"
                    >
                        <Plus size={15} />
                        افزودن وظیفه
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowCreateNoCase(true)}
                        className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-emerald-700"
                    >
                        <Plus size={15} />
                        ایجاد وظیفه بدون پرونده
                    </button>
                </div>
            </div>

            <input
                value={list.search}
                onChange={(event) => list.setSearch(event.target.value)}
                placeholder="جستجو در وظایف..."
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[12px] text-gray-700 outline-none transition-colors focus:border-indigo-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
            />

            {loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader size={24} className="animate-spin text-indigo-500" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">در حال دریافت لیست وظایف...</p>
                </div>
            )}

            {!loading && tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                    <ClipboardList size={28} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">تسک در حال انجامی وجود ندارد</p>
                </div>
            )}

            {!loading && tasks.length > 0 && (
                <motion.div layout className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                        {tasks.map((task, index) => {
                            const isHighlighted = highlightedTaskId === task.id;
                            const isViewed = viewedTaskId === task.id;

                            return (
                                <motion.div
                                    key={task.id}
                                    layout
                                    className="relative"
                                    animate={{ scale: isHighlighted ? [1, 1.012, 1] : 1 }}
                                    transition={isHighlighted ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
                                >
                                    {isHighlighted && (
                                        <>
                                            <motion.div
                                                className="pointer-events-none absolute -inset-1 z-0 rounded-[26px] bg-red-500/20 blur-xl"
                                                animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.98, 1.03, 0.98] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                            />
                                            <motion.div
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
                                        <TaskCard task={task} index={index} employees={employees} onEdit={handleEdit} onDelete={handleDelete} onUpdated={handleTaskUpdated} />
                                    </div>

                                    <AnimatePresence>
                                        {isHighlighted && (
                                            <motion.button
                                                type="button"
                                                onClick={() => handleTaskViewed(task.id)}
                                                className="absolute bottom-3 left-3 z-40 flex items-center gap-2 overflow-hidden rounded-xl px-3 py-2 text-[11px] font-extrabold text-white"
                                                style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)", boxShadow: "0 8px 22px rgba(185,28,28,.35)" }}
                                                initial={{ opacity: 0, scale: 0.7, y: 8 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.7, y: 8 }}
                                                whileTap={{ scale: 0.94 }}
                                            >
                                                <motion.span className="h-1.5 w-1.5 rounded-full bg-white" animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 0.8, repeat: Infinity }} />
                                                <Eye size={13} />
                                                مشاهده شد
                                            </motion.button>
                                        )}
                                    </AnimatePresence>

                                    <AnimatePresence>
                                        {isViewed && (
                                            <motion.div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.05 }} transition={{ duration: 0.35 }}>
                                                <motion.div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.05 }} transition={{ duration: 0.45, ease: "easeInOut" }}>
                                                    <Check size={21} strokeWidth={3} />
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}

            {list.totalPages > 1 && (
                <Pagination
                    page={list.page}
                    totalPages={list.totalPages}
                    onChange={list.setPage}
                />
            )}

            <AnimatePresence>
                {showCreate && <CreateTaskModal isOpen={showCreate} onClose={() => setShowCreate(false)} onSuccess={handleCreateSuccess} />}
            </AnimatePresence>

            <AnimatePresence>
                {showCreateNoCase && <CreateNoCaseTaskModal isOpen={showCreateNoCase} onClose={() => setShowCreateNoCase(false)} onSuccess={handleCreateNoCaseSuccess} />}
            </AnimatePresence>

            {editingTask && !customersLoaded && (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200/70 py-5 text-[12px] font-semibold text-gray-400 dark:border-white/10">
                    <Loader size={15} className="animate-spin" />
                    در حال آماده‌سازی اطلاعات ویرایش...
                </div>
            )}

            <AnimatePresence>
                {editingTask && customersLoaded && (
                    <EditTaskModal task={editingTask} customers={customers} departments={departments} onClose={() => setEditingTask(null)} onSuccess={handleEditSuccess} />
                )}
            </AnimatePresence>
        </div>
    );
}

export default function AdminTasksPage() {
    return (
        <SuspenseWrapper>
            <AdminTasksPageContent />
        </SuspenseWrapper>
    );
}