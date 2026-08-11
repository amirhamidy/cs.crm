"use client"

import TaskCard from "./TaskCard"
import type { TaskListProps } from "@/types/task"

export default function TaskList({
    tasks,
    onEdit,
    onDelete,
    loading = false,
    deletingTaskId = null,
}: TaskListProps) {
    if (loading) {
        return (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-center text-sm text-white/60">
                در حال دریافت تسک‌ها...
            </div>
        )
    }

    if (tasks.length === 0) {
        return (
            <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/70">
                هنوز تسکی ثبت نشده
            </div>
        )
    }

    return (
        <div className="grid gap-3">
            {tasks.map((task) => (
                <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    deleting={deletingTaskId === task.id}
                />
            ))}
        </div>
    )
}
