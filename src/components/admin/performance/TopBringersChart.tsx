"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { BringerStat } from "@/hooks/useAnalytics";
import { ChartCard, COLORS, Tip, fa, useDark } from "./chartKit";

const PAL = [COLORS.purple, COLORS.green, COLORS.blue, COLORS.red, "#c4b5fd", "#86efac", "#93c5fd", "#fda4af"];

export default function TopBringersChart({ items, loading }: { items: BringerStat[]; loading: boolean }) {
    const dark = useDark();
    const data = items.slice(0, 8).map((b) => ({ name: b.full_name, count: b.count }));
    const sum = data.reduce((s, d) => s + d.count, 0);
    return (
        <ChartCard
            title="مشتری‌آورترین افراد"
            hint="سهم هر نفر از مشتریانی که وارد سیستم کرده؛ عدد وسط مجموع مشتریان است."
            loading={loading}
            empty={!data.length}
        >
            <ResponsiveContainer>
                <PieChart>
                    <Tooltip content={<Tip dark={dark} names={{ count: "مشتری" }} />} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Pie data={data} dataKey="count" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={3} cornerRadius={6} stroke="none">
                        {data.map((_, i) => <Cell key={i} fill={PAL[i % PAL.length]} />)}
                    </Pie>
                    <text x="50%" y="46%" textAnchor="middle" className="fill-gray-900 dark:fill-white" fontSize={22} fontWeight={800}>{fa(sum)}</text>
                    <text x="50%" y="55%" textAnchor="middle" fill="#9ca3af" fontSize={10}>مشتری</text>
                </PieChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
