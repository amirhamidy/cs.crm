"use client";

import { useCallback, useState } from "react";
import TaskCard, { ApiTask } from "@/components/user/tasks/TaskCard";
import { tasksApi } from "@/lib/api";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import Pagination from "@/components/ui/Pagination";
import type { Paginated, SearchParams } from "@/types/pagination";

const PAGE_SIZE = 12;

export default function TaskList({ initialTasks = [] }: { initialTasks?: ApiTask[] }) {
    const [seedTasks, setSeedTasks] = useState<ApiTask[]>(initialTasks);

    const fetchPage = useCallback(
        (params: SearchParams, signal: AbortSignal) =>
            tasksApi.page(params, signal) as unknown as Promise<Paginated<ApiTask>>,
        [],
    );

    const list = usePaginatedList<ApiTask>(fetchPage, {
        pageSize: PAGE_SIZE,
        enabled: initialTasks.length === 0,
    });

    const tasks = initialTasks.length > 0 ? initialTasks : list.data;
    const loading = initialTasks.length === 0 && list.loading;

    if (loading)
        return (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
                ))}
            </div>
        );

    if (list.error) return <div className="py-12 text-center text-destructive">دریافت تسک‌ها با خطا مواجه شد</div>;

    if (tasks.length === 0)
        return <div className="py-12 text-center text-muted-foreground">تسکی وجود ندارد</div>;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {tasks.map((task, index) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        onUpdated={(updated) => {
                            if (initialTasks.length > 0) {
                                setSeedTasks((prev) => prev.map((item) => item.id === updated.id ? updated : item));
                            } else {
                                list.refetch();
                            }
                        }}
                    />
                ))}
            </div>
            {initialTasks.length === 0 && list.totalPages > 1 && (
                <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
            )}
        </div>
    );
}
