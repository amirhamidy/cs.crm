// src/components/admin/performance/SoldTrendChart.tsx
"use client";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import type { SoldTrendPoint } from "@/hooks/useAnalytics";

export default function SoldTrendChart({
    data,
    loading,
}: {
    data: SoldTrendPoint[];
    loading: boolean;
}) {
    return (
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5" dir="rtl">
            <p className="text-sm font-medium text-zinc-300 mb-4">روند فروش</p>
            {loading ? (
                <div className="h-52 rounded-xl bg-white/5 animate-pulse" />
            ) : (
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="soldGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" />
                        <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip
                            contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, fontSize: 12 }}
                            labelStyle={{ color: "#a1a1aa" }}
                            itemStyle={{ color: "#818cf8" }}
                        />
                        <Area type="monotone" dataKey="sold" stroke="#6366f1" strokeWidth={2} fill="url(#soldGrad)" name="فروش" />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
