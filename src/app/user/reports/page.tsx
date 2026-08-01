"use client"

import { useState } from "react"
import { BarChart2, Download, TrendingUp, TrendingDown, Calendar, FileText } from "lucide-react"

const summaryStats = [
    { label: "وظایف انجام‌شده", value: "۴۸", change: "+۱۲%", up: true },
    { label: "فرآیندهای تایید‌شده", value: "۱۷", change: "+۵%", up: true },
    { label: "درخواست‌های رد‌شده", value: "۳", change: "-۲۵%", up: false },
    { label: "ساعت کاری", value: "۱۶۴", change: "+۸%", up: true },
]

const reportList = [
    { id: 1, title: "گزارش عملکرد تیر ۱۴۰۵", date: "۱۴۰۵/۰۵/۰۱", type: "ماهانه", size: "۲.۴ MB" },
    { id: 2, title: "گزارش وظایف هفته سوم", date: "۱۴۰۵/۰۴/۲۱", type: "هفتگی", size: "۸۴۰ KB" },
    { id: 3, title: "خلاصه فرآیندهای خرداد", date: "۱۴۰۵/۰۴/۰۱", type: "ماهانه", size: "۱.۸ MB" },
    { id: 4, title: "گزارش هفته دوم تیر", date: "۱۴۰۵/۰۴/۱۴", type: "هفتگی", size: "۶۲۰ KB" },
]

const activityData = [65, 40, 80, 55, 90, 70, 45, 85, 60, 75, 50, 95]
const months = ["فر", "ار", "خر", "تیر", "مر", "شه", "مه", "آب", "آذ", "دی", "به", "اس"]

export default function ReportsPage() {
    const [activeType, setActiveType] = useState("همه")
    const max = Math.max(...activityData)

    const filtered = reportList.filter(
        (r) => activeType === "همه" || r.type === activeType
    )

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10">
                    <BarChart2 size={22} className="text-emerald-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">گزارشات</h1>
                    <p className="text-sm text-zinc-400">آمار و گزارش‌های عملکردی</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {summaryStats.map((stat) => (
                    <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
                        <p className="text-xs text-zinc-500">{stat.label}</p>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <div className={`flex items-center gap-1 text-xs ${stat.up ? "text-green-400" : "text-red-400"}`}>
                            {stat.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                            {stat.change} نسبت به ماه قبل
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">فعالیت سالانه</h2>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Calendar size={13} />
                        ۱۴۰۵
                    </div>
                </div>
                <div className="flex items-end gap-2 h-28">
                    {activityData.map((val, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div
                                className="w-full bg-emerald-500/80 hover:bg-emerald-400 rounded-sm transition-colors"
                                style={{ height: `${(val / max) * 100}%` }}
                            />
                            <span className="text-[10px] text-zinc-600">{months[i]}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">گزارش‌های قابل دانلود</h2>
                    <div className="flex gap-2">
                        {["همه", "ماهانه", "هفتگی"].map((t) => (
                            <button
                                key={t}
                                onClick={() => setActiveType(t)}
                                className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${activeType === t
                                        ? "bg-emerald-500 text-white"
                                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {filtered.map((report) => (
                    <div
                        key={report.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 hover:border-zinc-600 transition-colors"
                    >
                        <div className="p-2 rounded-xl bg-emerald-500/10">
                            <FileText size={18} className="text-emerald-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-white font-medium">{report.title}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{report.date} · {report.size}</p>
                        </div>
                        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-lg">{report.type}</span>
                        <button className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-2 rounded-xl">
                            <Download size={13} />
                            دانلود
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
