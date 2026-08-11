"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FolderKanban, Inbox, Loader2, Plus, Search } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import { Case, CaseStatus } from "@/types/case";
import { Customer } from "@/types/customer";
import { Department } from "@/types/department";
import CaseCard from "@/components/customcomponents/cases/CaseCard";
import CreateCaseModal from "@/components/customcomponents/cases/CreateCaseModal";
import EditCaseModal from "@/components/customcomponents/cases/EditCaseModal";
import { caseStatusLabels } from "@/components/customcomponents/shared/constants";

const getListData = <T,>(data: T[] | { results?: T[] }) => {
    return Array.isArray(data) ? data : data.results ?? [];
};

export default function AdminCasesPage() {
    const [cases, setCases] = useState<Case[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<CaseStatus | "ALL">("ALL");
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [editingCase, setEditingCase] = useState<Case | null>(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);

        try {
            const [
                casesResponse,
                customersResponse,
                departmentsResponse,
            ] = await Promise.all([
                axiosInstance.get(apiRoutes.cases),
                axiosInstance.get(apiRoutes.customers),
                axiosInstance.get(apiRoutes.departments),
            ]);

            setCases(getListData<Case>(casesResponse.data));
            setCustomers(getListData<Customer>(customersResponse.data));
            setDepartments(getListData<Department>(departmentsResponse.data));
        } catch (error) {
            console.error("خطا در دریافت اطلاعات پرونده‌ها:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const filteredCases = useMemo(() => {
        const query = search.trim().toLowerCase();

        return cases.filter((caseItem) => {
            const title = caseItem.title?.toLowerCase() ?? "";
            const description = caseItem.description?.toLowerCase() ?? "";

            const matchesStatus =
                statusFilter === "ALL" || caseItem.status === statusFilter;

            const matchesSearch =
                !query ||
                title.includes(query) ||
                description.includes(query);

            return matchesStatus && matchesSearch;
        });
    }, [cases, search, statusFilter]);

    const handleDelete = async (caseId: number) => {
        try {
            await axiosInstance.delete(apiRoutes.deleteCase(caseId));
            await fetchAll();
        } catch (error) {
            console.error("خطا در حذف پرونده:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0b1220] p-4 text-white sm:p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-4xl bg-blue-500/15 text-blue-400">
                            <FolderKanban className="h-6 w-6" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold sm:text-3xl">
                                مدیریت پرونده‌ها
                            </h1>

                            <p className="mt-1 text-sm text-slate-400">
                                {cases.length} پرونده ثبت شده
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 rounded-4xl bg-blue-600 px-5 py-3 text-sm font-medium transition-colors hover:bg-blue-500"
                    >
                        <Plus className="h-4 w-4" />
                        پرونده جدید
                    </button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="جستجوی عنوان یا توضیحات پرونده..."
                            className="w-full rounded-4xl border border-slate-700 bg-slate-900 py-3 pl-4 pr-11 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(
                                event.target.value as CaseStatus | "ALL"
                            )
                        }
                        className="rounded-4xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-blue-500"
                    >
                        <option value="ALL">همه وضعیت‌ها</option>

                        {(Object.keys(caseStatusLabels) as CaseStatus[]).map(
                            (status) => (
                                <option key={status} value={status}>
                                    {caseStatusLabels[status]}
                                </option>
                            )
                        )}
                    </select>
                </div>

                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : filteredCases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-4xl border border-dashed border-slate-700 py-16 text-slate-500">
                        <Inbox className="h-10 w-10" />
                        <p className="text-sm">
                            پرونده‌ای با این مشخصات پیدا نشد
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {filteredCases.map((caseItem) => (
                            <CaseCard
                                key={caseItem.id}
                                caseItem={caseItem}
                                customer={customers.find(
                                    (customer) =>
                                        customer.id === caseItem.customer
                                )}
                                department={departments.find(
                                    (department) =>
                                        department.id === caseItem.department
                                )}
                                onEdit={() => setEditingCase(caseItem)}
                                onDelete={() =>
                                    handleDelete(caseItem.id)
                                }
                            />
                        ))}
                    </div>
                )}
            </div>

            <CreateCaseModal
                isOpen={showCreate}
                customers={customers}
                onClose={() => setShowCreate(false)}
                onSuccess={async () => {
                    setShowCreate(false);
                    await fetchAll();
                }}
            />

            {editingCase && (
                <EditCaseModal
                    caseItem={editingCase}
                    customers={customers}
                    departments={departments}
                    onClose={() => setEditingCase(null)}
                    onSuccess={async () => {
                        setEditingCase(null);
                        await fetchAll();
                    }}
                />
            )}
        </div>
    );
}
