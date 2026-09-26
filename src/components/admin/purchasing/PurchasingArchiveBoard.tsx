"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Archive,
    CheckCircle2,
    Filter,
    Layers3,
    Package,
    Search,
    X,
} from "lucide-react";
import type { ApiPurchasingTask } from "@/types/purchasing";
import { toPersianDigits } from "@/lib/jalali";

interface Props {
    tasks: ApiPurchasingTask[];
}

export default function PurchasingArchiveBoard({ tasks }: Props) {
    const [query, setQuery] = useState("");
    const [stepFilter, setStepFilter] = useState<"all" | number>("all");

    const archived = useMemo(
        () => tasks.filter((t) => t.status === "completed"),
        [tasks]
    );

    const stepOptions = useMemo(() => {
        const map = new Map<number, string>();
        archived.forEach((t) =>
            map.set(t.process_step, t.process_step_title || `مرحله ${t.process_step_order}`)
        );
        return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
    }, [archived]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return archived.filter((t) => {
            if (stepFilter !== "all" && t.process_step !== stepFilter) return false;
            if (!q) return true;
            return (
                t.product_name?.toLowerCase().includes(q) ||
                t.process_step_title?.toLowerCase().includes(q)
            );
        });
    }, [archived, stepFilter, query]);

    const grouped = useMemo(() => {
        const map = new Map<number, { id: number; title: string; order: number; tasks: ApiPurchasingTask[] }>();
        visible.forEach((t) => {
            if (!map.has(t.process_step)) {
                map.set(t.process_step, {
                    id: t.process_step,
                    title: t.process_step_title || `مرحله ${t.process_step_order}`,
                    order: t.process_step_order,
                    tasks: [],
                });
            }
            map.get(t.process_step)!.tasks.push(t);
        });
        return Array.from(map.values()).sort((a, b) => a.order - b.order);
    }, [visible]);

    return (
        <div className="flex flex-col gap-4" dir="rtl">
            <div className="flex flex-col gap-3 rounded-[1.8rem] border border-gray-100 bg-white p-4 dark:border-white/[0.07] dark:bg-[#111a2d]">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                            <Archive size={16} />
                        </div>
                        <div>
                            <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                                بایگانی تسک‌های خرید
                            </h3>
                            <p className="mt-0.5 text-[10.5px] font-medium text-gray-400">
                                تسک‌های تکمیل شده
                            </p>
                        </div>
                    </div>
                    <div className="flex h-9 items-center gap-1.5 rounded-xl bg-indigo-500/10 px-3 text-[10px] font-black text-indigo-500">
                        <CheckCircle2 size={12} />
                        {toPersianDigits(visible.length)} تسک
                    </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="جستجو..."
                            className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pr-9 pl-3 text-[11px] font-bold text-gray-800 outline-none placeholder:text-gray-300 focus:border-indigo-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery("")}
                                className="absolute left-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-white/[0.06]"
                            >
                                <X size={11} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-gray-100 bg-gray-50 p-1 dark:border-white/[0.06] dark:bg-white/[0.03]">
                        <button
                            type="button"
                            onClick={() => setStepFilter("all")}
                            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition ${stepFilter === "all"
                                    ? "bg-white text-indigo-600 shadow-sm dark:bg-[#0f172a] dark:text-indigo-300"
                                    : "text-gray-400 hover:text-indigo-500"
                                }`}
                        >
                            <Filter size={10} />
                            همه مراحل
                        </button>
                        {stepOptions.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setStepFilter(s.id)}
                                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition ${stepFilter === s.id
                                        ? "bg-white text-indigo-600 shadow-sm dark:bg-[#0f172a] dark:text-indigo-300"
                                        : "text-gray-400 hover:text-indigo-500"
                                    }`}
                            >
                                {s.title}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {visible.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex min-h-[280px] flex-col items-center justify-center rounded-[1.7rem] border border-dashed border-gray-200 bg-white/60 px-5 dark:border-white/[.07] dark:bg-white/[.02]"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/[.04]">
                        <Archive size={23} className="text-gray-400" />
                    </div>
                    <h3 className="mt-4 text-[12px] font-extrabold text-gray-600 dark:text-gray-300">
                        موردی در بایگانی نیست
                    </h3>
                    <p className="mt-1.5 text-center text-[10px] font-medium text-gray-400">
                        برای فیلتر یا جستجوی انتخابی تسکی پیدا نشد.
                    </p>
                </motion.div>
            ) : (
                <div className="space-y-6">
                    {grouped.map((group) => (
                        <motion.section
                            key={group.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-1 rounded-full bg-indigo-500" />
                                    <div>
                                        <h3 className="flex items-center gap-1.5 text-[12px] font-black text-gray-800 dark:text-white">
                                            <Layers3 size={12} className="text-indigo-500" />
                                            {group.title}
                                        </h3>
                                        <p className="mt-0.5 text-[9px] font-bold text-gray-400">
                                            {toPersianDigits(group.tasks.length)} تسک
                                        </p>
                                    </div>
                                </div>
                                <span className="rounded-xl bg-gray-100 px-2.5 py-1 text-[9px] font-extrabold text-gray-400 dark:bg-white/[.04]">
                                    بایگانی
                                </span>
                            </div>

                            <AnimatePresence mode="popLayout">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                    {group.tasks.map((task) => (
                                        <ArchivedPurchasingTaskCard key={task.id} task={task} />
                                    ))}
                                </div>
                            </AnimatePresence>
                        </motion.section>
                    ))}
                </div>
            )}
        </div>
    );
}

function ArchivedPurchasingTaskCard({ task }: { task: ApiPurchasingTask }) {
    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.28 }}
            className="group relative overflow-hidden rounded-[1.8rem] border border-gray-100 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.035)] dark:border-white/[0.07] dark:bg-[#111a2d]"
        >
            <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-emerald-500 to-emerald-500/20" />

            <div className="mb-3 flex items-start justify-between gap-3 pl-1">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <CheckCircle2 size={10} />
                        تکمیل شده
                    </span>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-xl bg-gray-50 px-2.5 py-1.5 text-[9px] font-bold text-gray-400 dark:bg-white/[0.05]">
                    <Archive size={10} />
                    بایگانی
                </span>
            </div>

            <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                    <Package size={17} />
                </div>
                <h3 className="text-[14px] font-extrabold leading-6 text-gray-900 dark:text-white">
                    {task.product_name}
                </h3>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
                    <p className="text-[9px] font-bold text-gray-400">مقدار خرید</p>
                    <p className="mt-0.5 text-[10.5px] font-extrabold text-gray-800 dark:text-white/85">
                        {task.purchase_quantity}
                    </p>
                </div>
                <div className="rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
                    <p className="text-[9px] font-bold text-gray-400">موجودی بعد</p>
                    <p className="mt-0.5 text-[10.5px] font-extrabold text-gray-800 dark:text-white/85">
                        {task.quantity_after}
                    </p>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-indigo-500/[0.06] px-2.5 py-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-300">
                <Layers3 size={11} />
                {task.process_step_title || `مرحله ${task.process_step_order}`}
            </div>
        </motion.article>
    );
}