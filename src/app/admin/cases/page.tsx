"use client";

import SearchField from "@/components/ui/SearchField";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CaseCardSkeleton, CountSkeleton } from "@/components/ui/skeletons";
import { AnimatePresence, m } from "framer-motion";
import { Search, X, ClipboardList, Plus, RefreshCw } from "lucide-react";
import { Spinner as Loader2 } from "@/components/ui/Spinner";
import { useTheme } from "next-themes";
import { casesApi, customersApi, metaApi, tasksApi, fetchAllTasks, fetchTasksForCases, extractCaseId } from "@/lib/api";
import type { Department } from "@/types/department";
import type { Employee } from "@/types/employee";
import type { TaskItem } from "@/types/task";
import type { CaseItem } from "@/types/case";
import type { Customer } from "@/types/customer";
import CreateCaseModal from "@/components/user/cases/CreateCaseModal";
import dynamic from "next/dynamic";
import CaseCard, { type CaseView } from "@/components/user/cases/CaseCard";

const CaseActionsModal = dynamic(() => import("@/components/cases/CaseActionsModal"), {
    ssr: false,
    loading: () => null,
});


import Pagination from "@/components/ui/Pagination";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { toast } from "@/components/notifications/toast";

const PAGE_SIZE = 12;

export default function UserCasesPage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [taskTotal, setTaskTotal] = useState(0);
    const [isFetching, setIsFetching] = useState(false);
    const [caseModalOpen, setCaseModalOpen] = useState(false);
    const [actionCase, setActionCase] = useState<CaseItem | null>(null);
    const [actionView, setActionView] = useState<CaseView>("tasks");
    const [actionOpen, setActionOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
    const [tasksRefreshKey, setTasksRefreshKey] = useState(0);

    
    const list = usePaginatedList<CaseItem>((params, signal) => casesApi.page(params, signal), {
        pageSize: PAGE_SIZE,
        scrollTop: true,
    });
    const cases = list.data;
    const page = list.page;
    const totalCount = list.count;
    const totalPages = list.totalPages;
    const loading = list.loading && list.data.length === 0;
    const error = list.error ? "دریافت اطلاعات با خطا مواجه شد" : "";
    const refetchCases = list.refetch;
    const setListPage = list.setPage;

    const requestId = useRef(0);

    
    useEffect(() => {
        if (cases.length === 0) {
            setCustomers([]);
            return;
        }
        const id = ++requestId.current;
        setIsFetching(true);
        customersApi
            .getMany(cases.map((c) => Number(c.customer)))
            .then((pageCustomers) => {
                if (id !== requestId.current) return;
                setCustomers(pageCustomers);
            })
            .catch(() => undefined)
            .finally(() => {
                if (id === requestId.current) setIsFetching(false);
            });
    }, [cases]);

    const casesRef = useRef<CaseItem[]>([]);
    casesRef.current = cases;

    const tasksRequestId = useRef(0);

    
    const fetchTasks = useCallback((fresh = false, items: CaseItem[] = casesRef.current) => {
        const id = ++tasksRequestId.current;

        
        tasksApi
            .page({ page: 1, page_size: 1 })
            .then((res) => {
                if (id === tasksRequestId.current) setTaskTotal(res.count);
            })
            .catch(() => undefined);

        if (items.length === 0) {
            setTasks([]);
            return;
        }
        fetchTasksForCases(items.map((c) => c.id), { fresh })
            .then((grouped) => {
                
                if (id !== tasksRequestId.current) return;
                setTasks([...grouped.values()].flat());
            })
            .catch(() => undefined);
    }, []);

    const fetchMeta = useCallback(() => {
        metaApi.departments().then(setDepartments).catch(() => undefined);
        metaApi.employees().then(setEmployees).catch(() => undefined);
    }, []);

    useEffect(() => {
        fetchMeta();
    }, [fetchMeta]);

    useEffect(() => {
        fetchTasks(false, cases);
    }, [cases, fetchTasks]);

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
                    refetchCases();
                    throw new Error("خطا در حذف پرونده");
                }

                if (cases.length === 1 && page > 1) setListPage(page - 1);
                else refetchCases();
            } finally {
                setDeletingId(null);
            }
        },
        [cases.length, page, refetchCases, setListPage, syncCaseTasks],
    );

    const handleToggleCaseActive = useCallback(async (item: CaseItem, nextActive: boolean) => {
        try {
            if (nextActive) await casesApi.activate(item.id);
            else await casesApi.deactivate(item.id);
            toast.success(nextActive ? "پرونده فعال شد" : "پرونده غیرفعال شد");
            refetchCases();
        } catch {
            toast.error("تغییر وضعیت پرونده انجام نشد");
        }
    }, [refetchCases]);

    const handleOpenCase = useCallback((item: CaseItem, view: CaseView) => {
        setActionCase(item);
        setActionView(view);
        setActionOpen(true);
    }, []);

    const handleCaseUpdate = useCallback(() => {
        refetchCases();
        setActionOpen(false);
    }, [refetchCases]);

    const handleCaseCreated = useCallback(() => {
        if (page !== 1) setListPage(1);
        else refetchCases();
    }, [page, refetchCases, setListPage]);

    const handleDeleteTask = useCallback(async (taskId: number) => {
        setDeletingTaskId(taskId);
        try {
            await tasksApi.remove(taskId);
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
            setTaskTotal((n) => Math.max(0, n - 1));
        } catch {
            throw new Error("خطا در حذف وظیفه");
        } finally {
            setDeletingTaskId(null);
        }
    }, []);

    const handleTaskUpdate = useCallback(() => {
        tasksApi.invalidate();
        refetchCases();
        fetchTasks();
        setTasksRefreshKey((k) => k + 1);
    }, [refetchCases, fetchTasks]);

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="min-w-0">
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">پرونده‌ها</h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
                            {loading ? <CountSkeleton /> : `${totalCount} پرونده و ${taskTotal} وظیفه`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
<SearchField value={list.search} onChange={list.setSearch} placeholder="جستجوی پرونده‌ها..." />
                    <button
                        onClick={() => refetchCases()}
                        disabled={loading}
                        type="button"
                        title="بارگذاری مجدد"
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-colors disabled:opacity-50 `}
                        style={{
                            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)",
                            color: isDark ? "#d1d5db" : "#4b5563",
                        }}
                    >
                        {loading || isFetching ? <Loader2 size={15} /> : <RefreshCw size={15} />}
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
                        onClick={() => refetchCases()}
                        type="button"
                        className="rounded-xl bg-rose-600 px-3 py-1.5 text-[11.5px] font-bold text-white transition-colors hover:bg-rose-500"
                    >
                        تلاش مجدد
                    </button>
                </div>
            )}

            {loading && <CaseCardSkeleton />}

            {!loading && !error && cases.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                    <ClipboardList size={28} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">هنوز پرونده‌ای ثبت نشده</p>
                </div>
            )}

            {!loading && cases.length > 0 && (
                <m.div
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
                                    onOpen={handleOpenCase}
                                    onDelete={() => handleDeleteCase(item)}
                                    canManageActivation
                                    onToggleActive={handleToggleCaseActive}
                                />
                            );
                        })}
                    </AnimatePresence>
                </m.div>
            )}

            {!loading && totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setListPage} />}

            <CreateCaseModal open={caseModalOpen} onClose={() => setCaseModalOpen(false)} onCreated={handleCaseCreated} />

            <CaseActionsModal
                open={actionOpen}
                caseItem={actionCase}
                initialView={actionView}
                onClose={() => setActionOpen(false)}
                onCaseUpdated={handleCaseUpdate}
                employees={employees}
                refreshKey={tasksRefreshKey}
                customers={customers}
                departments={departments}
                onTaskUpdated={handleTaskUpdate}
                onDeleteTask={handleDeleteTask}
                deletingTaskId={deletingTaskId}
                onTasksLoaded={syncCaseTasks}
            />
        </div>
    );
}
