"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock3, Loader2, RefreshCw, ShieldCheck, ShoppingCart, UserCheck, Users, XCircle, type LucideIcon } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { toPersianDigits } from "@/lib/jalali";
import type { ApiPurchasingEmployee, ApiPurchasingStep, ApiPurchasingTask, ApiTaskAttachment } from "@/types/purchasing";
import PurchasingEmployeesBar from "./Purchasingemployeesbar";
import PurchasingEmployeeModal from "./PurchasingEmployeeModal";
import PurchasingStagesPanel from "./PurchasingStagesPanel";
import PurchasingArchivePanel from "./Purchasingarchivepanel";
import StepFormModal from "./StepFormModal";
import PurchasingDeleteModal from "./PurchasingDeleteModal";
import { usePurchasingAccess } from "@/hooks/usePurchasingAccess";

const normalizeList = <T,>(value: unknown): T[] =>
    Array.isArray(value) ? (value as T[]) : ((value as { results?: T[] } | null)?.results ?? []);

function errorText(error: unknown, fallback: string) {
    const data = (error as { response?: { data?: { detail?: string; message?: string } } }).response?.data;
    return data?.detail || data?.message || fallback;
}

type DeleteTarget = { type: "step"; step: ApiPurchasingStep } | { type: "employee"; employee: ApiPurchasingEmployee } | null;

const box = "rounded-[1.45rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111827]";

function Stat({ label, value, icon: Icon, tone }: { label: string; value: string; icon: LucideIcon; tone: string }) {
    return (
        <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${tone}`}>
            <Icon size={15} className="shrink-0" />
            <div className="min-w-0">
                <p className="text-[9.5px] font-semibold opacity-80">{label}</p>
                <p className="mt-0.5 text-[13px] font-extrabold leading-none">{value}</p>
            </div>
        </div>
    );
}

export default function PurchasingPage() {
    const { isAdmin, currentEmployeeName } = usePurchasingAccess();

    const [employees, setEmployees] = useState<ApiPurchasingEmployee[]>([]);
    const [steps, setSteps] = useState<ApiPurchasingStep[]>([]);
    const [tasks, setTasks] = useState<ApiPurchasingTask[]>([]);
    const [attachments, setAttachments] = useState<ApiTaskAttachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
    const [stepModalOpen, setStepModalOpen] = useState(false);
    const [editingStep, setEditingStep] = useState<ApiPurchasingStep | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const loadAll = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true);
        else setLoading(true);
        setError("");
        try {
            const [e, s, t, a] = await Promise.all([
                axiosInstance.get("/purchasing/api/v1/employees/"),
                axiosInstance.get("/purchasing/api/v1/steps/"),
                axiosInstance.get("/purchasing/api/v1/tasks/"),
                axiosInstance.get("/purchasing/api/v1/task-attachments/"),
            ]);
            setEmployees(normalizeList<ApiPurchasingEmployee>(e.data));
            setSteps(normalizeList<ApiPurchasingStep>(s.data).sort((x, y) => x.order - y.order));
            setTasks(normalizeList<ApiPurchasingTask>(t.data));
            setAttachments(normalizeList<ApiTaskAttachment>(a.data));
        } catch (err) {
            setError(errorText(err, "دریافت اطلاعات خرید انجام نشد"));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const activeTasks = useMemo(() => tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled"), [tasks]);

    const stats = useMemo(
        () => ({
            active: activeTasks.length,
            completed: tasks.filter((t) => t.status === "completed").length,
            cancelled: tasks.filter((t) => t.status === "cancelled").length,
            members: employees.filter((e) => e.is_active !== false).length,
        }),
        [tasks, activeTasks, employees]
    );

    const closeStepModal = () => {
        setStepModalOpen(false);
        setEditingStep(null);
    };

    // مسیر patch/delete کارمند: اگر در بک‌اند اسم دیگری دارد فقط همین‌ها را عوض کنید
    const toggleEmployee = async (employee: ApiPurchasingEmployee) => {
        try {
            await axiosInstance.patch(`/purchasing/api/v1/employees/${employee.id}/patch/`, { is_active: employee.is_active === false });
            await loadAll(true);
        } catch (err) {
            setError(errorText(err, "تغییر وضعیت انجام نشد"));
        }
    };

    const deleteMeta = useMemo(() => {
        if (!deleteTarget) return { title: "", description: "" };
        if (deleteTarget.type === "step")
            return { title: `حذف مرحله «${deleteTarget.step.title}»`, description: "این مرحله از فرآیند خرید حذف می‌شود." };
        return { title: `حذف «${deleteTarget.employee.employee_name}» از تیم`, description: "این عضو از فرآیند خرید حذف می‌شود." };
    }, [deleteTarget]);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            const url =
                deleteTarget.type === "step"
                    ? `/purchasing/api/v1/steps/${deleteTarget.step.id}/delete/`
                    : `/purchasing/api/v1/employees/${deleteTarget.employee.id}/delete/`;
            await axiosInstance.delete(url);
            await loadAll(true);
        } catch (err) {
            setError(errorText(err, "حذف انجام نشد"));
        } finally {
            setDeleteLoading(false);
            setDeleteTarget(null);
        }
    };

    return (
        <div dir="rtl" className="space-y-4 p-3 sm:p-5">
            <PurchasingDeleteModal open={!!deleteTarget} title={deleteMeta.title} description={deleteMeta.description} loading={deleteLoading} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />

            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className={`${box} p-3`}>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
                            <ShoppingCart size={18} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">مدیریت خرید</h1>
                            <p className="mt-0.5 truncate text-[10.5px] font-semibold text-gray-400">مدیریت مراحل، کارمندان و فرآیندهای خرید</p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <span className={`hidden h-9 items-center gap-1.5 rounded-full px-3 text-[10.5px] font-extrabold md:flex ${isAdmin ? "bg-amber-500/10 text-amber-500" : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"}`}>
                            {isAdmin ? <ShieldCheck size={12} /> : <UserCheck size={12} />}
                            {isAdmin ? "ادمین" : "کارمند"}
                            {currentEmployeeName ? ` · ${currentEmployeeName}` : ""}
                        </span>
                        <button type="button" onClick={() => loadAll(true)} disabled={loading || refreshing} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300">
                            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Stat label="در جریان" value={toPersianDigits(stats.active)} icon={Clock3} tone="bg-amber-50/70 text-amber-600 dark:bg-amber-500/[0.07] dark:text-amber-400" />
                    <Stat label="تکمیل‌شده" value={toPersianDigits(stats.completed)} icon={CheckCircle2} tone="bg-emerald-50/70 text-emerald-600 dark:bg-emerald-500/[0.07] dark:text-emerald-400" />
                    <Stat label="لغوشده" value={toPersianDigits(stats.cancelled)} icon={XCircle} tone="bg-red-50/70 text-red-500 dark:bg-red-500/[0.07] dark:text-red-400" />
                    <Stat label="اعضای فعال" value={`${toPersianDigits(stats.members)}/${toPersianDigits(employees.length)}`} icon={Users} tone="bg-indigo-50/70 text-indigo-600 dark:bg-indigo-500/[0.07] dark:text-indigo-400" />
                </div>
            </motion.div>

            {error && (
                <div className="flex items-center gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10">
                    <XCircle size={14} className="shrink-0 text-red-500" />
                    <span className="flex-1 text-[11.5px] font-semibold text-red-500 dark:text-red-400">{error}</span>
                    <button type="button" onClick={() => loadAll()} className="rounded-full bg-red-500 px-3 py-1.5 text-[10px] font-extrabold text-white transition hover:bg-red-600">تلاش مجدد</button>
                </div>
            )}

            {loading ? (
                <div className={`${box} flex h-32 items-center justify-center`}>
                    <Loader2 size={20} className="animate-spin text-indigo-500" />
                </div>
            ) : (
                <>
                    <PurchasingEmployeesBar
                        employees={employees}
                        canManage={isAdmin}
                        onAdd={() => setEmployeeModalOpen(true)}
                        onToggleActive={toggleEmployee}
                        onDelete={(employee) => setDeleteTarget({ type: "employee", employee })}
                    />

                    <PurchasingStagesPanel
                        steps={steps}
                        tasks={activeTasks}
                        attachments={attachments}
                        onEditStep={(step) => {
                            setEditingStep(step);
                            setStepModalOpen(true);
                        }}
                        onDeleteStep={(step) => setDeleteTarget({ type: "step", step })}
                        onUpdated={() => loadAll(true)}
                        onAddStep={() => {
                            setEditingStep(null);
                            setStepModalOpen(true);
                        }}
                    />

                    <PurchasingArchivePanel tasks={tasks} steps={steps} attachments={attachments} />
                </>
            )}

            {isAdmin && (
                <PurchasingEmployeeModal
                    open={employeeModalOpen}
                    onClose={() => setEmployeeModalOpen(false)}
                    existingEmployees={employees}
                    onSaved={() => {
                        setEmployeeModalOpen(false);
                        loadAll(true);
                    }}
                />
            )}

            <StepFormModal
                open={stepModalOpen}
                onClose={closeStepModal}
                step={editingStep}
                steps={steps}
                employees={employees}
                onSaved={() => {
                    closeStepModal();
                    loadAll(true);
                }}
            />
        </div>
    );
}