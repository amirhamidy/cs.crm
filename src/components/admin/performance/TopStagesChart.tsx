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
import type {
  StageRankItem,
  TimeRange,
} from "@/hooks/useTopStagesRanking";

type TabKey = "sold" | "completed" | "in_progress" | "cancelled";

type ActiveBar = {
  stage: string;
  department: string;
  value: number;
  color: string;
  glow: string;
  index: number;
};

type TopStagesChartProps = {
  topSoldStages: StageRankItem[];
  topCompletedStages: StageRankItem[];
  topInProgressStages: StageRankItem[];
  topCancelledStages: StageRankItem[];
  loading: boolean;
  activeRange?: TimeRange;
};

const ranges: { key: TimeRange; label: string; sub: string }[] = [
  { key: "weekly", label: "هفتگی", sub: "هفته اخیر" },
  { key: "monthly", label: "ماهانه", sub: "ماه اخیر" },
  { key: "yearly", label: "سالانه", sub: "سال اخیر" },
];

const tabs: { key: TabKey; label: string }[] = [
  { key: "sold", label: "فروش" },
  { key: "completed", label: "تکمیل شده" },
  { key: "in_progress", label: "در حال انجام" },
  { key: "cancelled", label: "لغو" },
];

const PALETTES: Record<
  TabKey,
  { color: string; glow: string }[]
> = {
  sold: [
    {
      color: "#22c55e",
      glow: "rgba(34,197,94,0.5)",
    },
    {
      color: "#16a34a",
      glow: "rgba(22,163,74,0.5)",
    },
    {
      color: "#4ade80",
      glow: "rgba(74,222,128,0.5)",
    },
    {
      color: "#15803d",
      glow: "rgba(21,128,61,0.5)",
    },
    {
      color: "#86efac",
      glow: "rgba(134,239,172,0.5)",
    },
  ],
  completed: [
    {
      color: "#0ea5e9",
      glow: "rgba(14,165,233,0.5)",
    },
    {
      color: "#0284c7",
      glow: "rgba(2,132,199,0.5)",
    },
    {
      color: "#38bdf8",
      glow: "rgba(56,189,248,0.5)",
    },
    {
      color: "#0369a1",
      glow: "rgba(3,105,161,0.5)",
    },
    {
      color: "#7dd3fc",
      glow: "rgba(125,211,252,0.5)",
    },
  ],
  in_progress: [
    {
      color: "#d946ef",
      glow: "rgba(217,70,239,0.5)",
    },
    {
      color: "#a855f7",
      glow: "rgba(168,85,247,0.5)",
    },
    {
      color: "#ec4899",
      glow: "rgba(236,72,153,0.5)",
    },
    {
      color: "#9333ea",
      glow: "rgba(147,51,234,0.5)",
    },
    {
      color: "#f0abfc",
      glow: "rgba(240,171,252,0.5)",
    },
  ],
  cancelled: [
    {
      color: "#ef4444",
      glow: "rgba(239,68,68,0.5)",
    },
    {
      color: "#dc2626",
      glow: "rgba(220,38,38,0.5)",
    },
    {
      color: "#f87171",
      glow: "rgba(248,113,113,0.5)",
    },
    {
      color: "#b91c1c",
      glow: "rgba(185,28,28,0.5)",
    },
    {
      color: "#fca5a5",
      glow: "rgba(252,165,165,0.5)",
    },
  ],
};

const getValue = (
  item: StageRankItem,
  tab: TabKey,
) => {
  if (tab === "sold") return item.sold;
  if (tab === "completed") return item.completed;
  if (tab === "in_progress") return item.in_progress;
  return item.cancelled;
};

function buildDefs(
  tab: TabKey,
  palette: { color: string; glow: string }[],
  isDark: boolean,
) {
  return (
    <defs>
      {palette.map((meta, i) => (
        <linearGradient
          key={i}
          id={`stageBarGrad-${tab}-${i}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor={meta.color}
            stopOpacity={isDark ? 0.95 : 1}
          />
          <stop
            offset="100%"
            stopColor={meta.color}
            stopOpacity={isDark ? 0.5 : 0.65}
          />
        </linearGradient>
      ))}
    </defs>
  );
}

function CustomBarShape({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  activeIndex,
  palette,
  tab,
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  activeIndex: number | null;
  palette: { color: string; glow: string }[];
  tab: TabKey;
}) {
  if (height <= 0) return null;

  const isActive = activeIndex === index;
  const meta = palette[index % palette.length];
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
        d={`M ${x},${y + height} L ${x},${y + radius} Q ${x},${y} ${x + radius
          },${y} L ${x + width - radius},${y} Q ${x + width
          },${y} ${x + width},${y + radius} L ${x + width
          },${y + height} Z`}
        fill={`url(#stageBarGrad-${tab}-${index})`}
        style={{
          filter: isActive
            ? `drop-shadow(0 0 8px ${meta.glow})`
            : "none",
          transition: "filter 0.2s ease",
        }}
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
  if (
    !payload?.value ||
    x === undefined ||
    y === undefined
  ) {
    return null;
  }

  const label =
    payload.value.length > 9
      ? payload.value.slice(0, 9) + "…"
      : payload.value;

  return (
    <text
      x={x}
      y={y + 14}
      textAnchor="middle"
      fontSize={11}
      fontWeight={500}
      fill={isDark ? "#64748b" : "#64748b"}
    >
      {label}
    </text>
  );
}

function TopStagesChartSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/5 dark:bg-slate-950">
      <div
        className="mb-3 flex items-start justify-between gap-3"
        dir="rtl"
      >
        <div className="space-y-2">
          <div className="h-4 w-36 animate-pulse rounded-full bg-gray-100 dark:bg-slate-900" />
          <div className="h-3 w-20 animate-pulse rounded-full bg-gray-100/80 dark:bg-slate-900/60" />
        </div>

        <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-900" />
      </div>

      <div className="flex h-[180px] items-end gap-2 px-2">
        {[60, 80, 45, 70, 35].map((h, i) => (
          <div
            key={i}
            className="w-6 animate-pulse rounded-t-md bg-gray-100 dark:bg-slate-900"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function TopStagesChart({
  topSoldStages,
  topCompletedStages,
  topInProgressStages,
  topCancelledStages,
  loading,
  activeRange: externalRange,
}: TopStagesChartProps) {
  const [internalRange, setInternalRange] =
    useState<TimeRange>(
      externalRange ?? "monthly",
    );

  const [activeTab, setActiveTab] =
    useState<TabKey>("sold");

  const [activeBar, setActiveBar] =
    useState<ActiveBar | null>(null);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const activeRange =
    externalRange ?? internalRange;

  const palette = PALETTES[activeTab];

  const rangeData = useMemo(() => {
    const sourceMap: Record<
      TabKey,
      StageRankItem[]
    > = {
      sold: topSoldStages,
      completed: topCompletedStages,
      in_progress: topInProgressStages,
      cancelled: topCancelledStages,
    };

    return sourceMap[activeTab] ?? [];
  }, [
    activeTab,
    topSoldStages,
    topCompletedStages,
    topInProgressStages,
    topCancelledStages,
  ]);

  const chartRows = useMemo(() => {
    return [...rangeData]
      .map((item) => ({
        key: item.key,
        stage_name: item.stage_name,
        department_name: item.department_name,
        total: item.total,
        value: getValue(item, activeTab),
      }))
      .filter((item) => item.value > 0)
      .sort(
        (a, b) =>
          b.value - a.value ||
          b.total - a.total,
      )
      .slice(0, 5);
  }, [rangeData, activeTab]);

  useEffect(() => {
    setActiveBar(null);
  }, [activeRange, activeTab]);

  const currentRange = useMemo(
    () =>
      ranges.find(
        (r) => r.key === activeRange,
      ),
    [activeRange],
  );

  const currentTab = useMemo(
    () =>
      tabs.find(
        (t) => t.key === activeTab,
      ),
    [activeTab],
  );

  const formattedValue = useMemo(
    () =>
      activeBar
        ? activeBar.value.toLocaleString(
          "fa-IR",
        )
        : null,
    [activeBar],
  );

  const handleMouseEnter = useCallback(
    (_: unknown, index: number) => {
      const item = chartRows[index];

      if (!item) return;

      const meta =
        palette[index % palette.length];

      setActiveBar({
        stage: item.stage_name,
        department:
          item.department_name,
        value: item.value,
        color: meta.color,
        glow: meta.glow,
        index,
      });
    },
    [chartRows, palette],
  );

  const handleMouseLeave = useCallback(
    () => setActiveBar(null),
    [],
  );

  const renderBarShape = useCallback(
    (props: unknown) => {
      const p = props as {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        index?: number;
      };

      return (
        <CustomBarShape
          {...p}
          activeIndex={
            activeBar?.index ?? null
          }
          palette={palette}
          tab={activeTab}
        />
      );
    },
    [
      activeBar?.index,
      palette,
      activeTab,
    ],
  );

  const renderXTick = useCallback(
    (props: unknown) => (
      <CustomXAxisTick
        {...(props as {
          x?: number;
          y?: number;
          payload?: {
            value: string;
          };
        })}
        isDark={isDark}
      />
    ),
    [isDark],
  );

  const gridColor = isDark
    ? "rgba(255,255,255,0.04)"
    : "#e2e8f0";

  const accentColor = palette[0].color;

  if (loading) {
    return <TopStagesChartSkeleton />;
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 6,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.3,
        ease: [
          0.25,
          0.46,
          0.45,
          0.94,
        ],
      }}
      className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-slate-950"
    >
      <div
        className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        dir="rtl"
      >
        <div>
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
            رتبه‌بندی مراحل بر اساس{" "}
            <span
              style={{
                color: accentColor,
              }}
            >
              {currentTab?.label}
            </span>
          </h3>

          <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">
            {currentRange?.sub}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-white/5 dark:bg-slate-900/50">
            {ranges.map((range) => (
              <button
                key={range.key}
                type="button"
                onClick={() =>
                  setInternalRange(
                    range.key,
                  )
                }
                className="relative rounded-lg px-2.5 py-1 text-[11px] font-medium"
              >
                {activeRange ===
                  range.key && (
                    <motion.span
                      layoutId="topStagesRangeIndicator"
                      className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-slate-800"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}

                <span
                  className={`relative z-10 transition-colors ${activeRange ===
                      range.key
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-400"
                    }`}
                >
                  {range.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-white/5 dark:bg-slate-900/50">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() =>
                  setActiveTab(
                    t.key,
                  )
                }
                className="relative rounded-lg px-2.5 py-1 text-[11px] font-medium"
              >
                {activeTab ===
                  t.key && (
                    <motion.span
                      layoutId="topStagesTabIndicator"
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background:
                          PALETTES[
                            t.key
                          ][0]
                            .color,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}

                <span
                  className={`relative z-10 transition-colors ${activeTab ===
                      t.key
                      ? "text-white"
                      : "text-gray-500 dark:text-gray-400"
                    }`}
                >
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute left-2 top-24 z-10 min-w-[150px]">
        <AnimatePresence mode="wait">
          {activeBar && (
            <motion.div
              key={`${activeRange}-${activeTab}-${activeBar.stage}`}
              initial={{
                opacity: 0,
                y: 4,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 4,
                scale: 0.96,
              }}
              transition={{
                duration: 0.15,
                ease: [
                  0.25,
                  0.46,
                  0.45,
                  0.94,
                ],
              }}
              className="pointer-events-none rounded-xl border border-gray-200/60 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/95"
              style={{
                boxShadow: `0 4px 20px ${activeBar.glow}`,
              }}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      activeBar.color,
                    boxShadow: `0 0 6px ${activeBar.glow}`,
                  }}
                />

                <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-100">
                  {activeBar.stage}
                </span>
              </div>

              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                {
                  activeBar.department
                }
              </p>

              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                {
                  currentTab?.label
                }
                :{" "}
                <span
                  className="font-bold tabular-nums"
                  style={{
                    color: activeBar.color,
                  }}
                >
                  {
                    formattedValue
                  }
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-[200px] w-full">
        {chartRows.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            داده‌ای در این بازه وجود ندارد
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={chartRows}
              margin={{
                top: 8,
                right: 4,
                left: -24,
                bottom: 8,
              }}
              barCategoryGap="40%"
              barGap={0}
              onMouseLeave={
                handleMouseLeave
              }
            >
              {buildDefs(
                activeTab,
                palette,
                isDark,
              )}

              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                vertical={false}
              />

              <XAxis
                dataKey="stage_name"
                axisLine={false}
                tickLine={false}
                tick={renderXTick}
                interval={0}
                height={28}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 11,
                  fontWeight: 500,
                }}
                className="[&_text]:fill-gray-400 dark:[&_text]:fill-gray-500"
              />

              <Bar
                dataKey="value"
                shape={renderBarShape}
                onMouseEnter={
                  handleMouseEnter
                }
                barSize={26}
                maxBarSize={28}
              >
                {chartRows.map(
                  (item, i) => (
                    <Cell
                      key={
                        item.key
                      }
                      fill={`url(#stageBarGrad-${activeTab}-${i})`}
                    />
                  ),
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}