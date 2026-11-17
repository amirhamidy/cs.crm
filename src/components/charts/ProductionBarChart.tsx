"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { BarChart3 } from "lucide-react";
import { useCallback, useId, useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AnimatedChartTooltip } from "@/components/charts/ChartTooltip";
import { toPersianDigits } from "@/lib/jalali";
import { sumProductionDecimals, formatProductionInteger, formatProductionPercent } from "@/lib/productionFormat";

export type ProductionBarPoint = { name: string; a: number; b: number };
type Series = { label: string; color: string; hint?: string };

type Props = {
  title: string;
  subtitle?: string;
  data: ProductionBarPoint[];
  seriesA: Series;
  seriesB: Series;
  emptyText?: string;
  signed?: boolean;
  /** نمایش همه‌ی برچسب‌های محور (برای مقایسه‌ی نیرو/ماشین/محصول) */
  allLabels?: boolean;
  tabs?: { id: number; label: string }[];
  activeTab?: number | null;
  onTab?: (id: number) => void;
};

const fmt = (v: number) => formatProductionInteger(v);
const compact = (v: number) => {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${formatProductionInteger(v / 1_000_000)}M`;
  if (a >= 1000) return `${formatProductionInteger(v / 1000)}K`;
  return formatProductionInteger(v);
};
const short = (s: string) => (s.length > 9 ? `${s.slice(0, 8)}…` : s);
const mid = (s: string) => (s.length > 16 ? `${s.slice(0, 15)}…` : s);

export default function ProductionBarChart({
  title, subtitle, data, seriesA, seriesB,
  emptyText = "داده‌ای برای نمایش وجود ندارد.",
  signed = false, allLabels = false, tabs, activeTab, onTab,
}: Props) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const uid = useId().replace(/:/g, "");
  const [active, setActive] = useState<number | null>(null);

  const hasData = useMemo(() => data.some((d) => d.a !== 0 || d.b !== 0), [data]);
  const totals = useMemo(() => {
    const a = sumProductionDecimals(data.map((point) => point.a));
    const b = sumProductionDecimals(data.map((point) => point.b));
    return { a, b, pct: b ? (a / b) * 100 : null };
  }, [data]);

  const onMove = useCallback((st: any) => {
    const i = st?.isTooltipActive ? Number(st.activeTooltipIndex) : NaN;
    setActive(Number.isNaN(i) ? null : i);
  }, []);

  const mode: "empty" | "single" | "bars" | "area" =
    !hasData ? "empty" : data.length === 1 ? "single" : (data.length <= 4 || allLabels) ? "bars" : "area";
  const point = active !== null ? data[active] : undefined;
  const diff = point ? point.a - point.b : 0;
  const pctTone = totals.pct === null ? "#9ca3af" : totals.pct >= 100 ? "#10b981" : totals.pct >= 80 ? "#f59e0b" : "#ef4444";
  const tick = { fontSize: 11, fontWeight: 500 };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-slate-950"
    >
      <div className="mb-3 flex items-start justify-between gap-3" dir="rtl">
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">({subtitle})</p>}
        </div>
        {tabs && (
          <div className="flex shrink-0 items-center gap-1 rounded-xl border border-gray-100 bg-gray-50/80 p-1 dark:border-white/5 dark:bg-slate-900/50">
            {tabs.map((t) => (
              <button key={t.id} type="button" onClick={() => onTab?.(t.id)} className="relative rounded-lg px-2.5 py-1 text-[11px] font-medium">
                {activeTab === t.id && (
                  <motion.span
                    layoutId={`tab-${uid}`}
                    className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-slate-800"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 transition-colors ${activeTab === t.id ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {mode !== "empty" && (seriesA.hint || seriesB.hint) && (
        <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5" dir="rtl">
          {[seriesA, seriesB].map((s, i) => (
            <div key={s.label} className="flex items-start gap-1.5">
              <span className="mt-1.5 h-0.5 w-5 shrink-0 rounded" style={i === 0 ? { backgroundColor: s.color } : { backgroundImage: `repeating-linear-gradient(90deg, ${s.color} 0 4px, transparent 4px 7px)` }} />
              <span className="text-[11.5px] font-semibold" style={{ color: s.color }}>
                {s.label}
                {s.hint && <span className="mr-1 text-[10px] font-normal text-gray-400">({s.hint})</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* summary strip */}
      {mode !== "empty" && mode !== "single" && (
      <div className="mb-3 grid grid-cols-3 gap-2" dir="rtl">
        {[
          { label: seriesA.label, value: fmt(totals.a), color: seriesA.color },
          { label: seriesB.label, value: fmt(totals.b), color: seriesB.color },
          { label: "تحقق", value: totals.pct === null ? "—" : `${formatProductionPercent(totals.pct)}٪`, color: pctTone },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-gray-50/80 px-3 py-2 dark:bg-white/[0.03]">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="truncate text-[11px] text-gray-500 dark:text-gray-400">{s.label}</span>
            </div>
            <p className="mt-0.5 text-[15px] font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>
      )}

      {mode === "empty" && (
        <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 text-gray-400 dark:border-white/10 dark:text-gray-500" dir="rtl">
          <BarChart3 size={28} strokeWidth={1.5} />
          <span className="text-[13px]">{emptyText}</span>
        </div>
      )}

      {mode === "single" && (() => {
        const d = data[0];
        const max = Math.max(d.a, d.b, 1);
        const df = d.a - d.b;
        return (
          <div className="space-y-4 py-2" dir="rtl">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[12px] text-gray-500 dark:text-gray-400">{d.name}</p>
                <p className="text-[32px] font-extrabold leading-tight tabular-nums" style={{ color: pctTone }}>
                  {totals.pct === null ? "—" : `${formatProductionPercent(totals.pct)}٪`}
                </p>
                <p className="text-[11px] text-gray-400">تحقق نسبت به مبنا</p>
              </div>
              <span className="rounded-full px-3 py-1 text-[12px] font-bold tabular-nums" style={{ color: df >= 0 ? "#10b981" : "#ef4444", backgroundColor: df >= 0 ? "#10b98114" : "#ef444414" }}>
                {df > 0 ? "+" : df < 0 ? "−" : ""}{fmt(Math.abs(df))}
              </span>
            </div>
            {[{ s: seriesA, v: d.a }, { s: seriesB, v: d.b }].map(({ s, v }) => (
              <div key={s.label}>
                <div className="mb-1 flex justify-between text-[12px]">
                  <span className="text-gray-500 dark:text-gray-400">{s.label}</span>
                  <span className="font-bold tabular-nums text-gray-900 dark:text-white">{fmt(v)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(Math.abs(v) / max) * 100}%` }} transition={{ duration: 0.6, ease: "easeOut" }} className="h-full rounded-full" style={{ backgroundColor: s.color }} />
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {(mode === "bars" || mode === "area") && (
      <div className={`relative ${allLabels ? "h-[270px]" : "h-[220px]"} w-full [&_.pbc-a]:-translate-y-1 [&_.pbc-b]:translate-y-1`} dir="ltr">
        <div dir="rtl">
          <AnimatedChartTooltip
            visible={!!point}
            animKey={`${activeTab ?? ""}-${point?.name ?? ""}`}
            position="top-left"
            title={point?.name ?? ""}
            dark={dark}
            colorKey="pbc"
            glowColor={`${seriesA.color}55`}
            rows={[
              { dotStyle: "circle", label: seriesA.label, value: fmt(point?.a ?? 0), color: seriesA.color },
              { dotStyle: "circle", label: seriesB.label, value: fmt(point?.b ?? 0), color: seriesB.color },
            ]}
            footer={{
              label: "اختلاف",
              value: `${diff > 0 ? "+" : diff < 0 ? "−" : ""}${fmt(Math.abs(diff))}`,
              valueColor: diff >= 0 ? "#10b981" : "#ef4444",
            }}
          />
        </div>
        <ResponsiveContainer width="100%" height="100%">
          {mode === "bars" ? (
          <BarChart data={data} margin={{ top: 24, right: 8, left: -16, bottom: allLabels ? 4 : 12 }} barGap={4} onMouseMove={onMove} onMouseLeave={() => setActive(null)}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="[&_line]:stroke-gray-100 dark:[&_line]:stroke-white/[0.04]" />
            <XAxis dataKey="name" tick={tick} className="[&_text]:fill-gray-500 dark:[&_text]:fill-gray-400" axisLine={false} tickLine={false} dy={5} tickFormatter={allLabels ? mid : short} {...(allLabels ? { interval: 0, angle: -30, textAnchor: "end", height: 64 } : {})} />
            <YAxis domain={[(m: number) => Math.min(0, m - Math.abs(m) * 0.15 - 1), (m: number) => m + Math.abs(m) * 0.2 + 1]} tick={tick} className="[&_text]:fill-gray-500 dark:[&_text]:fill-gray-400" axisLine={false} tickLine={false} tickFormatter={compact} />
            {signed && <ReferenceLine y={0} stroke={dark ? "#475569" : "#cbd5e1"} />}
            <Tooltip cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} content={() => null} />
            <Bar dataKey="a" fill={seriesA.color} radius={[6, 6, 0, 0]} maxBarSize={36} isAnimationActive={false} />
            <Bar dataKey="b" fill={seriesB.color} fillOpacity={0.35} radius={[6, 6, 0, 0]} maxBarSize={36} isAnimationActive={false} />
          </BarChart>
          ) : (
          <AreaChart data={data} margin={{ top: 24, right: 8, left: -16, bottom: allLabels ? 4 : 12 }} onMouseMove={onMove} onMouseLeave={() => setActive(null)}>
            <defs>
              {[seriesA, seriesB].map((s, i) => (
                <linearGradient key={i} id={`g-${uid}-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={i === 0 ? 0.3 : 0.12} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="[&_line]:stroke-gray-100 dark:[&_line]:stroke-white/[0.04]" />
            <XAxis dataKey="name" tick={tick} className="[&_text]:fill-gray-500 dark:[&_text]:fill-gray-400" axisLine={false} tickLine={false} dy={5} minTickGap={16} tickFormatter={allLabels ? mid : short} {...(allLabels ? { interval: 0, angle: -30, textAnchor: "end", height: 64 } : {})} />
            <YAxis domain={[(m: number) => Math.min(0, m - Math.abs(m) * 0.15 - 1), (m: number) => m + Math.abs(m) * 0.2 + 1]} tick={tick} className="[&_text]:fill-gray-500 dark:[&_text]:fill-gray-400" axisLine={false} tickLine={false} tickFormatter={compact} />
            {signed && <ReferenceLine y={0} stroke={dark ? "#475569" : "#cbd5e1"} />}
            <Tooltip cursor={{ stroke: dark ? "#475569" : "#cbd5e1", strokeDasharray: "4 4" }} content={() => null} />
            <Area className="pbc-b" type="monotone" dataKey="b" stroke={seriesB.color} strokeWidth={2} strokeDasharray="5 4" fill={`url(#g-${uid}-1)`} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: seriesB.color }} isAnimationActive={false} />
            <Area className="pbc-a" type="monotone" dataKey="a" stroke={seriesA.color} strokeWidth={2.5} fill={`url(#g-${uid}-0)`} dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: seriesA.color }} isAnimationActive={false} />
          </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
      )}
    </motion.div>
  );
}
