"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, Loader, Plus, RefreshCw, Search, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import { Case, Customer, Department, Employee } from "./types";
import CaseCard from "@/components/customcomponents/cases/CaseCard";
import CreateCaseModal from "@/components/customcomponents/cases/CreateCaseModal";

type ListResponse<T> = T[] | { results?: T[]; data?: T[] };

function extractList<T>(data: ListResponse<T> | undefined | null): T[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
        if (Array.isArray(data.results)) return data.results;
        if (Array.isArray(data.data)) return data.data;
    }
    return [];
}

export default function AdminCasesPage() {
    const [cases, setCases] = useState<Case[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [caseModalOpen, setCaseModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const [casesRes, customersRes, departmentsRes, employeesRes] = await Promise.all([
                axiosInstance.get<ListResponse<Case>>(apiRoutes.cases),
                axiosInstance.get<ListResponse<Customer>>(apiRoutes.customers),
                axiosInstance.get<ListResponse<Department>>(apiRoutes.departments),
                axiosInstance.get<ListResponse<Employee>>(apiRoutes.departmentEmployees),
            ]);
            setCases(extractList(casesRes.data));
            setCustomers(extractList(customersRes.data));
            setDepartments(extractList(departmentsRes.data));
            setEmployees(extractList(employeesRes.data));
        } catch (err) {
            console.error(err);
            setError("دریافت اطلاعات با خطا مواجه شد");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteCase = useCallback(
        async (item: Case) => {
            const id = Number(item.id);
            if (!id) return;
            try {
                setDeletingId(id);
                await axiosInstance.delete(`/tasks/api/v1/cases/${id}/delete/`);
                setCases((prev) => prev.filter((c) => Number(c.id) !== id));
            } catch (err) {
                console.error(err);
                await fetchData();
            } finally {
                setDeletingId(null);
            }
        },
        [fetchData]
    );

    const filteredCases = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return cases;
        return cases.filter((item) => {
            const customer = customers.find((c) => Number(c.id) === Number(item.customer));
            const customerName = [
                customer?.first_name,
                customer?.last_name,
                (customer as unknown as { full_name?: string })?.full_name,
                (customer as unknown as { company_name?: string })?.company_name,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return (
                String(item.title ?? "").toLowerCase().includes(q) ||
                String(item.description ?? "").toLowerCase().includes(q) ||
                String(item.id ?? "").includes(q) ||
                customerName.includes(q)
            );
        });
    }, [cases, customers, query]);

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10">
                        <ClipboardList size={16} className="text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                            پرونده‌ها
                        </h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-400 dark:text-gray-500">
                            {loading
                                ? "در حال بارگذاری..."
                                : `${cases.length} پرونده فعال در سیستم`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        type="button"
                        title="بارگذاری مجدد"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-gray-300"
                    >
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                    </button>

                    <button
                        onClick={() => setCaseModalOpen(true)}
                        type="button"
                        className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 text-[12.5px] font-bold text-white transition-all duration-200 hover:bg-indigo-500 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-400 sm:flex-none"
                    >
                        <Plus size={13} strokeWidth={2.5} />
                        <span className="whitespace-nowrap">پرونده جدید</span>
                    </button>
                </div>
            </div>

            <div className="relative">
                <Search
                    size={14}
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="جستجو در عنوان، توضیحات یا نام مشتری..."
                    className="h-11 w-full rounded-2xl border border-gray-200 bg-white pr-10 pl-10 text-[12.5px] text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-400 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-indigo-400/60"
                />
                {query && (
                    <button
                        onClick={() => setQuery("")}
                        type="button"
                        className="absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200"
                    >
                        <X size={13} />
                    </button>
                )}
            </div>

            {error && !loading && (
                <div className="flex flex-col items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[12.5px] text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 sm:flex-row sm:items-center sm:justify-between">
                    <span>{error}</span>
                    <button
                        onClick={fetchData}
                        type="button"
                        className="rounded-xl bg-rose-600 px-3 py-1.5 text-[11.5px] font-bold text-white transition-colors hover:bg-rose-500"
                    >
                        تلاش مجدد
                    </button>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader size={22} className="animate-spin text-indigo-500" />
                    <p className="text-[12.5px] text-gray-400 dark:text-gray-500">
                        در حال دریافت لیست پرونده‌ها...
                    </p>
                </div>
            ) : cases.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gray-100 dark:bg-white/5">
                        <ClipboardList size={20} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-[13px] text-gray-400 dark:text-gray-500">
                        پرونده‌ای ثبت نشده است
                    </p>
                    <button
                        onClick={() => setCaseModalOpen(true)}
                        type="button"
                        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    >
                        ایجاد اولین پرونده
                    </button>
                </div>
            ) : filteredCases.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-20">
                    <p className="text-[13px] text-gray-400 dark:text-gray-500">
                        نتیجه‌ای برای «{query}» پیدا نشد
                    </p>
                    <button
                        onClick={() => setQuery("")}
                        type="button"
                        className="text-[12px] font-bold text-indigo-500 transition-colors hover:text-indigo-400"
                    >
                        پاک کردن جستجو
                    </button>
                </div>
            ) : (
                <motion.div
                    layout
                    className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredCases.map((item, i) => (
                            <CaseCard
                                key={item.id}
                                item={item}
                                index={i}
                                customers={customers}
                                departments={departments}
                                users={employees}
                                isDeleting={deletingId === Number(item.id)}
                                onDelete={() => handleDeleteCase(item)}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            <CreateCaseModal
                open={caseModalOpen}
                onClose={() => setCaseModalOpen(false)}
                onCreated={fetchData}
                customers={customers}
            />
        </div>
    );
}