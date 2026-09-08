"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { ApiWarehouseTask } from "@/types/warehouse";
import WarehouseEmployeeTaskCard from "./WarehouseEmployeeTaskCard";
import { getTaskProductName, matchesSearch } from "@/utils/warehouseEmployee";

interface Props {
    tasks: ApiWarehouseTask[];
    onSelectTask: (task: ApiWarehouseTask) => void;
}

export default function WarehouseEmployeeTasks({ tasks, onSelectTask }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [search, setSearch] = useState("");

    const filtered = useMemo(
        () =>
            tasks.filter((task) => {
                const data = task as unknown as Record<string, unknown>;
                return matchesSearch(
                    [data.id, data.status, data.note, data.description, data.purchase_task_id, data.quality_control_id, data.order_task_id, getTaskProductName(task)],
                    search
                );
            }),
        [tasks, search]
    );

    const textColor = isDark ? "#ffffff" : "#1e293b";
    const mutedText = isDark ? "rgba(255,255,255,0.4)" : "#94a3b8";

    return (
        <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="flex items-center gap-2 text-base font-bold" style={{ color: textColor }}>
                        <ClipboardList className="h-5 w-5 text-indigo-400" />
                        وظایف من
                    </h2>
                    <p className="mt-1 text-xs" style={{ color: mutedText }}>
                        وظایفی که به حساب شما یا سمت انبار اختصاص داده شده‌اند
                    </p>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: mutedText }} />
                    <input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                        }}
                        placeholder="جستجو در وظایف..."
                        className="h-11 w-full rounded-xl border pr-10 pl-3 text-sm outline-none"
                        style={{
                            borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)",
                            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.03)",
                            color: textColor,
                        }}
                    />
                </div>
            </div>

            {filtered.length ? (
                <div className="grid gap-3">
                    {filtered.map((task) => (
                        <WarehouseEmployeeTaskCard
                            key={String((task as unknown as Record<string, unknown>).id)}
                            task={task}
                            onSelect={onSelectTask}
                        />
                    ))}
                </div>
            ) : (
                <div
                    className="rounded-2xl border border-dashed px-6 py-14 text-center"
                    style={{
                        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
                        background: isDark ? "#0f172a" : "#f8fafc",
                    }}
                >
                    <ClipboardList className="mx-auto h-9 w-9" style={{ color: mutedText }} />
                    <p className="mt-3 text-sm font-medium" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#94a3b8" }}>
                        وظیفه‌ای پیدا نشد
                    </p>
                </div>
            )}
        </section>
    );
}