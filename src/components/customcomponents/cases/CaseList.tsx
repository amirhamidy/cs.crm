"use client"

import { FolderSearch, Plus } from "lucide-react"
import CaseCard from "./CaseCard"
import type { CaseItem, CaseListProps } from "@/types/case"

export default function CaseList({
    cases,
    selectedCaseId,
    onSelect,
    onCreate,
    onEdit,
    onDelete,
    loading = false,
    deletingCaseId = null,
}: CaseListProps) {
    if (loading) {
        return (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-center text-sm text-white/60">
                در حال دریافت پرونده‌ها...
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white/75">پرونده‌ها</h3>
                <button
                    type="button"
                    onClick={onCreate}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white transition hover:bg-white/10"
                >
                    <Plus size={16} />
                    <span>پرونده جدید</span>
                </button>
            </div>

            {cases.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/45">
                        <FolderSearch size={18} />
                    </div>
                    <p className="text-sm text-white/70">برای این مشتری پرونده‌ای ثبت نشده</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {cases.map((caseItem: CaseItem) => (
                        <CaseCard
                            key={caseItem.id}
                            caseItem={caseItem}
                            isSelected={selectedCaseId === caseItem.id}
                            onSelect={onSelect}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            deleting={deletingCaseId === caseItem.id}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
