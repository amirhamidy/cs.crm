"use client";

import { useMemo, useState } from "react";
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
    PolarAngleAxis, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart, Radar, RadarChart,
    ResponsiveContainer, Tooltip, Treemap, XAxis, YAxis,
} from "recharts";
import { Layers, Trophy, UserX } from "lucide-react";
import type { BringerStat, DepartmentStat, EmployeeStat } from "@/hooks/useAnalytics";
import type { StageRankItem } from "@/hooks/useAnalytics";
import { rankBest, rankWeakest, useEmployeeScores } from "./useRankedEmployees";
import MyTaskDeadlines from "../MyTaskDeadlines";
import { Card, COLORS, Empty, Kpi, Legend, PALETTE, STATUS, Tip, TreeCell, fa, useChartTheme } from "./kit";

interface Props {
    loading: boolean;
    departments: DepartmentStat[];
    bestEmployees: EmployeeStat[];
    weakestEmployees: EmployeeStat[];
    topBringers: BringerStat[];
    topSoldStages: StageRankItem[];
    topCompletedStages: StageRankItem[];
    topInProgressStages: StageRankItem[];
    topCancelledStages: StageRankItem[];
}

const short = (s: string, n = 12) => (s.length > n ? s.slice(0, n) + "…" : s);

/* ───────────── Departments ───────────── */
function Departments({ departments, loading }: Props) {
    const t = useChartTheme();
    const [idx, setIdx] = useState(0);
    if (departments.length === 0) return <Card title="دپارتمان‌ها" hint="داده‌ای نیست"><Empty loading={loading} /></Card>;
    const dept = departments[Math.min(idx, departments.length - 1)];
    const stages = [...dept.stages].sort((a, b) => a.order - b.order);
    const rows = stages.map((s) => ({ ...s, label: short(s.name, 10) }));
    const maxCancel = Math.max(0, ...stages.map((s) => s.cancelled));
    const risk = maxCancel > 0 ? stages.find((s) => s.cancelled === maxCancel) : null;
    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="flex flex-wrap gap-2 lg:col-span-2" dir="rtl">
                {departments.map((d, i) => (
                    <button key={d.key} onClick={() => setIdx(i)}
                        className={`rounded-xl px-3 py-1.5 text-[11.5px] font-bold transition ${i === idx ? "bg-purple-500 text-white" : "bg-black/[0.04] text-gray-500 dark:bg-white/[0.05] dark:text-gray-400"}`}>
                        {d.department_name}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:col-span-2">
                <Kpi label="کل" value={fa(dept.total)} color="#9ca3af" />
                <Kpi label="فروش" value={fa(dept.sold)} color={COLORS.sold} />
                <Kpi label="تکمیل" value={fa(dept.completed)} color={COLORS.completed} />
                <Kpi label="لغو" value={fa(dept.cancelled)} color={COLORS.cancelled} />
                <Kpi label="بیشترین ریزش" value={risk ? short(risk.name, 12) : "—"} color={COLORS.pink} sub={risk ? `${fa(risk.cancelled)} لغو` : undefined} />
            </div>
            <Card title="وضعیت در هر مرحله" hint="هر ستون یک مرحله از فرآیند است" icon={<Layers size={15} />}>
                {rows.length === 0 ? <Empty /> : (
                    <ResponsiveContainer>
                        <BarChart data={rows} barSize={22}>
                            <CartesianGrid vertical={false} stroke={t.grid} />
                            <XAxis dataKey="label" tick={t.axis} axisLine={false} tickLine={false} />
                            <YAxis tick={t.axis} axisLine={false} tickLine={false} tickFormatter={fa} width={32} />
                            <Tooltip cursor={{ fill: "rgba(168,85,247,0.06)" }} content={<Tip title={(s) => s.name} />} />
                            {STATUS.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={s.color} radius={i === 3 ? [6, 6, 0, 0] : 0} />)}
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </Card>
        </div>
    );
}

/* ───────────── Employees ───────────── */
function Employees({ bestEmployees, weakestEmployees, loading, part }: Props & { part: "best" | "weak" }) {
    const t = useChartTheme();
    const bestRaw = useEmployeeScores(bestEmployees);
    const weakRaw = useEmployeeScores(weakestEmployees);
    const best = useMemo(() => rankBest(bestRaw).slice(0, 8), [bestRaw]);
    const weak = useMemo(() => rankWeakest(weakRaw), [weakRaw]);

    const bestData = best.map((e) => ({
        name: short(e.full_name, 12), full: e.full_name,
        rate: e.total ? ((e.sold + e.completed) / e.total) * 100 : 0,
        score: e.score, total: e.total, cancelled: e.cancelled,
    }));
    const weakData = weak.map((e, i) => ({
        name: e.full_name, value: e.cancelled, score: e.score, total: e.total, fill: PALETTE[i % PALETTE.length],
    }));
    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {part === "best" && <Card className="lg:col-span-2" title="رتبه‌بندی عملکرد کارمندان" hint="طول هر میله = درصد تسک‌های فروش‌رفته یا تکمیل‌شده" icon={<Trophy size={15} />} height={300}>
                {bestData.length === 0 ? <Empty loading={loading} /> : (
                    <ResponsiveContainer>
                        <BarChart data={bestData} layout="vertical" barSize={14}>
                            <CartesianGrid horizontal={false} stroke={t.grid} />
                            <XAxis type="number" domain={[0, 100]} tick={t.axis} axisLine={false} tickLine={false} tickFormatter={(v) => `${fa(v)}٪`} />
                            <YAxis type="category" dataKey="name" tick={t.axis} axisLine={false} tickLine={false} width={90} />
                            <Tooltip cursor={{ fill: "rgba(74,222,128,0.06)" }}
                                content={<Tip title={(s) => s.full} footer={(s) => ({ label: "امتیاز", value: s.score != null ? fa(s.score) : "—" })} />} />
                            <Bar dataKey="rate" name="نرخ موفقیت (٪)" radius={[0, 8, 8, 0]}>
                                {bestData.map((_, i) => <Cell key={i} fill={i === 0 ? COLORS.yellow : COLORS.green} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </Card>}
            {part === "weak" && <Card className="lg:col-span-2" title="ضعیف‌ترین عملکرد" hint="هر حلقه = تعداد لغوهای یک کارمند؛ حلقه بلندتر یعنی لغو بیشتر" icon={<UserX size={15} />} height={300}>
                {weakData.length === 0 ? <Empty loading={loading} /> : (
                    <>
                        <ResponsiveContainer height="80%">
                            <RadialBarChart data={weakData} innerRadius="25%" outerRadius="100%" startAngle={90} endAngle={-270}>
                                <RadialBar dataKey="value" name="لغو" background cornerRadius={8} />
                                <Tooltip content={<Tip footer={(s) => ({ label: "امتیاز", value: s.score != null ? fa(s.score) : "—" })} />} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <Legend items={weakData.map((w) => ({ label: short(w.name, 10), color: w.fill }))} />
                    </>
                )}
            </Card>}
        </div>
    );
}

/* ───────────── Stages ───────────── */
const STAGE_TABS = [
    { key: "sold", label: "فروش", color: COLORS.sold, kind: "bar" },
    { key: "completed", label: "تکمیل شده", color: COLORS.completed, kind: "area" },
    { key: "in_progress", label: "در حال انجام", color: COLORS.in_progress, kind: "radar" },
    { key: "cancelled", label: "لغو", color: COLORS.cancelled, kind: "tree" },
] as const;

function Stages(props: Props) {
    const t = useChartTheme();
    const [tab, setTab] = useState<(typeof STAGE_TABS)[number]["key"]>("sold");
    const src = {
        sold: props.topSoldStages, completed: props.topCompletedStages,
        in_progress: props.topInProgressStages, cancelled: props.topCancelledStages,
    }[tab];
    const cfg = STAGE_TABS.find((x) => x.key === tab)!;
    const data = (src ?? []).slice(0, 5).map((s, i) => ({
        name: s.stage_name, short: short(s.stage_name, 10), dept: s.department_name, value: s[tab] as number, fill: PALETTE[i % PALETTE.length],
    }));
    const tip = <Tip title={(s) => s.name} footer={(s) => ({ label: "دپارتمان", value: s.dept })} />;
    let chart;
    if (data.length === 0) chart = <Empty loading={props.loading} />;
    else if (cfg.kind === "bar")
        chart = (
            <ResponsiveContainer><BarChart data={data} layout="vertical" barSize={16}>
                <CartesianGrid horizontal={false} stroke={t.grid} />
                <XAxis type="number" tick={t.axis} axisLine={false} tickLine={false} tickFormatter={fa} />
                <YAxis type="category" dataKey="short" tick={t.axis} axisLine={false} tickLine={false} width={80} />
                <Tooltip cursor={{ fill: "rgba(45,212,191,0.06)" }} content={tip} />
                <Bar dataKey="value" name={cfg.label} radius={[0, 8, 8, 0]}>{data.map((d) => <Cell key={d.name} fill={d.fill} />)}</Bar>
            </BarChart></ResponsiveContainer>
        );
    else if (cfg.kind === "area")
        chart = (
            <ResponsiveContainer><AreaChart data={data}>
                <defs><linearGradient id="gStage" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={cfg.color} stopOpacity={0.5} /><stop offset="100%" stopColor={cfg.color} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke={t.grid} />
                <XAxis dataKey="short" tick={t.axis} axisLine={false} tickLine={false} />
                <YAxis tick={t.axis} axisLine={false} tickLine={false} tickFormatter={fa} width={32} />
                <Tooltip content={tip} />
                <Area type="monotone" dataKey="value" name={cfg.label} stroke={cfg.color} strokeWidth={2.5} fill="url(#gStage)" />
            </AreaChart></ResponsiveContainer>
        );
    else if (cfg.kind === "radar")
        chart = (
            <ResponsiveContainer><RadarChart data={data}>
                <PolarGrid stroke={t.grid} /><PolarAngleAxis dataKey="short" tick={t.axis} /><PolarRadiusAxis tick={false} axisLine={false} />
                <Radar name={cfg.label} dataKey="value" stroke={cfg.color} fill={cfg.color} fillOpacity={0.35} />
                <Tooltip content={tip} />
            </RadarChart></ResponsiveContainer>
        );
    else
        chart = (
            <ResponsiveContainer><Treemap data={data.filter((d) => d.value > 0).map((d) => ({ name: d.name, value: d.value, fill: d.fill }))} dataKey="value" content={<TreeCell />} isAnimationActive>
                <Tooltip content={<Tip />} />
            </Treemap></ResponsiveContainer>
        );
    return (
        <Card title="برترین مراحل" hint="۵ مرحله‌ی برتر در هر وضعیت؛ با تب‌ها وضعیت را عوض کنید" icon={<Layers size={15} />} height={320}
            action={
                <div className="flex flex-wrap justify-end gap-1" dir="rtl">
                    {STAGE_TABS.map((x) => (
                        <button key={x.key} onClick={() => setTab(x.key)}
                            className="rounded-lg px-2.5 py-1 text-[10.5px] font-bold transition"
                            style={tab === x.key ? { background: x.color, color: "#fff" } : { background: "rgba(128,128,128,0.12)", color: "#9ca3af" }}>
                            {x.label}
                        </button>
                    ))}
                </div>
            }>
            {chart}
        </Card>
    );
}

/* ───────────── Customers ───────────── */
function Customers({ topBringers, loading }: Props) {
    const t = useChartTheme();
    const items = (topBringers ?? []).slice(0, 6);
    const tree = items.filter((i) => i.count > 0).map((i, k) => ({ name: i.full_name, value: i.count, fill: PALETTE[k % PALETTE.length] }));
    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card title="سهم جذب مشتری" hint="مساحت هر مستطیل = تعداد مشتریانی که آن نفر آورده" icon={<Trophy size={15} />} height={300}>
                {tree.length === 0 ? <Empty loading={loading} /> : (
                    <ResponsiveContainer><Treemap data={tree} dataKey="value" content={<TreeCell />} isAnimationActive><Tooltip content={<Tip />} /></Treemap></ResponsiveContainer>
                )}
            </Card>
        </div>
    );
}

/* ───────────── Shell ───────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-3" dir="rtl">
            <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">{title}</h2>
            {children}
        </section>
    );
}

export default function PerformanceDashboard(props: Props) {
    return (
        <div className="flex flex-col gap-8">
            <Section title="مسیر تسک‌ها در فرآیندهای دپارتمان"><Departments {...props} /></Section>
            <Section title="ضعیف‌ترین عملکرد"><Employees {...props} part="weak" /></Section>
            <Section title="آورنده‌های برتر مشتری"><Customers {...props} /></Section>
            <Section title="رتبه‌بندی عملکرد کارمندان"><Employees {...props} part="best" /></Section>
            <Section title="رتبه‌بندی مراحل بر اساس فروش و تکمیل شده و ..."><Stages {...props} /></Section>
            <MyTaskDeadlines />
        </div>
    );
}
