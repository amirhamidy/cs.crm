"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useMemo } from "react";
import { rankWeakest, useEmployeeScores } from "./useRankedEmployees";
import { ChartCard, COLORS, Tip, useDark } from "./chartKit";

export interface WeakestEmployeeItem {
    key: string;
    full_name: string;
    total: number;
    cancelled: number;
    completed?: number;
    sold?: number;
    score?: number | null;
}

const NAMES = { total: "کل تسک", cancelled: "لغو شده" };

export default function WeakestEmployeesChart({ items, loading }: { items: WeakestEmployeeItem[]; loading: boolean }) {
    const dark = useDark();
    const scored = useEmployeeScores(items as any);
    const data = useMemo(
        () => rankWeakest(scored).map((e) => ({ name: e.full_name, total: e.total, cancelled: e.cancelled })),
        [scored],
    );
    return (
        <ChartCard
            title="کم‌عملکردترین کارمندان"
            hint="هر رأس یک کارمند است؛ هرچه سطح قرمز به سطح آبی نزدیک‌تر باشد، لغو بیشتری داشته است."
            loading={loading}
            empty={!data.length}
        >
            <ResponsiveContainer>
                <RadarChart data={data} outerRadius="72%">
                    <PolarGrid stroke="rgba(150,150,150,.25)" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                    <Tooltip content={<Tip dark={dark} names={NAMES} />} />
                    <Legend formatter={(v) => NAMES[v as keyof typeof NAMES]} wrapperStyle={{ fontSize: 10 }} />
                    <Radar dataKey="total" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.2} />
                    <Radar dataKey="cancelled" stroke={COLORS.red} fill={COLORS.red} fillOpacity={0.4} />
                </RadarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
