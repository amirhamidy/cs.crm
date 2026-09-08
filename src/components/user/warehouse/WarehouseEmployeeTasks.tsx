"use client";

import { useMemo, useState } from "react";
import {
    ClipboardList,
    Search,
} from "lucide-react";
import { ApiWarehouseTask } from "@/types/warehouse";
import WarehouseEmployeeTaskCard from "./WarehouseEmployeeTaskCard";
import {
    getTaskProductName,
    matchesSearch,
    paginate,
    PAGE_SIZE,
} from "@/utils/warehouseEmployee";

interface Props {
    tasks: ApiWarehouseTask[];
    onSelectTask: (task: ApiWarehouseTask) => void;
}

export default function WarehouseEmployeeTasks({
    tasks,
    onSelectTask,
}: Props) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const filtered = useMemo(
        () =>
            tasks.filter((task) => {
                const data =
                    task as unknown as Record<string, unknown>;

                return matchesSearch(
                    [
                        data.id,
                        data.status,
                        data.note,
                        data.description,
                        data.purchase_task_id,
                        data.quality_control_id,
                        data.order_task_id,
                        getTaskProductName(task),
                    ],
                    search
                );
            }),
        [tasks, search]
    );

    const result = paginate(filtered, page, PAGE_SIZE);

    return (
        <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="flex items-center gap-2 text-base font-bold text-white">
                        <ClipboardList className="h-5 w-5 text-orange-300" />
                        وظایف من
                    </h2>
                    <p className="mt-1 text-xs text-white/35">
                        وظایفی که به حساب شما یا سمت انبار اختصاص داده شده‌اند
                    </p>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                    <input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                        placeholder="جستجو در وظایف..."
                        className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] pr-10 pl-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-400/30"
                    />
                </div>
            </div>

            {result.items.length ? (
                <div className="grid gap-3">
                    {result.items.map((task) => (
                        <WarehouseEmployeeTaskCard
                            key={String(
                                (task as unknown as Record<string, unknown>)
                                    .id
                            )}
                            task={task}
                            onSelect={onSelectTask}
                        />
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#101114] px-6 py-14 text-center">
                    <ClipboardList className="mx-auto h-9 w-9 text-white/15" />
                    <p className="mt-3 text-sm font-medium text-white/50">
                        وظیفه‌ای پیدا نشد
                    </p>
                </div>
            )}

            {result.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    {Array.from(
                        { length: result.totalPages },
                        (_, index) => index + 1
                    ).map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => setPage(item)}
                            className={`h-9 min-w-9 rounded-lg px-2 text-xs transition ${item === result.page
                                    ? "bg-white text-black"
                                    : "bg-white/[0.04] text-white/45 hover:bg-white/[0.08] hover:text-white"
                                }`}
                        >
                            {item.toLocaleString("fa-IR")}
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}