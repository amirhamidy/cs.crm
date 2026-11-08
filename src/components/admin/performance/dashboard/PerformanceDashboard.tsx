"use client";

import { useMemo, useState } from "react";
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Funnel, FunnelChart, LabelList,
    Line, Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart, Radar, RadarChart,
    ResponsiveContainer, Scatter, ScatterChart, Tooltip, Treemap, XAxis, YAxis, ZAxis,
} from "recharts";
import { Activity, Building2, Layers, Trophy, Users, UserX, Workflow } from "lucide-react";
import type { BringerStat, DepartmentStat, EmployeeOverallStat } from "@/hooks/useAnalytics";
import type { StageRankItem } from "@/hooks/useTopStagesRanking";
import { rankBest, rankWeakest, useEmployeeScores } from "./useRankedEmployees";
import MyTaskDeadlines from "../MyTaskDeadlines";
import { Card, COLORS, Empty, Kpi, Legend, PALETTE, STATUS, Tip, TreeCell, fa, pct, useChartTheme } from "./kit";

interface Props {
    loading: boolean;
    departments: DepartmentStat[];
    bestEmployees: EmployeeOverallStat[];
    weakestEmployees: EmployeeOverallStat[];
    topBringers: BringerStat[];
    topSoldStages: StageRankItem[];
    topCompletedStages: StageRankItem[];
    topInProgressStages: StageRankItem[];
    topCancelledStages: StageRankItem[];
}

const TABS = [
    { key: "overview", label: "نمای کلی", icon: Activity },
    { key: "departments", label: "دپارتمان‌ها", icon: Building2 },
    { key: "employees", label: "کارمندان", icon: Users },
    { key: "stages", label: "مراحل", icon: Layers },
    { key: "customers", label: "مشتریان", icon: Trophy },
    { key: "deadlines", label: "مهلت‌ها", icon: Workflow },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const short = (s: string, n = 12) => (s.length > n ? s.slice(0, n) + "…" : s);

/* ───────────── Overview ───────────── */
function Overview({ departments, loading }: Props) {
    const t = useChartTheme();
    const totals = useMemo(() => {
        const o = { total: 0, sold: 0, completed: 0, in_progress: 0, cancelled: 0 };
        departments.forEach((d) => {
            o.total += d.total; o.sold += d.sold; o.completed += d.completed;
            o.in_progress += d.in_progress; o.cancelled += d.cancelled;
        });
        return o;
    }, [departments]);
    const donut = STATUS.map((s) => ({ name: s.label, value: totals[s.key], color: s.color })).filter((x) => x.value > 0);
    const bars = departments.map((d) => ({
        name: short(d.department_name), full: d.department_name,
        sold: d.sold, completed: d.completed, in_progress: d.in_progress, cancelled: d.cancelled,
    }));
    const radar = departments.map((d) => ({
        name: short(d.department_name, 10),
        rate: d.total > 0 ? ((d.sold + d.completed) / d.total) * 100 : 0,
    }));
    const doneRate = totals.total ? ((totals.sold + totals.completed) / totals.total) * 100 : 0;
    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:col-span-2">
                <Kpi label="کل تسک‌ها" value={fa(totals.total)} color="#9ca3af" />
                <Kpi label="فروش" value={fa(totals.sold)} color={COLORS.sold} />
                <Kpi label="تکمیل‌شده" value={fa(totals.completed)} color={COLORS.completed} />
                <Kpi label="لغو" value={fa(totals.cancelled)} color={COLORS.cancelled} />
                <Kpi label="نرخ موفقیت" value={pct(doneRate)} color={COLORS.purple} sub="فروش + تکمیل" />
            </div>
            <Card title="سهم هر وضعیت" hint="هر رنگ یک وضعیت است؛ هر چه قطعه بزرگ‌تر، سهم بیشتر" icon={<Activity size={15} />}>
                {donut.length === 0 ? <Empty loading={loading} /> : (
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={donut} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={3} cornerRadius={6} stroke="none">
                                {donut.map((d) => <Cell key={d.name} fill={d.color} />)}
                            </Pie>
                            <Tooltip content={<Tip footer={(s) => ({ label: "سهم", value: pct((s.value / totals.total) * 100) })} />} />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </Card>
            <Card title="مقایسه دپارتمان‌ها" hint="هر ستون یک دپارتمان؛ رنگ‌ها وضعیت تسک‌ها را روی هم نشان می‌دهند" icon={<Building2 size={15} />}>
                {bars.length === 0 ? <Empty loading={loading} /> : (
                    <ResponsiveContainer>
                        <BarChart data={bars} barSize={22}>
                            <CartesianGrid vertical={false} stroke={t.grid} />
                            <XAxis dataKey="name" tick={t.axis} axisLine={false} tickLine={false} />
                            <YAxis tick={t.axis} axisLine={false} tickLine={false} tickFormatter={fa} width={32} />
                            <Tooltip cursor={{ fill: "rgba(168,85,247,0.06)" }} content={<Tip title={(s) => s.full} />} />
                            {STATUS.map((s, i) => (
                                <Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={s.color} radius={i === 3 ? [6, 6, 0, 0] : 0} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </Card>
            <Card className="lg:col-span-2" title="نرخ موفقیت دپارتمان‌ها" hint="هر چه شکل به لبه نزدیک‌تر، آن دپارتمان موفق‌تر است" icon={<Trophy size={15} />} height={280}>
                {radar.length < 3 ? <Empty loading={loading} /> : (
                    <ResponsiveContainer>
                        <RadarChart data={radar}>
                            <PolarGrid stroke={t.grid} />
                            <PolarAngleAxis dataKey="name" tick={t.axis} />
                            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="نرخ موفقیت (٪)" dataKey="rate" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.3} />
                            <Tooltip content={<Tip />} />
                        </RadarChart>
                    </ResponsiveContainer>
                )}
            </Card>
        </div>
    );
}

/* ───────────── Departments ───────────── */
function Departments({ departments, loading }: Props) {
    const t = useChartTheme();
    const [idx, setIdx] = useState(0);
    if (departments.length === 0) return <Card title="دپارتمان‌ها" hint="داده‌ای نیست"><Empty loading={loading} /></Card>;
    const dept = departments[Math.min(idx, departments.length - 1)];
    const stages = [...dept.stages].sort((a, b) => a.order - b.order);
    const rows = stages.map((s) => ({ ...s, label: short(s.name, 10) }));
    const funnel = rows.filter((s) => s.total > 0).map((s, i) => ({ name: s.name, value: s.total, fill: PALETTE[i % PALETTE.length] }));
    const cancelLine = rows.map((s) => ({ name: s.label, full: s.name, rate: s.total ? (s.cancelled / s.total) * 100 : 0, cancelled: s.cancelled }));
    const people = [dept.best && { ...dept.best, role: "بهترین" }, dept.worst && { ...dept.worst, role: "ضعیف‌ترین" }, dept.solo && { ...dept.solo, role: "تک‌نفره" }]
        .filter(Boolean) as (NonNullable<DepartmentStat["best"]> & { role: string })[];
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
            <Card title="قیف مراحل" hint="عریض‌تر یعنی تسک‌های بیشتر در آن مرحله" icon={<Workflow size={15} />}>
                {funnel.length === 0 ? <Empty /> : (
                    <ResponsiveContainer>
                        <FunnelChart>
                            <Tooltip content={<Tip />} />
                            <Funnel data={funnel} dataKey="value" nameKey="name" isAnimationActive>
                                <LabelList position="center" fill="#fff" fontSize={11} formatter={(v: any) => fa(Number(v))} />
                            </Funnel>
                        </FunnelChart>
                    </ResponsiveContainer>
                )}
            </Card>
            <Card title="نرخ ریزش مراحل" hint="قله‌ها یعنی مرحله‌ای که بیشتر مشتری را از دست می‌دهید" icon={<UserX size={15} />}>
                {cancelLine.length === 0 ? <Empty /> : (
                    <ResponsiveContainer>
                        <AreaChart data={cancelLine}>
                            <defs>
                                <linearGradient id="gCancel" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={COLORS.cancelled} stopOpacity={0.5} />
                                    <stop offset="100%" stopColor={COLORS.cancelled} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke={t.grid} />
                            <XAxis dataKey="name" tick={t.axis} axisLine={false} tickLine={false} />
                            <YAxis tick={t.axis} axisLine={false} tickLine={false} width={32} tickFormatter={(v) => `${fa(v)}٪`} />
                            <Tooltip content={<Tip title={(s) => s.full} />} />
                            <Area type="monotone" dataKey="rate" name="ریزش (٪)" stroke={COLORS.cancelled} strokeWidth={2.5} fill="url(#gCancel)" />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </Card>
            <Card title="کارمندان شاخص دپارتمان" hint="مقایسه بهترین، ضعیف‌ترین یا تنها عضو دپارتمان" icon={<Users size={15} />}>
                {people.length === 0 ? <Empty /> : (
                    <ResponsiveContainer>
                        <BarChart data={people.map((p) => ({ ...p, name: `${p.role}: ${short(p.full_name, 10)}`, full: p.full_name }))} layout="vertical" barSize={14}>
                            <CartesianGrid horizontal={false} stroke={t.grid} />
                            <XAxis type="number" tick={t.axis} axisLine={false} tickLine={false} tickFormatter={fa} />
                            <YAxis type="category" dataKey="name" tick={t.axis} axisLine={false} tickLine={false} width={110} />
                            <Tooltip cursor={{ fill: "rgba(168,85,247,0.06)" }} content={<Tip title={(s) => s.full} />} />
                            {STATUS.map((s) => <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[0, 4, 4, 0]} />)}
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </Card>
        </div>
    );
}

/* ───────────── Employees ───────────── */
function Employees({ bestEmployees, weakestEmployees, loading }: Props) {
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
    const scatter = bestRaw.filter((e) => e.total > 0).map((e) => ({
        name: e.full_name, x: e.total, y: e.total ? (e.cancelled / e.total) * 100 : 0, z: e.sold + e.completed + 1,
    }));
    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card title="بهترین کارمندان" hint="طول هر میله = درصد تسک‌های فروش‌رفته یا تکمیل‌شده" icon={<Trophy size={15} />} height={300}>
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
            </Card>
            <Card title="نیازمند توجه" hint="هر حلقه = تعداد لغوهای یک کارمند؛ حلقه بلندتر یعنی لغو بیشتر" icon={<UserX size={15} />} height={300}>
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
            </Card>
            <Card className="lg:col-span-2" title="حجم کار در برابر لغو" hint="هر حباب یک نفر؛ بالا = لغو بیشتر، راست = تسک بیشتر، بزرگ‌تر = موفقیت بیشتر" icon={<Activity size={15} />} height={300}>
                {scatter.length === 0 ? <Empty loading={loading} /> : (
                    <ResponsiveContainer>
                        <ScatterChart>
                            <CartesianGrid stroke={t.grid} />
                            <XAxis type="number" dataKey="x" name="تسک" tick={t.axis} axisLine={false} tickLine={false} tickFormatter={fa} />
                            <YAxis type="number" dataKey="y" name="لغو (٪)" tick={t.axis} axisLine={false} tickLine={false} tickFormatter={(v) => `${fa(v)}٪`} width={40} />
                            <ZAxis type="number" dataKey="z" range={[60, 360]} />
                            <Tooltip cursor={false} content={<Tip footer={(s) => ({ label: "تسک", value: fa(s.x) })} />} />
                            <Scatter data={scatter} fill={COLORS.purple} fillOpacity={0.6} />
                        </ScatterChart>
                    </ResponsiveContainer>
                )}
            </Card>
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
    const comp = items.map((i) => ({ name: short(i.full_name, 10), full: i.full_name, actual: i.actual, potential: i.potential, count: i.count }));
    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card title="سهم جذب مشتری" hint="مساحت هر مستطیل = تعداد مشتریانی که آن نفر آورده" icon={<Trophy size={15} />} height={300}>
                {tree.length === 0 ? <Empty loading={loading} /> : (
                    <ResponsiveContainer><Treemap data={tree} dataKey="value" content={<TreeCell />} isAnimationActive><Tooltip content={<Tip />} /></Treemap></ResponsiveContainer>
                )}
            </Card>
            <Card title="مشتری واقعی و بالقوه" hint="ستون‌ها واقعی/بالقوه، خط تعداد کل مشتریان آورده‌شده" icon={<Users size={15} />} height={300}>
                {comp.length === 0 ? <Empty loading={loading} /> : (
                    <ResponsiveContainer>
                        <ComposedChart data={comp} barSize={14}>
                            <CartesianGrid vertical={false} stroke={t.grid} />
                            <XAxis dataKey="name" tick={t.axis} axisLine={false} tickLine={false} />
                            <YAxis tick={t.axis} axisLine={false} tickLine={false} tickFormatter={fa} width={32} />
                            <Tooltip cursor={{ fill: "rgba(168,85,247,0.06)" }} content={<Tip title={(s) => s.full} />} />
                            <Bar dataKey="actual" name="واقعی" fill={COLORS.green} radius={[6, 6, 0, 0]} />
                            <Bar dataKey="potential" name="بالقوه" fill={COLORS.blue} radius={[6, 6, 0, 0]} />
                            <Line type="monotone" dataKey="count" name="کل" stroke={COLORS.pink} strokeWidth={2.5} dot={{ r: 3 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </Card>
        </div>
    );
}

/* ───────────── Shell ───────────── */
export default function PerformanceDashboard(props: Props) {
    const [tab, setTab] = useState<TabKey>("overview");
    return (
        <div className="flex flex-col gap-5">
            <div className="flex gap-1.5 overflow-x-auto rounded-2xl bg-black/[0.03] p-1.5 dark:bg-white/[0.04]" dir="rtl">
                {TABS.map((x) => (
                    <button key={x.key} onClick={() => setTab(x.key)}
                        className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold transition ${tab === x.key ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30" : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"}`}>
                        <x.icon size={13} /> {x.label}
                    </button>
                ))}
            </div>
            {tab === "overview" && <Overview {...props} />}
            {tab === "departments" && <Departments {...props} />}
            {tab === "employees" && <Employees {...props} />}
            {tab === "stages" && <Stages {...props} />}
            {tab === "customers" && <Customers {...props} />}
            {tab === "deadlines" && <MyTaskDeadlines />}
        </div>
    );
}
