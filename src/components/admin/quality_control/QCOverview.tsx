"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { CheckCircle2, ClipboardCheck, ShieldCheck, XCircle } from "lucide-react";
import { toJalali, toPersianDigits, JALALI_MONTHS, pad2 } from "@/lib/jalali";
import type { ApiQualityControlEmployee, ApiQualityControlItem } from "@/types/quality_control";

interface QCOverviewProps {
    items: ApiQualityControlItem[];
    employees: ApiQualityControlEmployee[];
}

function formatJalaliShort(value?: string | null) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const [jy, jm, jd] = toJalali(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    ) as [number, number, number];
    return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} - ${toPersianDigits(pad2(date.getHours()))}:${toPersianDigits(pad2(date.getMinutes()))}`;
}

function StatCard({
    icon: Icon,
    label,
    value,
    color,
    bg,
    index,
}: {
    icon: typeof ShieldCheck;
    label: string;
    value: string | number;
    color: string;
    bg: string;
    index: number;
}) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="flex items-center gap-3 rounded-3xl p-4"
            style={{
                background: isDark ? "rgba(255,255,255,0.03)" : "#fafafa",
                border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(15,23,42,0.06)",
            }}
        >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: bg }}>
                <Icon size={18} style={{ color }} />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40">{label}</p>
                <p className="mt-0.5 text-[16px] font-extrabold text-gray-900 dark:text-white">{value}</p>
            </div>
        </motion.div>
    );
}

export default function QCOverview({ items, employees }: QCOverviewProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const pendingCount = items.filter((i) => i.status === "pending").length;
    const approvedCount = items.filter((i) => i.status === "approved").length;
    const rejectedCount = items.filter((i) => i.status === "rejected").length;
    const activeEmployees = employees.filter((e) => e.is_active).length;

    const recentChecked = [...items]
        .filter((i) => i.checked_at)
        .sort((a, b) => new Date(b.checked_at as string).getTime() - new Date(a.checked_at as string).getTime())
        .slice(0, 8);

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    index={0}
                    icon={ClipboardCheck}
                    label="در انتظار بررسی"
                    value={pendingCount}
                    color="#f59e0b"
                    bg="rgba(245,158,11,0.1)"
                />
                <StatCard
                    index={1}
                    icon={CheckCircle2}
                    label="تایید شده"
                    value={approvedCount}
                    color="#10b981"
                    bg="rgba(16,185,129,0.1)"
                />
                <StatCard
                    index={2}
                    icon={XCircle}
                    label="رد شده"
                    value={rejectedCount}
                    color="#ef4444"
                    bg="rgba(239,68,68,0.1)"
                />
                <StatCard
                    index={3}
                    icon={ShieldCheck}
                    label="کارمندان فعال کنترل کیفی"
                    value={`${activeEmployees} از ${employees.length}`}
                    color="#3b82f6"
                    bg="rgba(59,130,246,0.1)"
                />
            </div>

            <div
                className="flex flex-col gap-3 rounded-3xl p-5"
                style={{
                    background: isDark ? "rgba(255,255,255,0.03)" : "#fafafa",
                    border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(15,23,42,0.06)",
                }}
            >
                <div className="flex items-center gap-2">
                    <ShieldCheck size={15} className="text-emerald-500" />
                    <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                        آخرین بررسی‌های کنترل کیفی
                    </h3>
                </div>

                {recentChecked.length === 0 ? (
                    <p className="py-6 text-center text-[11.5px] text-gray-400">
                        هنوز بررسی‌ای انجام نشده است
                    </p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {recentChecked.map((item) => {
                            const isApproved = item.status === "approved";
                            return (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]"
                                >
                                    <div className="flex min-w-0 items-center gap-2">
                                        {isApproved ? (
                                            <CheckCircle2 size={14} className="text-emerald-500" />
                                        ) : (
                                            <XCircle size={14} className="text-red-500" />
                                        )}
                                        <div className="min-w-0">
                                            <p className="truncate text-[11.5px] font-bold text-gray-800 dark:text-white">
                                                {item.product_name}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                {item.checked_by_name} · {formatJalaliShort(item.checked_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`text-[10.5px] font-extrabold ${isApproved ? "text-emerald-500" : "text-red-500"
                                            }`}
                                    >
                                        {item.status_display}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}