"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock3, ListTodo, XCircle } from "lucide-react";
import { useEmployeePerformance } from "@/hooks/useEmployeePerformance";

function Skeleton() {
    return (
        <div
            dir="rtl"
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
            <div className="mb-5 flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
                    <div className="h-3 w-20 animate-pulse rounded-md bg-muted" />
                </div>

                <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2">
                <div className="h-24 animate-pulse rounded-xl bg-muted" />
                <div className="h-24 animate-pulse rounded-xl bg-muted" />
            </div>

            <div className="space-y-4">
                <div className="h-5 animate-pulse rounded bg-muted" />
                <div className="h-5 animate-pulse rounded bg-muted" />
                <div className="h-5 animate-pulse rounded bg-muted" />
            </div>
        </div>
    );
}

function PerformanceRow({
    icon,
    label,
    value,
    total,
    className,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    total: number;
    className: string;
}) {
    const percent = total
        ? Math.round((value / total) * 100)
        : 0;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <span className={className}>{icon}</span>
                    <span>{label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                    <span className="font-semibold tabular-nums text-foreground">
                        {value.toLocaleString("fa-IR")}
                    </span>

                    <span className="text-[10px] text-muted-foreground">
                        ({percent.toLocaleString("fa-IR")}٪)
                    </span>
                </div>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{
                        duration: 0.55,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`h-full rounded-full ${className.replace(
                        "text-",
                        "bg-",
                    )}`}
                />
            </div>
        </div>
    );
}

export default function EmployeePerformanceCard() {
    const {
        employee,
        performance,
        loading,
        error,
    } = useEmployeePerformance("weekly");

    if (loading) {
        return <Skeleton />;
    }

    if (error) {
        return (
            <div
                dir="rtl"
                className="flex min-h-[220px] items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-center text-xs text-destructive"
            >
                {error}
            </div>
        );
    }

    return (
        <motion.div
            dir="rtl"
            initial={{
                opacity: 0,
                y: 8,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            transition={{
                duration: 0.3,
            }}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
            <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <ListTodo size={16} />
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-foreground">
                                عملکرد من
                            </h3>

                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                وضعیت تسک‌های ۷ روز اخیر
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                            کل تسک‌ها
                        </span>

                        <ListTodo
                            size={15}
                            className="text-muted-foreground"
                        />
                    </div>

                    <div className="text-2xl font-bold tracking-tight text-foreground">
                        {performance.total.toLocaleString("fa-IR")}
                    </div>

                    <p className="mt-1 text-[10px] text-muted-foreground">
                        تسک اختصاص داده‌شده
                    </p>
                </div>

                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                            درصد انجام
                        </span>

                        <CheckCircle2
                            size={15}
                            className="text-emerald-500"
                        />
                    </div>

                    <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                        {performance.completionRate.toLocaleString("fa-IR")}٪
                    </div>

                    <p className="mt-1 text-[10px] text-muted-foreground">
                        تسک‌های تکمیل‌شده
                    </p>
                </div>
            </div>

            <div className="mb-5 flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2.5">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                        <CheckCircle2 size={14} />
                    </div>

                    <div>
                        <p className="text-[11px] font-medium text-foreground">
                            انجام‌شده
                        </p>

                        <p className="text-[10px] text-muted-foreground">
                            {performance.completed.toLocaleString("fa-IR")} تسک
                        </p>
                    </div>
                </div>

                <div className="rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {performance.completionRate.toLocaleString("fa-IR")}٪
                </div>
            </div>

            <div className="space-y-4">
                <PerformanceRow
                    icon={<CheckCircle2 size={14} />}
                    label="انجام‌شده"
                    value={performance.completed}
                    total={performance.total}
                    className="text-emerald-500"
                />

                <PerformanceRow
                    icon={<Clock3 size={14} />}
                    label="در حال انجام"
                    value={performance.inProgress}
                    total={performance.total}
                    className="text-blue-500"
                />

                <PerformanceRow
                    icon={<XCircle size={14} />}
                    label="لغوشده"
                    value={performance.cancelled}
                    total={performance.total}
                    className="text-red-500"
                />
            </div>

            {performance.total === 0 && (
                <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-[11px] text-muted-foreground">
                    در این بازه هنوز تسکی برای شما ثبت نشده است.
                </div>
            )}

            {employee && (
                <div className="mt-5 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-[10px] text-muted-foreground">
                        عملکرد کارمند
                    </span>

                    <span className="text-[11px] font-medium text-foreground">
                        {employee.full_name || employee.username}
                    </span>
                </div>
            )}
        </motion.div>
    );
}