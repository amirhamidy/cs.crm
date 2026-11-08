"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EmployeeOverallStat } from "@/hooks/useAnalytics";
import { useMemo } from "react";
import { rankBest, useEmployeeScores } from "./useRankedEmployees";
import { ChartCard, COLORS, Tip, axisProps, useDark } from "./chartKit";

const NAMES = { completed: "تکمیل", sold: "فروش" };

export default function BestEmployeesChart({ items, loading }: { items: EmployeeOverallStat[]; loading: boolean }) {
    const dark = useDark();
    const scored = useEmployeeScores(items);
    const data = useMemo(
        () => rankBest(scored).slice(0, 8).map((e) => ({ name: e.full_name, completed: e.completed, sold: e.sold })),
        [scored],
    );
    return (
        <ChartCard
            title="برترین کارمندان"
            hint="میله‌های بلندتر یعنی عملکرد بهتر؛ سبز تسک‌های تکمیل‌شده و آبی فروش‌هاست."
            loading={loading}
            empty={!data.length}
        >
            <ResponsiveContainer>
                <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }} barCategoryGap={8}>
                    <CartesianGrid horizontal={false} stroke="rgba(150,150,150,.12)" />
                    <XAxis type="number" {...axisProps} />
                    <YAxis type="category" dataKey="name" width={80} {...axisProps} />
                    <Tooltip cursor={{ fill: "rgba(150,150,150,.08)" }} content={<Tip dark={dark} names={NAMES} />} />
                    <Bar dataKey="completed" fill={COLORS.green} radius={[0, 6, 6, 0]} />
                    <Bar dataKey="sold" fill={COLORS.blue} radius={[0, 6, 6, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
