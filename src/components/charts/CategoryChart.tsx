"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { useCustomerSources, type SliceKey, type TimeRange } from "@/hooks/useCustomerSources";

const ranges: { key: TimeRange; label: string; sub: string }[] = [
  { key: "weekly", label: "هفتگی", sub: "۷ روز اخیر" },
  { key: "monthly", label: "ماهانه", sub: "۳۰ روز اخیر" },
  { key: "yearly", label: "سالانه", sub: "۳۶۵ روز اخیر" },
];

const chartMeta: Record<SliceKey, { label: string; color: string; glow: string }> = {
  instagram: { label: "اینستاگرام", color: "#f472b6", glow: "rgba(244,114,182,0.35)" },
  website: { label: "وب‌سایت", color: "#38bdf8", glow: "rgba(56,189,248,0.35)" },
  referral: { label: "معرفی", color: "#4ade80", glow: "rgba(74,222,128,0.35)" },
  ads: { label: "تبلیغات", color: "#fb923c", glow: "rgba(251,146,60,0.35)" },
  other: { label: "سایر", color: "#a78bfa", glow: "rgba(167,139,250,0.35)" },
};

type ActiveSlice = {
  name: SliceKey;
  label: string;
  value: number;
  color: string;
  glow: string;
  pct: string;
};

function ChartSkeleton() {
  return (
    <div className="relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-slate-950">
      <div className="mb-3 flex items-start justify-between gap-3" dir="rtl">
        <div className="space-y-2">
          <div className="h-4 w-36 animate-pulse rounded-md bg-gray-200 dark:bg-slate-800" />
          <div className="h-3 w-24 animate-pulse rounded-md bg-gray-100 dark:bg-slate-800/60" />
        </div>
        <div className="h-8 w-36 animate-pulse rounded-xl bg-gray-100 dark:bg-slate-800/60" />
      </div>
      <div className="flex h-[180px] items-center justify-center">
        <div className="h-[148px] w-[148px] animate-pulse rounded-full bg-gray-100 dark:bg-slate-800/60" />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1" dir="rtl">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-7 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800/60"
          />
        ))}
      </div>
    </div>
  );
}

export default function CategoryChart() {
  const { data: rangeData, loading, error } = useCustomerSources();
  const [activeRange, setActiveRange] = useState<TimeRange>("weekly");
  const [activeSlice, setActiveSlice] = useState<ActiveSlice | null>(null);

  const data = useMemo(() => rangeData[activeRange] ?? [], [rangeData, activeRange]);

  const total = useMemo(() => data.reduce((sum, i) => sum + i.value, 0), [data]);
  const totalFormatted = useMemo(() => total.toLocaleString("fa-IR"), [total]);
  const currentRange = useMemo(
    () => ranges.find((r) => r.key === activeRange),
    [activeRange],
  );

  const handleMouseEnter = useCallback(
    (_: unknown, index: number) => {
      const item = data[index];
      if (!item) return;
      const meta = chartMeta[item.name];
      setActiveSlice({
        name: item.name,
        label: meta.label,
        value: item.value,
        color: meta.color,
        glow: meta.glow,
        pct: total ? ((item.value / total) * 100).toFixed(1) : "0.0",
      });
    },
    [data, total],
  );

  const handleMouseLeave = useCallback(() => setActiveSlice(null), []);

  useEffect(() => setActiveSlice(null), [activeRange]);

  const pieDefs = (
    <defs>
      {(Object.entries(chartMeta) as [SliceKey, (typeof chartMeta)[SliceKey]][]).map(
        ([key, meta]) => (
          <radialGradient key={key} id={`pieGrad-${key}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={meta.color} stopOpacity={1} />
            <stop offset="100%" stopColor={meta.color} stopOpacity={0.65} />
          </radialGradient>
        ),
      )}
      {(Object.entries(chartMeta) as [SliceKey, (typeof chartMeta)[SliceKey]][]).map(
        ([key, meta]) => (
          <filter
            key={`filter-${key}`}
            id={`glow-${key}`}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="3"
              floodColor={meta.color}
              floodOpacity="0.6"
            />
          </filter>
        ),
      )}
    </defs>
  );

  if (loading) return <ChartSkeleton />;

  if (error)
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-red-200/50 bg-white dark:border-red-500/10 dark:bg-slate-950">
        <p className="text-[13px] text-red-400">{error}</p>
      </div>
    );

  return (
    <div className="relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-slate-950">
      <div className="mb-3 flex items-start justify-between gap-3" dir="rtl">
        <div>
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
            بیشترین منابع فروش
          </h3>
          <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">
            {currentRange?.sub}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-gray-100 bg-gray-50/80 p-1 dark:border-white/5 dark:bg-slate-900/50">
          {ranges.map((range) => (
            <button
              key={range.key}
              type="button"
              onClick={() => setActiveRange(range.key)}
              className="relative rounded-lg px-2.5 py-1 text-[11px] font-medium"
            >
              {activeRange === range.key && (
                <motion.span
                  layoutId="categoryChartRangeIndicator"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-slate-800"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span
                className={`relative z-10 transition-colors ${activeRange === range.key
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                  }`}
              >
                {range.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[180px]">
        <div className="absolute left-2 top-2 z-10 min-w-[140px]">
          <AnimatePresence mode="wait">
            {activeSlice && (
              <motion.div
                key={`${activeRange}-${activeSlice.name}`}
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="pointer-events-none rounded-xl border border-gray-200/60 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/95"
                style={{ boxShadow: `0 4px 20px ${activeSlice.glow}` }}
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: activeSlice.color }}
                  />
                  <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-100">
                    {activeSlice.label}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  سهم فروش:{" "}
                  <span
                    className="font-bold tabular-nums"
                    style={{ color: activeSlice.color }}
                  >
                    {activeSlice.pct}%
                  </span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {pieDefs}
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={74}
              paddingAngle={4}
              strokeWidth={0}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              isAnimationActive={false}
            >
              {data.map((entry) => {
                const isActive = activeSlice?.name === entry.name;
                return (
                  <Cell
                    key={`${activeRange}-${entry.name}`}
                    fill={`url(#pieGrad-${entry.name})`}
                    stroke="none"
                    filter={isActive ? `url(#glow-${entry.name})` : undefined}
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {activeSlice ? (
              <motion.div
                key={activeSlice.name}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.12 }}
                className="text-center"
              >
                <p
                  className="text-[20px] font-bold tabular-nums"
                  style={{ color: activeSlice.color }}
                >
                  {activeSlice.pct}%
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="total"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="text-center"
              >
                <p className="text-[10px] text-gray-400 dark:text-gray-500">کل</p>
                <p className="text-[16px] font-bold tabular-nums text-gray-700 dark:text-gray-200">
                  {totalFormatted}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1" dir="rtl">
        {data.map((entry) => {
          const meta = chartMeta[entry.name];
          const pct = total ? ((entry.value / total) * 100).toFixed(1) : "0.0";
          const isActive = activeSlice?.name === entry.name;

          return (
            <div
              key={`${activeRange}-${entry.name}`}
              className="flex cursor-default items-center gap-1.5 rounded-lg px-2 py-1 transition-colors duration-150"
              style={{ backgroundColor: isActive ? meta.glow : "transparent" }}
            >
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
              <span className="flex-1 text-[12px] text-gray-600 dark:text-gray-300">
                {meta.label}
              </span>
              <span
                className="tabular-nums text-[12px] font-bold"
                style={{ color: meta.color }}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
