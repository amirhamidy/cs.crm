"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { AlarmClock, Building2, CalendarDays, FileText, User, UserCog } from "lucide-react";
import { toJalali, toPersianDigits, JALALI_MONTHS, pad2 } from "@/lib/jalali";
import type { ApiOrderTask, ApiOrderTaskDeadline } from "@/types/warehouse";

interface OrderTaskCardProps {
    orderTask: ApiOrderTask;
    deadline: ApiOrderTaskDeadline | null;
    index: number;
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

function deadlineState(deadline?: string | null) {
    if (!deadline) {
        return { label: "بدون مهلت", color: "#9ca3af", bg: "rgba(156,163,175,0.12)" };
    }
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff < 0) return { label: "منقضی شده", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
    if (diff / (1000 * 60 * 60) <= 24) {
        return { label: "فوری", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
    }
    return { label: "در زمانبندی", color: "#10b981", bg: "rgba(16,185,129,0.1)" };
}

function statusMeta(status: string) {
    switch (status) {
        case "completed":
            return { label: "تکمیل‌شده", color: "#10b981", bg: "rgba(16,185,129,0.1)" };
        case "in_progress":
            return { label: "در حال انجام", color: "#6366f1", bg: "rgba(99,102,241,0.1)" };
        case "rejected":
            return { label: "رد شده", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
        default:
            return { label: "در انتظار", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
    }
}

export default function OrderTaskCard({ orderTask, deadline, index }: OrderTaskCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const meta = statusMeta(orderTask.status);
    const dState = deadlineState(deadline?.deadline ?? orderTask.deadline);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.04 }}
            className="flex flex-col gap-3 rounded-3xl p-4"
            style={{
                background: isDark ? "rgba(255,255,255,0.03)" : "#fafafa",
                border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(15,23,42,0.06)",
            }}
        >
            <div className="flex flex-wrap items-center gap-1.5">
                <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold"
                    style={{ background: meta.bg, color: meta.color }}
                >
                    {meta.label}
                </span>
                <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold"
                    style={{ background: dState.bg, color: dState.color }}
                >
                    <AlarmClock size={10} />
                    {dState.label}
                </span>
            </div>

            <h3 className="line-clamp-2 text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                {orderTask.title}
            </h3>

            {orderTask.case && (
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    پرونده: {orderTask.case.title}
                </p>
            )}

            <div className="flex flex-col gap-1.5 rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
                {orderTask.department && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                        <Building2 size={11} className="text-gray-400" />
                        <span className="font-semibold text-gray-400 dark:text-white/35">دپارتمان:</span>
                        <span className="font-bold text-gray-700 dark:text-white/80">
                            {orderTask.department.name}
                        </span>
                    </div>
                )}
                {orderTask.created_by && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                        <User size={11} className="text-gray-400" />
                        <span className="font-semibold text-gray-400 dark:text-white/35">درخواست‌دهنده:</span>
                        <span className="font-bold text-gray-700 dark:text-white/80">
                            {orderTask.created_by.username}
                        </span>
                    </div>
                )}
                {orderTask.performed_by && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                        <UserCog size={11} className="text-gray-400" />
                        <span className="font-semibold text-gray-400 dark:text-white/35">انبار‌دار:</span>
                        <span className="font-bold text-gray-700 dark:text-white/80">
                            {orderTask.performed_by.full_name}
                        </span>
                    </div>
                )}
                {deadline?.deadline && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                        <CalendarDays size={11} className="text-gray-400" />
                        <span className="font-semibold text-gray-400 dark:text-white/35">مهلت:</span>
                        <span className="font-bold text-gray-700 dark:text-white/80">
                            {formatJalali(deadline.deadline)}
                        </span>
                    </div>
                )}
            </div>

            {orderTask.note && (
                <p className="rounded-2xl bg-gray-50 px-3 py-2 text-[11px] font-medium text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
                    {orderTask.note}
                </p>
            )}

            {orderTask.file && (
                <a
                    href={orderTask.file}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-2xl bg-indigo-50 py-2 text-[11px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"
                >
                    <FileText size={12} />
                    مشاهده پیوست
                </a>
            )}
        </motion.div>
    );
}