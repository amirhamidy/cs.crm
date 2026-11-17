"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useCallback, useId, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AnimatedChartTooltip } from "@/components/charts/ChartTooltip";
import { toPersianDigits } from "@/lib/jalali";

export type ParetoPoint = { name: string; waste: number; cumulative: number };

const short = (s: string) => (s.length > 9 ? `${s.slice(0, 8)}…` : s);
const BAR = "#ef4444";
const LINE = "#6366f1";

export default function ParetoChart({ data, title = "نمودار پارتو ضایعات", subtitle = "ضایعات به تفکیک علت و درصد تجمعی" }: { data: ParetoPoint[]; title?: string; subtitle?: string }) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const uid = useId().replace(/:/g, "");
  const [idx, setIdx] = useState<number | null>(null);
  const onMove = useCallback((st: any) => {
    const i = st?.isTooltipActive ? Number(st.activeTooltipIndex) : NaN;
    setIdx(Number.isNaN(i) ? null : i);
  }, []);
  const p = idx !== null ? data[idx] : undefined;
  const tick = { fontSize: 11, fontWeight: 500 };
  const vital = data.filter((d, i) => i === 0 || (data[i - 1]?.cumulative ?? 100) < 80).length;

  if (data.length === 1) {
    const d = data[0];
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-slate-950" dir="rtl">
        <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">فقط یک علت ثبت شده؛ ۱۰۰٪ ضایعات مربوط به آن است.</p>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-red-50/70 px-4 py-3 dark:bg-red-500/10">
          <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">{d.name}</span>
          <span className="text-[22px] font-extrabold tabular-nums text-red-500">{toPersianDigits(String(d.waste))}</span>
        </div>
      </motion.div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="flex h-[180px] flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-gray-200 bg-white text-[13px] text-gray-400 dark:border-white/10 dark:bg-slate-950" dir="rtl">
        <span className="font-semibold text-gray-500 dark:text-gray-300">{title}</span>
        داده‌ای برای نمایش وجود ندارد.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-slate-950"
    >
      <div className="mb-3 flex items-start justify-between gap-3" dir="rtl">
        <div>
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        {data.length > 0 && (
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            {toPersianDigits(vital)} علت = ۸۰٪ ضایعات
          </span>
        )}
      </div>
      <div className="mb-2 flex items-center gap-4" dir="rtl">
        {[{ l: "ضایعات", c: BAR }, { l: "درصد تجمعی", c: LINE }].map((s) => (
          <div key={s.l} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.c }} />
            <span className="text-[11px] text-gray-500 dark:text-gray-400">{s.l}</span>
          </div>
        ))}
      </div>
      <div className="relative h-[260px] w-full" dir="ltr">
        <div dir="rtl">
          <AnimatedChartTooltip
            visible={!!p}
            animKey={idx ?? -1}
            position="top-left"
            title={p?.name ?? ""}
            dark={dark}
            colorKey="pareto"
            glowColor={`${BAR}55`}
            rows={[
              { dotStyle: "square", label: "ضایعات", value: toPersianDigits(String(p?.waste ?? 0)), color: BAR },
              { dotStyle: "circle", label: "درصد تجمعی", value: `${toPersianDigits(String(p?.cumulative ?? 0))}٪`, color: LINE },
            ]}
          />
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 0, left: -16, bottom: 0 }} onMouseMove={onMove} onMouseLeave={() => setIdx(null)}>
            <defs>
              <linearGradient id={`pb-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BAR} stopOpacity={0.95} />
                <stop offset="100%" stopColor={BAR} stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="[&_line]:stroke-gray-100 dark:[&_line]:stroke-white/[0.04]" />
            <XAxis dataKey="name" tick={tick} className="[&_text]:fill-gray-500 dark:[&_text]:fill-gray-400" axisLine={false} tickLine={false} dy={5} minTickGap={12} tickFormatter={short} />
            <YAxis yAxisId="l" tick={tick} className="[&_text]:fill-gray-500 dark:[&_text]:fill-gray-400" axisLine={false} tickLine={false} tickFormatter={(v: number) => toPersianDigits(String(v))} />
            <YAxis yAxisId="r" orientation="right" domain={[0, 100]} ticks={[0, 25, 50, 80, 100]} tick={tick} className="[&_text]:fill-gray-500 dark:[&_text]:fill-gray-400" axisLine={false} tickLine={false} width={36} tickFormatter={(v: number) => `${toPersianDigits(String(v))}٪`} />
            <ReferenceLine yAxisId="r" y={80} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.6} />
            <Tooltip cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} content={() => null} />
            <Bar yAxisId="l" dataKey="waste" fill={`url(#pb-${uid})`} radius={[6, 6, 0, 0]} maxBarSize={44} isAnimationActive={false} />
            <Line yAxisId="r" type="monotone" dataKey="cumulative" stroke={LINE} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0, fill: LINE }} activeDot={{ r: 5, strokeWidth: 0, fill: LINE }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
        {data.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500" dir="rtl">
            داده‌ای برای نمایش وجود ندارد.
          </div>
        )}
      </div>
    </motion.div>
  );
}
