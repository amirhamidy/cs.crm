"use client";

import { useMemo, useState } from "react";
import { PackageSearch, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { ApiOrderTask } from "@/types/warehouse";
import WarehouseEmployeeOrderTaskCard from "./WarehouseEmployeeOrderTaskCard";
import { matchesSearch } from "@/utils/warehouseEmployee";

interface WarehouseEmployeeOrderTasksProps {
    orderTasks: ApiOrderTask[];
    isStaff: boolean;
    canChangeStatus?: boolean;
    onUpdate: (orderTask: ApiOrderTask) => void;
}

export default function WarehouseEmployeeOrderTasks({
    orderTasks,
    isStaff,
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
                <div>
                    <h2
                        className="flex items-center gap-2 text-base font-bold"
                        style={{ color: textColor }}
                    >
                        <PackageSearch className="h-5 w-5 text-indigo-400" />
                        سفارش‌های انبار
                    </h2>

                    <p
                        className="mt-1 text-xs"
                        style={{ color: mutedText }}
                    >
                        لیست سفارش‌های ثبت‌شده برای انبار
                    </p>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search
                        className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                        style={{ color: mutedText }}
                    />

                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="جستجو در سفارش‌ها..."
                        className="h-11 w-full rounded-xl border pr-10 pl-3 text-sm outline-none"
                        style={{
                            borderColor: isDark
                                ? "rgba(255,255,255,0.07)"
                                : "rgba(15,23,42,0.07)",
                            background: isDark
                                ? "rgba(255,255,255,0.03)"
                                : "rgba(15,23,42,0.03)",
                            color: textColor,
                        }}
                    />
                </div>
            </div>

            {filtered.length ? (
                <div className="grid gap-3">
                    {filtered.map((task, index) => (
                        <WarehouseEmployeeOrderTaskCard
                            key={task.id}
                            orderTask={task}
                            index={index}
                            isStaff={isStaff}
                            canChangeStatus={canChangeStatus}
                            onUpdate={onUpdate}
                        />
                    ))}
                </div>
            ) : (
                <div
                    className="rounded-2xl border border-dashed px-6 py-14 text-center"
                    style={{
                        borderColor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(15,23,42,0.08)",
                        background: isDark ? "#0f172a" : "#f8fafc",
                    }}
                >
                    <PackageSearch
                        className="mx-auto h-9 w-9"
                        style={{ color: mutedText }}
                    />

                    <p
                        className="mt-3 text-sm font-medium"
                        style={{
                            color: isDark
                                ? "rgba(255,255,255,0.5)"
                                : "#94a3b8",
                        }}
                    >
                        سفارشی پیدا نشد
                    </p>
                </div>
            )}
        </section>
    );
}
