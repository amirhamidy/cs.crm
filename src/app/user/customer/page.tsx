"use client";

import { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Users, Plus, Loader, RefreshCw, Filter, FileSpreadsheet, Search, X } from "lucide-react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import CustomerCard from "@/components/user/customer/CustomerCard";
import ImportExcelModal from "@/components/user/customer/ImportExcelModal";
import LazyLoading from "@/components/ui/LazyLoading";
import Pagination from "@/components/ui/Pagination";


const AddCustomerModal = dynamic(() => import("@/components/user/customer/AddCustomerModal"), {
    ssr: false,
    loading: () => <LazyLoading />,
});
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { Customer, CustomerStatus } from "@/types/customer";
import type { Employee } from "@/types/employee";
import type { CaseItem } from "@/types/case";
import type { TaskItem } from "@/types/task";
import axiosInstance from "@/lib/axiosInstance";
import { cached, listAll, customersApi, casesApi, type CustomerCounts } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";
import { useAuthStore } from "@/store/authStore";

type FilterType = "all" | "potential" | "active";

const PAGE_SIZE = 20;

const STATUS_BY_FILTER: Record<FilterType, CustomerStatus | undefined> = {
    all: undefined,
    potential: 1,
    active: 2,
};

const EMPTY_COUNTS: CustomerCounts = {
    all: 0,
    potential: 0,
    active: 0,
};

function parseAssignedEmployees(raw: unknown): number[] {
    const ids: number[] = [];

    if (Array.isArray(raw)) {
        raw.forEach((item) => {
            if (typeof item === "object" && item !== null) {
                const id = Number(
                    (item as any).id ??
                    (item as any).employee ??
                    (item as any).user
                );

                if (!isNaN(id) && id > 0) {
                    ids.push(id);
                }
            } else {
                const id = Number(item);

                if (!isNaN(id) && id > 0) {
                    ids.push(id);
                }
            }
        });
    } else if (typeof raw === "object" && raw !== null) {
        const id = Number(
            (raw as any).id ??
            (raw as any).employee ??
            (raw as any).user
        );

        if (!isNaN(id) && id > 0) {
            ids.push(id);
        }
    } else if (raw !== null && raw !== undefined) {
        const id = Number(raw);

        if (!isNaN(id) && id > 0) {
            ids.push(id);
        }
    }

    return ids;
}

function extractCaseCustomerId(item: any): number | null {
    const customerRaw = item?.customer;

    if (customerRaw && typeof customerRaw === "object") {
        const id = Number(customerRaw.id);
        return isNaN(id) ? null : id;
    }

    if (customerRaw !== null && customerRaw !== undefined) {
        const id = Number(customerRaw);
        return isNaN(id) ? null : id;
    }

    return null;
}

export default function CustomersPage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const list = usePaginatedList<Customer, { status?: CustomerStatus }>(
        (params, signal) => customersApi.page(params, signal),
        {
            pageSize: PAGE_SIZE,
            filters: { status: STATUS_BY_FILTER.all },
            scrollTop: true,
        }
    );

    const customers = list.data;
    const loading = list.loading;
    const totalCount = list.count;
    const page = list.page;
    const totalPages = list.totalPages;
    const search = list.search;
    const filter: FilterType =
        list.filters.status === 1
            ? "potential"
            : list.filters.status === 2
                ? "active"
                : "all";

    const [customersWithCase, setCustomersWithCase] = useState<Set<number>>(
        new Set()
    );
    const [counts, setCounts] = useState<CustomerCounts>(EMPTY_COUNTS);
    const [casesTick, setCasesTick] = useState(0);
    const [showAdd, setShowAdd] = useState(false);
    const [showImport, setShowImport] = useState(false);

    const userId = useAuthStore((state) => state.userId);
    const username = useAuthStore((state) => state.username);

    const fetchCounts = useCallback(async () => {
        try {
            setCounts(await customersApi.counts());
        } catch {
            
        }
    }, []);

    const fetchCases = useCallback(async () => {
        try {
            const [allCases, allTasks, employeeList] = await Promise.all([
                cached<CaseItem[]>(
                    "cases:customer-page:cases",
                    () => listAll<CaseItem>("/tasks/api/v1/cases/"),
                    60_000
                ),
                cached<TaskItem[]>(
                    "tasks:customer-page:list",
                    () => listAll<TaskItem>(apiRoutes.tasks),
                    30_000
                ),
                cached<Employee[]>(
                    "accounts:customer-page:employees",
                    () => listAll<Employee>("/accounts/api/v1/employee/list/"),
                    5 * 60_000
                ),
            ]);

            let empId: number | null = null;

            const matchedEmployee = employeeList.find(
                (emp: any) =>
                    (username && emp.username === username) ||
                    (userId &&
                        Number(
                            emp.user_id ??
                            emp.user ??
                            emp.user_detail?.id
                        ) === Number(userId)) ||
                    (userId &&
                        Number(emp.id) === Number(userId))
            );

            if (matchedEmployee) {
                empId = Number(matchedEmployee.id);
            }

            const pageCustomerIds = new Set(
                customers.map((customer) => Number(customer.id))
            );

            const relevantCases = allCases.filter((c) => {
                const customerId = extractCaseCustomerId(c);

                return Boolean(customerId && pageCustomerIds.has(customerId));
            });

            const detailedCases = await Promise.all(
                relevantCases.map(async (c) => {
                    try {
                        return await cached<CaseItem>(
                            `cases:customer-page:detail:${c.id}`,
                            async () => {
                                const detailRes = await axiosInstance.get<CaseItem>(
                                    `/tasks/api/v1/cases/${c.id}/`
                                );

                                return { ...c, ...detailRes.data };
                            },
                            60_000
                        );
                    } catch {
                        return c;
                    }
                })
            );

            const userTasks = empId
                ? allTasks.filter((task: any) => {
                    const assignedList = parseAssignedEmployees(
                        task.assigned_employee
                    );

                    const creatorId = Number(
                        task.created_by ??
                        task.creator ??
                        task.user
                    );

                    return (
                        assignedList.includes(empId!) ||
                        (userId &&
                            creatorId === Number(userId))
                    );
                })
                : allTasks;

            const userTaskCaseIds = new Set(
                userTasks
                    .map((task: any) => {
                        const raw =
                            task.case ??
                            task.case_id ??
                            task.caseId;

                        return typeof raw === "object"
                            ? Number(raw?.id)
                            : Number(raw);
                    })
                    .filter(
                        (id) =>
                            !isNaN(id) &&
                            id > 0
                    )
            );

            const activeCaseCustomerIds = new Set<number>();

            detailedCases.forEach((c: any) => {
                const caseId = Number(c.id);
                const customerId = extractCaseCustomerId(c);

                if (!customerId) return;

                const isAssignedDirectly =
                    empId &&
                    (
                        parseAssignedEmployees(
                            c.assigned_employee
                        ).includes(empId) ||
                        parseAssignedEmployees(
                            c.employees
                        ).includes(empId) ||
                        (
                            userId &&
                            Number(
                                c.created_by ??
                                c.creator ??
                                c.user
                            ) === Number(userId)
                        )
                    );

                const hasTaskInCase =
                    userTaskCaseIds.has(caseId);

                if (
                    !empId ||
                    isAssignedDirectly ||
                    hasTaskInCase
                ) {
                    activeCaseCustomerIds.add(customerId);
                }
            });

            setCustomersWithCase(activeCaseCustomerIds);
        } catch {
            setCustomersWithCase(new Set());
        }
    }, [userId, username, customers, casesTick]);

    useEffect(() => {
        fetchCases();
    }, [fetchCases]);

    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    const refresh = useCallback(() => {
        customersApi.invalidate();
        casesApi.invalidate();
        setCasesTick((tick) => tick + 1);
        list.refetch();
        fetchCounts();
    }, [list.refetch, fetchCounts]);

    const handleDeleted = useCallback(
        (_id: number) => {
            customersApi.invalidate();

            if (customers.length === 1 && page > 1) {
                list.setPage(page - 1);
            } else {
                list.refetch();
            }

            fetchCounts();
        },
        [customers.length, page, list.setPage, list.refetch, fetchCounts]
    );

    const handleAdded = useCallback(() => {
        refresh();
    }, [refresh]);

    const handleEdited = useCallback(
        (_updated: Customer) => {
            customersApi.invalidate();
            list.refetch();
            fetchCounts();
        },
        [list.refetch, fetchCounts]
    );

    const handleFilterChange = (newFilter: FilterType) => {
        if (newFilter === filter) return;

        list.setFilters({ status: STATUS_BY_FILTER[newFilter] });
    };

    const filterOptions: { value: FilterType; label: string; count: number }[] = [
        { value: "all", label: "همه", count: counts.all },
        { value: "potential", label: "بالقوه", count: counts.potential },
        { value: "active", label: "فعال", count: counts.active },
    ];

    return (
        <div
            className="flex flex-col gap-5 p-3 sm:p-4 md:p-6"
            dir="rtl"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,0.12)"
                                : "rgba(99,102,241,0.08)",
                        }}
                    >
                        <Users
                            size={16}
                            className="text-indigo-500"
                        />
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                            مدیریت مشتریان
                        </h1>

                        <p className="mt-0.5 text-[11.5px] text-gray-400 dark:text-gray-500">
                            {loading
                                ? "در حال بارگذاری..."
                                : `${totalCount} مشتری ثبت شده`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:hover:text-gray-300"
                        style={{
                            background: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(0,0,0,0.04)",
                        }}
                        title="بارگذاری مجدد"
                        type="button"
                    >
                        <RefreshCw
                            size={13}
                            className={loading ? "animate-spin" : ""}
                        />
                    </button>

                    <button
                        onClick={() => setShowImport(true)}
                        className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[12px] font-bold text-emerald-600 transition-all duration-200 hover:bg-emerald-500 hover:text-white dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"
                        type="button"
                    >
                        <FileSpreadsheet size={13} />
                        <span className="whitespace-nowrap">
                            افزودن با اکسل
                        </span>
                    </button>

                    <button
                        onClick={() => setShowAdd(true)}
                        className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-[12.5px] font-bold text-white transition-all duration-200 hover:bg-indigo-700 sm:flex-none"
                        type="button"
                    >
                        <Plus size={13} />

                        <span className="whitespace-nowrap">
                            افزودن مشتری
                        </span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className="flex h-9 items-center gap-1.5 rounded-xl px-3"
                        style={{
                            background: isDark
                                ? "rgba(255,255,255,0.04)"
                                : "rgba(0,0,0,0.03)",
                        }}
                    >
                        <Filter
                            size={13}
                            className="text-gray-400"
                        />

                        <span className="text-[11px] font-bold text-gray-400">
                            فیلتر:
                        </span>
                    </div>

                    <div className="flex gap-1.5">
                        {filterOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() =>
                                    handleFilterChange(
                                        option.value
                                    )
                                }
                                className={`flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-[11.5px] font-bold transition-all duration-200 ${filter === option.value
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    }`}
                                style={{
                                    background:
                                        filter === option.value
                                            ? undefined
                                            : isDark
                                                ? "rgba(255,255,255,0.04)"
                                                : "rgba(0,0,0,0.03)",
                                }}
                                type="button"
                            >
                                {option.label}

                                <span
                                    className={`rounded-lg px-1.5 py-0.5 text-[10px] font-bold ${filter === option.value
                                        ? "bg-white/20 text-white"
                                        : "bg-gray-200/50 text-gray-400 dark:bg-white/10 dark:text-gray-500"
                                        }`}
                                >
                                    {option.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div
                    className="relative flex h-9 items-center gap-2 rounded-xl px-3 sm:w-64"
                    style={{
                        background: isDark
                            ? "rgba(255,255,255,0.04)"
                            : "rgba(0,0,0,0.03)",
                    }}
                >
                    <Search
                        size={13}
                        className="shrink-0 text-gray-400"
                    />

                    <input
                        value={search}
                        onChange={(e) => list.setSearch(e.target.value)}
                        placeholder="جستجوی نام، شماره یا شرکت..."
                        className="min-w-0 flex-1 bg-transparent text-[11.5px] font-medium text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-200"
                    />

                    {search && (
                        <button
                            type="button"
                            onClick={() => list.setSearch("")}
                            className="shrink-0 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                            aria-label="پاک کردن جستجو"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader
                        size={22}
                        className="animate-spin text-indigo-500"
                    />

                    <p className="text-[12.5px] text-gray-400 dark:text-gray-500">
                        در حال دریافت لیست مشتریان...
                    </p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {customers.length === 0 ? (
                        <m.div
                            key="empty"
                            initial={{
                                opacity: 0,
                                y: 8,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                            }}
                            exit={{
                                opacity: 0,
                                y: 8,
                            }}
                            className="flex flex-col items-center justify-center gap-2 py-16"
                        >
                            <Users
                                size={28}
                                className="text-gray-300 dark:text-gray-700"
                            />

                            <p className="text-[12.5px] text-gray-400 dark:text-gray-500">
                                {search.trim()
                                    ? "نتیجه‌ای برای جستجوی شما یافت نشد"
                                    : filter === "all"
                                        ? "مشتری‌ای برای شما یافت نشد"
                                    : filter === "potential"
                                        ? "مشتری بالقوه‌ای یافت نشد"
                                        : "مشتری فعالی یافت نشد"}
                            </p>
                        </m.div>
                    ) : (
                        <m.div
                            layout
                            key="grid"
                            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        >
                            <AnimatePresence mode="popLayout">
                                {customers.map(
                                    (customer, index) => (
                                        <CustomerCard
                                            key={customer.id}
                                            customer={customer}
                                            index={index}
                                            hasActiveCase={customersWithCase.has(
                                                customer.id
                                            )}
                                            onDeleted={
                                                handleDeleted
                                            }
                                            onEdited={
                                                handleEdited
                                            }
                                        />
                                    )
                                )}
                            </AnimatePresence>
                        </m.div>
                    )}
                </AnimatePresence>
            )}

            {!loading && totalPages > 1 && (
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onChange={list.setPage}
                />
            )}

            {showAdd && (
                <AddCustomerModal
                    isOpen={showAdd}
                    onClose={() => setShowAdd(false)}
                    onAdded={handleAdded}
                    allowDuplicatePhone
                />
            )}

            <ImportExcelModal
                isOpen={showImport}
                onClose={() => setShowImport(false)}
                onSuccess={handleAdded}
            />
        </div>
    );
}
