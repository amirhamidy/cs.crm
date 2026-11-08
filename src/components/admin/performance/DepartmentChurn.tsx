"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import type { DepartmentStat } from "@/hooks/useAnalytics";
import { ChartCard, COLORS, Tip, axisProps, useDark } from "./chartKit";

const NAMES = { completed: "تکمیل", sold: "فروش", in_progress: "در جریان", cancelled: "لغو", churnRate: "ریزش (٪)" };

export default function DepartmentChurn({ departments, loading }: { departments: DepartmentStat[]; loading: boolean }) {
    const dark = useDark();
    const data = departments.map((d) => ({ ...d, name: d.department_name, churnRate: Math.round(d.churnRate) }));
    return (
        <ChartCard
            title="مسیر تسک‌ها در دپارتمان‌ها"
            hint="هر ستون یک دپارتمان است؛ رنگ‌ها وضعیت تسک‌ها و خط قرمز درصد ریزش را نشان می‌دهد."
            loading={loading}
            empty={!data.length}
        >
            <ResponsiveContainer>
                <ComposedChart data={data} margin={{ left: -10, right: -10 }}>
                    <CartesianGrid vertical={false} stroke="rgba(150,150,150,.12)" />
                    <XAxis dataKey="name" {...axisProps} />
                    <YAxis yAxisId="l" {...axisProps} />
                    <YAxis yAxisId="r" orientation="right" domain={[0, 100]} {...axisProps} />
                    <Tooltip cursor={{ fill: "rgba(150,150,150,.08)" }} content={<Tip dark={dark} names={NAMES} />} />
                    <Legend formatter={(v) => NAMES[v as keyof typeof NAMES]} wrapperStyle={{ fontSize: 10 }} />
                    <Bar yAxisId="l" dataKey="completed" stackId="a" fill={COLORS.green} />
                    <Bar yAxisId="l" dataKey="sold" stackId="a" fill={COLORS.blue} />
                    <Bar yAxisId="l" dataKey="in_progress" stackId="a" fill={COLORS.purple} />
                    <Bar yAxisId="l" dataKey="cancelled" stackId="a" fill={COLORS.red} radius={[6, 6, 0, 0]} />
                    <Line yAxisId="r" dataKey="churnRate" stroke={COLORS.red} strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
