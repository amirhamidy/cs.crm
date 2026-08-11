"use client"

import { FileText, Pencil, Trash2 } from "lucide-react"
import type { TaskCardProps } from "@/types/task"

export default function TaskCard({
    task,
    onEdit,
    onDelete,
    deleting = false,
}: TaskCardProps) {
    const caseTitle =
        typeof task.case === "object" && task.case !== null ? task.case.title : "بدون پرونده"

    return (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/[0.07]">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70">
                        <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-medium text-white">{task.title}</h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-6 text-white/55">
                            {task.description}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/65">
                                {caseTitle}
                            </span>
                            {task.status && (
                                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] text-blue-200">
                                    {task.status}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onEdit?.(task)}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete?.(task.id)}
                        disabled={deleting}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    )
}
