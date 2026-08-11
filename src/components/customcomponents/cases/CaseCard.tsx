"use client"

import { FolderKanban, Pencil, Trash2 } from "lucide-react"
import type { CaseCardProps } from "@/types/case"

export default function CaseCard({
  caseItem,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  deleting = false,
}: CaseCardProps) {
  return (
    <div
      className={`rounded-[28px] border p-4 transition ${
        isSelected
          ? "border-blue-500/50 bg-blue-500/10"
          : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onSelect?.(caseItem.id)}
          className="flex min-w-0 flex-1 items-start gap-3 text-right"
        >
          <div
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isSelected ? "bg-blue-500/20 text-blue-300" : "bg-white/10 text-white/70"
            }`}
          >
            <FolderKanban size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium text-white">{caseItem.title}</h3>
            <p className="mt-1 line-clamp-2 text-xs leading-6 text-white/55">
              {caseItem.description || "بدون توضیح"}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit?.(caseItem)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(caseItem.id)}
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
