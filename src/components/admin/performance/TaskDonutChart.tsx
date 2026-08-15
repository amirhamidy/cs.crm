// src/components/admin/performance/TaskDonutChart.tsx
"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { TaskStatusOverview } from "@/hooks/useAnalytics";

const STATUS_CONFIG = [
    { key: "sold" as const, label: "فروش", color: "#34d399" },
    { key: "completed" as const, label: "تکمیل‌شده", color: "#818cf8" },
    { key: "in_progress" as const, label: "در جریان", color: "#fbbf24" },
    { key: "cancelled" as const, label: "لغو‌شده", color: "#f87171" },
];

export default function TaskDonutChart({
    data,
    loading,
}: {
    data: TaskStatusOverview;
    loading: boolean;
}) {
    const chartData = STATUS_CONFIG.map((s) => ({ name: s.label, value: data[s.key], color: s.color }));

    return (
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5" dir="rtl">
            <p className="text-sm font-medium text-zinc-300 mb-4">وضعیت تسک‌ها</p>
            {loading ? (
                <div className="h-52 rounded-xl bg-white/5 animate-pulse" />
            ) : (
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                            {chartData.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, fontSize: 12 }}
                            itemStyle={{ color: "#a1a1aa" }}
                        />
                        <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "#a1a1aa", fontSize: 11 }}>{v}</span>} />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
