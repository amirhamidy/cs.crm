"use client";

import { AnimatePresence, m } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Sector } from "recharts";

type TimeRange = "weekly" | "monthly" | "yearly";

interface SourceCount {
  resourceId: number;
  name: string;
  value: number;
  color: string;
  glow: string;
}

type CategoryChartData = Record<TimeRange, SourceCount[]>;

type PieItem = SourceCount & {
  renderValue: number;
  ratio: number;
  offset: number;
};

type ActiveSlice = {
  id: number;
  label: string;
  value: number;
  color: string;
  glow: string;
  pct: string;
};

const ranges: { key: TimeRange; label: string; sub: string }[] = [
  { key: "weekly", label: "هفتگی", sub: "۷ روز اخیر" },
  { key: "monthly", label: "ماهانه", sub: "۳۰ روز اخیر" },
  { key: "yearly", label: "سالانه", sub: "۳۶۵ روز اخیر" },
];

const CATEGORY_PALETTE: string[] = [
  "#A78BFA",
  "#F472B6",
  "#F5A623",
  "#34D399",
  "#60A5FA",
  "#FBBF24",
  "#2DD4BF",
  "#FB7185",
  "#818CF8",
  "#A3E635",
  "#38BDF8",
  "#E879F9",
  "#22D3EE",
  "#8B5CF6",
  "#10B981",
  "#F97316",
  "#EAB308",
  "#EC4899",
  "#14B8A6",
  "#6366F1",
];

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getCategoryColor(index: number): string {
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
}

const LEGEND_LIMIT = 6;
const CROWDED_THRESHOLD = 12;
const SMALL_RATIO = 0.04;
const MIN_RENDER_RATIO = 0.015;
const BASE_OFFSET = 10;
const STAGGER_OFFSET = 8;
const RADIAN = Math.PI / 180;

export default function CategoryChart({
  data: rangeData,
}: {
  data: CategoryChartData;
}) {
  const [activeRange, setActiveRange] = useState<TimeRange>("weekly");
  const [activeSlice, setActiveSlice] = useState<ActiveSlice | null>(null);
  const [showAll, setShowAll] = useState(false);

  const data = useMemo<SourceCount[]>(
    () =>
      (rangeData[activeRange] ?? []).map((item, index) => {
        const color = getCategoryColor(index);
        return {
          ...item,
          color,
          glow: hexToRgba(color, 0.35),
        };
      }),
    [rangeData, activeRange],
  );

  const visibleItems = useMemo(
    () => (showAll ? data : data.slice(0, LEGEND_LIMIT)),
    [data, showAll],
  );

  const hiddenCount = Math.max(data.length - LEGEND_LIMIT, 0);

  const isCrowded = data.length > CROWDED_THRESHOLD;

  const total = useMemo(
    () => data.reduce((sum, item) => sum + item.value, 0),
    [data],
  );

  const totalFormatted = useMemo(
    () => total.toLocaleString("fa-IR"),
    [total],
  );

  const currentRange = useMemo(
    () => ranges.find((range) => range.key === activeRange),
    [activeRange],
  );

  const pieData = useMemo<PieItem[]>(() => {
    let smallCounter = 0;

    return data.map((item) => {
      const ratio = total ? item.value / total : 0;
      const isSmall = ratio < SMALL_RATIO;

      const offset = isSmall
        ? BASE_OFFSET + (smallCounter++ % 2) * STAGGER_OFFSET
        : 0;

      return {
        ...item,
        ratio,
        offset: isCrowded ? offset : 0,
        renderValue: Math.max(item.value, total * MIN_RENDER_RATIO),
      };
    });
  }, [data, total, isCrowded]);

  const handleMouseEnter = useCallback(
    (_: unknown, index: number) => {
      const item = data[index];
      if (!item) return;

      setActiveSlice({
        id: item.resourceId,
        label: item.name,
        value: item.value,
        color: item.color,
        glow: item.glow,
        pct: total ? ((item.value / total) * 100).toFixed(1) : "0.0",
      });
    },
    [data, total],
  );

  const handleMouseLeave = useCallback(() => {
    setActiveSlice(null);
  }, []);

  useEffect(() => {
    setActiveSlice(null);
    setShowAll(false);
  }, [activeRange]);

  const renderSlice = useCallback(
    (props: any) => {
      const {
        cx,
        cy,
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
        midAngle,
        payload,
      } = props;
      const item = payload as PieItem;

      const offset = item.offset ?? 0;
      const dx = offset * Math.cos(-RADIAN * midAngle);
      const dy = offset * Math.sin(-RADIAN * midAngle);

      const isActive = activeSlice?.id === item.resourceId;

      return (
        <g
          filter={isActive ? `url(#glow-${item.resourceId})` : undefined}
        >
          <Sector
            cx={cx + dx}
            cy={cy + dy}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={`url(#pieGrad-${item.resourceId})`}
            stroke="none"
          />
        </g>
      );
    },
    [activeSlice],
  );

  const pieDefs = (
    <defs>
      {data.map((item) => (
        <radialGradient
          key={`pieGrad-${item.resourceId}`}
          id={`pieGrad-${item.resourceId}`}
          cx="50%"
          cy="50%"
          r="50%"
        >
          <stop offset="0%" stopColor={item.color} stopOpacity={1} />
          <stop offset="100%" stopColor={item.color} stopOpacity={0.65} />
        </radialGradient>
      ))}

      {data.map((item) => (
        <filter
          key={`glow-${item.resourceId}`}
          id={`glow-${item.resourceId}`}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="3"
            floodColor={item.color}
            floodOpacity="0.6"
          />
        </filter>
      ))}
    </defs>
  );

  return (
    <div className="relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-gray-950">
      <div className="mb-3 flex items-start justify-between gap-3" dir="rtl">
        <div>
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
            بیشترین منابع مشتری
          </h3>

          <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">
            {currentRange?.sub}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-gray-100 bg-gray-50/80 p-1 dark:border-white/5 dark:bg-gray-900/50">
          {ranges.map((range) => (
            <button
              key={range.key}
              type="button"
              onClick={() => setActiveRange(range.key)}
              className="relative rounded-lg px-2.5 py-1 text-[11px] font-medium"
            >
              {activeRange === range.key && (
                <m.span
                  layoutId="categoryChartRangeIndicator"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-gray-800"
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
              <m.div
                key={`${activeRange}-${activeSlice.id}`}
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="pointer-events-none rounded-xl border border-gray-200/60 bg-white/95 px-3 py-2 shadow-lg dark:border-white/10 dark:bg-gray-900/95"
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
                  سهم منبع:{" "}
                  <span
                    className="font-bold tabular-nums"
                    style={{ color: activeSlice.color }}
                  >
                    {activeSlice.pct}%
                  </span>
                </p>
              </m.div>
            )}
          </AnimatePresence>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {pieDefs}

            <Pie
              key={`${activeRange}-${isCrowded}`}
              data={pieData}
              dataKey="renderValue"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={isCrowded ? 44 : 48}
              outerRadius={isCrowded ? 70 : 74}
              paddingAngle={data.length > 1 ? (isCrowded ? 1 : 4) : 0}
              strokeWidth={0}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              isAnimationActive={false}
              shape={renderSlice}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {activeSlice ? (
              <m.div
                key={activeSlice.id}
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
              </m.div>
            ) : (
              <m.div
                key="total"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="text-center"
              >
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  کل
                </p>

                <p className="text-[16px] font-bold tabular-nums text-gray-700 dark:text-gray-200">
                  {totalFormatted}
                </p>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1" dir="rtl">
        {visibleItems.map((entry: SourceCount) => {
          const pct = total
            ? ((entry.value / total) * 100).toFixed(1)
            : "0.0";

          const isActive = activeSlice?.id === entry.resourceId;

          return (
            <div
              key={`${activeRange}-${entry.resourceId}`}
              className="flex cursor-default items-center gap-1.5 rounded-lg px-2 py-1 transition-colors duration-150"
              style={{
                backgroundColor: isActive ? entry.glow : "transparent",
              }}
            >
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />

              <span className="flex-1 truncate text-[12px] text-gray-600 dark:text-gray-300">
                {entry.name}
              </span>

              <span
                className="tabular-nums text-[12px] font-bold"
                style={{ color: entry.color }}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>

      {hiddenCount > 0 && (
        <div className="mt-2" dir="rtl">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            aria-expanded={showAll}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50/80 py-1.5 text-[11px] font-medium text-gray-500 transition-colors hover:bg-white hover:text-gray-900 dark:border-white/5 dark:bg-gray-900/50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <span>
              {showAll
                ? "نمایش کمتر"
                : `دیدن بقیه (${hiddenCount.toLocaleString("fa-IR")}+)`}
            </span>

            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${showAll ? "rotate-180" : ""
                }`}
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
