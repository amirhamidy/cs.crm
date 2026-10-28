"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, Loader, Plus, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import { casesApi, customersApi, metaApi, tasksApi, fetchAllTasks, extractCaseId } from "@/lib/api";
import type { Department } from "@/types/department";
import type { Employee } from "@/types/employee";
import type { TaskItem } from "@/types/task";
import type { CaseItem } from "@/types/case";
import type { Customer } from "@/types/customer";
import CreateCaseModal from "@/components/user/cases/CreateCaseModal";
import EditCaseModal from "@/components/user/cases/EditCaseModal";
import CaseCard from "@/components/user/cases/CaseCard";
import EditTaskModal from "@/components/tasks/EditTaskModal";
import CaseTasksModal from "@/components/cases/CaseTasksModal";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 12;

export default function UserCasesPage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [cases, setCases] = useState<CaseItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState("");
    const [caseModalOpen, setCaseModalOpen] = useState(false);
    const [editingCase, setEditingCase] = useState<CaseItem | null>(null);
    const [editCaseModalOpen, setEditCaseModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
    const [editTaskModalOpen, setEditTaskModalOpen] = useState(false);
    const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
    const [tasksModalOpen, setTasksModalOpen] = useState(false);
    const [selectedCaseForTasks, setSelectedCaseForTasks] = useState<CaseItem | null>(null);
    const [tasksRefreshKey, setTasksRefreshKey] = useState(0);

    const requestId = useRef(0);
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const fetchCases = useCallback(
        async (opts: { silent?: boolean } = {}) => {
            const id = ++requestId.current;
            if (!opts.silent) setLoading(true);
            setIsFetching(true);
            setError("");

            try {
                const data = await casesApi.list({ page, page_size: PAGE_SIZE });
                const pageCustomers = await customersApi.getMany(data.results.map((c) => Number(c.customer)));

                if (id !== requestId.current) return;

                setCases(data.results);
                setCustomers(pageCustomers);
                setTotalCount(data.count);
            } catch {
                if (id !== requestId.current) return;
                setError("دریافت اطلاعات با خطا مواجه شد");
            } finally {
                if (id === requestId.current) {
                    setLoading(false);
                    setIsFetching(false);
                }
            }
        },
        [page],
    );

    const fetchTasks = useCallback((fresh = false) => {
        fetchAllTasks({ fresh })
            .then(setTasks)
            .catch(() => undefined);
    }, []);

    const fetchMeta = useCallback(() => {
        metaApi.departments().then(setDepartments).catch(() => undefined);
        metaApi.employees().then(setEmployees).catch(() => undefined);
    }, []);

    useEffect(() => {
        fetchCases();
    }, [fetchCases]);

    useEffect(() => {
        fetchMeta();
        fetchTasks();
    }, [fetchMeta, fetchTasks]);

    const refreshAll = useCallback(() => {
        fetchCases();
        fetchTasks(true);
    }, [fetchCases, fetchTasks]);

    const tasksByCase = useMemo(() => {
        const map = new Map<string, TaskItem[]>();
        tasks.forEach((task) => {
            const caseId = extractCaseId(task);
            if (!caseId) return;
            const list = map.get(caseId);
            if (list) list.push(task);
            else map.set(caseId, [task]);
        });
        return map;
    }, [tasks]);

    const syncCaseTasks = useCallback((caseId: string, fresh: TaskItem[]) => {
        setTasks((prev) => [...prev.filter((t) => extractCaseId(t) !== caseId), ...fresh]);
    }, []);

    const handleDeleteCase = useCallback(
        async (item: CaseItem) => {
            const id = Number(item.id);
            if (!id) return;

            setDeletingId(id);
            try {
                const freshTasks = await fetchAllTasks({ caseId: id, fresh: true });
                if (freshTasks.length > 0) {
                    syncCaseTasks(String(id), freshTasks);
                    throw new Error("این پرونده هنوز وظیفه دارد");
                }

                try {
                    await casesApi.remove(id);
                } catch {
                    await fetchCases({ silent: true });
                    throw new Error("خطا در حذف پرونده");
                }

                if (cases.length === 1 && page > 1) setPage((p) => p - 1);
                else await fetchCases({ silent: true });
            } finally {
                setDeletingId(null);
            }
        },
        [cases.length, page, fetchCases, syncCaseTasks],
    );

    const handleEditCase = useCallback((item: CaseItem) => {
        setEditingCase(item);
        setEditCaseModalOpen(true);
    }, []);

    const handleCaseUpdate = useCallback(() => {
        fetchCases({ silent: true });
        setEditCaseModalOpen(false);
        setEditingCase(null);
    }, [fetchCases]);

    const handleCaseCreated = useCallback(() => {
        if (page !== 1) setPage(1);
        else fetchCases({ silent: true });
    }, [page, fetchCases]);

    const handleDeleteTask = useCallback(async (taskId: number) => {
        setDeletingTaskId(taskId);
        try {
            await tasksApi.remove(taskId);
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
        } catch {
            throw new Error("خطا در حذف وظیفه");
        } finally {
            setDeletingTaskId(null);
        }
    }, []);

    const handleEditTask = useCallback((task: TaskItem) => {
        setEditingTask(task);
        setEditTaskModalOpen(true);
    }, []);

    const handleTaskUpdate = useCallback(() => {
        tasksApi.invalidate();
        fetchCases({ silent: true });
        fetchTasks();
        setTasksRefreshKey((k) => k + 1);
        setEditTaskModalOpen(false);
        setEditingTask(null);
    }, [fetchCases, fetchTasks]);

    const handleOpenTasksModal = useCallback((item: CaseItem) => {
        setSelectedCaseForTasks(item);
        setTasksModalOpen(true);
    }, []);

    const goToPage = (p: number) => {
        if (p < 1 || p > totalPages || p === page) return;
        setPage(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="min-w-0">
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">پرونده‌ها</h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
                            {loading ? "در حال بارگذاری..." : `${totalCount} پرونده و ${tasks.length} وظیفه`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={refreshAll}
                        disabled={loading}
                        type="button"
                        title="بارگذاری مجدد"
                        className="flex h-10 w-10 items-center justify-center rounded-2xl transition-colors disabled:opacity-50"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)",
                            color: isDark ? "#cbd5e1" : "#475569",
                        }}
                    >
                        <RefreshCw size={15} className={loading || isFetching ? "animate-spin" : ""} />
                    </button>

                    <button
                        onClick={() => setCaseModalOpen(true)}
                        type="button"
                        className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-700"
                    >
                        <Plus size={15} />
                        <span>پرونده جدید</span>
                    </button>
                </div>
            </div>

            {error && !loading && (
                <div className="flex flex-col items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[12.5px] text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 sm:flex-row sm:items-center sm:justify-between">
                    <span>{error}</span>
                    <button
                        onClick={() => fetchCases()}
                        type="button"
                        className="rounded-xl bg-rose-600 px-3 py-1.5 text-[11.5px] font-bold text-white transition-colors hover:bg-rose-500"
                    >
                        تلاش مجدد
                    </button>
                </div>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader size={24} className="animate-spin text-indigo-500" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">در حال دریافت لیست پرونده‌ها...</p>
                </div>
            )}

            {!loading && !error && cases.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                    <ClipboardList size={28} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">هنوز پرونده‌ای ثبت نشده</p>
                </div>
            )}

            {!loading && cases.length > 0 && (
                <motion.div
                    layout
                    key={`grid-${page}`}
                    className={`grid grid-cols-1 gap-3 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${isFetching ? "opacity-60" : "opacity-100"
                        }`}
                >
                    <AnimatePresence mode="popLayout">
                        {cases.map((item, i) => {
                            const caseTasks = tasksByCase.get(String(item.id)) ?? [];
                            return (
                                <CaseCard
                                    key={item.id}
                                    item={item}
                                    index={i}
                                    customers={customers}
                                    departments={departments}
                                    users={employees}
                                    isDeleting={deletingId === Number(item.id)}
                                    hasActiveTasks={caseTasks.length > 0}
                                    caseTasks={caseTasks}
                                    onEdit={handleEditCase}
                                    onDelete={() => handleDeleteCase(item)}
                                    onClick={() => handleOpenTasksModal(item)}
                                />
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}

            {!loading && totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={goToPage} />}

            <CreateCaseModal open={caseModalOpen} onClose={() => setCaseModalOpen(false)} onCreated={handleCaseCreated} />

            {editCaseModalOpen && editingCase && (
                <EditCaseModal
                    isOpen={editCaseModalOpen}
                    caseItem={editingCase}
                    customers={customers}
                    departments={departments}
                    users={employees}
                    onClose={() => {
                        setEditCaseModalOpen(false);
                        setEditingCase(null);
                    }}
                    onSuccess={handleCaseUpdate}
                />
            )}

            <CaseTasksModal
                isOpen={tasksModalOpen}
                onClose={() => {
                    setTasksModalOpen(false);
                    setSelectedCaseForTasks(null);
                }}
                caseItem={selectedCaseForTasks}
                employees={employees}
                refreshKey={tasksRefreshKey}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                deletingTaskId={deletingTaskId}
                onTasksLoaded={syncCaseTasks}
            />

            {editTaskModalOpen && editingTask && (
                <EditTaskModal
                    task={editingTask}
                    customers={customers}
                    departments={departments}
                    onClose={() => {
                        setEditTaskModalOpen(false);
                        setEditingTask(null);
                    }}
                    onSuccess={handleTaskUpdate}
                />
            )}
        </div>
    );
}
