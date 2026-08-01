"use client"

import { useState } from "react"
import { ClipboardList, Clock, CheckCircle2, XCircle, ChevronRight, Search, Filter } from "lucide-react"

const mockProcesses = [
    { id: 1, title: "درخواست مرخصی سالانه", status: "pending", date: "۱۴۰۵/۰۵/۰۱", priority: "normal" },
    { id: 2, title: "تایید قرارداد پروژه الف", status: "approved", date: "۱۴۰۵/۰۴/۲۸", priority: "high" },
    { id: 3, title: "بررسی گزارش ماهانه", status: "rejected", date: "۱۴۰۵/۰۴/۲۵", priority: "low" },
    { id: 4, title: "درخواست تجهیزات جدید", status: "pending", date: "۱۴۰۵/۰۴/۲۰", priority: "high" },
    { id: 5, title: "ارزیابی عملکرد فصلی", status: "approved", date: "۱۴۰۵/۰۴/۱۵", priority: "normal" },
    { id: 6, title: "هماهنگی جلسه تیم", status: "pending", date: "۱۴۰۵/۰۴/۱۰", priority: "low" },
]

const statusMap = {
    pending: { label: "در انتظار", color: "text-yellow-400 bg-yellow-400/10", icon: Clock },
    approved: { label: "تایید شده", color: "text-green-400 bg-green-400/10", icon: CheckCircle2 },
    rejected: { label: "رد شده", color: "text-red-400 bg-red-400/10", icon: XCircle },
}

const priorityMap = {
    high: { label: "بالا", color: "text-red-400" },
    normal: { label: "متوسط", color: "text-yellow-400" },
    low: { label: "پایین", color: "text-blue-400" },
}

export default function ProcessesPage() {
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState("all")

    const filtered = mockProcesses.filter((p) => {
        const matchSearch = p.title.includes(search)
        const matchFilter = filter === "all" || p.status === filter
        return matchSearch && matchFilter
    })

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10">
                    <ClipboardList size={22} className="text-blue-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">فرآیندها</h1>
                    <p className="text-sm text-zinc-400">پیگیری درخواست‌ها و فرآیندهای جاری</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "در انتظار", count: mockProcesses.filter((p) => p.status === "pending").length, color: "text-yellow-400", bg: "bg-yellow-400/10" },
                    { label: "تایید شده", count: mockProcesses.filter((p) => p.status === "approved").length, color: "text-green-400", bg: "bg-green-400/10" },
                    { label: "رد شده", count: mockProcesses.filter((p) => p.status === "rejected").length, color: "text-red-400", bg: "bg-red-400/10" },
                ].map((item) => (
                    <div key={item.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
                        <div className={`text-3xl font-bold ${item.color}`}>{item.count}</div>
                        <div className={`text-sm ${item.color} ${item.bg} px-2 py-1 rounded-lg`}>{item.label}</div>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="جستجوی فرآیند..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pr-9 pl-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={15} className="text-zinc-500" />
                    {["all", "pending", "approved", "rejected"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-2 rounded-xl text-xs transition-colors ${filter === f ? "bg-blue-500 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600"
                                }`}
                        >
                            {f === "all" ? "همه" : statusMap[f as keyof typeof statusMap].label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="text-center text-zinc-500 py-12">فرآیندی یافت نشد</div>
                ) : (
                    filtered.map((process) => {
                        const status = statusMap[process.status as keyof typeof statusMap]
                        const priority = priorityMap[process.priority as keyof typeof priorityMap]
                        const Icon = status.icon
                        return (
                            <div
                                key={process.id}
                                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 hover:border-zinc-600 transition-colors cursor-pointer group"
                            >
                                <div className={`p-2 rounded-xl ${status.color}`}>
                                    <Icon size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-white font-medium">{process.title}</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">{process.date}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-medium ${priority.color}`}>{priority.label}</span>
                                    <span className={`text-xs px-2 py-1 rounded-lg ${status.color}`}>{status.label}</span>
                                </div>
                                <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
