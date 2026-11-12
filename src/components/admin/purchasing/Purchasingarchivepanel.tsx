"use client";

import { useMemo, useState } from "react";
import { Archive } from "lucide-react";
import { toPersianDigits } from "@/lib/jalali";
import type { ApiPurchasingStep, ApiPurchasingTask, ApiTaskAttachment } from "@/types/purchasing";
import PurchasingTaskCard from "./PurchasingTaskCard";

interface Props {
    tasks: ApiPurchasingTask[];
    steps: ApiPurchasingStep[];
    attachments: ApiTaskAttachment[];
}

const PAGE = 8;

export default function PurchasingArchive({ tasks, steps, attachments }: Props) {
    const [shown, setShown] = useState(PAGE);

    const archived = useMemo(() => tasks.filter((t) => t.status === "completed" || t.status === "cancelled"), [tasks]);

    return (
        <section className="flex flex-col gap-3" dir="rtl">
            <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.05]">
                    <Archive size={15} className="text-gray-500 dark:text-gray-400" />
                </span>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-[13px] font-extrabold text-gray-900 dark:text-white">بایگانی تسک‌ها</h2>
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 px-1.5 text-[9.5px] font-extrabold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                            {toPersianDigits(archived.length)}
                        </span>
                    </div>
                    <p className="mt-0.5 text-[10.5px] font-semibold text-gray-400">تسک‌های تکمیل یا لغو شده</p>
                </div>
            </div>

            {archived.length === 0 ? (
                <div className="flex min-h-[130px] flex-col items-center justify-center gap-2 rounded-[1.45rem] border border-dashed border-gray-200 text-center dark:border-white/[0.07]">
                    <Archive size={22} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[11px] font-semibold text-gray-400">هنوز هیچ تسکی تکمیل یا لغو نشده است</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                        {archived.slice(0, shown).map((task, index) => (
                            <PurchasingTaskCard
                                key={task.id}
                                task={task}
                                index={index}
                                steps={steps}
                                attachments={attachments.filter((a) => a.task === task.id)}
                                onUpdated={() => undefined}
                            />
                        ))}
                    </div>

                    {archived.length > shown && (
                        <button type="button" onClick={() => setShown((n) => n + PAGE)} className="mx-auto flex h-9 items-center rounded-full bg-gray-100 px-5 text-[11px] font-extrabold text-gray-500 transition hover:text-indigo-500 dark:bg-white/[0.05] dark:text-gray-400">
                            نمایش بیشتر ({toPersianDigits(archived.length - shown)})
                        </button>
                    )}
                </>
            )}
        </section>
    );
}