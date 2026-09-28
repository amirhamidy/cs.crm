"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, Clock3, FileText, UserRound, XCircle, type LucideIcon } from "lucide-react";
import { toPersianDigits } from "@/lib/jalali";
import type { ApiQualityControlEmployee, ApiQualityControlItem, QualityControlActionResponse } from "@/types/quality_control";
import { QC_STATUS_META } from "@/types/quality_control";
import QCActionModal from "./QCActionModal";
import { formatDate } from "./qcUtils";

interface Props {
    item: ApiQualityControlItem;
    index: number;
    reviewer: ApiQualityControlEmployee | null;
    reviewerName: string;
    names: Record<string, string>;
    onUpdated: (response: QualityControlActionResponse) => void;
}

const TONE: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10",
    rejected: "bg-red-50 text-red-500 dark:bg-red-500/10",
};
const PENDING_TONE = "bg-amber-50 text-amber-500 dark:bg-amber-500/10";

function Tile({ icon: Icon, label, children }: { icon?: LucideIcon; label: string; children: React.ReactNode }) {
    return (
        <div className="min-w-0 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
            <div className="flex items-center gap-1.5 text-gray-400">
                {Icon && <Icon size={11} />}
                <span className="text-[9.5px] font-semibold">{label}</span>
            </div>
            <div className="mt-0.5 truncate text-[11.5px] font-extrabold text-gray-800 dark:text-white">{children}</div>
        </div>
    );
}

export default function QCItemCard({ item, index, reviewer, reviewerName, names, onUpdated }: Props) {
    const [action, setAction] = useState<"approve" | "reject" | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const tone = TONE[item.status] ?? PENDING_TONE;
    const Icon = item.status === "approved" ? CheckCircle2 : item.status === "rejected" ? XCircle : Clock3;
    const checker = item.checked_by_name ? names[item.checked_by_name] || item.checked_by_name : "هنوز بررسی نشده";

    return (
        <>
            <motion.article
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", damping: 24, stiffness: 260, delay: Math.min(index * 0.035, 0.3) }}
                className="overflow-hidden rounded-[1.45rem] border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-xl hover:shadow-black/[0.04] dark:border-white/[0.06] dark:bg-[#111827] dark:hover:shadow-black/20"
                dir="rtl"
            >
                <div className="p-3">
                    <div className="flex items-start gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
                            <Icon size={17} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">{item.product_name}</h3>
                                    <p className="mt-1 text-[10.5px] font-semibold text-gray-400">درخواست خرید #{toPersianDigits(item.purchase_task_id)}</p>
                                </div>
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold ${tone}`}>
                                    {QC_STATUS_META[item.status]?.label || item.status_display}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 h-px bg-gray-100 dark:bg-white/[0.06]" />

                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <Tile icon={UserRound} label="بررسی‌کننده">{checker}</Tile>
                        <Tile icon={Clock3} label="زمان بررسی">{formatDate(item.checked_at)}</Tile>
                    </div>

                    {item.note && (
                        <div className="mt-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <FileText size={11} />
                                <span className="text-[9.5px] font-semibold">توضیحات</span>
                            </div>
                            <p className="mt-1 text-[11px] font-bold leading-5 text-gray-600 dark:text-gray-300">{item.note}</p>
                        </div>
                    )}

                    <button type="button" onClick={() => setDetailsOpen((v) => !v)} className="mt-3 flex w-full items-center justify-center gap-1 text-[10.5px] font-extrabold text-gray-400 transition hover:text-blue-500">
                        جزئیات
                        <ChevronDown size={12} className={`transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence initial={false}>
                        {detailsOpen && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <Tile label="شناسه بررسی">{toPersianDigits(item.id)}</Tile>
                                    <Tile label="ایجاد شده">{formatDate(item.created_at)}</Tile>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {item.status === "pending" && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={() => setAction("approve")} className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-emerald-600 text-[11.5px] font-extrabold text-white transition hover:bg-emerald-500">
                                <CheckCircle2 size={13} />
                                تایید کالا
                            </motion.button>
                            <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={() => setAction("reject")} className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-red-600 text-[11.5px] font-extrabold text-white transition hover:bg-red-500">
                                <XCircle size={13} />
                                رد کالا
                            </motion.button>
                        </div>
                    )}
                </div>
            </motion.article>

            {action && <QCActionModal isOpen mode={action} item={item} reviewer={reviewer} reviewerName={reviewerName} onClose={() => setAction(null)} onCompleted={onUpdated} />}
        </>
    );
}