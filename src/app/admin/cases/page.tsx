"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { apiRoutes } from "@/lib/apiRoutes";

import {
    BriefcaseBusiness,
    ClipboardList,
    Loader,
    Loader2,
    Plus,
    RefreshCw,
    Trash2,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { Customer, Case, Department, Employee } from "./types";
import {
    GlassModal,
    FloatingInput,
    FloatingTextarea,
    PrimaryButton,
} from "@/components/customcomponents/shared/FloatingInput";
import CaseCard from "@/components/customcomponents/cases/CaseCard";

type CreateCaseState = {
    title: string;
    description: string;
    customer: string;
};

type ListResponse<T> = T[] | { results?: T[]; data?: T[] };

function extractList<T>(data: ListResponse<T>): T[] {
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

    const [caseModalOpen, setCaseModalOpen] = useState(false);
    const [caseSubmitting, setCaseSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [createCase, setCreateCase] = useState<CreateCaseState>({
        title: "",
        description: "",
        customer: "",
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
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
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateCase = async () => {
        if (!createCase.title.trim() || !createCase.customer) return;

        try {
            setCaseSubmitting(true);
            await axiosInstance.post("/tasks/api/v1/cases/create/", {
                title: createCase.title.trim(),
                description: createCase.description.trim(),
                customer: Number(createCase.customer),
            });
            setCreateCase({ title: "", description: "", customer: "" });
            setCaseModalOpen(false);
            await fetchData();
        } catch (error) {
            console.error(error);
        } finally {
            setCaseSubmitting(false);
        }
    };

    const handleDeleteCase = useCallback(
        async (item: Case) => {
            const id = Number(item.id);
            try {
                setDeletingId(id);
                await axiosInstance.delete(`/tasks/api/v1/cases/${id}/delete/`);
                setCases((prev) => prev.filter((c) => c.id !== id));
            } catch (error) {
                console.error(error);
                await fetchData();
            } finally {
                setDeletingId(null);
            }
        },
        [fetchData]
    );

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
                            {loading ? "در حال بارگذاری..." : `${cases.length} پرونده فعال در سیستم`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-gray-300"
                        title="بارگذاری مجدد"
                        type="button"
                    >
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                    </button>

                    <button
                        onClick={() => setCaseModalOpen(true)}
                        className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-[12.5px] font-bold text-white transition-all duration-200 hover:bg-blue-100 hover:text-blue-600 dark:bg-blue-500 dark:hover:bg-blue-500/15 dark:hover:text-blue-300 sm:flex-none"
                        type="button"
                    >
                        <Plus size={13} strokeWidth={2.5} />
                        <span className="whitespace-nowrap">پرونده جدید</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader size={22} className="text-indigo-500 animate-spin" />
                    <p className="text-[12.5px] !text-gray-400 dark:!text-gray-500">
                        در حال دریافت لیست پرونده ها...
                    </p>
                </div>
            ) : cases.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20">
                    <p className="text-[13px] text-gray-400 dark:text-gray-500">
                        پرونده‌ای ثبت نشده است
                    </p>
                </div>
            ) : (
                <motion.div
                    layout
                    className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3"
                >
                    <AnimatePresence mode="popLayout">
                        {cases.map((item, i) => (
                            <CaseCard
                                key={item.id}
                                item={item}
                                index={i}
                                customers={customers}
                                departments={departments}
                                users={employees}
                                isDeleting={deletingId === item.id}
                                onDelete={() => handleDeleteCase(item)}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            <GlassModal
                isOpen={caseModalOpen}
                onClose={() => setCaseModalOpen(false)}
                title="ایجاد پرونده جدید"
                maxWidth="max-w-2xl"
            >
                <div className="space-y-4">
                    <FloatingInput
                        id="case-title"
                        label="عنوان پرونده"
                        value={createCase.title}
                        onChange={(e) => setCreateCase((prev) => ({ ...prev, title: e.target.value }))}
                    />
                    <FloatingTextarea
                        id="case-description"
                        label="توضیحات"
                        value={createCase.description}
                        onChange={(e) => setCreateCase((prev) => ({ ...prev, description: e.target.value }))}
                    />

                    <div className="relative">
                        <div className="pointer-events-none absolute right-4 top-1/2 z-10 -translate-y-1/2 text-slate-400">
                            <BriefcaseBusiness size={16} />
                        </div>
                        <select
                            value={createCase.customer}
                            onChange={(e) => setCreateCase((prev) => ({ ...prev, customer: e.target.value }))}
                            className="h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-white/70 px-12 pr-12 text-slate-900 outline-none transition focus:border-sky-500/50 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                        >
                            <option value="" className="text-black dark:text-black">
                                انتخاب مشتری
                            </option>
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id} className="text-black dark:text-black">
                                    {customer.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                        <PrimaryButton variant="secondary" onClick={() => setCaseModalOpen(false)}>
                            انصراف
                        </PrimaryButton>
                        <PrimaryButton
                            onClick={handleCreateCase}
                            loading={caseSubmitting}
                            disabled={!createCase.title.trim() || !createCase.customer}
                        >
                            ثبت پرونده
                        </PrimaryButton>
                    </div>
                </div>
            </GlassModal>
        </div>
    );
}