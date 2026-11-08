"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import type { StageRankItem, TimeRange } from "@/hooks/useAnalytics";
import { ChartCard, COLORS, Tip, axisProps, useDark } from "./chartKit";

type Props = {
    topSoldStages: StageRankItem[];
    topCompletedStages: StageRankItem[];
    topInProgressStages: StageRankItem[];
    topCancelledStages: StageRankItem[];
    loading: boolean;
    activeRange?: TimeRange;
};

const NAMES = { sold: "فروش", completed: "تکمیل", cancelled: "لغو" };

export default function TopStagesChart({ topSoldStages, topCompletedStages, topInProgressStages, topCancelledStages, loading }: Props) {
    const dark = useDark();
    const map = new Map<string, any>();
    [topSoldStages, topCompletedStages, topInProgressStages, topCancelledStages].flat().forEach((s) => {
        map.set(s.key, { name: s.stage_name, sold: s.sold, completed: s.completed, cancelled: s.cancelled });
    });
    const data = [...map.values()].sort((a, b) => b.sold + b.completed - (a.sold + a.completed)).slice(0, 10);
    return (
        <ChartCard
            title="مراحل برتر"
            hint="موج‌ها مراحل را از بهترین به ضعیف‌ترین نشان می‌دهند؛ هرچه موج بالاتر، آن مرحله فعال‌تر است."
            loading={loading}
            empty={!data.length}
        >
            <ResponsiveContainer>
                <AreaChart data={data} margin={{ left: -10, right: -10 }}>
                    <defs>
                        {Object.entries({ sold: COLORS.blue, completed: COLORS.green, cancelled: COLORS.red }).map(([k, c]) => (
                            <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={c} stopOpacity={0.5} />
                                <stop offset="100%" stopColor={c} stopOpacity={0} />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid vertical={false} stroke="rgba(150,150,150,.12)" />
                    <XAxis dataKey="name" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip content={<Tip dark={dark} names={NAMES} />} />
                    <Legend formatter={(v) => NAMES[v as keyof typeof NAMES]} wrapperStyle={{ fontSize: 10 }} />
                    <Area type="monotone" dataKey="sold" stroke={COLORS.blue} fill="url(#g-sold)" strokeWidth={2} />
                    <Area type="monotone" dataKey="completed" stroke={COLORS.green} fill="url(#g-completed)" strokeWidth={2} />
                    <Area type="monotone" dataKey="cancelled" stroke={COLORS.red} fill="url(#g-cancelled)" strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
