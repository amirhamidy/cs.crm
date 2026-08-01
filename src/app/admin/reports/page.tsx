"use client";

import { TrendingUp, TrendingDown, FileText, Download } from "lucide-react";
import SalesChart from "@/components/charts/SalesChart";
import VisitsChart from "@/components/charts/VisitsChart";

const summaryData = [
    { label: "فروش این ماه", value: "۸۴,۵۰۰,۰۰۰ ت", trend: "up", percent: "۱۴.۲٪" },
    { label: "فروش ماه قبل", value: "۷۳,۹۰۰,۰۰۰ ت", trend: "down", percent: "۳.۱٪" },
    { label: "بازدید امروز", value: "۲,۱۴۵", trend: "up", percent: "۹.۸٪" },
    { label: "نرخ تبدیل", value: "۳.۶٪", trend: "up", percent: "۱.۲٪" },
];

export default function ReportsPage() {
    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">گزارشات</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">آمار و عملکرد کلی سیستم</p>
                </div>
                <button className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <Download size={15} />
                    خروجی PDF
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {summaryData.map((item, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                            <span className={`flex items-center gap-0.5 text-xs font-medium ${item.trend === "up" ? "text-green-500" : "text-red-500"
                                }`}>
                                {item.trend === "up" ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                                {item.percent}
                            </span>
                        </div>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SalesChart />
                <VisitsChart />
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium text-sm">
                        <FileText size={16} />
                        آخرین گزارش‌ها
                    </div>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {["گزارش فروش هفتگی", "گزارش بازدید ماهانه", "گزارش کاربران جدید", "گزارش محصولات پرفروش"].map((name, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                    <FileText size={14} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
                            </div>
                            <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">دانلود</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
