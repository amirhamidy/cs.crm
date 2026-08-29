"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Loader, RefreshCw, Filter } from "lucide-react";
import { useTheme } from "next-themes";
import CustomerCard from "@/components/user/customer/CustomerCard";
import AddCustomerModal from "@/components/user/customer/AddCustomerModal";
import { Customer } from "@/types/customer";
import type { Employee } from "@/types/employee";
import type { CaseItem } from "@/types/case";
import type { TaskItem } from "@/types/task";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import { useAuthStore } from "@/store/authStore";

type ListResponse<T> = T[] | { results?: T[]; data?: T[] };

type FilterType = "all" | "potential" | "active";

function extractList<T>(data: ListResponse<T> | undefined | null): T[] {
    if (Array.isArray(data)) return data;

    if (data && typeof data === "object") {
        if (Array.isArray(data.results)) return data.results;
        if (Array.isArray(data.data)) return data.data;
    }

    return [];
}

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

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customersWithCase, setCustomersWithCase] = useState<Set<number>>(
        new Set()
    );
    const [loading, setLoading] = useState(true);
    const [filterLoading, setFilterLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [filter, setFilter] = useState<FilterType>("all");

    const userId = useAuthStore((state) => state.userId);
    const username = useAuthStore((state) => state.username);

    const fetchData = useCallback(async () => {
        setLoading(true);

        try {
            const [
                customersRes,
                casesRes,
                tasksRes,
                employeesRes,
            ] = await Promise.all([
                axiosInstance.get<ListResponse<Customer>>(
                    "/customers/api/v1/customers/"
                ),
                axiosInstance.get<ListResponse<CaseItem>>(
                    "/tasks/api/v1/cases/"
                ),
                axiosInstance.get<ListResponse<TaskItem>>(
                    apiRoutes.tasks
                ),
                axiosInstance.get<ListResponse<Employee>>(
                    "/accounts/api/v1/employee/list/"
                ),
            ]);

            const allCustomers = extractList<Customer>(
                customersRes.data
            );

            const allCases = extractList<CaseItem>(
                casesRes.data
            );

            const allTasks = extractList<TaskItem>(
                tasksRes.data
            );

            const employeeList = extractList<Employee>(
                employeesRes.data
            );

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

            const detailedCases = await Promise.all(
                allCases.map(async (c) => {
                    try {
                        const detailRes = await axiosInstance.get(
                            `/ tasks / api / v1 / cases / ${ c.id }/`
                        );

return {
    ...c,
    ...detailRes.data,
};
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

const allowedCaseCustomerIds = new Set<number>();
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
        allowedCaseCustomerIds.add(customerId);
        activeCaseCustomerIds.add(customerId);
    }
});

const filteredCustomers = empId
    ? allCustomers.filter((customer: any) => {
        const isCreator =
            username &&
            customer.created_by_username &&
            customer.created_by_username === username;

        const isAssigned =
            empId &&
            (
                parseAssignedEmployees(
                    customer.assigned_employee
                ).includes(empId) ||
                parseAssignedEmployees(
                    customer.employees
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

const handleDeleted = useCallback((id: number) => {
    setCustomers((prev) =>
        prev.filter((customer) => customer.id !== id)
    );
}, []);

const handleAdded = useCallback(() => {
    fetchData();
}, [fetchData]);

const handleEdited = useCallback((updated: Customer) => {
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
    if (filter === "all") {
        return true;
    }

    if (filter === "potential") {
        return customer.status === 1;
    }

    if (filter === "active") {
        return customer.status === 2;
    }

    return true;
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
                    onClick={fetchData}
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
    </div>
);
}
