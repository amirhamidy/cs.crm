"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeftCircle,
    ArrowRightCircle,
    CheckCircle2,
    FileText,
    ListOrdered,
    Package,
    UserCheck,
    UserRound,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiPurchasingStep, ApiPurchasingTask, ApiTaskAttachment } from "@/types/purchasing";
import { PURCHASING_TASK_STATUS_META } from "@/types/purchasing";
import { usePurchasingAccess } from "@/hooks/usePurchasingAccess";
import TaskActionModal from "./TaskActionModal";

interface Props {
    task: ApiPurchasingTask;
    index: number;
    steps: ApiPurchasingStep[];
    attachments: ApiTaskAttachment[];
    onUpdated: () => void;
}

function InfoTile({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
            <p className="text-[8.5px] font-bold text-gray-400 dark:text-white/35">{label}</p>
            <p className="mt-0.5 truncate text-[10.5px] font-extrabold text-gray-800 dark:text-white/85">{value}</p>
        </div>
    );
}

export default function TaskCard({ task, index, steps, attachments, onUpdated }: Props) {
    const { isAdmin, isEmployee, hasAccess, currentEmployeeId, currentEmployeeName } = usePurchasingAccess();

    const [pendingAction, setPendingAction] = useState<"advance" | "revert" | null>(null);
    const [completing, setCompleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const status = PURCHASING_TASK_STATUS_META[task.status];
    const isCompleted = task.status === "completed";

    const orderedSteps = useMemo(() => [...steps].sort((a, b) => a.order - b.order), [steps]);
    const currentIndex = orderedSteps.findIndex((step) => step.id === task.process_step);
    const currentStep = orderedSteps[currentIndex];
    const isFirstStep = currentIndex <= 0;
    const isLastStep = currentIndex !== -1 && currentIndex >= orderedSteps.length - 1;

    const canAct = isAdmin || (isEmployee && hasAccess && !!currentEmployeeId);

    const recentActivity = useMemo(
        () => [...attachments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3),
        [attachments]
    );

    const handleComplete = async () => {
        setCompleting(true);
        setErrorMessage("");
        try {
            await axiosInstance.patch(`/purchasing/api/v1/tasks/${task.id}/status/`, { status: "completed" });
            onUpdated();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { detail?: string; message?: string } } };
            setErrorMessage(e?.response?.data?.detail || e?.response?.data?.message || "تغییر وضعیت تسک انجام نشد.");
        } finally {
            setCompleting(false);
        }
    };

    return (
        <>
            <motion.article
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: Math.min(index, 6) * 0.03 }}
                className="group relative overflow-hidden rounded-[1.8rem] border border-gray-100 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.035)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] dark:border-white/[0.07] dark:bg-[#111a2d] dark:shadow-none"
            >
                <div className="absolute inset-y-0 right-0 w-1" style={{ background: `linear-gradient(180deg, ${status.color}, ${status.color}45)` }} />

                <div className="mb-3 flex items-start justify-between gap-3 pl-1">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-400/10 dark:text-indigo-300">
                            <Package size={17} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">{task.product_name}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span className="rounded-full px-2.5 py-1 text-[9.5px] font-extrabold" style={{ color: status.color, background: status.bg }}>
                                    {status.label}
                                </span>
                                {canAct && !isCompleted && (
                                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">
                                        <UserCheck size={9} />
                                        قابل انجام
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    <div className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-2.5 py-1.5 text-[10px] font-bold text-gray-500 dark:bg-white/[0.05] dark:text-white/45">
                        <ListOrdered size={11} />
                        مرحله {task.process_step_order}: {task.process_step_title}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl bg-indigo-500/[0.06] px-2.5 py-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-300">
                        خرید: {task.purchase_quantity}
                    </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <InfoTile label="موجودی بعد" value={task.quantity_after} />
                    <InfoTile label="حداقل موجودی" value={task.minimum_stock} />
                    <InfoTile label="حداکثر موجودی" value={task.maximum_stock} />
                </div>

                <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-300">
                        <UserCheck size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-bold text-gray-400 dark:text-white/35">انجام‌دهنده</p>
                        <p className="truncate text-[10.5px] font-extrabold text-gray-800 dark:text-white/85">
                            {isAdmin ? `${currentEmployeeName} (ادمین)` : currentEmployeeName ?? "—"}
                        </p>
                    </div>
                </div>

                {currentStep && currentStep.employees_detail.length > 0 && (
                    <div className="mt-2.5 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-white/35">
                            <UserRound size={12} />
                            مسئولان پیشنهادی این مرحله
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {currentStep.employees_detail.map((employee) => {
                                const isMe = !isAdmin && employee.employee_id === currentEmployeeId;
                                return (
                                    <span
                                        key={employee.id}
                                        className={`inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[9.5px] font-bold ${isMe
                                            ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300"
                                            : "bg-gray-50 text-gray-600 dark:bg-white/[0.05] dark:text-gray-300"
                                            } ${!employee.is_active ? "opacity-50" : ""}`}
                                    >
                                        <UserRound size={9} />
                                        {employee.full_name}
                                        {isMe && " (شما)"}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {errorMessage && (
                    <div className="mt-3 rounded-2xl bg-red-50 px-3 py-2.5 text-[10px] font-semibold text-red-500 dark:bg-red-500/10">{errorMessage}</div>
                )}

                {isCompleted ? (
                    <div className="mt-3.5 flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-500/10 py-2.5 text-[10.5px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={14} />
                        این تسک تکمیل شده است
                    </div>
                ) : (
                    <div className="mt-3.5 border-t border-gray-100 pt-3.5 dark:border-white/[0.06]">
                        <button
                            type="button"
                            disabled={isLastStep || !canAct}
                            onClick={() => setPendingAction("advance")}
                            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-[11px] font-extrabold text-white shadow-md shadow-indigo-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                        >
                            <ArrowLeftCircle size={14} />
                            {isLastStep ? "این آخرین مرحله است" : "انتقال به مرحله بعد"}
                        </button>

                        <div className="mt-2 grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                disabled={isFirstStep || !canAct}
                                onClick={() => setPendingAction("revert")}
                                className="flex h-9 items-center justify-center gap-1.5 rounded-2xl bg-rose-500/10 text-[10px] font-extrabold text-rose-500 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ArrowRightCircle size={13} />
                                مرحله قبل
                            </button>

                            <button
                                type="button"
                                disabled={completing || !canAct}
                                onClick={handleComplete}
                                className="flex h-9 items-center justify-center gap-1.5 rounded-2xl bg-teal-500/10 text-[10px] font-extrabold text-teal-600 transition hover:bg-teal-500/15 disabled:opacity-40 dark:text-teal-300"
                            >
                                <CheckCircle2 size={13} />
                                تکمیل تسک
                            </button>
                        </div>

                        {!canAct && !isAdmin && (
                            <div className="mt-2.5 flex items-center gap-2 rounded-2xl bg-amber-500/10 px-3 py-2.5 text-[9.5px] font-semibold text-amber-600 dark:text-amber-400">
                                <UserRound size={13} />
                                شما در فرآیند خرید فعال نیستید.
                            </div>
                        )}
                    </div>
                )}

                {recentActivity.length > 0 && (
                    <div className="mt-4">
                        <div className="mb-2 flex items-center gap-2 text-gray-400 dark:text-white/35">
                            <FileText size={12} />
                            <span className="text-[10px] font-extrabold text-gray-700 dark:text-white/70">آخرین فعالیت‌ها</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            {recentActivity.map((item) => (
                                <div key={item.id} className="rounded-2xl bg-gray-50 p-3 dark:bg-white/[0.035]">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span className="rounded-lg bg-indigo-500/10 px-2 py-1 text-[8.5px] font-bold text-indigo-600 dark:text-indigo-300">
                                                {item.type_display}
                                            </span>
                                            <span className="truncate text-[9.5px] font-bold text-gray-600 dark:text-white/60">{item.created_by_name}</span>
                                        </div>
                                        <span className="text-[8.5px] font-medium text-gray-400 dark:text-white/35">مرحله {item.process_step_order ?? "-"}</span>
                                    </div>
                                    {item.note && <p className="mt-1.5 text-[9.5px] leading-5 text-gray-500 dark:text-white/50">{item.note}</p>}
                                    {item.file_url && (
                                        <a href={item.file_url} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-bold text-indigo-600 dark:text-indigo-300">
                                            <FileText size={11} />
                                            مشاهده فایل
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.article>

            <TaskActionModal
                isOpen={pendingAction !== null}
                onClose={() => setPendingAction(null)}
                mode={pendingAction ?? "advance"}
                task={task}
                onCompleted={() => {
                    setPendingAction(null);
                    onUpdated();
                }}
            />
        </>
    );
}