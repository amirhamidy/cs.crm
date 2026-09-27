"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, ShieldCheck, ShoppingCart, UserCheck } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type {
    ApiPurchasingEmployee,
    ApiPurchasingStep,
    ApiPurchasingTask,
    ApiTaskAttachment,
} from "@/types/purchasing";
import PurchasingEmployeesBar from "./Purchasingemployeesbar";
import PurchasingEmployeeModal from "./PurchasingEmployeeModal";
import PurchasingStagesPanel from "./PurchasingStagesPanel";
import PurchasingArchivePanel from "./Purchasingarchivepanel";
import StepFormModal from "./StepFormModal";
import PurchasingDeleteModal from "./PurchasingDeleteModal";
import { usePurchasingAccess } from "@/hooks/usePurchasingAccess";

const normalizeList = <T,>(value: unknown): T[] => {
    if (Array.isArray(value)) return value as T[];

    if (
        value &&
        typeof value === "object" &&
        "results" in value &&
        Array.isArray((value as { results?: unknown }).results)
    ) {
        return (value as { results: T[] }).results;
    }

    return [];
};

type DeleteTarget =
    | { type: "step"; step: ApiPurchasingStep }
    | { type: "employee"; employee: ApiPurchasingEmployee }
    | null;

export default function PurchasingPage() {
    const { isAdmin, currentEmployeeName } = usePurchasingAccess();

    const [employees, setEmployees] = useState<ApiPurchasingEmployee[]>([]);
    const [steps, setSteps] = useState<ApiPurchasingStep[]>([]);
    const [tasks, setTasks] = useState<ApiPurchasingTask[]>([]);
    const [attachments, setAttachments] = useState<ApiTaskAttachment[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
    const [stepModalOpen, setStepModalOpen] = useState(false);
    const [editingStep, setEditingStep] = useState<ApiPurchasingStep | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const loadAll = useCallback(async (silent = false) => {
        try {
            if (silent) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const [employeesResponse, stepsResponse, tasksResponse, attachmentsResponse] =
                await Promise.all([
                    axiosInstance.get("/purchasing/api/v1/employees/"),
                    axiosInstance.get("/purchasing/api/v1/steps/"),
                    axiosInstance.get("/purchasing/api/v1/tasks/"),
                    axiosInstance.get("/purchasing/api/v1/task-attachments/"),
                ]);

            setEmployees(normalizeList<ApiPurchasingEmployee>(employeesResponse.data));
            setSteps(
                normalizeList<ApiPurchasingStep>(stepsResponse.data).sort(
                    (a, b) => a.order - b.order
                )
            );
            setTasks(normalizeList<ApiPurchasingTask>(tasksResponse.data));
            setAttachments(normalizeList<ApiTaskAttachment>(attachmentsResponse.data));
        } catch (error) {
            console.error("Purchasing data loading failed:", error);

            setEmployees([]);
            setSteps([]);
            setTasks([]);
            setAttachments([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const safeEmployees = employees ?? [];
    const safeSteps = steps ?? [];
    const safeTasks = tasks ?? [];
    const safeAttachments = attachments ?? [];

    const activeStepTasks = useMemo(
        () => safeTasks.filter((task) => task.status !== "completed" && task.status !== "cancelled"),
        [safeTasks]
    );

    // --- Step handlers ---
    const handleStepEdit = (step: ApiPurchasingStep) => {
        setEditingStep(step);
        setStepModalOpen(true);
    };

    const handleStepModalClose = () => {
        setStepModalOpen(false);
        setEditingStep(null);
    };

    // --- Employee handlers ---
    // توجه: مسیرهای patch/delete کارمند بر اساس الگوی موجود در steps فرض شده‌اند
    // (/purchasing/api/v1/employees/{id}/patch/ و /delete/). اگر در بک‌اند اسم دیگری دارند، فقط همین دو خط را عوض کن.
    const handleToggleEmployeeActive = async (employee: ApiPurchasingEmployee) => {
        await axiosInstance.patch(`/purchasing/api/v1/employees/${employee.id}/patch/`, {
            is_active: employee.is_active === false,
        });
        await loadAll(true);
    };

    // --- Delete flow (shared between steps & employees) ---
    const deleteModalMeta = useMemo(() => {
        if (!deleteTarget) return { title: "", description: "" };
        if (deleteTarget.type === "step") {
            return {
                title: `حذف مرحله «${deleteTarget.step.title}»`,
                description: "این مرحله از فرآیند خرید حذف می‌شود.",
            };
        }
        return {
            title: `حذف «${deleteTarget.employee.employee_name}» از تیم`,
            description: "این عضو از فرآیند خرید حذف می‌شود.",
        };
    }, [deleteTarget]);

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        setDeleteLoading(true);
        try {
            if (deleteTarget.type === "step") {
                await axiosInstance.delete(`/purchasing/api/v1/steps/${deleteTarget.step.id}/delete/`);
            } else {
                await axiosInstance.delete(
                    `/purchasing/api/v1/employees/${deleteTarget.employee.id}/delete/`
                );
            }
            await loadAll(true);
        } finally {
            setDeleteLoading(false);
            setDeleteTarget(null);
        }
    };

    return (
        <div dir="rtl" className="flex flex-col gap-4">
            <PurchasingDeleteModal
                open={!!deleteTarget}
                title={deleteModalMeta.title}
                description={deleteModalMeta.description}
                loading={deleteLoading}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />

            {/* هدر بالای صفحه */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative flex items-center justify-between gap-3 overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-4 shadow-[0_10px_34px_rgba(15,23,42,0.05)] dark:border-white/[0.07] dark:bg-[#0A1930]"
            >
                <div
                    className="absolute inset-y-0 right-0 w-1"
                    style={{ background: "linear-gradient(180deg,#6366f1,#8b5cf6 60%,#6366f145)" }}
                />

                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
                        <ShoppingCart size={19} />
                    </div>

                    <div className="min-w-0">
                        <h1 className="truncate text-[15px] font-extrabold text-gray-900 dark:text-white">
                            مدیریت خرید
                        </h1>
                        <p className="mt-0.5 truncate text-[11px] font-medium text-gray-400">
                            مدیریت مراحل، کارمندان و فرآیندهای خرید
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <div
                        className={`hidden items-center gap-1.5 rounded-2xl px-3 py-2 text-[10.5px] font-extrabold sm:flex ${isAdmin
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                            }`}
                    >
                        {isAdmin ? <ShieldCheck size={12} /> : <UserCheck size={12} />}
                        <span>
                            {isAdmin ? "ادمین" : "کارمند"}
                            {currentEmployeeName ? ` · ${currentEmployeeName}` : ""}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => loadAll(true)}
                        disabled={loading || refreshing}
                        className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                    >
                        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                    </button>
                </div>
            </motion.div>

            {loading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-40 animate-pulse rounded-[1.8rem] border border-gray-100 bg-gray-50 dark:border-white/[0.07] dark:bg-white/[0.03]"
                        />
                    ))}
                </div>
            ) : (
                <>
                    {/* هدر اعضای تیم */}
                    <PurchasingEmployeesBar
                        employees={safeEmployees}
                        canManage={isAdmin}
                        onAdd={() => setEmployeeModalOpen(true)}
                        onToggleActive={handleToggleEmployeeActive}
                        onDelete={(employee) => setDeleteTarget({ type: "employee", employee })}
                    />

                    {/* وسط صفحه: مراحل و تسک‌ها */}
                    <PurchasingStagesPanel
                        steps={safeSteps}
                        tasks={activeStepTasks}
                        attachments={safeAttachments}
                        onEditStep={handleStepEdit}
                        onDeleteStep={(step) => setDeleteTarget({ type: "step", step })}
                        onUpdated={() => loadAll(true)}
                        onAddStep={() => {
                            setEditingStep(null);
                            setStepModalOpen(true);
                        }}
                    />

                    {/* پایین صفحه: بایگانی */}
                    <PurchasingArchivePanel
                        tasks={safeTasks}
                        steps={safeSteps}
                        attachments={safeAttachments}
                    />
                </>
            )}

            {isAdmin && (
                <PurchasingEmployeeModal
                    open={employeeModalOpen}
                    onClose={() => setEmployeeModalOpen(false)}
                    existingEmployees={safeEmployees}
                    onSaved={() => {
                        setEmployeeModalOpen(false);
                        loadAll(true);
                    }}
                />
            )}

            <StepFormModal
                open={stepModalOpen}
                onClose={handleStepModalClose}
                step={editingStep}
                steps={safeSteps}
                employees={safeEmployees}
                onSaved={() => {
                    handleStepModalClose();
                    loadAll(true);
                }}
            />
        </div>
    );
}