"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Loader2, Plus, Search, Users, X } from "lucide-react";
import HumanResourceCard from "./HumanResourceCard";
import HumanResourceForm from "./HumanResourceForm";
import HumanResourceStepsModal from "./HumanResourceStepsModal";
import {
    Department, DepartmentEmployee, HumanResource,
    getDepartmentEmployees, getDepartments, getDocuments, getEmployees, getMe, deleteDocument,
} from "./humanResourceApi";

const stat = (bg: string, label: string, value: string, num: number) => (
    <div className={`rounded-xl px-3 py-2 ${bg}`}>
        <p className={`text-[9.5px] font-semibold ${label}`}>{value}</p>
        <p className={`mt-0.5 text-[13px] font-extrabold ${label.replace("400", "600").replace("500", "600")}`}>{num}</p>
    </div>
);

export default function HumanResourcesPage({ canManage = false }: { canManage?: boolean }) {
    const [documents, setDocuments] = useState<HumanResource[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [departmentEmployees, setDepartmentEmployees] = useState<DepartmentEmployee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<HumanResource | null>(null);
    const [stepsDocument, setStepsDocument] = useState<HumanResource | null>(null);
    const [currentEmployeeId, setCurrentEmployeeId] = useState<number | null>(null);

    const load = useCallback(async () => {
        try {
            const [docs, deps] = await Promise.all([getDocuments(), getDepartments()]);
            setDocuments(docs.data);
            setDepartments(deps.data);

            if (!canManage) {
                const [me, emps, depEmps] = await Promise.all([getMe(), getEmployees(), getDepartmentEmployees()]);
                setDepartmentEmployees(depEmps.data);
                setCurrentEmployeeId(emps.data.find((e) => e.username === me.data.username)?.id ?? null);
            }
        } finally {
            setLoading(false);
        }
    }, [canManage]);

    useEffect(() => {
        load();
    }, [load]);

    const currentDepartmentIds = useMemo(
        () => (currentEmployeeId ? departmentEmployees.filter((i) => i.employee === currentEmployeeId).map((i) => i.department) : []),
        [currentEmployeeId, departmentEmployees]
    );

    const visibleDocuments = useMemo(() => {
        const q = search.trim().toLowerCase();
        return documents.filter((d) => {
            if (!canManage) {
                const dep = departments.find((x) => x.name === d.title);
                if (dep && !currentDepartmentIds.includes(dep.id)) return false;
            }
            return !q || d.title.toLowerCase().includes(q);
        });
    }, [canManage, documents, departments, currentDepartmentIds, search]);

    const filesCount = useMemo(() => documents.filter((i) => i.files.length > 0).length, [documents]);

    const handleDelete = useCallback(
        async (d: HumanResource) => {
            if (!confirm(`آیا از حذف «${d.title}» مطمئن هستید؟`)) return;
            await deleteDocument(d.id);
            await load();
        },
        [load]
    );

    const handleEdit = useCallback((d: HumanResource) => {
        setEditing(d);
        setFormOpen(true);
    }, []);

    return (
        <div className="space-y-4 p-3 sm:p-5" dir="rtl">
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[1.45rem] border border-gray-100 bg-white p-3 shadow-sm dark:border-white/[0.06] dark:bg-[#111827]"
            >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
                            <Users size={18} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">منابع انسانی</h1>
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-50 px-1.5 text-[9.5px] font-extrabold text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                                    {visibleDocuments.length}
                                </span>
                            </div>
                            <p className="mt-0.5 text-[10.5px] font-semibold text-gray-400">اطلاعات و فرآیندهای منابع انسانی</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative min-w-0 sm:w-64">
                            <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="جستجوی منابع انسانی..."
                                className="h-9 w-full rounded-full border border-gray-100 bg-gray-50 pr-9 pl-9 text-[11px] font-semibold text-gray-800 outline-none transition focus:border-indigo-400 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white"
                            />
                            {search && (
                                <button type="button" onClick={() => setSearch("")} className="absolute left-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:text-gray-600">
                                    <X size={11} />
                                </button>
                            )}
                        </div>

                        {canManage && (
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.97 }}
                                onClick={() => {
                                    setEditing(null);
                                    setFormOpen(true);
                                }}
                                className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-indigo-600 px-4 text-[11px] font-extrabold text-white transition hover:bg-indigo-500"
                            >
                                <Plus size={13} />
                                ایجاد منبع
                            </motion.button>
                        )}
                    </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
                        <p className="text-[9.5px] font-semibold text-gray-400">کل منابع</p>
                        <p className="mt-0.5 text-[13px] font-extrabold text-gray-800 dark:text-white">{documents.length}</p>
                    </div>
                    <div className="rounded-xl bg-indigo-50/70 px-3 py-2 dark:bg-indigo-500/[0.07]">
                        <p className="text-[9.5px] font-semibold text-indigo-400">قابل مشاهده</p>
                        <p className="mt-0.5 text-[13px] font-extrabold text-indigo-600 dark:text-indigo-400">{visibleDocuments.length}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50/70 px-3 py-2 dark:bg-emerald-500/[0.07]">
                        <p className="text-[9.5px] font-semibold text-emerald-500">دپارتمان‌ها</p>
                        <p className="mt-0.5 text-[13px] font-extrabold text-emerald-600 dark:text-emerald-400">{departments.length}</p>
                    </div>
                    <div className="rounded-xl bg-amber-50/70 px-3 py-2 dark:bg-amber-500/[0.07]">
                        <p className="text-[9.5px] font-semibold text-amber-500">فایل‌دار</p>
                        <p className="mt-0.5 text-[13px] font-extrabold text-amber-600 dark:text-amber-400">{filesCount}</p>
                    </div>
                </div>
            </motion.div>

            {loading ? (
                <div className="flex h-32 items-center justify-center rounded-[1.45rem] border border-gray-100 bg-white dark:border-white/[0.06] dark:bg-[#111827]">
                    <Loader2 size={20} className="animate-spin text-indigo-500" />
                </div>
            ) : visibleDocuments.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex min-h-[230px] flex-col items-center justify-center rounded-[1.45rem] border border-dashed border-gray-200 bg-white text-center dark:border-white/[0.07] dark:bg-[#111827]"
                >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10">
                        {search ? <Search size={19} className="text-indigo-400" /> : <FileText size={19} className="text-indigo-400" />}
                    </div>
                    <h3 className="text-[12.5px] font-extrabold text-gray-800 dark:text-white">منبع انسانی‌ای پیدا نشد</h3>
                    <p className="mt-1.5 max-w-xs text-[10.5px] font-semibold leading-5 text-gray-400">
                        {search ? "نتیجه‌ای مطابق جستجوی شما وجود ندارد." : "هنوز منبع انسانی‌ای ثبت نشده است."}
                    </p>
                </motion.div>
            ) : (
                <motion.div layout className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    <AnimatePresence mode="popLayout">
                        {visibleDocuments.map((d, i) => (
                            <motion.div key={d.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.035 }}>
                                <HumanResourceCard
                                    document={d}
                                    departments={departments}
                                    canManage={canManage}
                                    onEdit={() => handleEdit(d)}
                                    onDelete={() => handleDelete(d)}
                                    onSteps={() => setStepsDocument(d)}
                                    onChange={load}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {canManage && (
                <HumanResourceForm
                    open={formOpen}
                    document={editing}
                    departments={departments}
                    onClose={() => {
                        setFormOpen(false);
                        setEditing(null);
                    }}
                    onSaved={load}
                />
            )}

            <HumanResourceStepsModal open={!!stepsDocument} document={stepsDocument} canManage={canManage} onClose={() => setStepsDocument(null)} onChange={load} />
        </div>
    );
}