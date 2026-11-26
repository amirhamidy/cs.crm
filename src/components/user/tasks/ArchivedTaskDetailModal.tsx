"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
    Archive,
    Ban,
    Building2,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FileText,
    Flag,
    Hash,
    ShoppingBag,
    UserCircle2,
    UserRound,
    X,
} from "lucide-react";

/** فقط فیلدهای موجود در لیست آرشیو؛ هیچ درخواست اضافه‌ای به endpoint جزئیات زده نمی‌شود. */
export interface ArchiveTaskSummary {
    id: number;
    task_id: number;
    title: string;
    status: "completed" | "cancelled" | "sold";
    case_id: number | null;
    case_title: string;
    customer_id: number | null;
    customer_full_name: string;
    department_id: number;
    department_name: string;
    created_by_id: number | null;
    created_by_username: string;
    created_by_full_name: string;
    final_action_by_id: number | null;
    final_action_by_username: string;
    final_action_by_full_name: string;
    task_created_at: string;
    completed_at: string | null;
    archived_at: string;
}

const dateFmt = new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric" });
const timeFmt = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" });

function fmtDate(value?: string | null) {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}

function fmtDateTime(value?: string | null) {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : `${dateFmt.format(d)} · ${timeFmt.format(d)}`;
}

/** مدت زمان بین دو تاریخ به شکل خوانا (روز/ساعت) */
function fmtDuration(from?: string | null, to?: string | null) {
    if (!from || !to) return null;
    const a = new Date(from).getTime();
    const b = new Date(to).getTime();
    if (isNaN(a) || isNaN(b) || b < a) return null;
    const totalMinutes = Math.round((b - a) / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const parts: string[] = [];
    if (days) parts.push(`${days.toLocaleString("fa-IR")} روز`);
    if (hours) parts.push(`${hours.toLocaleString("fa-IR")} ساعت`);
    if (!days && minutes) parts.push(`${minutes.toLocaleString("fa-IR")} دقیقه`);
    return parts.length ? parts.join(" و ") : "کمتر از یک دقیقه";
}

function statusMeta(status: ArchiveTaskSummary["status"]) {
    if (status === "sold")
        return { label: "فروش رفته", icon: ShoppingBag, cls: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" };
    if (status === "cancelled")
        return { label: "لغو شده", icon: Ban, cls: "text-rose-600 bg-rose-500/10 border-rose-500/20" };
    return { label: "انجام شده", icon: CheckCircle2, cls: "text-sky-600 bg-sky-500/10 border-sky-500/20" };
}

function Field({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value?: string | null }) {
    return (
        <div className="flex min-w-0 items-start gap-2.5 rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
            <Icon size={13} className="mt-0.5 shrink-0 text-gray-400" />
            <div className="min-w-0">
                <p className="text-[9.5px] font-bold text-gray-400">{label}</p>
                <p className="mt-0.5 truncate text-[11px] font-extrabold text-gray-700 dark:text-gray-200">
                    {value || "—"}
                </p>
            </div>
        </div>
    );
}

interface Props {
    task: ArchiveTaskSummary;
    onClose: () => void;
}

export default function ArchivedTaskDetailModal({ task, onClose }: Props) {
    const status = statusMeta(task.status);
    const StatusIcon = status.icon;

    const actor = task.final_action_by_full_name || task.final_action_by_username || "—";
    const creator = task.created_by_full_name || task.created_by_username || "—";

    const durationToComplete = useMemo(
        () => fmtDuration(task.task_created_at, task.completed_at),
        [task.task_created_at, task.completed_at],
    );
    const durationToArchive = useMemo(
        () => fmtDuration(task.task_created_at, task.archived_at),
        [task.task_created_at, task.archived_at],
    );

    const timeline = [
        { label: "ایجاد تسک", value: task.task_created_at, icon: CalendarDays },
        ...(task.completed_at ? [{ label: "تکمیل / پایان", value: task.completed_at, icon: Clock3 }] : []),
        { label: "ورود به آرشیو", value: task.archived_at, icon: Archive },
    ];

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
            dir="rtl"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-gray-100 bg-white p-6 text-right shadow-2xl dark:border-white/[0.08] dark:bg-[#111a2d]"
            >
                <div className="flex items-start justify-between gap-3">
                    <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${status.cls}`}>
                        <StatusIcon size={11} />
                        {status.label}
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/[0.06]"
                        aria-label="بستن"
                    >
                        <X size={15} />
                    </button>
                </div>

                <h4 className="mt-4 text-[15px] font-black leading-7 text-gray-900 dark:text-white">
                    {task.title || "تسک بدون عنوان"}
                </h4>
                <p className="mt-1 text-[10px] font-bold text-gray-400">شناسه تسک #{task.task_id}</p>

                {/* خلاصه زمانی */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                    {durationToComplete && (
                        <div className="rounded-2xl bg-indigo-500/[.06] px-3 py-3 dark:bg-indigo-500/[.08]">
                            <p className="text-[9.5px] font-bold text-indigo-400">مدت تا تکمیل</p>
                            <p className="mt-1 text-[11px] font-black text-indigo-600 dark:text-indigo-300">{durationToComplete}</p>
                        </div>
                    )}
                    {durationToArchive && (
                        <div className="rounded-2xl bg-gray-50 px-3 py-3 dark:bg-white/[0.035]">
                            <p className="text-[9.5px] font-bold text-gray-400">مدت تا آرشیو</p>
                            <p className="mt-1 text-[11px] font-black text-gray-700 dark:text-gray-200">{durationToArchive}</p>
                        </div>
                    )}
                </div>

                {/* اطلاعات */}
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Field icon={Building2} label="دپارتمان" value={task.department_name} />
                    <Field icon={UserRound} label="مشتری" value={task.customer_full_name} />
                    <Field icon={FileText} label="پرونده" value={task.case_title} />
                    <Field icon={UserCircle2} label="ایجادکننده" value={creator} />
                    <Field icon={Flag} label="آخرین اقدام توسط" value={actor} />
                    <Field icon={Hash} label="شناسه آرشیو" value={`#${task.id}`} />
                </div>

                {/* تایم‌لاین */}
                <div className="mt-5">
                    <p className="mb-3 text-[10.5px] font-extrabold text-gray-500 dark:text-gray-400">مسیر زمانی</p>
                    <ol className="relative space-y-4 border-r-2 border-gray-100 pr-5 dark:border-white/[0.07]">
                        {timeline.map((item) => {
                            const Icon = item.icon;
                            return (
                                <li key={item.label} className="relative">
                                    <span className="absolute -right-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-2 ring-indigo-400 dark:bg-[#111a2d]" />
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                        <Icon size={11} />
                                        {item.label}
                                    </div>
                                    <p className="mt-0.5 text-[11px] font-extrabold text-gray-700 dark:text-gray-200">
                                        {fmtDateTime(item.value)}
                                    </p>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </motion.div>
        </div>
    );
}
