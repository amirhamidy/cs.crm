"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ClipboardList, Plus, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import { casesApi, customersApi, metaApi, tasksApi, fetchAllTasks } from "@/lib/api";
import type { Paginated } from "@/types/pagination";
import type { Department } from "@/types/department";
import type { Employee } from "@/types/employee";
import type { TaskItem } from "@/types/task";
import type { CaseItem } from "@/types/case";
import type { Customer } from "@/types/customer";
import CreateCaseModal from "@/components/user/cases/CreateCaseModal";
import EditCaseModal from "@/components/user/cases/EditCaseModal";
import CaseCard from "@/components/user/cases/CaseCard";
import EditTaskModal from "@/components/customcomponents/tasks/EditTaskModal";
import CaseTasksModal from "@/components/customcomponents/cases/CaseTasksModal";
import Pagination from "@/components/ui/Pagination";
import CardSkeletonGrid from "@/components/ui/CardSkeletonGrid";

const PAGE_SIZE = 12;
const PAGE_CACHE_TTL = 30_000;

interface CachedPage {
    data: Paginated<CaseItem>;
    at: number;
}

export default function UserCasesPage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [cases, setCases] = useState<CaseItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    // وظایف فقط برای پرونده‌های همین صفحه (کلید = شناسهٔ پرونده)
    const [tasksByCase, setTasksByCase] = useState<Map<string, TaskItem[]>>(new Map());
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
    const pageCache = useRef(new Map<number, CachedPage>());
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const clearPageCache = useCallback(() => pageCache.current.clear(), []);

    /** مشتری‌ها و وظایف پرونده‌های همین صفحه — بدون بلاک کردن نمایش کارت‌ها */
    const hydratePage = useCallback((items: CaseItem[], id: number, fresh: boolean) => {
        if (items.length === 0) return;

        customersApi
            .getMany(items.map((c) => Number(c.customer)))
            .then((list) => {
                if (id === requestId.current) setCustomers(list);
            })
            .catch(() => undefined);

        Promise.allSettled(items.map((c) => fetchAllTasks({ caseId: c.id, fresh }))).then((results) => {
            if (id !== requestId.current) return;
            setTasksByCase((prev) => {
                const next = new Map(prev);
                results.forEach((res, i) => {
                    if (res.status === "fulfilled") next.set(String(items[i].id), res.value);
                });
                return next;
            });
        });
    }, []);

    const prefetch = useCallback((target: number) => {
        if (target < 1 || pageCache.current.has(target)) return;
        casesApi
            .list({ page: target, page_size: PAGE_SIZE })
            .then((data) => pageCache.current.set(target, { data, at: Date.now() }))
            .catch(() => undefined);
    }, []);

    const fetchCases = useCallback(
        async (opts: { silent?: boolean; fresh?: boolean } = {}) => {
            const id = ++requestId.current;
            const { silent = false, fresh = false } = opts;

            if (fresh) clearPageCache();

            const cached = pageCache.current.get(page);
            const useCache = !!cached && Date.now() - cached.at < PAGE_CACHE_TTL;

            if (!silent && !useCache) setLoading(true);
            setIsFetching(!useCache);
            setError("");

            try {
                const data = useCache ? cached!.data : await casesApi.list({ page, page_size: PAGE_SIZE });
                if (id !== requestId.current) return;

                pageCache.current.set(page, { data, at: Date.now() });
                setCases(data.results);
                setTotalCount(data.count);
                setLoading(false);
                setIsFetching(false);

                hydratePage(data.results, id, fresh);
                if (page * PAGE_SIZE < data.count) prefetch(page + 1);
            } catch {
                if (id !== requestId.current) return;
                setError("دریافت اطلاعات با خطا مواجه شد");
                setLoading(false);
                setIsFetching(false);
            }
        },
        [page, hydratePage, prefetch, clearPageCache],
    );

    useEffect(() => {
        void fetchCases();
    }, [fetchCases]);

    useEffect(() => {
        metaApi.departments().then(setDepartments).catch(() => undefined);
        metaApi.employees().then(setEmployees).catch(() => undefined);
    }, []);

    const refreshAll = useCallback(() => {
        tasksApi.invalidate();
        void fetchCases({ fresh: true });
    }, [fetchCases]);

    const syncCaseTasks = useCallback((caseId: string, fresh: TaskItem[]) => {
        setTasksByCase((prev) => new Map(prev).set(caseId, fresh));
    }, []);

    const totalTasksOnPage = useMemo(() => {
        let n = 0;
        cases.forEach((c) => {
            n += tasksByCase.get(String(c.id))?.length ?? 0;
        });
        return n;
    }, [cases, tasksByCase]);

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
                    await fetchCases({ silent: true, fresh: true });
                    throw new Error("خطا در حذف پرونده");
                }

                clearPageCache();
                if (cases.length === 1 && page > 1) setPage((p) => p - 1);
                else await fetchCases({ silent: true, fresh: true });
            } finally {
                setDeletingId(null);
            }
        },
        [cases.length, page, fetchCases, syncCaseTasks, clearPageCache],
    );

    const handleEditCase = useCallback((item: CaseItem) => {
        setEditingCase(item);
        setEditCaseModalOpen(true);
    }, []);

    const handleCaseUpdate = useCallback(() => {
        void fetchCases({ silent: true, fresh: true });
        setEditCaseModalOpen(false);
        setEditingCase(null);
    }, [fetchCases]);

    const handleCaseCreated = useCallback(() => {
        clearPageCache();
        if (page !== 1) setPage(1);
        else void fetchCases({ silent: true, fresh: true });
    }, [page, fetchCases, clearPageCache]);

    const handleDeleteTask = useCallback(async (taskId: number) => {
        setDeletingTaskId(taskId);
        try {
            await tasksApi.remove(taskId);
            setTasksByCase((prev) => {
                const next = new Map<string, TaskItem[]>();
                prev.forEach((list, key) => next.set(key, list.filter((t) => t.id !== taskId)));
                return next;
            });
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
        void fetchCases({ silent: true, fresh: true });
        setTasksRefreshKey((k) => k + 1);
        setEditTaskModalOpen(false);
        setEditingTask(null);
    }, [fetchCases]);

    const handleOpenTasksModal = useCallback((item: CaseItem) => {
        setSelectedCaseForTasks(item);
        setTasksModalOpen(true);
    }, []);

    const goToPage = useCallback(
        (p: number) => {
            if (p < 1 || p > totalPages || p === page) return;
            setPage(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
        },
        [page, totalPages],
    );

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="min-w-0">
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">پرونده‌ها</h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
                            {loading
                                ? "در حال بارگذاری..."
                                : `${totalCount} پرونده${totalTasksOnPage > 0 ? ` · ${totalTasksOnPage} وظیفه در این صفحه` : ""}`}
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
                        onClick={() => void fetchCases()}
                        type="button"
                        className="rounded-xl bg-rose-600 px-3 py-1.5 text-[11.5px] font-bold text-white transition-colors hover:bg-rose-500"
                    >
                        تلاش مجدد
                    </button>
                </div>
            )}

            {loading && <CardSkeletonGrid count={6} />}

            {!loading && !error && cases.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                    <ClipboardList size={28} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">هنوز پرونده‌ای ثبت نشده</p>
                </div>
            )}

            {!loading && cases.length > 0 && (
                <div
                    key={`grid-${page}`}
                    className={`grid grid-cols-1 gap-3 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${isFetching ? "opacity-60" : "opacity-100"}`}
                >
                    <AnimatePresence>
                        {cases.map((item, i) => {
                            const caseTasks = tasksByCase.get(String(item.id));
                            return (
                                <CaseCard
                                    key={item.id}
                                    item={item}
                                    index={i}
                                    customers={customers}
                                    departments={departments}
                                    users={employees}
                                    isDeleting={deletingId === Number(item.id)}
                                    hasActiveTasks={!!caseTasks && caseTasks.length > 0}
                                    caseTasks={caseTasks}
                                    onEdit={handleEditCase}
                                    onDelete={() => handleDeleteCase(item)}
                                    onClick={() => handleOpenTasksModal(item)}
                                />
                            );
                        })}
                    </AnimatePresence>
                </div>
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
