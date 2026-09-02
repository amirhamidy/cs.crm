"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Users, Plus, Loader, RefreshCw, Filter } from "lucide-react";
import CustomerCard from "./CustomerCard";
import AddCustomerModal from "./AddCustomerModal";
import { Customer } from "@/types/customer";
import axiosInstance from "@/lib/axiosInstance";

interface CaseItem {
    id: number;
    customer: number;
}

type FilterType = "all" | "potential" | "active";

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

    const fetchData = useCallback(async () => {
        setLoading(true);

        try {
            const [customersRes, casesRes] = await Promise.all([
                axiosInstance.get<Customer[]>(
                    "/customers/api/v1/customers/"
                ),
                axiosInstance.get<CaseItem[]>("/tasks/api/v1/cases/"),
            ]);

            setCustomers(customersRes.data);

            const ids = new Set(casesRes.data.map((c) => c.customer));
            setCustomersWithCase(ids);
        } catch {
            setCustomers([]);
            setCustomersWithCase(new Set());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleted = useCallback((id: number) => {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
    }, []);

    const handleAdded = useCallback(() => {
        fetchData();
    }, [fetchData]);

    const handleEdited = useCallback((updated: Customer) => {
        setCustomers((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
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
        return (
            filter === "all" ||
            (filter === "potential" && customer.status === 1) ||
            (filter === "active" && customer.status === 2)
        );
    });

    const potentialCount = customers.filter(
        (c) => c.status === 1
    ).length;

    const activeCount = customers.filter(
        (c) => c.status === 2
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
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,0.14)"
                                : "rgba(99,102,241,0.08)",
                        }}
                    >
                        <Users
                            size={18}
                            className="text-indigo-500"
                        />
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                            مدیریت مشتریان
                        </h1>

                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
                            {isLoading
                                ? "در حال بارگذاری..."
                                : `${filteredCustomers.length} مشتری ثبت شده`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        disabled={isLoading}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl transition-colors disabled:opacity-50"
                        style={{
                            background: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(15,23,42,0.05)",
                            color: isDark
                                ? "#cbd5e1"
                                : "#475569",
                        }}
                        title="بارگذاری مجدد"
                        type="button"
                    >
                        <RefreshCw
                            size={15}
                            className={
                                isLoading ? "animate-spin" : ""
                            }
                        />
                    </button>

                    <button
                        onClick={() => setShowAdd(true)}
                        className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-700"
                        type="button"
                    >
                        <Plus size={15} />
                        <span>افزودن مشتری</span>
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
                    {filterOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() =>
                                handleFilterChange(opt.value)
                            }
                            className={`flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-[11.5px] font-bold transition-all duration-200 ${filter === opt.value
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                }`}
                            style={{
                                background:
                                    filter === opt.value
                                        ? undefined
                                        : isDark
                                            ? "rgba(255,255,255,0.04)"
                                            : "rgba(0,0,0,0.03)",
                            }}
                            type="button"
                        >
                            {opt.label}

                            <span
                                className={`rounded-lg px-1.5 py-0.5 text-[10px] font-bold ${filter === opt.value
                                        ? "bg-white/20 text-white"
                                        : "bg-gray-200/50 text-gray-400 dark:bg-white/10 dark:text-gray-500"
                                    }`}
                            >
                                {opt.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader
                        size={24}
                        className="animate-spin text-indigo-500"
                    />

                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">
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
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="flex flex-col items-center justify-center gap-2 py-16"
                        >
                            <Users
                                size={28}
                                className="text-gray-300 dark:text-gray-700"
                            />

                            <p className="text-[12.5px] text-gray-500 dark:text-gray-400">
                                {filter === "all"
                                    ? "هنوز مشتری‌ای ثبت نشده"
                                    : filter === "potential"
                                        ? "مشتری بالقوه‌ای یافت نشد"
                                        : "مشتری فعالی یافت نشد"}
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            layout
                            key="grid"
                            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredCustomers.map(
                                    (customer, i) => (
                                        <CustomerCard
                                            key={customer.id}
                                            customer={customer}
                                            index={i}
                                            hasActiveCase={customersWithCase.has(
                                                customer.id
                                            )}
                                            onDeleted={handleDeleted}
                                            onEdited={handleEdited}
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