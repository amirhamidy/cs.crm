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

    const cardBg = isDark ? "rgba(255,255,255,0.03)" : "#fafafa";
    const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)";
    const textColor = isDark ? "#f1f5f9" : "#1e293b";
    const mutedText = isDark ? "#94a3b8" : "#64748b";

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.04 }}
            className="relative flex flex-col gap-3 rounded-3xl p-4 transition-all hover:border-indigo-200/50"
            style={{
                background: cardBg,
                border: `1px solid ${borderColor}`,
            }}
        >
            {/* Animated border - ایندیگو/بنفش */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
                <defs>
                    <linearGradient
                        id={`order-border-${orderTask.id}`}
                        x1="100%"
                        y1="100%"
                        x2="0%"
                        y2="0%"
                    >
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                </defs>
                <motion.rect
                    x="1"
                    y="1"
                    width="calc(100% - 2px)"
                    height="calc(100% - 2px)"
                    rx="23"
                    ry="23"
                    fill="none"
                    stroke="url(#order-border-${orderTask.id})"
                    strokeWidth="1.4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileHover={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.45, ease: "easeInOut" }}
                />
            </svg>

            <div className="flex flex-wrap items-center gap-1.5">
                <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-extrabold"
                    style={{ background: meta.bg, color: meta.color }}
                >
                    {meta.label}
                </span>
                <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-extrabold"
                    style={{ background: dState.bg, color: dState.color }}
                >
                    <AlarmClock size={11} />
                    {dState.label}
                </span>
            </div>

            <h3
                className="line-clamp-2 text-[13.5px] font-extrabold"
                style={{ color: textColor }}
            >
                {orderTask.title}
            </h3>

            {orderTask.case && (
                <p className="text-[12px] font-medium" style={{ color: mutedText }}>
                    پرونده: {orderTask.case.title}
                </p>
            )}

            <div
                className="flex flex-col gap-1.5 rounded-2xl px-3 py-2.5"
                style={{
                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
                }}
            >
                {orderTask.department && (
                    <div className="flex items-center gap-1.5 text-[12px]">
                        <Building2 size={12} style={{ color: mutedText }} />
                        <span className="font-semibold" style={{ color: mutedText }}>
                            دپارتمان:
                        </span>
                        <span className="font-bold" style={{ color: textColor }}>
                            {orderTask.department.name}
                        </span>
                    </div>
                )}
                {orderTask.created_by && (
                    <div className="flex items-center gap-1.5 text-[12px]">
                        <User size={12} style={{ color: mutedText }} />
                        <span className="font-semibold" style={{ color: mutedText }}>
                            درخواست‌دهنده:
                        </span>
                        <span className="font-bold" style={{ color: textColor }}>
                            {orderTask.created_by.username}
                        </span>
                    </div>
                )}
                {orderTask.performed_by && (
                    <div className="flex items-center gap-1.5 text-[12px]">
                        <UserCog size={12} style={{ color: mutedText }} />
                        <span className="font-semibold" style={{ color: mutedText }}>
                            انبار‌دار:
                        </span>
                        <span className="font-bold" style={{ color: textColor }}>
                            {orderTask.performed_by.full_name}
                        </span>
                    </div>
                )}
                {deadline?.deadline && (
                    <div className="flex items-center gap-1.5 text-[12px]">
                        <CalendarDays size={12} style={{ color: mutedText }} />
                        <span className="font-semibold" style={{ color: mutedText }}>
                            مهلت:
                        </span>
                        <span className="font-bold" style={{ color: textColor }}>
                            {formatJalali(deadline.deadline)}
                        </span>
                    </div>
                )}
            </div>

            {orderTask.note && (
                <p
                    className="rounded-2xl px-3 py-2 text-[12px] font-medium"
                    style={{
                        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
                        color: mutedText,
                    }}
                >
                    {orderTask.note}
                </p>
            )}

            {orderTask.file && (
                <a
                    href={orderTask.file}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-2xl py-2 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-500"
                    style={{
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    }}
                >
                    <FileText size={13} />
                    مشاهده پیوست
                </a>
            )}
        </motion.div>
    );
}