"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Loader, RefreshCw, Filter, FileSpreadsheet } from "lucide-react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import CustomerCard from "@/components/user/customer/CustomerCard";
import { Customer } from "@/types/customer";
import type { Employee } from "@/types/employee";
import type { CaseItem } from "@/types/case";
import type { TaskItem } from "@/types/task";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import { useAuthStore } from "@/store/authStore";
import { cached, invalidate, listAll } from "@/lib/api";

type FilterType = "all" | "potential" | "active";

const AddCustomerModal = dynamic(() => import("@/components/user/customer/AddCustomerModal"), {
    ssr: false,
    loading: () => null,
});
const ImportExcelModal = dynamic(() => import("@/components/user/customer/ImportExcelModal"), {
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

function extractCaseCustomerId(item: unknown): number | null {
    if (typeof item !== "object" || item === null) return null;

    const customerRaw = (item as Record<string, unknown>).customer;
    if (typeof customerRaw === "object" && customerRaw !== null) {
        const id = Number((customerRaw as Record<string, unknown>).id);
        return Number.isFinite(id) ? id : null;
    }

    if (customerRaw !== null && customerRaw !== undefined) {
        const id = Number(customerRaw);
        return Number.isFinite(id) ? id : null;
    }

    return null;
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

export default function CustomersPage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customersWithCase, setCustomersWithCase] = useState<Set<number>>(
        new Set()
    );
    const [loading, setLoading] = useState(true);
    const [filterLoading, setFilterLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [filter, setFilter] = useState<FilterType>("all");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    const userId = useAuthStore((state) => state.userId);
    const username = useAuthStore((state) => state.username);

    const fetchData = useCallback(async () => {
        setLoading(true);

        try {
            const [allCustomers, allCases, allTasks, employeeList] = await Promise.all([
                cached(
                    "user-customers:list",
                    () => listAll<Customer>("/customers/api/v1/customers/"),
                    30_000,
                ),
                cached(
                    "user-customers:cases",
                    () => listAll<CaseItem>("/tasks/api/v1/cases/"),
                    60_000,
                ),
                cached(
                    "user-customers:tasks",
                    () => listAll<TaskItem>(apiRoutes.tasks),
                    30_000,
                ),
                cached(
                    "user-customers:employees",
                    () => listAll<Employee>("/accounts/api/v1/employee/list/"),
                    5 * 60_000,
                ),
            ]);

            let empId: number | null = null;

            const matchedEmployee = employeeList.find((employee) => {
                const record = employee as Employee & {
                    user_id?: number | string;
                    user?: number | string;
                };

                return (
                    (username && employee.username === username) ||
                    (userId &&
                        Number(record.user_id ?? record.user ?? employee.user_detail?.id) === Number(userId)) ||
                    (userId && Number(employee.id) === Number(userId))
                );
            });

            if (matchedEmployee) {
                empId = Number(matchedEmployee.id);
            }

            const detailedCases = await mapLimit(allCases, 4, async (c) => {
                try {
                    return await cached<CaseItem>(
                        `user-customers:case-detail:${c.id}`,
                        async () => {
                            const detailRes = await axiosInstance.get<CaseItem>(
                                `/tasks/api/v1/cases/${c.id}/`,
                            );
                            return { ...c, ...detailRes.data };
                        },
                        60_000,
                    );
                } catch {
                    return c;
                }
            });

            const userTasks = empId
                ? allTasks.filter((task) => {
                    const record = task as TaskItem & {
                        created_by?: unknown;
                        creator?: unknown;
                        user?: unknown;
                    };
                    const assignedList = parseAssignedEmployees(record.assigned_employee);

                    const creatorId = Number(
                        record.created_by ??
                        record.creator ??
                        record.user
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
                    .map((task) => {
                        const record = task as TaskItem & {
                            case?: unknown;
                            case_id?: unknown;
                            caseId?: unknown;
                        };
                        const raw = record.case ?? record.case_id ?? record.caseId;

                        if (typeof raw === "object" && raw !== null) {
                            return Number((raw as Record<string, unknown>).id);
                        }
                        return Number(raw);
                    })
                    .filter(
                        (id) =>
                            !isNaN(id) &&
                            id > 0
                    )
            );

            const allowedCaseCustomerIds = new Set<number>();
            const activeCaseCustomerIds = new Set<number>();

            detailedCases.forEach((c) => {
                const caseRecord = c as CaseItem & {
                    assigned_employee?: unknown;
                    employees?: unknown;
                    created_by?: unknown;
                    creator?: unknown;
                    user?: unknown;
                };
                const caseId = Number(caseRecord.id);
                const customerId = extractCaseCustomerId(caseRecord);

                if (!customerId) return;

                const isAssignedDirectly =
                    empId &&
                    (
                        parseAssignedEmployees(
                            caseRecord.assigned_employee
                        ).includes(empId) ||
                        parseAssignedEmployees(
                            caseRecord.employees
                        ).includes(empId) ||
                        (
                            userId &&
                            Number(
                                caseRecord.created_by ??
                                caseRecord.creator ??
                                caseRecord.user
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
                    allowedCaseCustomerIds.add(customerId);
                    activeCaseCustomerIds.add(customerId);
                }
            });

            const filteredCustomers = empId
                ? allCustomers.filter((customer) => {
                    const customerRecord = customer as Customer & {
                        assigned_employee?: unknown;
                        employees?: unknown;
                    };
                    const isCreator =
                        username &&
                        customer.created_by_username &&
                        customer.created_by_username === username;

                    const isAssigned =
                        empId &&
                        (
                            parseAssignedEmployees(
                                customerRecord.assigned_employee
                            ).includes(empId) ||
                            parseAssignedEmployees(
                                customerRecord.employees
                            ).includes(empId)
                        );

                    const hasPermittedCase =
                        allowedCaseCustomerIds.has(
                            Number(customer.id)
                        );

                    return (
                        isCreator ||
                        isAssigned ||
                        hasPermittedCase
                    );
                })
                : allCustomers;

            setCustomers(filteredCustomers);
            setCustomersWithCase(activeCaseCustomerIds);
        } catch {
            setCustomers([]);
            setCustomersWithCase(new Set());
        } finally {
            setLoading(false);
        }
    }, [userId, username]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setSearch(searchInput.trim().replace(/\s+/g, " "));
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [searchInput]);

    const refresh = useCallback(() => {
        invalidate("user-customers:");
        void fetchData();
    }, [fetchData]);

    const handleDeleted = useCallback((id: number) => {
        invalidate("user-customers:");
        setCustomers((prev) =>
            prev.filter((customer) => customer.id !== id)
        );
    }, []);

    const handleAdded = useCallback(() => {
        refresh();
    }, [refresh]);

    const handleEdited = useCallback((updated: Customer) => {
        invalidate("user-customers:");
        setCustomers((prev) =>
            prev.map((customer) =>
                customer.id === updated.id
                    ? updated
                    : customer
            )
        );
    }, []);

    const handleFilterChange = (newFilter: FilterType) => {
        if (newFilter === filter) return;

        setFilterLoading(true);
        setFilter(newFilter);

        setTimeout(() => {
            setFilterLoading(false);
        }, 400);
    };

    const filteredCustomers = customers.filter((customer) => {
        const matchesStatus =
            filter === "all" ||
            (filter === "potential" && customer.status === 1) ||
            (filter === "active" && customer.status === 2);

        if (!matchesStatus) return false;
        if (!search) return true;

        const query = search.toLocaleLowerCase();
        return [
            customer.full_name,
            customer.phone_number,
            customer.company_name,
        ].some((value) => String(value ?? "").toLocaleLowerCase().includes(query));
    });

    const potentialCount = customers.filter(
        (customer) => customer.status === 1
    ).length;

    const activeCount = customers.filter(
        (customer) => customer.status === 2
    ).length;

    const filterOptions = [
        {
            value: "all" as FilterType,
            label: "همه",
            count: customers.length,
        },
        {
            value: "potential" as FilterType,
            label: "بالقوه",
            count: potentialCount,
        },
        {
            value: "active" as FilterType,
            label: "فعال",
            count: activeCount,
        },
    ];

    const isLoading = loading || filterLoading;

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
                            {isLoading
                                ? "در حال بارگذاری..."
                                : `${filteredCustomers.length} مشتری ثبت شده`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                    <button
                        onClick={refresh}
                        disabled={isLoading}
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
                            className={
                                isLoading
                                    ? "animate-spin"
                                    : ""
                            }
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

            <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="جستجوی نام مشتری، شماره تماس یا شرکت..."
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[12px] text-gray-700 outline-none transition-colors focus:border-indigo-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
            />

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

            {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader
                        size={22}
                        className="animate-spin text-indigo-500"
                    />

                    <p className="text-[12.5px] text-gray-400 dark:text-gray-500">
                        {loading
                            ? "در حال دریافت لیست مشتریان..."
                            : "در حال اعمال فیلتر..."}
                    </p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {filteredCustomers.length === 0 ? (
                        <motion.div
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
                                {filter === "all"
                                    ? "مشتری‌ای برای شما یافت نشد"
                                    : filter === "potential"
                                        ? "مشتری بالقوه‌ای یافت نشد"
                                        : "مشتری فعالی یافت نشد"}
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            layout
                            key="grid"
                            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredCustomers.map(
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
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            <AddCustomerModal
                isOpen={showAdd}
                onClose={() => setShowAdd(false)}
                onAdded={handleAdded}
            />

            <ImportExcelModal
                isOpen={showImport}
                onClose={() => setShowImport(false)}
                onSuccess={handleAdded}
            />
        </div>
    );
}
