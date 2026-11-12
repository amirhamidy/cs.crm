"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Loader, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { toPersianDigits } from "@/lib/jalali";
import type {
    ApiPurchasingStep,
    ApiPurchasingTask,
    ApiTaskAttachment,
} from "@/types/purchasing";
import { PURCHASING_TASK_STATUS_META } from "@/types/purchasing";
import PurchasingTaskCard from "./PurchasingTaskCard";

interface Props {
    step: ApiPurchasingStep;
    index: number;
    steps: ApiPurchasingStep[];
    tasks: ApiPurchasingTask[];
    attachments: ApiTaskAttachment[];
    tasksLoading?: boolean;
    accent: string;
    isLast?: boolean;
    showConnector?: boolean;
    onEditStep?: (step: ApiPurchasingStep) => void;
    onDeleteStep?: (step: ApiPurchasingStep) => void;
    onUpdated: () => void;
}

export default function PurchasingStageCard({
    step,
    index,
    steps,
    tasks,
    attachments,
    tasksLoading = false,
    accent,
    isLast = false,
    showConnector = true,
    onEditStep,
    onDeleteStep,
    onUpdated,
}: Props) {
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

    const hasDependencies = tasks.length > 0;

    const statusCounts = tasks.reduce<Record<string, number>>((acc, task) => {
        if (task.status) acc[task.status] = (acc[task.status] ?? 0) + 1;
        return acc;
    }, {});

    const showDependencyTooltip = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        if (!hasDependencies) return;
        const rect = event.currentTarget.getBoundingClientRect();
        setTooltipPosition({ top: rect.top - 10, left: rect.left + rect.width / 2 });
        setTooltipVisible(true);
    };

    const hideDependencyTooltip = () => setTooltipVisible(false);

    const tooltip =
        tooltipVisible && hasDependencies && typeof document !== "undefined"
            ? createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="pointer-events-none fixed z-[999999] -translate-x-1/2 -translate-y-full whitespace-nowrap"
                        style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
                        dir="rtl"
                    >
                        <div className="flex flex-col items-center gap-0.5 rounded-xl border border-white/[0.08] bg-slate-800 px-3 py-2 text-center shadow-2xl">
                            <span className="text-[11px] font-extrabold text-white">
                                این مرحله وظیفه دارد
                            </span>
                            <span className="text-[10px] text-slate-400">
                                برای حذف، ابتدا وظایف این مرحله را حذف کنید
                            </span>
                        </div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )
            : null;

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{
                    layout: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                }}
                className="relative flex min-w-0 flex-col rounded-[1.45rem] border shadow-[0_6px_22px_rgba(15,23,42,0.025)] dark:bg-white/[0.025] dark:shadow-none"
                style={{ borderColor: `${accent}25` }}
            >
                {showConnector && !isLast && (
                    <div
                        className="pointer-events-none absolute top-[28px] z-20 flex h-5 w-5 items-center justify-center rounded-full border bg-white shadow-sm dark:bg-[#0f172a]"
                        style={{ insetInlineEnd: "-10px", borderColor: `${accent}35`, color: accent }}
                    >
                        <ChevronLeft size={10} strokeWidth={2.5} />
                    </div>
                )}

                <div className="relative px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2.5">
                        <div className="flex min-w-0 items-center gap-2">
                            <span
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold text-white shadow-sm"
                                style={{ backgroundColor: accent }}
                            >
                                {toPersianDigits(index + 1)}
                            </span>

                            <div className="min-w-0">
                                <div className="flex min-w-0 items-center gap-1.5">
                                    <h4 className="truncate text-[12px] font-extrabold text-gray-800 dark:text-gray-100">
                                        {step.title}
                                    </h4>
                                    <span
                                        className="shrink-0 rounded-full px-1.5 py-0.5 text-[10.5px] font-extrabold"
                                        style={{ background: `${accent}12`, color: accent }}
                                    >
                                        {toPersianDigits(tasks.length)}
                                    </span>
                                </div>

                                {step.description && (
                                    <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-gray-400 dark:text-gray-500">
                                        {step.description}
                                    </p>
                                )}

                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                    <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
                                        وظیفه
                                    </span>

                                    {Object.entries(statusCounts).map(
                                        ([statusKey, count]) => {
                                            const meta =
                                                PURCHASING_TASK_STATUS_META[
                                                statusKey as keyof typeof PURCHASING_TASK_STATUS_META
                                                ];
                                            if (!meta || count === 0) return null;

                                            return (
                                                <span
                                                    key={statusKey}
                                                    className="flex items-center gap-1 text-[11px] font-bold"
                                                    style={{ color: meta.color }}
                                                >
                                                    <span className="relative flex h-1.5 w-1.5">
                                                        {statusKey === "in_progress" && (
                                                            <span
                                                                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                                                                style={{ backgroundColor: meta.color }}
                                                            />
                                                        )}
                                                        <span
                                                            className="relative inline-flex h-1.5 w-1.5 rounded-full"
                                                            style={{ backgroundColor: meta.color }}
                                                        />
                                                    </span>
                                                    {toPersianDigits(count)}
                                                </span>
                                            );
                                        }
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                            {onEditStep && (
                                <button
                                    type="button"
                                    onClick={() => onEditStep(step)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg transition"
                                    style={{ color: accent, backgroundColor: `${accent}12` }}
                                >
                                    <Pencil size={12} />
                                </button>
                            )}

                            {onDeleteStep && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (hasDependencies) return;
                                        onDeleteStep(step);
                                    }}
                                    onMouseEnter={showDependencyTooltip}
                                    onMouseLeave={hideDependencyTooltip}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg transition"
                                    style={{
                                        background: hasDependencies
                                            ? "rgba(0,0,0,0.035)"
                                            : undefined,
                                        color: hasDependencies ? "#9ca3af" : "#94a3b8",
                                        cursor: hasDependencies ? "not-allowed" : "pointer",
                                    }}
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="h-px" style={{ background: `${accent}12` }} />

                {tasksLoading ? (
                    <div className="flex h-28 items-center justify-center">
                        <Loader size={17} className="animate-spin text-indigo-500" />
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="flex h-28 flex-col items-center justify-center gap-1.5 px-4 text-center">
                        <div
                            className="flex h-7 w-7 items-center justify-center rounded-lg"
                            style={{ background: `${accent}0c` }}
                        >
                            <Plus size={11} style={{ color: `${accent}80` }} />
                        </div>
                        <p className="text-[11px] font-medium text-gray-400">
                            وظیفه‌ای در این مرحله نیست
                        </p>
                    </div>
                ) : (
                    <div className="scrollbar-thin flex max-h-[420px] flex-col gap-2 overflow-y-auto p-2">
                        {tasks.map((task, taskIndex) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: Math.min(taskIndex, 6) * 0.025,
                                    duration: 0.18,
                                }}
                            >
                                <PurchasingTaskCard
                                    task={task}
                                    index={taskIndex}
                                    steps={steps}
                                    accent={accent}
                                    attachments={attachments.filter(
                                        (attachment) => attachment.task === task.id
                                    )}
                                    onUpdated={onUpdated}
                                />
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {tooltip}
        </>
    );
}