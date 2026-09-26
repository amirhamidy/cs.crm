"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, ChevronLeft, ChevronRight, History } from "lucide-react";
import { toPersianDigits } from "@/lib/jalali";
import type {
    ApiPurchasingStep,
    ApiPurchasingTask,
    ApiTaskAttachment,
} from "@/types/purchasing";
import TaskCard from "./TaskCard";

interface Props {
    tasks: ApiPurchasingTask[];
    steps: ApiPurchasingStep[];
    attachments: ApiTaskAttachment[];
}

const PAGE_SIZE = 8;

export default function PurchasingArchive({
    tasks,
    steps,
    attachments,
}: Props) {
    const [page, setPage] = useState(1);

    const archivedTasks = useMemo(
        () =>
            tasks.filter(
                (task) =>
                    task.status === "completed" ||
                    task.status === "cancelled"
            ),
        [tasks]
    );

    const totalPages = Math.max(
        1,
        Math.ceil(archivedTasks.length / PAGE_SIZE)
    );

    useEffect(() => {
        setPage((current) => Math.min(current, totalPages));
    }, [totalPages]);

    const currentTasks = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return archivedTasks.slice(start, start + PAGE_SIZE);
    }, [archivedTasks, page]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                        <History size={17} />
                    </div>

                    <div>
                        <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                            بایگانی تسک‌ها
                        </h3>
                        <p className="text-[11px] text-gray-400">
                            {toPersianDigits(archivedTasks.length)} تسک بایگانی شده
                        </p>
                    </div>
                </div>

                {archivedTasks.length > 0 && (
                    <div className="rounded-2xl bg-emerald-500/10 px-3 py-2 text-[10px] font-extrabold text-emerald-500">
                        صفحه {toPersianDigits(page)} از{" "}
                        {toPersianDigits(totalPages)}
                    </div>
                )}
            </div>

            {archivedTasks.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.07]">
                    <Archive
                        size={28}
                        className="text-gray-300 dark:text-gray-700"
                    />
                    <div className="text-center">
                        <p className="text-[12px] font-bold text-gray-500 dark:text-gray-400">
                            بایگانی خالی است
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-gray-400">
                            هنوز هیچ تسکی تکمیل یا لغو نشده است
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                        {currentTasks.map((task, index) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                index={index}
                                steps={steps}
                                attachments={attachments.filter(
                                    (attachment) =>
                                        attachment.task === task.id
                                )}
                                onUpdated={() => undefined}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() =>
                                    setPage((current) =>
                                        Math.max(1, current - 1)
                                    )
                                }
                                disabled={page === 1}
                                className="flex h-9 items-center gap-1.5 rounded-2xl bg-gray-100 px-3 text-[10px] font-extrabold text-gray-500 transition hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/[0.05] dark:text-gray-400"
                            >
                                <ChevronRight size={14} />
                                قبلی
                            </button>

                            <div className="flex items-center gap-1.5">
                                {Array.from(
                                    { length: totalPages },
                                    (_, index) => index + 1
                                ).map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setPage(item)}
                                        className={`flex h-9 min-w-9 items-center justify-center rounded-2xl px-2 text-[10px] font-extrabold transition ${page === item
                                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                                            : "bg-gray-100 text-gray-500 hover:text-indigo-500 dark:bg-white/[0.05] dark:text-gray-400"
                                            }`}
                                    >
                                        {toPersianDigits(item)}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setPage((current) =>
                                        Math.min(totalPages, current + 1)
                                    )
                                }
                                disabled={page === totalPages}
                                className="flex h-9 items-center gap-1.5 rounded-2xl bg-gray-100 px-3 text-[10px] font-extrabold text-gray-500 transition hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/[0.05] dark:text-gray-400"
                            >
                                بعدی
                                <ChevronLeft size={14} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}