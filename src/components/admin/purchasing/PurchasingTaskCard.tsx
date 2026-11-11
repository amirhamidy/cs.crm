"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeftCircle,
    ArrowRightCircle,
    CheckCircle2,
    FileText,
    ListOrdered,
    MessageSquareText,
    Package,
    UserCheck,
    UserRound,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { toPersianDigits } from "@/lib/jalali";
import type {
    ApiPurchasingStep,
    ApiPurchasingTask,
    ApiTaskAttachment,
} from "@/types/purchasing";
import { PURCHASING_TASK_STATUS_META } from "@/types/purchasing";
import { usePurchasingAccess } from "@/hooks/usePurchasingAccess";
import TaskTransitionModal from "./TaskTransitionModal";
import TaskHistoryModal, {
    type PurchasingTaskHistoryEntry,
} from "./Taskhistorymodal";

interface Props {
    task: ApiPurchasingTask;
    index: number;
    steps: ApiPurchasingStep[];
    attachments: ApiTaskAttachment[];
    accent?: string;
    onUpdated: () => void;
}

export default function PurchasingTaskCard({
    task,
    index,
    steps,
    attachments,
    accent = "#6366f1",
    onUpdated,
}: Props) {
    const { isAdmin, isEmployee, hasAccess, currentEmployeeId } =
        usePurchasingAccess();

    const [pendingAction, setPendingAction] = useState<
        "advance" | "revert" | null
    >(null);
    const [completing, setCompleting] = useState(false);
    const [error, setError] = useState("");
    const [historyOpen, setHistoryOpen] = useState(false);

    const historyEntries: PurchasingTaskHistoryEntry[] = [...attachments]
        .sort(
            (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
        )
        .map(
            (attachment) =>
                attachment as unknown as PurchasingTaskHistoryEntry
        );

    const status = PURCHASING_TASK_STATUS_META[task.status];
    const isCompleted = task.status === "completed";

    const orderedSteps = [...steps].sort((a, b) => a.order - b.order);

    const currentIndex = orderedSteps.findIndex(
        (step) => step.id === task.process_step
    );

    const currentStep =
        currentIndex >= 0 ? orderedSteps[currentIndex] : undefined;

    const isFirstStep = currentIndex <= 0;

    const isLastStep =
        currentIndex >= 0 &&
        currentIndex === orderedSteps.length - 1;

    const canAct =
        isAdmin ||
        (isEmployee && hasAccess && !!currentEmployeeId);

    const filesCount = attachments.length;

    const productName =
        (task as ApiPurchasingTask & {
            product_name?: string | null;
        }).product_name || `محصول #${task.product}`;

    const warehouseId = (
        task as ApiPurchasingTask & {
            warehouse?: number | null;
        }
    ).warehouse;

    const warehouseName =
        (task as ApiPurchasingTask & {
            warehouse_name?: string | null;
        }).warehouse_name ||
        (warehouseId != null ? `انبار #${warehouseId}` : "انبار نامشخص");

    const warehouseCode =
        (task as ApiPurchasingTask & {
            warehouse_code?: string | null;
        }).warehouse_code;

    const handleComplete = async () => {
        if (!canAct || completing || isCompleted) return;

        try {
            setError("");
            setCompleting(true);

            await axiosInstance.patch(
                `/purchasing/api/v1/tasks/${task.id}/status/`,
                { status: "completed" }
            );

            onUpdated();
        } catch (err) {
            const response = err as {
                response?: {
                    data?: {
                        detail?: string;
                        message?: string;
                    };
                };
            };

            setError(
                response.response?.data?.detail ||
                response.response?.data?.message ||
                "تغییر وضعیت وظیفه انجام نشد."
            );
        } finally {
            setCompleting(false);
        }
    };

    return (
        <>
            <motion.article
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.22,
                    delay: Math.min(index * 0.03, 0.15),
                }}
                className="group relative overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.045)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(15,23,42,0.07)] dark:border-white/[0.06] dark:bg-[#111a2d] dark:shadow-none"
            >
                <div
                    className="absolute inset-y-0 right-0 w-[3px]"
                    style={{
                        background: `linear-gradient(180deg, ${accent}, ${accent}35)`,
                    }}
                />

                <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="mb-2.5 flex items-center gap-2">
                                <div
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                                    style={{
                                        background: `linear-gradient(135deg, ${accent}, ${accent}b8)`,
                                    }}
                                >
                                    <Package size={16} />
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate text-[9.5px] font-bold text-gray-400">
                                        محصول
                                    </p>

                                    <h3 className="truncate text-[13px] font-extrabold leading-5 text-gray-900 dark:text-white">
                                        {productName}
                                    </h3>
                                </div>
                            </div>

                            {task.title && task.title !== productName && (
                                <p className="mb-2 text-[10.5px] font-semibold leading-5 text-gray-500 dark:text-white/50">
                                    {task.title}
                                </p>
                            )}
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                            <span
                                className="rounded-full px-2.5 py-1 text-[9px] font-extrabold"
                                style={{
                                    background: `${status.color}15`,
                                    color: status.color,
                                }}
                            >
                                {status.label}
                            </span>

                            <span className="text-[9px] font-bold text-gray-300 dark:text-white/20">
                                #{toPersianDigits(index + 1)}
                            </span>
                        </div>
                    </div>

                    {task.description && (
                        <div className="mb-3 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
                            <p className="line-clamp-2 text-[10px] font-medium leading-5 text-gray-500 dark:text-white/50">
                                {task.description}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/80 px-2.5 py-2 dark:border-white/[0.04] dark:bg-white/[0.035]">
                            <div className="mb-1 flex items-center gap-1.5 text-gray-400">
                                <ListOrdered size={11} />
                                <span className="text-[8.5px] font-bold">
                                    مرحله
                                </span>
                            </div>

                            <p className="truncate text-[10.5px] font-extrabold text-gray-700 dark:text-gray-200">
                                {currentStep?.title || "نامشخص"}
                            </p>
                        </div>

                        <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/80 px-2.5 py-2 dark:border-white/[0.04] dark:bg-white/[0.035]">
                            <div className="mb-1 flex items-center gap-1.5 text-gray-400">
                                <Package size={11} />
                                <span className="text-[8.5px] font-bold">
                                    مقدار خرید
                                </span>
                            </div>

                            <p className="truncate text-[10.5px] font-extrabold text-gray-700 dark:text-gray-200">
                                {task.purchase_quantity != null
                                    ? toPersianDigits(
                                        task.purchase_quantity
                                    )
                                    : "—"}
                            </p>
                        </div>

                        <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/80 px-2.5 py-2 dark:border-white/[0.04] dark:bg-white/[0.035]">
                            <div className="mb-1 flex items-center gap-1.5 text-gray-400">
                                <Package size={11} />
                                <span className="text-[8.5px] font-bold">
                                    انبار
                                </span>
                            </div>

                            <p className="truncate text-[10.5px] font-extrabold text-gray-700 dark:text-gray-200">
                                {warehouseName}
                            </p>

                            {warehouseCode && (
                                <p className="mt-0.5 text-[8.5px] font-semibold text-gray-400">
                                    کد {toPersianDigits(warehouseCode)}
                                </p>
                            )}
                        </div>

                        <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/80 px-2.5 py-2 dark:border-white/[0.04] dark:bg-white/[0.035]">
                            <div className="mb-1 flex items-center gap-1.5 text-gray-400">
                                <UserRound size={11} />
                                <span className="text-[8.5px] font-bold">
                                    مسئول
                                </span>
                            </div>

                            <p className="truncate text-[10.5px] font-extrabold text-gray-700 dark:text-gray-200">
                                {task.assigned_to_name ||
                                    task.assigned_to_username ||
                                    "تعیین نشده"}
                            </p>
                        </div>
                    </div>

                    {task.current_stock != null && (
                        <div className="mt-2 flex items-center justify-between rounded-xl bg-blue-500/[0.045] px-3 py-2 dark:bg-blue-500/[0.07]">
                            <div className="flex items-center gap-1.5">
                                <Package
                                    size={11}
                                    className="text-blue-500"
                                />

                                <span className="text-[9px] font-bold text-gray-400">
                                    موجودی فعلی
                                </span>
                            </div>

                            <span className="text-[10.5px] font-extrabold text-blue-600 dark:text-blue-400">
                                {toPersianDigits(task.current_stock)}
                            </span>
                        </div>
                    )}

                    {currentStep?.employees_detail &&
                        currentStep.employees_detail.length > 0 && (
                            <div className="mt-2.5 rounded-xl bg-indigo-500/[0.035] px-2.5 py-2 dark:bg-indigo-500/[0.06]">
                                <div className="mb-1.5 flex items-center gap-1.5">
                                    <UserCheck
                                        size={11}
                                        className="text-indigo-500 dark:text-indigo-300"
                                    />

                                    <span className="text-[8.5px] font-bold text-gray-400">
                                        مسئولین این مرحله
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-1">
                                    {currentStep.employees_detail.map(
                                        (employee) => (
                                            <span
                                                key={employee.id}
                                                className="rounded-lg bg-indigo-500/10 px-1.5 py-1 text-[9px] font-bold text-indigo-500 dark:text-indigo-300"
                                            >
                                                {employee.full_name ||
                                                    employee.username}
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                    {error && (
                        <div className="mt-2.5 rounded-xl border border-rose-500/15 bg-rose-500/5 px-2.5 py-2 text-[9.5px] font-bold leading-4 text-rose-500">
                            {error}
                        </div>
                    )}

                    <div className="mt-3 flex items-center gap-1.5 border-t border-gray-100 pt-3 dark:border-white/[0.06]">
                        <button
                            type="button"
                            onClick={() => setHistoryOpen(true)}
                            className="flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gray-50 px-2.5 text-[9.5px] font-extrabold text-gray-500 transition-colors hover:bg-gray-100 dark:bg-white/[0.05] dark:text-white/45 dark:hover:bg-white/[0.1]"
                            title="یادداشت‌ها و تاریخچه"
                        >
                            <MessageSquareText size={12} />
                            یادداشت‌ها
                        </button>

                        {canAct && !isCompleted && !isLastStep && (
                            <button
                                type="button"
                                onClick={() =>
                                    setPendingAction("advance")
                                }
                                className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-50 text-[9.5px] font-extrabold text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                            >
                                <ArrowLeftCircle size={12} />
                                مرحله بعد
                            </button>
                        )}

                        {canAct && !isCompleted && isLastStep && (
                            <button
                                type="button"
                                onClick={handleComplete}
                                disabled={completing}
                                className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-[9.5px] font-extrabold text-emerald-600 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-500/10 dark:text-emerald-300"
                            >
                                <CheckCircle2 size={12} />

                                {completing
                                    ? "در حال تکمیل..."
                                    : "تکمیل وظیفه"}
                            </button>
                        )}

                        {canAct && !isCompleted && !isFirstStep && (
                            <button
                                type="button"
                                onClick={() =>
                                    setPendingAction("revert")
                                }
                                className="flex h-8 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100 dark:bg-white/[0.05] dark:text-white/45 dark:hover:bg-white/[0.1]"
                                title="بازگشت به مرحله قبل"
                            >
                                <ArrowRightCircle size={13} />
                            </button>
                        )}

                        {filesCount > 0 && (
                            <div className="flex h-8 shrink-0 items-center gap-1 rounded-xl bg-gray-50 px-2 text-[9.5px] font-extrabold text-gray-500 dark:bg-white/[0.05] dark:text-white/45">
                                <FileText size={12} />
                                {toPersianDigits(filesCount)}
                            </div>
                        )}

                        {!canAct && !isCompleted && (
                            <div className="flex h-8 flex-1 items-center justify-center rounded-xl bg-amber-500/5 text-[9.5px] font-bold text-amber-500">
                                عدم دسترسی
                            </div>
                        )}
                    </div>
                </div>
            </motion.article>

            <TaskTransitionModal
                isOpen={pendingAction !== null}
                onClose={() => setPendingAction(null)}
                mode={pendingAction ?? "advance"}
                task={task}
                onCompleted={() => {
                    setPendingAction(null);
                    onUpdated();
                }}
            />

            <TaskHistoryModal
                open={historyOpen}
                taskTitle={task.title || productName}
                entries={historyEntries}
                onClose={() => setHistoryOpen(false)}
                onRefresh={onUpdated}
            />
        </>
    );
}