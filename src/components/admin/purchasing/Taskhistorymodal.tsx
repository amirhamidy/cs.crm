"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeftCircle,
    ArrowRightCircle,
    FileText,
    History,
    Loader2,
    RefreshCw,
    StickyNote,
    UserRound,
    X,
} from "lucide-react";
import { JALALI_MONTHS, pad2, toJalali, toPersianDigits } from "@/lib/jalali";

// توجه: چون تایپ دقیق ApiTaskAttachment در دسترسم نبود، این شکل رو فرض کردم.
// اگه اسم فیلدهای واقعی فرق داره (مثلاً step_name بجای to_step_name) کافیه همینجا map رو اصلاح کنی.
export interface PurchasingTaskHistoryEntry {
    id: number | string;
    created_at: string;
    action?: "advance" | "revert" | string;
    step_name?: string;
    to_step_name?: string;
    from_step_name?: string;
    created_by_name?: string;
    created_by_username?: string;
    note?: string;
    file?: string | null;
    file_name?: string | null;
}

interface Props {
    open: boolean;
    taskTitle: string;
    entries: PurchasingTaskHistoryEntry[];
    loading?: boolean;
    onRefresh?: () => void;
    onClose: () => void;
}

const formatJalali = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const [jy, jm, jd] = toJalali(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    ) as [number, number, number];
    return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)} ساعت ${toPersianDigits(
        pad2(date.getHours())
    )}:${toPersianDigits(pad2(date.getMinutes()))}`;
};

const actionMeta = (action?: string) => {
    if (action === "advance") {
        return {
            label: "انتقال به مرحله بعد",
            bg: "bg-indigo-50 dark:bg-indigo-500/10",
            text: "text-indigo-600 dark:text-indigo-300",
            icon: ArrowLeftCircle,
            dot: "bg-indigo-500",
        };
    }
    if (action === "revert") {
        return {
            label: "بازگشت به مرحله قبل",
            bg: "bg-rose-50 dark:bg-rose-500/10",
            text: "text-rose-600 dark:text-rose-300",
            icon: ArrowRightCircle,
            dot: "bg-rose-500",
        };
    }
    return {
        label: "بروزرسانی",
        bg: "bg-gray-100 dark:bg-white/[0.06]",
        text: "text-gray-500 dark:text-gray-300",
        icon: StickyNote,
        dot: "bg-gray-400",
    };
};

export default function TaskHistoryModal({
    open,
    taskTitle,
    entries,
    loading = false,
    onRefresh,
    onClose,
}: Props) {
    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
                    onClick={onClose}
                    dir="rtl"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 14 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 14 }}
                        transition={{ duration: 0.2 }}
                        onClick={(event) => event.stopPropagation()}
                        className="flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#111a2d]"
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition hover:text-gray-600 dark:bg-white/[0.05] dark:hover:text-gray-300"
                                >
                                    <X size={15} />
                                </button>

                                {onRefresh && (
                                    <button
                                        type="button"
                                        onClick={onRefresh}
                                        disabled={loading}
                                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                                    >
                                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                                    </button>
                                )}
                            </div>

                            <div className="text-left">
                                <h3 className="flex items-center justify-end gap-2 text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    تاریخچه تسک
                                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-300">
                                        <History size={14} />
                                    </span>
                                </h3>
                                <p className="mt-0.5 truncate text-[11px] font-medium text-gray-400">
                                    {taskTitle}
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-5">
                            {loading ? (
                                <div className="flex h-40 items-center justify-center">
                                    <Loader2 size={20} className="animate-spin text-indigo-500" />
                                </div>
                            ) : entries.length === 0 ? (
                                <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                                    <History size={26} className="text-gray-300 dark:text-gray-700" />
                                    <p className="text-[11.5px] font-bold text-gray-400">
                                        تاریخچه‌ای برای این تسک ثبت نشده است
                                    </p>
                                </div>
                            ) : (
                                <div className="relative flex flex-col gap-4 pr-4">
                                    <div className="absolute right-[7px] top-2 bottom-2 w-px bg-gray-100 dark:bg-white/[0.06]" />

                                    {entries.map((entry) => {
                                        const meta = actionMeta(entry.action);
                                        const Icon = meta.icon;
                                        const stepName =
                                            entry.step_name || entry.to_step_name || entry.from_step_name;

                                        return (
                                            <div key={entry.id} className="relative">
                                                <span
                                                    className={`absolute right-[-25px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white dark:border-[#111a2d] ${meta.dot}`}
                                                />

                                                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[9.5px] font-bold text-gray-400">
                                                            {formatJalali(entry.created_at)}
                                                        </span>
                                                        <span
                                                            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold ${meta.bg} ${meta.text}`}
                                                        >
                                                            <Icon size={11} />
                                                            {meta.label}
                                                        </span>
                                                    </div>

                                                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                                        {stepName && (
                                                            <span className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[9.5px] font-bold text-gray-600 dark:bg-white/[0.04] dark:text-gray-300">
                                                                <span className="text-gray-400">مرحله:</span>
                                                                {stepName}
                                                            </span>
                                                        )}

                                                        {(entry.created_by_name || entry.created_by_username) && (
                                                            <span className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[9.5px] font-bold text-gray-600 dark:bg-white/[0.04] dark:text-gray-300">
                                                                <span className="text-gray-400">توسط:</span>
                                                                <UserRound size={10} className="text-indigo-400" />
                                                                {entry.created_by_name || entry.created_by_username}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {entry.note && (
                                                        <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-white px-3 py-2.5 text-[10.5px] font-medium leading-5 text-gray-600 dark:bg-white/[0.04] dark:text-gray-300">
                                                            <StickyNote
                                                                size={12}
                                                                className="mt-0.5 shrink-0 text-gray-400"
                                                            />
                                                            {entry.note}
                                                        </div>
                                                    )}

                                                    {entry.file && (
                                                        <div className="mt-2 flex items-center gap-1.5 text-[9.5px] font-bold text-indigo-500">
                                                            <FileText size={11} />
                                                            {entry.file_name || "فایل پیوست"}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}