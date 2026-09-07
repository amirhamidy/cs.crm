"use client";

import {
    ClipboardList,
    History,
    ListOrdered,
    ShoppingCart,
    UserCog,
} from "lucide-react";
import { useTheme } from "next-themes";
import type {
    ApiPurchasingEmployee,
    ApiPurchasingStep,
    ApiPurchasingTask,
    ApiTaskAttachment,
} from "@/types/purchasing";
import { PURCHASING_TASK_STATUS_META } from "@/types/purchasing";

interface Props {
    employees?: ApiPurchasingEmployee[];
    steps?: ApiPurchasingStep[];
    tasks?: ApiPurchasingTask[];
    attachments?: ApiTaskAttachment[];
}

export default function PurchasingOverview({
    employees = [],
    steps = [],
    tasks = [],
    attachments = [],
}: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const pending = tasks.filter(
        (item) => item.status === "pending"
    ).length;

    const inProgress = tasks.filter(
        (item) => item.status === "in_progress"
    ).length;

    const completed = tasks.filter(
        (item) => item.status === "completed"
    ).length;

    const activeEmployees = employees.filter(
        (item) => item.is_active
    ).length;

    const stats = [
        {
            title: "کل تسک‌ها",
            value: tasks.length,
            icon: ClipboardList,
            color: "#6366f1",
            bg: "rgba(99,102,241,0.10)",
        },
        {
            title: "در انتظار",
            value: pending,
            icon: ShoppingCart,
            color: PURCHASING_TASK_STATUS_META.pending.color,
            bg: PURCHASING_TASK_STATUS_META.pending.bg,
        },
        {
            title: "در حال انجام",
            value: inProgress,
            icon: ListOrdered,
            color: PURCHASING_TASK_STATUS_META.in_progress.color,
            bg: PURCHASING_TASK_STATUS_META.in_progress.bg,
        },
        {
            title: "تکمیل شده",
            value: completed,
            icon: History,
            color: PURCHASING_TASK_STATUS_META.completed.color,
            bg: PURCHASING_TASK_STATUS_META.completed.bg,
        },
        {
            title: "کارمندان فعال",
            value: activeEmployees,
            icon: UserCog,
            color: "#8b5cf6",
            bg: "rgba(139,92,246,0.10)",
        },
    ];

    const recentActivities = [...attachments]
        .sort(
            (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
        )
        .slice(0, 6);

    return (
        <div dir="rtl" className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                {stats.map((item) => {
                    const Icon = item.icon;

                    return (
                        <div
                            key={item.title}
                            className="rounded-[1.8rem] border p-3.5 transition-all duration-200 hover:-translate-y-0.5"
                            style={{
                                background: isDark
                                    ? "rgba(255,255,255,0.025)"
                                    : "#fafafa",
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(15,23,42,0.06)",
                            }}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                                    style={{
                                        background: item.bg,
                                        color: item.color,
                                    }}
                                >
                                    <Icon size={14} />
                                </div>

                                <span
                                    className="text-[18px] font-black"
                                    style={{ color: item.color }}
                                >
                                    {item.value}
                                </span>
                            </div>

                            <p className="mt-2.5 text-[10px] font-bold text-gray-400">
                                {item.title}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
                <div
                    className="rounded-[1.8rem] border p-4"
                    style={{
                        background: isDark
                            ? "rgba(255,255,255,0.025)"
                            : "#fafafa",
                        borderColor: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(15,23,42,0.06)",
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-[12.5px] font-extrabold text-gray-900 dark:text-white">
                                فعالیت‌های اخیر
                            </h3>

                            <p className="mt-0.5 text-[9.5px] text-gray-400">
                                آخرین تغییرات فرآیند خرید
                            </p>
                        </div>

                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                            <History size={14} />
                        </div>
                    </div>

                    {recentActivities.length === 0 ? (
                        <div className="mt-4 flex items-center justify-center rounded-2xl bg-gray-50 py-8 dark:bg-white/[0.025]">
                            <span className="text-[10.5px] font-semibold text-gray-400">
                                هنوز فعالیتی ثبت نشده است
                            </span>
                        </div>
                    ) : (
                        <div className="mt-4 flex flex-col gap-2">
                            {recentActivities.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                                        <History size={13} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-lg bg-indigo-500/10 px-2 py-1 text-[9px] font-bold text-indigo-500">
                                                {item.type_display}
                                            </span>

                                            <span className="truncate text-[10px] font-bold text-gray-500 dark:text-white/55">
                                                {item.created_by_name}
                                            </span>
                                        </div>

                                        {item.note && (
                                            <p className="mt-1 truncate text-[9.5px] text-gray-400">
                                                {item.note}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div
                    className="rounded-[1.8rem] border p-4"
                    style={{
                        background: isDark
                            ? "rgba(255,255,255,0.025)"
                            : "#fafafa",
                        borderColor: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(15,23,42,0.06)",
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-[12.5px] font-extrabold text-gray-900 dark:text-white">
                                وضعیت فرآیند
                            </h3>

                            <p className="mt-0.5 text-[9.5px] text-gray-400">
                                ساختار فعلی خرید
                            </p>
                        </div>

                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                            <ListOrdered size={14} />
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                        <OverviewRow
                            label="مراحل تعریف شده"
                            value={steps.length}
                        />

                        <OverviewRow
                            label="کارمندان خرید"
                            value={employees.length}
                        />

                        <OverviewRow
                            label="کارمندان فعال"
                            value={activeEmployees}
                        />

                        <OverviewRow
                            label="فایل‌های ثبت شده"
                            value={attachments.length}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function OverviewRow({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
            <span className="text-[10px] font-semibold text-gray-400">
                {label}
            </span>

            <span className="rounded-xl bg-indigo-500/10 px-2.5 py-1 text-[10px] font-extrabold text-indigo-500">
                {value}
            </span>
        </div>
    );
}