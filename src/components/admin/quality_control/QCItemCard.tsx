"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardCheck, FileText, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toJalali, toPersianDigits, JALALI_MONTHS, pad2 } from "@/lib/jalali";
import type { ApiQualityControlEmployee, ApiQualityControlItem } from "@/types/quality_control";
import { QC_STATUS_META } from "@/types/quality_control";
import QCActionModal from "./QCActionModal";

interface QCItemCardProps {
    item: ApiQualityControlItem;
    index: number;
    employees: ApiQualityControlEmployee[];
    onUpdated: () => void;
}

function formatJalali(value?: string | null) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const [jy, jm, jd] = toJalali(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    ) as [number, number, number];
    return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)} - ${toPersianDigits(pad2(date.getHours()))}:${toPersianDigits(pad2(date.getMinutes()))}`;
}

export default function QCItemCard({ item, index, employees, onUpdated }: QCItemCardProps) {
    const [modalMode, setModalMode] = useState<"approve" | "reject" | null>(null);
    const meta = QC_STATUS_META[item.status];
    const isPending = item.status === "pending";

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
            >
                <div className="flex items-center justify-between">
                    <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold"
                        style={{ background: meta.bg, color: meta.color }}
                    >
                        {meta.label}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400">
                        وظیفه خرید #{item.purchase_task_id}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10">
                        <ClipboardCheck size={18} className="text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                            {item.product_name}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                            {formatJalali(item.created_at)}
                        </p>
                    </div>
                </div>

                {item.note && (
                    <p className="rounded-2xl bg-gray-50 px-3 py-2 text-[11px] font-medium text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
                        {item.note}
                    </p>
                )}

                {item.file && (
                    <a
                        href={item.file}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-2xl bg-indigo-50 py-2 text-[11px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"
                    >
                        <FileText size={12} />
                        مشاهده پیوست
                    </a>
                )}

                {!isPending && item.checked_by_name && (
                    <p className="text-center text-[10.5px] font-semibold text-gray-400">
                        بررسی‌شده توسط {item.checked_by_name} · {formatJalali(item.checked_at)}
                    </p>
                )}

                {isPending && (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setModalMode("approve")}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-emerald-500"
                        >
                            <CheckCircle2 size={14} />
                            تایید
                        </button>
                        <button
                            type="button"
                            onClick={() => setModalMode("reject")}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-red-600 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-red-500"
                        >
                            <XCircle size={14} />
                            رد
                        </button>
                    </div>
                )}
            </motion.div>

            {modalMode && (
                <QCActionModal
                    isOpen={Boolean(modalMode)}
                    onClose={() => setModalMode(null)}
                    mode={modalMode}
                    item={item}
                    employees={employees}
                    onCompleted={onUpdated}
                />
            )}
        </>
    );
}