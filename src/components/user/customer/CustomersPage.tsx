"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Users, Plus, Loader, RefreshCw, Filter, FileSpreadsheet } from "lucide-react";
import CustomerCard from "./CustomerCard";
import AddCustomerModal from "./AddCustomerModal";
import ImportExcelModal from "./ImportExcelModal";
import Pagination from "@/components/ui/Pagination";
import type { Customer, CustomerStatus } from "@/types/customer";
import { customersApi, casesApi, type CustomerCounts } from "@/lib/api";

type FilterType = "all" | "potential" | "active";

const PAGE_SIZE = 20;

const STATUS_BY_FILTER: Record<FilterType, CustomerStatus | undefined> = {
    all: undefined,
    potential: 1,
    active: 2,
};

const EMPTY_COUNTS: CustomerCounts = { all: 0, potential: 0, active: 0 };

export default function CustomersPage() {
    const { resolvedTheme } = useTheme();

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    const isDark = mounted && resolvedTheme === "dark";

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [counts, setCounts] = useState<CustomerCounts>(EMPTY_COUNTS);
    const [customersWithCase, setCustomersWithCase] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [filter, setFilter] = useState<FilterType>("all");
    const [page, setPage] = useState(1);

    const requestId = useRef(0);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const fetchCounts = useCallback(async () => {
        try {
            setCounts(await customersApi.counts());
        } catch {
            /* شمارنده‌ها اختیاری‌اند */
        }
    }, []);

    const fetchCases = useCallback(async () => {
        try {
            const cases = await casesApi.listAll();
            setCustomersWithCase(new Set(cases.map((c) => Number(c.customer))));
        } catch {
            setCustomersWithCase(new Set());
        }
    }, []);

    const fetchCustomers = useCallback(async () => {
        const id = ++requestId.current;
        setLoading(true);

        try {
            const data = await customersApi.list({
                page,
                page_size: PAGE_SIZE,
                status: STATUS_BY_FILTER[filter],
            });

            if (id !== requestId.current) return;

            setCustomers(data.results);
            setTotalCount(data.count);
        } catch {
            if (id !== requestId.current) return;
            setCustomers([]);
            setTotalCount(0);
        } finally {
            if (id === requestId.current) setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    useEffect(() => {
        fetchCases();
        fetchCounts();
    }, [fetchCases, fetchCounts]);

    const refreshAll = useCallback(() => {
        customersApi.invalidate();
        fetchCustomers();
        fetchCases();
        fetchCounts();
    }, [fetchCustomers, fetchCases, fetchCounts]);

    const handleDeleted = useCallback(() => {
        customersApi.invalidate();
        if (customers.length === 1 && page > 1) {
            setPage((p) => p - 1);
        } else {
            fetchCustomers();
        }
        fetchCounts();
    }, [customers.length, page, fetchCustomers, fetchCounts]);

    const handleAdded = useCallback(() => {
        refreshAll();
    }, [refreshAll]);

    const handleEdited = useCallback(
        (updated: Customer) => {
            customersApi.invalidate();
            setCustomers((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
            fetchCounts();
        },
        [fetchCounts],
    );

    const handleFilterChange = (newFilter: FilterType) => {
        if (newFilter === filter) return;
        setFilter(newFilter);
        setPage(1);
    };

    const goToPage = (p: number) => {
        if (p < 1 || p > totalPages || p === page) return;
        setPage(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const filterOptions: { value: FilterType; label: string; count: number }[] = [
        { value: "all", label: "همه", count: counts.all },
        { value: "potential", label: "بالقوه", count: counts.potential },
        { value: "active", label: "فعال", count: counts.active },
    ];

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                        style={{ background: isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)" }}
                    >
                        <Users size={18} className="text-indigo-500" />
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">مدیریت مشتریان</h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
                            {loading ? "در حال بارگذاری..." : `${totalCount} مشتری ثبت شده`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={refreshAll}
                        disabled={loading}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl transition-colors disabled:opacity-50"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)",
                            color: isDark ? "#cbd5e1" : "#475569",
                        }}
                        title="بارگذاری مجدد"
                        type="button"
                    >
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                    </button>

                    <button
                        onClick={() => setShowImport(true)}
                        className="flex h-10 items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 text-[12.5px] font-bold text-emerald-600 transition-colors hover:bg-emerald-500 hover:text-white dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"
                        type="button"
                    >
                        <FileSpreadsheet size={15} />
                        <span>افزودن با اکسل</span>
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
                    style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
                >
                    <Filter size={13} className="text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-400">فیلتر:</span>
                </div>

                <div className="flex gap-1.5">
                    {filterOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => handleFilterChange(opt.value)}
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

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader size={24} className="animate-spin text-indigo-500" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">در حال دریافت لیست مشتریان...</p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {customers.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="flex flex-col items-center justify-center gap-2 py-16"
                        >
                            <Users size={28} className="text-gray-300 dark:text-gray-700" />
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
                            key={`grid-${filter}-${page}`}
                            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
                        >
                            <AnimatePresence mode="popLayout">
                                {customers.map((customer, i) => (
                                    <CustomerCard
                                        key={customer.id}
                                        customer={customer}
                                        index={i}
                                        hasActiveCase={customersWithCase.has(customer.id)}
                                        onDeleted={handleDeleted}
                                        onEdited={handleEdited}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {!loading && totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={goToPage} />}

            <AddCustomerModal isOpen={showAdd} onClose={() => setShowAdd(false)} onAdded={handleAdded} />
            <ImportExcelModal isOpen={showImport} onClose={() => setShowImport(false)} onSuccess={handleAdded} />
        </div>
    );
}
