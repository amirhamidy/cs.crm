"use client";

import TaskCard, { ApiTask } from "@/components/user/tasks/TaskCard";
import axiosInstance from "@/lib/axiosInstance";
import { useEffect, useState } from "react";

export default function TaskList({ initialTasks = [] }: { initialTasks?: ApiTask[] }) {
    const [tasks, setTasks] = useState<ApiTask[]>(initialTasks);
    const [loading, setLoading] = useState(initialTasks.length === 0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialTasks.length > 0) return;
        const fetchTasks = async () => {
            try {
                const res = await axiosInstance.get("/tasks/api/v1/tasks/");
                const data: ApiTask[] = Array.isArray(res.data) ? res.data : res.data.results ?? [];
                setTasks(data);
            } catch {
                setError("دریافت تسک‌ها با خطا مواجه شد");
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, []);

    if (loading)
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
                ))}
            </div>
        );

    if (error) return <div className="text-center text-destructive py-12">{error}</div>;

    if (tasks.length === 0)
        return <div className="text-center text-muted-foreground py-12">تسکی وجود ندارد</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tasks.map((task, index) => (
                <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    onUpdated={(updated) =>
                        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
                    }
                />
            ))}
        </div>
    );
}
