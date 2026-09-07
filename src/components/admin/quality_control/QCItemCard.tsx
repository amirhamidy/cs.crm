"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    CheckCircle2,
    ChevronLeft,
    ClipboardCheck,
    Clock3,
    FileText,
    UserRound,
    XCircle,
} from "lucide-react";
import {
    JALALI_MONTHS,
    pad2,
    toJalali,
    toPersianDigits,
} from "@/lib/jalali";
import type {
    ApiQualityControlEmployee,
    ApiQualityControlItem,
    QualityControlActionResponse,
} from "@/types/quality_control";
import { QC_STATUS_META } from "@/types/quality_control";
import QCActionModal from "./QCActionModal";

interface Props {
    item: ApiQualityControlItem;
    index: number;
    employees: ApiQualityControlEmployee[];
    onUpdated: (response: QualityControlActionResponse) => void;
}

function formatDate(value?: string | null) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    const [jy, jm, jd] = toJalali(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    ) as [number, number, number];

    return `${toPersianDigits(jd)} ${
        JALALI_MONTHS[jm - 1]
    } ${toPersianDigits(jy)} - ${toPersianDigits(
        pad2(date.getHours())
    )}:${toPersianDigits(pad2(date.getMinutes()))}`;
}

function StatusIcon({ status }: { status: string }) {
    if (status === "approved") {
        return <CheckCircle2 size={14} />;
    }

    if (status === "rejected") {
        return <XCircle size={14} />;
    }

    return <Clock3 size={14} />;
}

export default function QCItemCard({
    item,
    index,
    employees,
    onUpdated,
}: Props) {
    const [action, setAction] = useState<"approve" | "reject" | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const meta = QC_STATUS_META[item.status];

    const statusClass =
        item.status === "approved"
            ? "bg-emerald-500/10 text-emerald-500"
            : item.status === "rejected"
            ? "bg-red-500/10 text-red-500"
            : "bg-amber-500/10 text-amber-500";

    return (
        <>
            <motion.article
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.25,
                    delay: Math.min(index * 0.035, 0.35),
                }}
                className="group relative overflow-hidden rounded-[28px] border border-black/[0.05] bg-white shadow-[0_10px_35px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/[0.06] dark:bg-white/[0.025] dark:hover:bg-white/[0.035]"
                dir="rtl"
            >
                <div
                    className={`absolute right-0 top-0 h-full w-1 ${
                        item.status === "approved"
                            ? "bg-emerald-500"
                            : item.status === "rejected"
                            ? "bg-red-500"
                            : "bg-amber-500"
                    }`}
                />

                <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black ${statusClass}`}
                        >
                            <StatusIcon status={item.status} />
                            {item.status_display || meta.label}
                        </span>

                        <span className="rounded-xl bg-gray-100 px-2.5 py-1.5 text-[9.5px] font-extrabold text-gray-500 dark:bg-white/[0.05] dark:text-gray-400">
                            QC #{item.id}
                        </span>
                    </div>

                    <div className="mt-5 flex items-center gap-3">
                        <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${statusClass}`}
                        >
                            <ClipboardCheck size={19} />
                        </div>

                        <div className="min-w-0">
                            <h3 className="truncate text-[14px] font-black text-gray-900 dark:text-white">
                                {item.product_name}
                            </h3>

                            <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                <span>
                                    وظیفه خرید #{item.purchase_task_id}
                                </span>

                                <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-white/20" />

                                <span>{formatDate(item.created_at)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                        <div className="rounded-2xl bg-gray-50 p-3 dark:bg-white/[0.035]">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <Clock3 size={12} />
                                <span className="text-[9.5px] font-bold">
                                    ایجاد شده
                                </span>
                            </div>

                            <p className="mt-1.5 text-[10.5px] font-extrabold text-gray-700 dark:text-gray-200">
                                {formatDate(item.created_at)}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-gray-50 p-3 dark:bg-white/[0.035]">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <UserRound size={12} />
                                <span className="text-[9.5px] font-bold">
                                    بررسی‌کننده
                                </span>
                            </div>

                            <p className="mt-1.5 truncate text-[10.5px] font-extrabold text-gray-700 dark:text-gray-200">
                                {item.checked_by_name || "هنوز بررسی نشده"}
                            </p>
                        </div>
                    </div>

                    {item.note && (
                        <div className="mt-3 rounded-2xl border border-black/[0.035] bg-gray-50 p-3 dark:border-white/[0.04] dark:bg-white/[0.025]">
                            <p className="line-clamp-2 text-[10.5px] font-medium leading-5 text-gray-500 dark:text-gray-300">
                                {item.note}
                            </p>
                        </div>
                    )}

                    {item.file && (
                        <a
                            href={item.file}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 flex items-center gap-2 rounded-2xl bg-indigo-500/[0.07] px-3 py-2.5 text-indigo-500 transition hover:bg-indigo-500/10"
                        >
                            <FileText size={14} />

                            <span className="text-[10.5px] font-extrabold">
                                مشاهده فایل پیوست
                            </span>

                            <ChevronLeft
                                size={13}
                                className="mr-auto"
                            />
                        </a>
                    )}

                    {!item.checked_at && item.status === "pending" && (
                        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-amber-500/[0.06] px-3 py-2.5 text-amber-600 dark:text-amber-400">
                            <Clock3 size={13} />

                            <span className="text-[10px] font-bold">
                                این مورد منتظر بررسی کنترل کیفی است
                            </span>
                        </div>
                    )}

                    {item.checked_at && (
                        <div className="mt-3 text-[9.5px] font-bold text-gray-400">
                            بررسی شده در {formatDate(item.checked_at)}
                        </div>
                    )}

                    <div className="mt-4 flex gap-2">
                        <button
                            type="button"
                            onClick={() => setDetailsOpen(true)}
                            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gray-100 text-[10.5px] font-extrabold text-gray-600 transition hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08]"
                        >
                            مشاهده جزئیات
                        </button>

                        {item.status === "pending" && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setAction("approve")}
                                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white transition hover:bg-emerald-500"
                                    title="تایید"
                                >
                                    <CheckCircle2 size={15} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setAction("reject")}
                                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 text-white transition hover:bg-red-500"
                                    title="رد"
                                >
                                    <XCircle size={15} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </motion.article>

            <AnimatePresence>
                {detailsOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setDetailsOpen(false)}
                        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.98 }}
                            onClick={(event) => event.stopPropagation()}
                            dir="rtl"
                            className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-[30px] bg-white p-6 shadow-2xl dark:bg-[#0b1220]"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black ${statusClass}`}
                                    >
                                        <StatusIcon status={item.status} />
                                        {item.status_display}
                                    </span>

                                    <h2 className="mt-3 text-[17px] font-black text-gray-900 dark:text-white">
                                        {item.product_name}
                                    </h2>

                                    <p className="mt-1 text-[10px] font-bold text-gray-400">
                                        کنترل کیفی #{item.id}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setDetailsOpen(false)}
                                    className="h-9 w-9 rounded-xl bg-gray-100 text-gray-500 dark:bg-white/[0.05]"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <Detail
                                    label="شناسه کنترل کیفی"
                                    value={`#${item.id}`}
                                />
                                <Detail
                                    label="وظیفه خرید"
                                    value={`#${item.purchase_task_id}`}
                                />
                                <Detail
                                    label="وضعیت"
                                    value={
                                        item.status_display || meta.label
                                    }
                                />
                                <Detail
                                    label="بررسی‌کننده"
                                    value={
                                        item.checked_by_name ||
                                        "بررسی نشده"
                                    }
                                />
                                <Detail
                                    label="زمان ایجاد"
                                    value={formatDate(item.created_at)}
                                />
                                <Detail
                                    label="زمان بررسی"
                                    value={formatDate(item.checked_at)}
                                />
                            </div>

                            <div className="mt-3 rounded-2xl bg-gray-50 p-4 dark:bg-white/[0.035]">
                                <p className="text-[10px] font-black text-gray-400">
                                    توضیحات
                                </p>

                                <p className="mt-2 whitespace-pre-wrap text-[11.5px] font-medium leading-6 text-gray-700 dark:text-gray-300">
                                    {item.note || "توضیحی ثبت نشده است"}
                                </p>
                            </div>

                            {item.file && (
                                <a
                                    href={item.file}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-[11px] font-black text-white transition hover:bg-indigo-500"
                                >
                                    <FileText size={15} />
                                    مشاهده فایل پیوست
                                </a>
                            )}

                            {item.status === "pending" && (
                                <div className="mt-5 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDetailsOpen(false);
                                            setAction("approve");
                                        }}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-[11px] font-black text-white"
                                    >
                                        <CheckCircle2 size={15} />
                                        تایید
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDetailsOpen(false);
                                            setAction("reject");
                                        }}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 text-[11px] font-black text-white"
                                    >
                                        <XCircle size={15} />
                                        رد
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {action && (
                <QCActionModal
                    isOpen
                    mode={action}
                    item={item}
                    employees={employees}
                    onClose={() => setAction(null)}
                    onCompleted={onUpdated}
                />
            )}
        </>
    );
}

function Detail({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl bg-gray-50 p-3 dark:bg-white/[0.035]">
            <p className="text-[9.5px] font-bold text-gray-400">
                {label}
            </p>

            <p className="mt-1.5 truncate text-[11px] font-black text-gray-800 dark:text-white">
                {value}
            </p>
        </div>
    );
}