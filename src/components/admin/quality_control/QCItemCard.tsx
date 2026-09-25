"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronLeft, Clock3, FileText, UserRound, XCircle } from "lucide-react";
import { JALALI_MONTHS, pad2, toJalali, toPersianDigits } from "@/lib/jalali";
import type { ApiQualityControlEmployee, ApiQualityControlItem, QualityControlActionResponse } from "@/types/quality_control";
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
    const [jy, jm, jd] = toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate()) as [number, number, number];
    return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)} - ${toPersianDigits(pad2(date.getHours()))}:${toPersianDigits(pad2(date.getMinutes()))}`;
}

function StatusIcon({ status }: { status: string }) {
    if (status === "approved") return <CheckCircle2 size={14} />;
    if (status === "rejected") return <XCircle size={14} />;
    return <Clock3 size={14} />;
}

export default function QCItemCard({ item, index, employees, onUpdated }: Props) {
    const [action, setAction] = useState<"approve" | "reject" | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const meta = QC_STATUS_META[item.status];
    const statusClass = item.status === "approved" ? "bg-emerald-500/10 text-emerald-500" : item.status === "rejected" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500";

    return (
        <>
            <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25, delay: Math.min(index * .035, .35) }} className="overflow-hidden rounded-[26px] border border-black/[0.05] bg-white shadow-[0_10px_35px_rgba(15,23,42,0.03)] dark:border-white/[0.06] dark:bg-white/[0.025]">
                <div className="p-5">
                    <div className="flex items-start gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${statusClass}`}><StatusIcon status={item.status} /></div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h3 className="truncate text-[12px] font-black text-gray-900 dark:text-white">{item.product_name}</h3>
                                    <p className="mt-1 text-[9.5px] font-bold text-gray-400">درخواست خرید #{toPersianDigits(item.purchase_task_id)}</p>
                                </div>
                                <span className={`shrink-0 rounded-xl px-2.5 py-1 text-[9px] font-black ${statusClass}`}>{meta?.label || item.status_display}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-2xl bg-gray-50 p-3 dark:bg-white/[0.035]">
                            <div className="flex items-center gap-1.5 text-gray-400"><UserRound size={12} /><span className="text-[9px] font-bold">بررسی‌کننده</span></div>
                            <p className="mt-1.5 truncate text-[10.5px] font-black text-gray-800 dark:text-white">{item.checked_by_name || "هنوز بررسی نشده"}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 p-3 dark:bg-white/[0.035]">
                            <div className="flex items-center gap-1.5 text-gray-400"><Clock3 size={12} /><span className="text-[9px] font-bold">زمان بررسی</span></div>
                            <p className="mt-1.5 truncate text-[10px] font-black text-gray-800 dark:text-white">{formatDate(item.checked_at)}</p>
                        </div>
                    </div>

                    {item.note && <div className="mt-2 rounded-2xl bg-gray-50 p-3 dark:bg-white/[0.035]"><div className="flex items-center gap-1.5 text-gray-400"><FileText size={12} /><span className="text-[9px] font-bold">توضیحات</span></div><p className="mt-1.5 text-[10px] font-bold leading-5 text-gray-600 dark:text-gray-300">{item.note}</p></div>}

                    <button type="button" onClick={() => setDetailsOpen((value) => !value)} className="mt-4 flex w-full items-center justify-center gap-1 text-[9.5px] font-black text-gray-400 transition hover:text-blue-500">
                        جزئیات <ChevronLeft size={13} className={`transition-transform ${detailsOpen ? "-rotate-90" : ""}`} />
                    </button>

                    <AnimatePresence initial={false}>
                        {detailsOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="rounded-2xl bg-gray-50 p-3 dark:bg-white/[0.035]"><p className="text-[9px] font-bold text-gray-400">شناسه بررسی</p><p className="mt-1 text-[10.5px] font-black text-gray-800 dark:text-white">{toPersianDigits(item.id)}</p></div>
                            <div className="rounded-2xl bg-gray-50 p-3 dark:bg-white/[0.035]"><p className="text-[9px] font-bold text-gray-400">ایجاد شده</p><p className="mt-1 truncate text-[10px] font-black text-gray-800 dark:text-white">{formatDate(item.created_at)}</p></div>
                        </div></motion.div>}
                    </AnimatePresence>

                    {item.status === "pending" && <div className="mt-4 grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setAction("approve")} className="flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-emerald-500 text-[10px] font-black text-white transition hover:bg-emerald-600"><CheckCircle2 size={14} />تایید کالا</button>
                        <button type="button" onClick={() => setAction("reject")} className="flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-red-500 text-[10px] font-black text-white transition hover:bg-red-600"><XCircle size={14} />رد کالا</button>
                    </div>}
                </div>
            </motion.article>

            {action && <QCActionModal isOpen mode={action} item={item} employees={employees} onClose={() => setAction(null)} onCompleted={onUpdated} />}
        </>
    );
}