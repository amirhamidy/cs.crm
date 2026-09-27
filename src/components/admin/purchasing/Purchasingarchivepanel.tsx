"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, ChevronDown, ChevronUp, History } from "lucide-react";
import { toPersianDigits } from "@/lib/jalali";
import type {
    ApiPurchasingStep,
    ApiPurchasingTask,
    ApiTaskAttachment,
} from "@/types/purchasing";
import PurchasingTaskCard from "./PurchasingTaskCard";

interface Props {
    tasks: ApiPurchasingTask[];
    steps: ApiPurchasingStep[];
    attachments: ApiTaskAttachment[];
}

const STEP_SIZE = 5;

export default function PurchasingArchivePanel({ tasks, steps, attachments }: Props) {
    const archivedTasks = useMemo(
        () =>
            [...tasks]
                .filter((task) => task.status === "completed" || task.status === "cancelled")
                .sort(
                    (a, b) =>
                        new Date((b as any).updated_at ?? b.created_at ?? 0).getTime() -
                        new Date((a as any).updated_at ?? a.created_at ?? 0).getTime()
                ),
        [tasks]
    );

    const [visibleCount, setVisibleCount] = useState(STEP_SIZE);

    useEffect(() => {
        setVisibleCount((current) =>
            Math.min(Math.max(current, STEP_SIZE), Math.max(archivedTasks.length, STEP_SIZE))
        );
    }, [archivedTasks.length]);

    const visibleTasks = archivedTasks.slice(0, visibleCount);
    const canShowMore = visibleCount < archivedTasks.length;
    const canShowLess = visibleCount > STEP_SIZE;

    return (
        <div
            className="flex flex-col gap-4 rounded-[1.6rem] border border-gray-100 bg-white p-4 dark:border-white/[0.07] dark:bg-[#0f1c33]"
            dir="rtl"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                        <History size={17} />
                    </div>

                    <div>
                        <h3 className="text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                            بایگانی تسک‌ها
                        </h3>
                        <p className="text-[10.5px] text-gray-400">
                            {toPersianDigits(archivedTasks.length)} تسک بایگانی شده
                        </p>
                    </div>
                </div>

                {archivedTasks.length > 0 && (
                    <div className="rounded-2xl bg-emerald-500/10 px-3 py-1.5 text-[9.5px] font-extrabold text-emerald-500">
                        نمایش {toPersianDigits(visibleTasks.length)} از {toPersianDigits(archivedTasks.length)}
                    </div>
                )}
            </div>

            {archivedTasks.length === 0 ? (
                <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.07]">
                    <Archive size={26} className="text-gray-300 dark:text-gray-700" />
                    <div className="text-center">
                        <p className="text-[11.5px] font-bold text-gray-500 dark:text-gray-400">
                            بایگانی خالی است
                        </p>
                        <p className="mt-1 text-[10.5px] font-medium text-gray-400">
                            هنوز هیچ تسکی تکمیل یا لغو نشده است
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {visibleTasks.map((task, index) => (
                            <PurchasingTaskCard
                                key={task.id}
                                task={task}
                                index={index}
                                steps={steps}
                                attachments={attachments.filter((attachment) => attachment.task === task.id)}
                                onUpdated={() => undefined}
                            />
                        ))}
                    </div>

                    {(canShowMore || canShowLess) && (
                        <div className="flex items-center justify-center gap-2 pt-1">
                            {canShowLess && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setVisibleCount((current) => Math.max(STEP_SIZE, current - STEP_SIZE))
                                    }
                                    className="flex h-9 items-center gap-1.5 rounded-2xl bg-gray-100 px-3.5 text-[10.5px] font-extrabold text-gray-500 transition hover:text-indigo-500 dark:bg-white/[0.05] dark:text-gray-400"
                                >
                                    <ChevronUp size={14} />
                                    نمایش کمتر
                                </button>
                            )}

                            {canShowMore && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setVisibleCount((current) =>
                                            Math.min(archivedTasks.length, current + STEP_SIZE)
                                        )
                                    }
                                    className="flex h-9 items-center gap-1.5 rounded-2xl bg-indigo-500/10 px-3.5 text-[10.5px] font-extrabold text-indigo-600 transition hover:bg-indigo-500/15 dark:text-indigo-300"
                                >
                                    <ChevronDown size={14} />
                                    نمایش بیشتر
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}