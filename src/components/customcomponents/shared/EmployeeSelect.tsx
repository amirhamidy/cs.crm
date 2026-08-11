"use client"

import type { EmployeeSelectProps } from "@/types/employee"

const getEmployeeLabel = (employee: {
    full_name?: string
    first_name?: string
    last_name?: string
    user_detail?: {
        full_name?: string
        first_name?: string
        last_name?: string
    }
}) => {
    const directName =
        employee.full_name ||
        [employee.first_name, employee.last_name].filter(Boolean).join(" ").trim()

    if (directName) return directName

    const nestedName =
        employee.user_detail?.full_name ||
        [employee.user_detail?.first_name, employee.user_detail?.last_name]
            .filter(Boolean)
            .join(" ")
            .trim()

    if (nestedName) return nestedName

    return "کارمند بدون نام"
}

export default function EmployeeSelect({
    employees,
    value,
    onChange,
    loading = false,
    disabled = false,
}: EmployeeSelectProps) {
    return (
        <div className="space-y-2">
            <label className="block text-sm text-white/70">کارمند مسئول</label>
            <select
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
                disabled={disabled || loading}
                className="h-14 w-full rounded-4xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <option value="" className="bg-slate-900 text-white">
                    {loading ? "در حال دریافت کارمندها..." : "یک کارمند انتخاب کن"}
                </option>
                {employees.map((employee) => (
                    <option
                        key={employee.id}
                        value={employee.id}
                        className="bg-slate-900 text-white"
                    >
                        {getEmployeeLabel(employee)}
                    </option>
                ))}
            </select>
        </div>
    )
}
