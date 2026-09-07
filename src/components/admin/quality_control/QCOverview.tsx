"use client";

import { motion } from "framer-motion";
import {
    Activity,
    ArrowLeft,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    ShieldCheck,
    Users,
    XCircle,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
    JALALI_MONTHS,
    pad2,
    toJalali,
    toPersianDigits,
} from "@/lib/jalali";
import type {
    ApiQualityControlEmployee,
    ApiQualityControlItem,
} from "@/types/quality_control";

interface Props {
    items: ApiQualityControlItem[];
    employees: ApiQualityControlEmployee[];
    onOpenItems: () => void;
    onOpenEmployees: () => void;
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

    return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]
        } ${toPersianDigits(jy)} · ${toPersianDigits(
            pad2(date.getHours())
        )}:${toPersianDigits(pad2(date.getMinutes()))}`;
}

function Stat({
    label,
    value,
    icon: Icon,
    type,
    index,
}: {
    label: string;
    value: string | number;
    icon: typeof ClipboardCheck;
    type: "amber" | "green" | "red" | "blue";
    index: number;
}) {
    const themes = {
        amber: {
            icon: "bg-amber-500/10 text-amber-500",
            line: "bg-amber-500",
        },
        green: {
            icon: "bg-emerald-500/10 text-emerald-500",
            line: "bg-emerald-500",
        },
        red: {
            icon: "bg-red-500/10 text-red-500",
            line: "bg-red-500",
        },
        blue: {
            icon: "bg-blue-500/10 text-blue-500",
            line: "bg-blue-500",
        },
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            className="relative overflow-hidden rounded-[26px] border border-black/[0.05] bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.03)] dark:border-white/[0.06] dark:bg-white/[0.025]"
        >
            <div
                className={`absolute right-0 top-0 h-full w-1 ${themes[type].line}`}
            />

            <div className="flex items-start justify-between gap-3">
                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${themes[type].icon}`}
                >
                    <Icon size={18} />
                </div>

                <Activity
                    size={15}
                    className="text-gray-300 dark:text-white/20"
                />
            </div>

            <p className="mt-5 text-[10.5px] font-bold text-gray-400">
                {label}
            </p>

            <p className="mt-1 text-[24px] font-black tracking-tight text-gray-900 dark:text-white">
                {value}
            </p>
        </motion.div>
    );
}

export default function QCOverview({
    items,
    employees,
    onOpenItems,
    onOpenEmployees,
}: Props) {
    const { resolvedTheme } = useTheme();

    const isDark = resolvedTheme === "dark";

    const pending = items.filter(
        (item) => item.status === "pending"
    ).length;

    const approved = items.filter(
        (item) => item.status === "approved"
    ).length;

    const rejected = items.filter(
        (item) => item.status === "rejected"
    ).length;

    const activeEmployees = employees.filter(
        (employee) => employee.is_active
    ).length;

    const completed = approved + rejected;

    const approvalRate =
        completed > 0
            ? Math.round((approved / completed) * 100)
            : 0;

    const recent = [...items]
        .filter((item) => item.checked_at)
        .sort(
            (a, b) =>
                new Date(b.checked_at as string).getTime() -
                new Date(a.checked_at as string).getTime()
        )
        .slice(0, 6);

    return (
        <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Stat
                    index={0}
                    label="در انتظار بررسی"
                    value={pending}
                    icon={Clock3}
                    type="amber"
                />

                <Stat
                    index={1}
                    label="تایید شده"
                    value={approved}
                    icon={CheckCircle2}
                    type="green"
                />

                <Stat
                    index={2}
                    label="رد شده"
                    value={rejected}
                    icon={XCircle}
                    type="red"
                />

                <Stat
                    index={3}
                    label="کارمندان فعال"
                    value={`${activeEmployees}/${employees.length}`}
                    icon={Users}
                    type="blue"
                />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_.6fr]">
                <div
                    className="rounded-[28px] border p-5"
                    style={{
                        background: isDark
                            ? "rgba(255,255,255,.025)"
                            : "#fafafa",
                        borderColor: isDark
                            ? "rgba(255,255,255,.06)"
                            : "rgba(15,23,42,.05)",
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck
                                    size={15}
                                    className="text-blue-500"
                                />

                                <h2 className="text-[13px] font-black text-gray-900 dark:text-white">
                                    وضعیت کلی کنترل کیفی
                                </h2>
                            </div>

                            <p className="mt-1 text-[10px] font-medium text-gray-400">
                                خلاصه عملکرد بر اساس داده‌های دریافت‌شده از API
                            </p>
                        </div>

                        <span className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-[10px] font-black text-blue-500">
                            {items.length} مورد
                        </span>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                        <Mini
                            label="در انتظار"
                            value={pending}
                            color="text-amber-500"
                        />

                        <Mini
                            label="تایید"
                            value={approved}
                            color="text-emerald-500"
                        />

                        <Mini
                            label="رد"
                            value={rejected}
                            color="text-red-500"
                        />
                    </div>

                    <div className="mt-6">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400">
                                نرخ تایید موارد بررسی‌شده
                            </span>

                            <span className="text-[11px] font-black text-gray-800 dark:text-white">
                                {toPersianDigits(approvalRate)}٪
                            </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/[0.07]">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${approvalRate}%`,
                                }}
                                transition={{
                                    duration: 0.8,
                                    ease: "easeOut",
                                }}
                                className="h-full rounded-full bg-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                        <button
                            type="button"
                            onClick={onOpenItems}
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3 text-[10.5px] font-black text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                        >
                            <ClipboardCheck size={14} />
                            مشاهده بررسی‌ها
                            <ArrowLeft size={13} />
                        </button>

                        <button
                            type="button"
                            onClick={onOpenEmployees}
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3 text-[10.5px] font-black text-gray-600 ring-1 ring-black/[0.05] dark:bg-white/[0.04] dark:text-gray-300 dark:ring-white/[0.06]"
                        >
                            <Users size={14} />
                            مدیریت کارکنان
                            <ArrowLeft size={13} />
                        </button>
                    </div>
                </div>

                <div className="rounded-[28px] border border-black/[0.05] bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.025]">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Activity
                                    size={15}
                                    className="text-emerald-500"
                                />

                                <h2 className="text-[13px] font-black text-gray-900 dark:text-white">
                                    تیم کنترل کیفی
                                </h2>
                            </div>

                            <p className="mt-1 text-[10px] text-gray-400">
                                وضعیت فعلی نیروها
                            </p>
                        </div>

                        <Users
                            size={18}
                            className="text-gray-300 dark:text-white/20"
                        />
                    </div>

                    <div className="mt-6 flex items-end gap-3">
                        <span className="text-[34px] font-black text-gray-900 dark:text-white">
                            {activeEmployees}
                        </span>

                        <span className="pb-1 text-[10px] font-bold text-gray-400">
                            فعال از {employees.length} نفر
                        </span>
                    </div>

                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                        <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{
                                width: `${employees.length
                                        ? (activeEmployees /
                                            employees.length) *
                                        100
                                        : 0
                                    }%`,
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-[28px] border border-black/[0.05] bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.025]">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Clock3
                                size={15}
                                className="text-gray-400"
                            />

                            <h2 className="text-[13px] font-black text-gray-900 dark:text-white">
                                آخرین بررسی‌ها
                            </h2>
                        </div>

                        <p className="mt-1 text-[10px] text-gray-400">
                            آخرین مواردی که توسط کنترل کیفی بررسی شده‌اند
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onOpenItems}
                        className="text-[10px] font-black text-blue-500"
                    >
                        همه موارد
                    </button>
                </div>

                {recent.length === 0 ? (
                    <div className="py-14 text-center">
                        <ClipboardCheck
                            size={25}
                            className="mx-auto text-gray-200 dark:text-white/10"
                        />

                        <p className="mt-3 text-[11px] font-bold text-gray-400">
                            هنوز بررسی‌ای ثبت نشده است
                        </p>
                    </div>
                ) : (
                    <div className="mt-5 grid grid-cols-1 gap-2 md:grid-cols-2">
                        {recent.map((item) => {
                            const approved =
                                item.status === "approved";

                            return (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-white/[0.035]"
                                >
                                    <div
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${approved
                                                ? "bg-emerald-500/10 text-emerald-500"
                                                : "bg-red-500/10 text-red-500"
                                            }`}
                                    >
                                        {approved ? (
                                            <CheckCircle2 size={15} />
                                        ) : (
                                            <XCircle size={15} />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[11px] font-black text-gray-800 dark:text-white">
                                            {item.product_name}
                                        </p>

                                        <p className="mt-1 text-[9px] font-bold text-gray-400">
                                            {item.checked_by_name ||
                                                "—"}{" "}
                                            ·{" "}
                                            {formatDate(
                                                item.checked_at
                                            )}
                                        </p>
                                    </div>

                                    <span
                                        className={`shrink-0 text-[9.5px] font-black ${approved
                                                ? "text-emerald-500"
                                                : "text-red-500"
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

function Mini({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div className="rounded-2xl bg-white p-4 dark:bg-white/[0.035]">
            <p className="text-[9.5px] font-bold text-gray-400">
                {label}
            </p>

            <p className={`mt-1 text-[20px] font-black ${color}`}>
                {value}
            </p>
        </div>
    );
}