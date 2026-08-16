"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { useCancelledTasksByDept, TimeRange } from "@/hooks/useCancelledTasksByDept";

type ActiveBar = {
  stage: string;
  issues: number;
  color: string;
  glow: string;
  index: number;
  isEmpty: boolean;
};

const ranges: { key: TimeRange; label: string; sub: string }[] = [
  { key: "weekly", label: "هفتگی", sub: "هفته اخیر" },
  { key: "monthly", label: "ماهانه", sub: "ماه اخیر" },
  { key: "yearly", label: "سالانه", sub: "سال اخیر" },
];

const BAR_COLORS = [
  { color: "#ef4444", glow: "rgba(239,68,68,0.5)" },
  { color: "#f97316", glow: "rgba(249,115,22,0.5)" },
  { color: "#eab308", glow: "rgba(234,179,8,0.5)" },
  { color: "#0ea5e9", glow: "rgba(14,165,233,0.5)" },
  { color: "#a855f7", glow: "rgba(168,85,247,0.5)" },
  { color: "#22c55e", glow: "rgba(34,197,94,0.5)" },
  { color: "#ec4899", glow: "rgba(236,72,153,0.5)" },
];

const STATIC_DEFS_LIGHT = (
  <defs>
    {BAR_COLORS.map((meta, i) => (
      <linearGradient key={i} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={meta.color} stopOpacity={1} />
        <stop offset="100%" stopColor={meta.color} stopOpacity={0.65} />
      </linearGradient>
    ))}
  </defs>
);

const STATIC_DEFS_DARK = (
  <defs>
    {BAR_COLORS.map((meta, i) => (
      <linearGradient key={i} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={meta.color} stopOpacity={0.95} />
        <stop offset="100%" stopColor={meta.color} stopOpacity={0.5} />
      </linearGradient>
    ))}
  </defs>
);

function CustomBarShape({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  activeIndex,
  isDark,
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  activeIndex: number | null;
  isDark: boolean;
}) {
  if (height <= 0) return null;
  const isActive = activeIndex === index;
  const meta = BAR_COLORS[index % BAR_COLORS.length];
  const radius = 5;

  return (
    <g>
      {isActive && (
        <rect
          x={x - 2}
          y={y - 2}
          width={width + 4}
          height={height + 2}
          rx={radius + 1}
          fill={meta.color}
          opacity={0.15}
        />
      )}
      <path
        d={`M ${x},${y + height} L ${x},${y + radius} Q ${x},${y} ${x + radius},${y} L ${x + width - radius},${y} Q ${x + width},${y} ${x + width},${y + radius} L ${x + width},${y + height} Z`}
        fill={`url(#barGrad-${index})`}
        style={{
          filter: isActive ? `drop-shadow(0 0 8px ${meta.glow})` : "none",
          transition: "filter 0.2s ease",
        }}
      />
    </g>
  );
}

function CustomBgShape({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  activeIndex,
  isDark,
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  activeIndex: number | null;
  isDark: boolean;
}) {
  if (height <= 0) return null;
  const isActive = activeIndex === index;
  const radius = 5;
  const strokeColor = isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1";
  const fillColor = isDark
    ? "rgba(255,255,255,0.03)"
    : "rgba(148,163,184,0.08)";

  return (
    <g
      opacity={isActive ? 1 : 0.75}
      style={{ transition: "opacity 0.2s ease" }}
    >
      <path
        d={`M ${x},${y + height} L ${x},${y + radius} Q ${x},${y} ${x + radius},${y} L ${x + width - radius},${y} Q ${x + width},${y} ${x + width},${y + radius} L ${x + width},${y + height} Z`}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />
    </g>
  );
}

function CustomXAxisTick({
  x,
  y,
  payload,
  isDark,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  isDark: boolean;
}) {
  if (!payload?.value || x === undefined || y === undefined) return null;
  return (
    <text
      x={x}
      y={y + 14}
      textAnchor="middle"
      fontSize={11}
      fontWeight={500}
      fill={isDark ? "#64748b" : "#64748b"}
    >
      {payload.value}
    </text>
  );
}

function SalesIssuesChartSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/5 dark:bg-slate-950">
      <div className="mb-3 flex items-start justify-between gap-3" dir="rtl">
        <div className="space-y-2">
          <div className="h-4 w-36 animate-pulse rounded-full bg-gray-100 dark:bg-slate-900" />
          <div className="h-3 w-20 animate-pulse rounded-full bg-gray-100/80 dark:bg-slate-900/60" />
        </div>
        <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-900" />
      </div>
      <div className="flex h-[180px] items-end gap-2 px-2">
        {[60, 80, 45, 70, 35, 55].map((h, i) => (
          <div
            key={i}
            className="flex-1 animate-pulse rounded-t-md bg-gray-100 dark:bg-slate-900"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function SalesIssuesChart() {
  const { chartData, loading, error } = useCancelledTasksByDept();
  const [activeRange, setActiveRange] = useState<TimeRange>("monthly");
  const [activeBar, setActiveBar] = useState<ActiveBar | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const allDepartments = useMemo(() => {
    const seen = new Set<string>();
    Object.values(chartData).forEach((rangeData) => {
      rangeData.forEach((item) => seen.add(item.stage));
    });
    return Array.from(seen);
  }, [chartData]);

  const data = useMemo(() => {
    const current = chartData[activeRange];
    const map = new Map(current.map((item) => [item.stage, item.issues]));
    return allDepartments.map((stage) => ({
      stage,
      issues: map.get(stage) ?? 0,
    }));
  }, [chartData, activeRange, allDepartments]);

  useEffect(() => {
    setActiveBar(null);
  }, [activeRange]);

  const currentRange = useMemo(
    () => ranges.find((r) => r.key === activeRange),
    [activeRange]
  );

  const formattedIssues = useMemo(
    () =>
      activeBar && !activeBar.isEmpty
        ? activeBar.issues.toLocaleString("fa-IR")
        : null,
    [activeBar]
  );

  const maxValue = useMemo(
    () => Math.max(...data.map((d) => d.issues), 1),
    [data]
  );

  const displayData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        bgBar: item.issues === 0 ? maxValue : 0,
      })),
    [data, maxValue]
  );

  const handleMouseEnter = useCallback(
    (_: unknown, index: number) => {
      const item = data[index];
      if (!item) return;
      const meta = BAR_COLORS[index % BAR_COLORS.length];
      const isEmpty = item.issues === 0;
      setActiveBar({
        stage: item.stage,
        issues: item.issues,
        color: meta.color,
        glow: meta.glow,
        index,
        isEmpty,
      });
    },
    [data]
  );

  const handleMouseLeave = useCallback(() => setActiveBar(null), []);

  const renderBarShape = useCallback(
    (props: unknown) => {
      const p = props as { x?: number; y?: number; width?: number; height?: number; index?: number };
      return (
        <CustomBarShape
          {...p}
          activeIndex={activeBar?.index ?? null}
          isDark={isDark}
        />
      );
    },
    [activeBar?.index, isDark]
  );

  const renderBgShape = useCallback(
    (props: unknown) => {
      const p = props as { x?: number; y?: number; width?: number; height?: number; index?: number };
      return (
        <CustomBgShape
          {...p}
          activeIndex={activeBar?.index ?? null}
          isDark={isDark}
        />
      );
    },
    [activeBar?.index, isDark]
  );

  const renderXTick = useCallback(
    (props: unknown) => (
      <CustomXAxisTick {...(props as any)} isDark={isDark} />
    ),
    [isDark]
  );

  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "#e2e8f0";
  const chartDefs = isDark ? STATIC_DEFS_DARK : STATIC_DEFS_LIGHT;

  if (loading) return <SalesIssuesChartSkeleton />;
  if (error) {
    return (
      <div className="flex h-[256px] items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-4 text-center text-xs text-red-600 dark:border-red-950/20 dark:bg-red-950/5 dark:text-red-400">
        خطایی در لود کردن اطلاعات رخ داد: {error}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-slate-950"
    >
      <div className="mb-3 flex items-start justify-between gap-3" dir="rtl">
        <div>
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
            دپارتمان‌های با بیشترین لغو تسک
          </h3>
          <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">
            {currentRange?.sub}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-white/5 dark:bg-slate-900/50">
          {ranges.map((range) => (
            <button
              key={range.key}
              type="button"
              onClick={() => setActiveRange(range.key)}
              className="relative rounded-lg px-2.5 py-1 text-[11px] font-medium"
            >
              {activeRange === range.key && (
                <motion.span
                  layoutId="salesIssuesRangeIndicator"
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

      {/* Tooltip */}
      <div className="absolute left-2 top-14 z-10 min-w-[150px]">
        <AnimatePresence mode="wait">
          {activeBar && (
            <motion.div
              key={`${activeRange}-${activeBar.stage}`}
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="pointer-events-none rounded-xl border border-gray-200/60 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/95"
              style={{
                boxShadow: activeBar.isEmpty
                  ? "0 4px 20px rgba(0,0,0,0.08)"
                  : `0 4px 20px ${activeBar.glow}`,
              }}
            >
              <div className="mb-1 flex items-center gap-1.5">
                {activeBar.isEmpty ? (
                  <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                ) : (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: activeBar.color,
                      boxShadow: `0 0 6px ${activeBar.glow}`,
                    }}
                  />
                )}
                <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-100">
                  {activeBar.stage}
                </span>
              </div>
              {activeBar.isEmpty ? (
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  هنوز آماری ثبت نشده
                </p>
              ) : (
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  تعداد لغو شده:{" "}
                  <span
                    className="font-bold tabular-nums"
                    style={{ color: activeBar.color }}
                  >
                    {formattedIssues}
                  </span>
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-[200px] w-full">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            هیچ دپارتمانی ثبت نشده است.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayData}
              margin={{ top: 8, right: 4, left: -24, bottom: 8 }}
              barCategoryGap="28%"
              barGap={0}
              onMouseLeave={handleMouseLeave}
            >
              {chartDefs}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                vertical={false}
              />
              <XAxis
                dataKey="stage"
                axisLine={false}
                tickLine={false}
                tick={renderXTick}
                interval={0}
                height={28}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fontWeight: 500 }}
                className="[&_text]:fill-gray-400 dark:[&_text]:fill-gray-500"
              />
              {/* بار پس‌زمینه برای دپارتمان‌های خالی */}
              <Bar
                dataKey="bgBar"
                shape={renderBgShape}
                onMouseEnter={handleMouseEnter}
                isAnimationActive={false}
                stackId="a"
              >
                {displayData.map((_, i) => (
                  <Cell key={i} fill="transparent" />
                ))}
              </Bar>
              {/* بار اصلی */}
              <Bar
                dataKey="issues"
                shape={renderBarShape}
                onMouseEnter={handleMouseEnter}
                stackId="a"
              >
                {displayData.map((item, i) => (
                  <Cell
                    key={i}
                    fill={item.issues === 0 ? "transparent" : `url(#barGrad-${i})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
