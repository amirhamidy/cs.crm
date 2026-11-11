"use client"

import type { DepartmentSelectProps } from "@/types/department"

export default function DepartmentSelect({
    departments,
    value,
    onChange,
    loading = false,
    disabled = false,
}: DepartmentSelectProps) {
    return (
        <div className="space-y-2">
            <label className="block text-sm text-white/70">دپارتمان</label>
            <select
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
                disabled={disabled || loading}
                className="h-14 w-full rounded-4xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <option value="" className="bg-slate-900 text-white">
                    {loading ? "در حال دریافت دپارتمان‌ها..." : "یک دپارتمان انتخاب کن"}
                </option>
                {departments.map((department) => (
                    <option
                        key={department.id}
                        value={department.id}
                        className="bg-slate-900 text-white"
                    >
                        {department.name}
                    </option>
                ))}
            </select>
        </div>
    )
}
