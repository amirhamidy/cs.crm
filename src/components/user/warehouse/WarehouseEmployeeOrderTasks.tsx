"use client";

import { useMemo, useState } from "react";
import { PackageSearch, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { ApiOrderTask, ApiProduct } from "@/types/warehouse";
import WarehouseEmployeeOrderTaskCard from "./WarehouseEmployeeOrderTaskCard";
import { matchesSearch } from "@/utils/warehouseEmployee";

interface WarehouseEmployeeOrderTasksProps {
    orderTasks: ApiOrderTask[];
    products?: ApiProduct[];
    isStaff: boolean;
    staffId: number | string | null;
    canChangeStatus?: boolean;
    onUpdate: (orderTask: ApiOrderTask) => void;
}

export default function WarehouseEmployeeOrderTasks({
    orderTasks,
    products = [],
    isStaff,
    staffId,
    canChangeStatus = false,
    onUpdate,
}: WarehouseEmployeeOrderTasksProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [search, setSearch] = useState("");

    const filtered = useMemo(
        () =>
            orderTasks.filter((task) =>
                matchesSearch(
                    [
                        task.id,
                        task.title,
                        task.status,
                        task.note,
                        task.created_by?.username,
                        task.performed_by?.full_name,
                        task.department?.name,
                        task.customer?.full_name,
                    ],
                    search
                )
            ),
        [orderTasks, search]
    );

    const textColor = isDark ? "#ffffff" : "#1e293b";
    const mutedText = isDark ? "rgba(255,255,255,0.4)" : "#94a3b8";

    return (
        <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,0.14)"
                                : "rgba(99,102,241,0.08)",
                        }}
                    >
                        <PackageSearch size={18} className="text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                            سفارش‌های انبار
                        </h2>
                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
                            لیست سفارش‌های ثبت‌شده برای انبار
                        </p>
                    </div>
                </div>

                <div className="relative w-full sm:w-80">
                    <Search
                        className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                        size={16}
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="جستجو در سفارش‌ها..."
                        className="h-11 w-full rounded-2xl border border-gray-100 bg-gray-50 pr-10 pl-4 text-[13px] font-bold text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-500/50 dark:focus:bg-white/[0.05]"
                    />
                </div>
            </div>

            {filtered.length ? (
                <div className="grid gap-3">
                    {filtered.map((task, index) => (
                        <WarehouseEmployeeOrderTaskCard
                            key={task.id}
                            orderTask={task}
                            products={products}
                            index={index}
                            isStaff={isStaff}
                            staffId={staffId}
                            canChangeStatus={canChangeStatus}
                            onUpdate={onUpdate}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 px-6 py-16 dark:border-white/[0.08]">
                    <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl"
                        style={{
                            background: isDark
                                ? "rgba(148,163,184,0.1)"
                                : "rgba(148,163,184,0.08)",
                        }}
                    >
                        <PackageSearch
                            size={24}
                            className="text-gray-400 dark:text-gray-500"
                        />
                    </div>
                    <p className="mt-4 text-[13px] font-bold text-gray-900 dark:text-white">
                        سفارشی یافت نشد
                    </p>
                    <p className="mt-1 text-[11.5px] text-gray-500 dark:text-gray-400">
                        {search
                            ? "نتیجه‌ای برای عبارت جستجو شده وجود ندارد"
                            : "هنوز سفارشی در سیستم ثبت نشده است"}
                    </p>
                </div>
            )}
        </section>
    );
}