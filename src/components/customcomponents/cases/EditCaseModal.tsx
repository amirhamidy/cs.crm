"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Loader2, X } from "lucide-react"
import axiosInstance from "@/lib/axiosInstance"
import type { CaseFormData, CaseItem, EditCaseModalProps } from "@/types/case"

export default function EditCaseModal({
  isOpen,
  onClose,
  caseItem,
  onSuccess,
}: EditCaseModalProps) {
  const [form, setForm] = useState<CaseFormData>({ title: "", description: "" })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && caseItem) {
      setForm({
        title: caseItem.title || "",
        description: caseItem.description || "",
      })
      setSubmitting(false)
      setError(null)
    }
  }, [isOpen, caseItem])

  const canSubmit = useMemo(() => {
    return Boolean(form.title.trim() && form.description.trim() && caseItem?.id)
  }, [form, caseItem])

  const handleSubmit = async () => {
    if (!caseItem?.id || !canSubmit) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await axiosInstance.patch(
        `/tasks/api/v1/cases/${caseItem.id}/update/`,
        {
          title: form.title.trim(),
          description: form.description.trim(),
        }
      )

      const updatedCase: CaseItem = response.data
      onSuccess(updatedCase)
      onClose()
    } catch {
      setError("خطا در ویرایش پرونده. دوباره امتحان کن.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || !caseItem) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#07111f] p-6 text-white shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">ویرایش پرونده</h2>
            <p className="mt-1 text-sm text-white/55">اطلاعات پرونده را به‌روزرسانی کن</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm text-white/70">عنوان پرونده</label>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="h-14 w-full rounded-4xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-blue-500/50"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-white/70">توضیحات</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={5}
              className="w-full rounded-[28px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none transition focus:border-blue-500/50"
            />
          </div>

          {error && (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-full border border-white/10 px-5 text-sm text-white/80 transition hover:bg-white/5"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            <span>ذخیره تغییرات</span>
          </button>
        </div>
      </div>
    </div>
  )
}
