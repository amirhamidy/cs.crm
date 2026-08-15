// src/components/admin/performance/EmployeeRankingTable.tsx
"use client";
import { motion } from "framer-motion";
import type { EmployeeRankItem } from "@/hooks/useAnalytics";

export default function EmployeeRankingTable({
    data,
    loading,
}: {
    data: EmployeeRankItem[];
    loading: boolean;
}) {
    return (
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5" dir="rtl">
            <p className="text-sm font-medium text-zinc-300 mb-4">رنکینگ کارمندان</p>
            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-zinc-500 text-xs border-b border-white/5">
                                <th className="pb-2 text-right font-medium">#</th>
                                <th className="pb-2 text-right font-medium">نام</th>
                                <th className="pb-2 text-right font-medium">فروش واقعی</th>
                                <th className="pb-2 text-right font-medium">بالقوه</th>
                                <th className="pb-2 text-right font-medium">جمع</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((emp, i) => (
                                <motion.tr
                                    key={emp.username}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="border-b border-white/5 last:border-0"
                                >
                                    <td className="py-2.5 text-zinc-500">{i + 1}</td>
                                    <td className="py-2.5 text-zinc-200 font-medium">{emp.full_name}</td>
                                    <td className="py-2.5">
                                        <span className="text-emerald-400 font-semibold">{emp.actual}</span>
                                    </td>
                                    <td className="py-2.5 text-zinc-400">{emp.potential}</td>
                                    <td className="py-2.5 text-zinc-300">{emp.total}</td>
                                </motion.tr>
                            ))}
                            {data.length === 0 && (
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
