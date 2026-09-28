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
import TaskHistoryModal, { type PurchasingTaskHistoryEntry } from "./Taskhistorymodal";

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

    // پیوست‌های همین تسک به‌عنوان فید تاریخچه استفاده می‌شوند.
    // اگر شکل واقعی رکورد در بک‌اند فرق دارد (مثلاً action/step_name)
    // فقط همین مپ را اصلاح کن.
    const historyEntries: PurchasingTaskHistoryEntry[] = [...attachments]
        .sort(
            (a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .map((attachment) => attachment as unknown as PurchasingTaskHistoryEntry);

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
        currentIndex >= 0 && currentIndex === orderedSteps.length - 1;

    const canAct =
        isAdmin || (isEmployee && hasAccess && !!currentEmployeeId);

    const filesCount = attachments.length;

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
                response?: { data?: { detail?: string; message?: string } };
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
                className="group relative overflow-hidden rounded-[1.2rem] border border-gray-100 bg-white p-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.03)] transition-all dark:border-white/[0.06] dark:bg-[#111a2d] dark:shadow-none"
            >
                <div
                    className="absolute inset-y-0 right-0 w-1"
                    style={{
                        background: `linear-gradient(180deg, ${accent}, ${accent}45)`,
                    }}
                />

                <div className="mb-2.5 flex items-start justify-between gap-2 pl-0.5">
                    <span
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold"
                        style={{
                            background: `${status.color}15`,
                            color: status.color,
                        }}
                    >
                        {status.label}
                    </span>

                    <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[9px] font-extrabold text-white"
                        style={{ backgroundColor: accent }}
                    >
                        {toPersianDigits(index + 1)}
                    </span>
                </div>

                <h3 className="text-[12.5px] font-extrabold leading-5 text-gray-900 dark:text-white">
                    {task.title}
                </h3>

                {task.description && (
                    <p className="mt-1.5 line-clamp-2 text-[10.5px] font-medium leading-5 text-gray-500 dark:text-white/50">
                        {task.description}
                    </p>
                )}

                <div className="mt-3 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-1.5">
                        <div className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-2.5 py-1.5 text-[10px] font-bold text-gray-500 dark:bg-white/[0.035] dark:text-white/45">
                            <ListOrdered size={11} />
                            <span className="truncate">
                                {currentStep?.title || "نامشخص"}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-2.5 py-1.5 text-[10px] font-bold text-gray-500 dark:bg-white/[0.035] dark:text-white/45">
                            <Package size={11} />
                            <span>تعداد: {task.purchase_quantity ?? "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-2.5 py-1.5 text-[10px] font-bold text-gray-500 dark:bg-white/[0.035] dark:text-white/45">
                            <Package size={11} />
                            <span>موجودی: {task.current_stock ?? "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-2.5 py-1.5 text-[10px] font-bold text-gray-500 dark:bg-white/[0.035] dark:text-white/45">
                            <UserRound size={11} />
                            <span className="truncate">
                                {task.assigned_to_name ||
                                    task.assigned_to_username ||
                                    "تعیین نشده"}
                            </span>
                        </div>
                    </div>

                    {currentStep?.employees_detail &&
                        currentStep.employees_detail.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 rounded-xl bg-indigo-500/[0.035] px-2.5 py-1.5">
                                <UserCheck
                                    size={11}
                                    className="text-indigo-500 dark:text-indigo-300"
                                />
                                {currentStep.employees_detail.map(
                                    (employee) => (
                                        <span
                                            key={employee.id}
                                            className="rounded-lg bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-bold text-indigo-500 dark:text-indigo-300"
                                        >
                                            {employee.full_name ||
                                                employee.username}
                                        </span>
                                    )
                                )}
                            </div>
                        )}

                    {error && (
                        <div className="rounded-xl border border-rose-500/15 bg-rose-500/5 px-2.5 py-2 text-[9.5px] font-bold leading-4 text-rose-500">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 border-t border-gray-100 pt-2.5 dark:border-white/[0.06]">
                        <button
                            type="button"
                            onClick={() => setHistoryOpen(true)}
                            className="flex h-8 items-center justify-center gap-1.5 rounded-xl bg-gray-50 px-2.5 text-[9.5px] font-extrabold text-gray-500 transition-colors hover:bg-gray-100 dark:bg-white/[0.05] dark:text-white/45 dark:hover:bg-white/[0.1]"
                            title="یادداشت‌ها و تاریخچه"
                        >
                            <MessageSquareText size={12} />
                            یادداشت‌ها
                        </button>

                        {canAct && !isCompleted && !isLastStep && (
                            <button
                                type="button"
                                onClick={() => setPendingAction("advance")}
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
                                {completing ? "در حال تکمیل..." : "تکمیل وظیفه"}
                            </button>
                        )}

                        {canAct && !isCompleted && !isFirstStep && (
                            <button
                                type="button"
                                onClick={() => setPendingAction("revert")}
                                className="flex h-8 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100 dark:bg-white/[0.05] dark:text-white/45 dark:hover:bg-white/[0.1]"
                                title="بازگشت به مرحله قبل"
                            >
                                <ArrowRightCircle size={13} />
                            </button>
                        )}

                        {filesCount > 0 && (
                            <div className="flex h-8 items-center gap-1 rounded-xl bg-gray-50 px-2 text-[9.5px] font-extrabold text-gray-500 dark:bg-white/[0.05] dark:text-white/45">
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
                taskTitle={task.title || task.product_name}
                entries={historyEntries}
                onClose={() => setHistoryOpen(false)}
                onRefresh={onUpdated}
            />
        </>
    );
}