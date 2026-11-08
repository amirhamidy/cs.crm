"use client";

import {
    Bar, BarChart, CartesianGrid, Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, RadialBar, RadialBarChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from "recharts";
import { Activity, Users, TrendingUp, Ban } from "lucide-react";
import { C, PALETTE, fa, pct, short, AXIS, GRID } from "../shared/theme";
import { Tip, Card, Empty } from "../shared/ui";
import type { Props } from "../shared/types";

export default function Employees({ bestEmployees, weakestEmployees }: Props) {
    const best = bestEmployees.slice(0, 8).map((e) => ({
        name: short(e.full_name), "فروش": e.sold, "تکمیل": e.completed,
    }));
    const weak = weakestEmployees.slice(0, 8).map((e) => ({
        name: short(e.full_name), "لغو": e.cancelled, "کل": e.total,
    }));
    const weakR = weakestEmployees.slice(0, 6).map((e, i) => ({
        name: short(e.full_name, 10), v: pct(e.cancelled, e.total), fill: PALETTE[i % PALETTE.length],
    }));
    const scatter = [...bestEmployees, ...weakestEmployees]
        .filter((e, i, a) => a.findIndex((x) => x.key === e.key) === i)
        .map((e) => ({ name: e.full_name, x: e.total, y: pct(e.sold + e.completed, e.total), z: e.cancelled + 1 }));
    const top5 = bestEmployees.slice(0, 5);
    const radar = [
        { name: "فروش" }, { name: "تکمیل" }, { name: "کم‌لغو بودن" }, { name: "حجم کار" },
    ].map((ax) => {
        const row: any = { name: ax.name };
        const max = Math.max(1, ...top5.map((e) => e.total));
        top5.forEach((e) => {
            row[short(e.full_name, 10)] =
                ax.name === "فروش" ? pct(e.sold, e.total)
                    : ax.name === "تکمیل" ? pct(e.completed, e.total)
                        : ax.name === "کم‌لغو بودن" ? 100 - pct(e.cancelled, e.total)
                            : pct(e.total, max);
        });
        return row;
    });

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="برترین کارمندان" hint="هرچه نوار بلندتر، فروش و تکمیل بیشتر" icon={Users} height={320}>
                {best.length ? (
                    <ResponsiveContainer>
                        <BarChart data={best} layout="vertical" margin={{ right: 8 }}>
                            <CartesianGrid stroke={GRID} horizontal={false} />
                            <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} tickFormatter={fa} />
                            <YAxis type="category" dataKey="name" tick={AXIS} axisLine={false} tickLine={false} width={80} orientation="right" />
                            <Tooltip content={<Tip />} cursor={{ fill: "rgba(129,140,248,0.08)" }} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="فروش" stackId="a" fill={C.sold} />
                            <Bar dataKey="تکمیل" stackId="a" fill={C.completed} radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : <Empty />}
            </Card>

            <Card title="کارمندان نیازمند توجه" hint="بیشترین تسک‌های لغو‌شده؛ هر حلقه یک نفر؛ حلقه‌ی بلندتر = درصد لغو بیشتر" icon={Ban} height={320}>
                {weak.length ? (
                    <ResponsiveContainer>
                        <RadialBarChart data={weakR} innerRadius="15%" outerRadius="100%" startAngle={90} endAngle={-270}>
                            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                            <RadialBar dataKey="v" name="٪ لغو" background={{ fill: GRID }} cornerRadius={10} />
                            <Tooltip content={<Tip />} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                ) : <Empty />}
            </Card>

            <Card title="مقایسه‌ی ۵ نفر برتر" hint="هر رنگ یک نفر؛ سطح بزرگ‌تر یعنی عملکرد بهتر" icon={Activity} height={320}>
                {top5.length ? (
                    <ResponsiveContainer>
                        <RadarChart data={radar}>
                            <PolarGrid stroke={GRID} />
                            <PolarAngleAxis dataKey="name" tick={AXIS} />
                            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                            {top5.map((e, i) => (
                                <Radar key={e.key} name={short(e.full_name, 10)} dataKey={short(e.full_name, 10)}
                                    stroke={PALETTE[i]} fill={PALETTE[i]} fillOpacity={0.12} />
                            ))}
                            <Tooltip content={<Tip />} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        </RadarChart>
                    </ResponsiveContainer>
                ) : <Empty />}
            </Card>

            <Card title="نقشه‌ی حجم کار و موفقیت" hint="راست = تسک بیشتر، بالا = موفقیت بیشتر، دایره‌ی بزرگ = لغو بیشتر" icon={TrendingUp} height={320}>
                {scatter.length ? (
                    <ResponsiveContainer>
                        <ScatterChart margin={{ right: 10 }}>
                            <CartesianGrid stroke={GRID} />
                            <XAxis type="number" dataKey="x" name="تعداد تسک" tick={AXIS} tickFormatter={fa} axisLine={false} />
                            <YAxis type="number" dataKey="y" name="موفقیت٪" domain={[0, 100]} tick={AXIS} tickFormatter={fa} axisLine={false} width={34} />
                            <ZAxis type="number" dataKey="z" range={[60, 400]} name="لغو" />
                            <Tooltip content={<Tip />} />
                            <Scatter data={scatter} fill={C.violet} fillOpacity={0.7} />
                        </ScatterChart>
                    </ResponsiveContainer>
                ) : <Empty />}
            </Card>
        </div>
    );
}
