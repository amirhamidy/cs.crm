"use client"

import type { CustomerSelectProps } from "@/types/customer"

const getCustomerLabel = (customer: {
    full_name?: string
    first_name?: string
    last_name?: string
    company_name?: string
    phone_number?: string
}) => {
    const fullName =
        customer.full_name ||
        [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim()

    if (fullName) return fullName
    if (customer.company_name) return customer.company_name
    if (customer.phone_number) return customer.phone_number
    return "مشتری بدون نام"
}

export default function CustomerSelect({
    customers,
    value,
    onChange,
    loading = false,
    disabled = false,
}: CustomerSelectProps) {
    return (
        <div className="space-y-2">
            <label className="block text-sm text-white/70">مشتری</label>
            <select
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
                disabled={disabled || loading}
                className="h-14 w-full rounded-4xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <option value="" className="bg-slate-900 text-white">
                    {loading ? "در حال دریافت مشتری‌ها..." : "یک مشتری انتخاب کن"}
                </option>
                {customers.map((customer) => (
                    <option
                        key={customer.id}
                        value={customer.id}
                        className="bg-slate-900 text-white"
                    >
                        {getCustomerLabel(customer)}
                    </option>
                ))}
            </select>
        </div>
    )
}
