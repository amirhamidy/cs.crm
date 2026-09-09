"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    ChevronDown,
    FileText,
    Package,
    User,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type {
    ApiPurchasingEmployee,
    ApiPurchasingStep,
    ApiPurchasingTask,
    ApiTaskAttachment,
} from "@/types/purchasing";
import { PURCHASING_TASK_STATUS_META } from "@/types/purchasing";
import TaskActionModal from "./TaskActionModal";

interface Props {
    task: ApiPurchasingTask;
    index: number;
    employees: ApiPurchasingEmployee[];
    steps: ApiPurchasingStep[];
    attachments: ApiTaskAttachment[];
    onUpdated: () => void;
}

export default function TaskCard({
    task,
    index,
    employees,
    steps,
    attachments,
    onUpdated,
}: Props) {
    const [open, setOpen] = useState(false);
    const [action, setAction] = useState<
        "advance" | "revert" | null
    >(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const status =
        PURCHASING_TASK_STATUS_META[task.status];

    const orderedSteps = useMemo(
        () =>
            [...steps].sort(
                (a, b) => a.order - b.order
            ),
        [steps]
    );

    const currentIndex = orderedSteps.findIndex(
        (step) => step.id === task.process_step
    );

    const currentStep = orderedSteps[currentIndex];

    const isFirstStep = currentIndex <= 0;

    const isLastStep =
        currentIndex !== -1 &&
        currentIndex >= orderedSteps.length - 1;

    const allowedEmployees = useMemo(() => {
        if (!currentStep) return [];

        return employees.filter(
            (employee) =>
                employee.is_active &&
                currentStep.employees.includes(
                    employee.id
                )
        );
    }, [employees, currentStep]);

    const complete = async () => {
        try {
            setLoading(true);
            setError("");

            await axiosInstance.patch(
                `/purchasing/api/v1/tasks/${task.id}/status/`,
                {
                    status: "completed",
                }
            );

            onUpdated();
        } catch (err: any) {
            setError(
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                "تغییر وضعیت تسک انجام نشد."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.2,
                    delay: index * 0.025,
                }}
                className="group relative overflow-hidden rounded-[1.8rem] border border-[#DCEAFB] bg-white shadow-[0_8px_28px_rgba(37,99,235,0.06)] transition-all hover:shadow-[0_16px_40px_rgba(37,99,235,0.12)] dark:border-[rgba(96,165,250,0.14)] dark:bg-[#0E1F38]"
            >
                <div
                    className="absolute right-0 top-0 h-full w-1"
                    style={{
                        background: `linear-gradient(180deg, ${status.color}, ${status.color}45)`,
                    }}
                />

                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="flex w-full items-center gap-3 p-4 text-right"
                >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB]/12 to-[#06B6D4]/12 text-[#2563EB] dark:text-[#38BDF8]">
                        <Package size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-[13px] font-extrabold text-[#0F2647] dark:text-white">
                                {task.product_name}
                            </h3>

                            <span
                                className="rounded-full px-2.5 py-1 text-[8.5px] font-bold"
                                style={{
                                    color: status.color,
                                    background:
                                        status.bg,
                                }}
                            >
                                {status.label}
                            </span>
                        </div>

                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[9.5px] text-[#5D7595] dark:text-[#8FAAD1]">
                            <span>
                                مرحله{" "}
                                {task.process_step_order}:{" "}
                                {task.process_step_title}
                            </span>

                            <span>
                                خرید:{" "}
                                {task.purchase_quantity}
                            </span>
                        </div>
                    </div>

                    <ChevronDown
                        size={16}
                        className={`shrink-0 text-[#5D7595] transition-transform dark:text-[#8FAAD1] ${open ? "rotate-180" : ""
                            }`}
                    />
                </button>

                <AnimatePresence initial={false}>
                    {open && (
                        <motion.div
                            initial={{
                                height: 0,
                                opacity: 0,
                            }}
                            animate={{
                                height: "auto",
                                opacity: 1,
                            }}
                            exit={{
                                height: 0,
                                opacity: 0,
                            }}
                        >
                            <div className="border-t border-[#DCEAFB] px-4 pb-4 pt-4 dark:border-[rgba(96,165,250,0.1)]">
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    <InfoItem
                                        label="مرحله فعلی"
                                        value={
                                            task.process_step_title
                                        }
                                    />

                                    <InfoItem
                                        label="موجودی بعد"
                                        value={
                                            task.quantity_after
                                        }
                                    />

                                    <InfoItem
                                        label="حداقل"
                                        value={
                                            task.minimum_stock
                                        }
                                    />

                                    <InfoItem
                                        label="حداکثر"
                                        value={
                                            task.maximum_stock
                                        }
                                    />
                                </div>

                                {error && (
                                    <div className="mt-3 rounded-2xl bg-rose-500/10 px-3 py-2.5 text-[10px] font-semibold text-rose-500">
                                        {error}
                                    </div>
                                )}

                                {task.status !==
                                    "completed" && (
                                        <>
                                            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        loading ||
                                                        isLastStep ||
                                                        !allowedEmployees.length
                                                    }
                                                    onClick={() =>
                                                        setAction(
                                                            "advance"
                                                        )
                                                    }
                                                    className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] px-3 py-2.5 text-[10px] font-bold text-white shadow-md shadow-[#2563EB]/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                                                >
                                                    <ArrowLeft
                                                        size={13}
                                                    />
                                                    مرحله بعد
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        loading ||
                                                        isFirstStep ||
                                                        !allowedEmployees.length
                                                    }
                                                    onClick={() =>
                                                        setAction(
                                                            "revert"
                                                        )
                                                    }
                                                    className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#F43F5E]/10 px-3 py-2.5 text-[10px] font-bold text-[#F43F5E] transition hover:bg-[#F43F5E]/15 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    <ArrowRight
                                                        size={13}
                                                    />
                                                    مرحله قبل
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        loading
                                                    }
                                                    onClick={
                                                        complete
                                                    }
                                                    className="col-span-2 flex items-center justify-center gap-1.5 rounded-2xl bg-[#06B6D4]/10 px-3 py-2.5 text-[10px] font-bold text-[#0891B2] transition hover:bg-[#06B6D4]/15 disabled:opacity-40 dark:text-[#22D3EE] sm:col-span-1"
                                                >
                                                    <CheckCircle2
                                                        size={13}
                                                    />
                                                    تکمیل تسک
                                                </button>
                                            </div>

                                            {!allowedEmployees.length && (
                                                <div className="mt-3 flex items-center gap-2 rounded-2xl bg-amber-500/10 px-3 py-2.5 text-[9.5px] font-semibold text-amber-500">
                                                    <User
                                                        size={13}
                                                    />
                                                    برای این مرحله
                                                    کارمند فعالی
                                                    تعیین نشده است.
                                                </div>
                                            )}
                                        </>
                                    )}

                                {attachments.length > 0 && (
                                    <div className="mt-5">
                                        <div className="mb-2.5 flex items-center gap-2">
                                            <FileText
                                                size={13}
                                                className="text-[#5D7595] dark:text-[#8FAAD1]"
                                            />

                                            <span className="text-[10.5px] font-extrabold text-[#0F2647] dark:text-white">
                                                آخرین فعالیت‌ها
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            {[
                                                ...attachments,
                                            ]
                                                .sort(
                                                    (
                                                        a,
                                                        b
                                                    ) =>
                                                        new Date(
                                                            b.created_at
                                                        ).getTime() -
                                                        new Date(
                                                            a.created_at
                                                        ).getTime()
                                                )
                                                .slice(0, 4)
                                                .map(
                                                    (
                                                        item
                                                    ) => (
                                                        <div
                                                            key={
                                                                item.id
                                                            }
                                                            className="rounded-2xl bg-[#F3F8FF] p-3 dark:bg-[rgba(96,165,250,0.06)]"
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex min-w-0 items-center gap-2">
                                                                    <span className="rounded-xl bg-[#2563EB]/10 px-2 py-1 text-[8.5px] font-bold text-[#2563EB] dark:text-[#38BDF8]">
                                                                        {
                                                                            item.type_display
                                                                        }
                                                                    </span>

                                                                    <span className="truncate text-[9.5px] font-bold text-[#3D5B82] dark:text-[#8FAAD1]">
                                                                        {
                                                                            item.created_by_name
                                                                        }
                                                                    </span>
                                                                </div>

                                                                <span className="text-[8.5px] text-[#5D7595] dark:text-[#7C93B8]">
                                                                    مرحله{" "}
                                                                    {item.process_step_order ??
                                                                        "-"}
                                                                </span>
                                                            </div>

                                                            {item.note && (
                                                                <p className="mt-2 text-[9.5px] leading-5 text-[#5D7595] dark:text-[#7C93B8]">
                                                                    {
                                                                        item.note
                                                                    }
                                                                </p>
                                                            )}

                                                            {item.file_url && (
                                                                <a
                                                                    href={
                                                                        item.file_url
                                                                    }
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold text-[#2563EB] dark:text-[#38BDF8]"
                                                                >
                                                                    <FileText
                                                                        size={
                                                                            11
                                                                        }
                                                                    />
                                                                    مشاهده
                                                                    فایل
                                                                </a>
                                                            )}
                                                        </div>
                                                    )
                                                )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <TaskActionModal
                isOpen={action !== null}
                onClose={() => setAction(null)}
                mode={action ?? "advance"}
                task={task}
                employees={allowedEmployees}
                onCompleted={() => {
                    setAction(null);
                    onUpdated();
                }}
            />
        </>
    );
}

function InfoItem({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="rounded-2xl bg-[#F3F8FF] px-3 py-2.5 dark:bg-[rgba(96,165,250,0.06)]">
            <p className="text-[8.5px] font-semibold text-[#5D7595] dark:text-[#8FAAD1]">
                {label}
            </p>

            <p className="mt-1 truncate text-[10px] font-extrabold text-[#0F2647] dark:text-[#EAF2FF]">
                {value}
            </p>
        </div>
    );
}