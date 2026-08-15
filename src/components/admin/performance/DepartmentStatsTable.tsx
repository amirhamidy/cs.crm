// src/components/admin/performance/DepartmentStatsTable.tsx
"use client";
import { motion } from "framer-motion";
import type { DepartmentStatItem, DepartmentConversionItem } from "@/hooks/useAnalytics";

interface Props {
    stats: DepartmentStatItem[];
    conversion: DepartmentConversionItem[];
    loading: boolean;
}

export default function DepartmentStatsTable({ stats, conversion, loading }: Props) {
    const convMap = Object.fromEntries(conversion.map((c) => [c.department_name, c.conversion]));

    return (
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5" dir="rtl">
            <p className="text-sm font-medium text-zinc-300 mb-4">آمار دپارتمان‌ها</p>
            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-zinc-500 text-xs border-b border-white/5">
                                <th className="pb-2 text-right font-medium">دپارتمان</th>
                                <th className="pb-2 text-right font-medium">فروش</th>
                                <th className="pb-2 text-right font-medium">لغو</th>
                                <th className="pb-2 text-right font-medium">تکمیل</th>
                                <th className="pb-2 text-right font-medium">نرخ تبدیل</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.map((dept, i) => {
                                const conv = convMap[dept.department_name] ?? 0;
                                return (
                                    <motion.tr
                                        key={dept.department_name}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="border-b border-white/5 last:border-0"
                                    >
                                        <td className="py-2.5 text-zinc-200 font-medium">{dept.department_name}</td>
                                        <td className="py-2.5 text-emerald-400 font-semibold">{dept.sold}</td>
                                        <td className="py-2.5 text-rose-400">{dept.cancelled}</td>
                                        <td className="py-2.5 text-indigo-400">{dept.completed}</td>
                                        <td className="py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden max-w-16">
                                                    <div
                                                        className="h-full rounded-full bg-emerald-500 transition-all"
                                                        style={{ width: `${conv}%` }}
                                                    />
                                                </div>
                                                <span className="text-zinc-300 text-xs tabular-nums">{conv}%</span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                            {stats.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-zinc-600 text-xs">
                                        داده‌ای یافت نشد
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
