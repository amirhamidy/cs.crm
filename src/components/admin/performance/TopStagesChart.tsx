"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { TrendingUp, Ban, Award, AlertTriangle } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface StageRankItem {
  key: string;
  stage_name: string;
  department_name: string;
  total: number;
  sold: number;
  cancelled: number;
}

interface Props {
  topSoldStages: StageRankItem[];
  topCancelledStages: StageRankItem[];
  loading: boolean;
}

const SOLD_COLORS = [
  { color: "#2dd4bf", glow: "rgba(45,212,191,0.4)" },
  { color: "#0ea5e9", glow: "rgba(14,165,233,0.4)" },
  { color: "#38bdf8", glow: "rgba(56,189,248,0.4)" },
  { color: "#34d399", glow: "rgba(52,211,153,0.4)" },
  { color: "#4ade80", glow: "rgba(74,222,128,0.4)" },
  { color: "#a3e635", glow: "rgba(163,230,53,0.4)" },
  { color: "#22d3ee", glow: "rgba(34,211,238,0.4)" },
  { color: "#60a5fa", glow: "rgba(96,165,250,0.4)" },
  { color: "#818cf8", glow: "rgba(129,140,248,0.4)" },
  { color: "#6ee7b7", glow: "rgba(110,231,183,0.4)" },
];

const CANCEL_COLORS = [
  { color: "#fb7185", glow: "rgba(251,113,133,0.4)" },
  { color: "#f472b6", glow: "rgba(244,114,182,0.4)" },
  { color: "#e879f9", glow: "rgba(232,121,249,0.4)" },
  { color: "#c084fc", glow: "rgba(192,132,252,0.4)" },
  { color: "#fda4af", glow: "rgba(253,164,175,0.4)" },
  { color: "#f0abfc", glow: "rgba(240,171,252,0.4)" },
  { color: "#fb923c", glow: "rgba(251,146,60,0.4)" },
  { color: "#fbbf24", glow: "rgba(251,191,36,0.4)" },
  { color: "#f87171", glow: "rgba(248,113,113,0.4)" },
  { color: "#e879f9", glow: "rgba(232,121,249,0.4)" },
];

type TabKey = "sold" | "cancelled";

interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number;
  payload: StageRankItem & { fill: string; glow: string };
}

function Skeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/8 dark:bg-slate-950">
      <div className="mb-4 flex items-center justify-between" dir="rtl">
        <div className="space-y-2">
          <div className="h-4 w-44 animate-pulse rounded-full bg-gray-100 dark:bg-slate-900" />
          <div className="h-3 w-28 animate-pulse rounded-full bg-gray-100/80 dark:bg-slate-900/60" />
        </div>
        <div className="h-8 w-32 animate-pulse rounded-xl bg-gray-100 dark:bg-slate-900" />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3" dir="rtl">
            <div className="h-3 w-24 animate-pulse rounded-full bg-gray-100 dark:bg-slate-900" />
            <div
              className="h-7 animate-pulse rounded-md bg-gray-100 dark:bg-slate-900"
              style={{ width: `${70 - i * 9}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  tab,
  isDark,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  tab: TabKey;
  isDark: boolean;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const meta = tab === "sold" ? SOLD_COLORS : CANCEL_COLORS;
  const idx = 0;
  const glow = item.glow ?? meta[idx].glow;
  const color = item.fill ?? meta[idx].color;
  const value = tab === "sold" ? item.sold : item.cancelled;

  return (
    <div
      className="pointer-events-none rounded-xl border border-gray-200/60 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/95"
      style={{ boxShadow: `0 4px 20px ${glow}` }}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 6px ${glow}` }}
        />
        <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-100">
          {item.stage_name}
        </span>
      </div>
      <p className=" text-gray-500 dark:text-gray-400">
        {item.department_name}
      </p>
      <div className="mt-1.5 flex items-center gap-3">
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          {tab === "sold" ? "فروش" : "لغو"}:{" "}
          <span
            className="font-bold tabular-nums"
            style={{ color }}
          >
            {value.toLocaleString("fa-IR")}
          </span>
        </span>
        <span className="text-[11px] text-gray-400 dark:text-gray-500">
          کل: {item.total.toLocaleString("fa-IR")}
        </span>
      </div>
    </div>
  );
}

export default function TopStagesChart({
  topSoldStages,
  topCancelledStages,
  loading,
}: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [tab, setTab] = useState<TabKey>("sold");

  const activeData = useMemo(() => {
    const source = tab === "sold" ? topSoldStages : topCancelledStages;
    const palette = tab === "sold" ? SOLD_COLORS : CANCEL_COLORS;
    return source.slice(0, 8).map((item, i) => ({
      ...item,
      fill: palette[i % palette.length].color,
      glow: palette[i % palette.length].glow,
      value: tab === "sold" ? item.sold : item.cancelled,
    }));
  }, [tab, topSoldStages, topCancelledStages]);

  const accent =
    tab === "sold"
      ? { from: "#2dd4bf", to: "#0ea5e9", icon: TrendingUp, border: "rgba(45,212,191,0.12)", bg: "rgba(45,212,191,0.06)" }
      : { from: "#fb7185", to: "#c084fc", icon: Ban, border: "rgba(251,113,133,0.12)", bg: "rgba(251,113,133,0.06)" };

  const IconComp = accent.icon;

  if (loading) return <Skeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-2xl border p-4 shadow-sm"
      style={{
        borderColor: isDark ? accent.border : accent.border,
        background: isDark
          ? `linear-gradient(160deg, ${accent.bg}, rgba(15,23,42,0))`
          : `linear-gradient(160deg, ${accent.bg}, #ffffff)`,
      }}
    >
      <div className="mb-4 flex items-start justify-between gap-3" dir="rtl">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${accent.bg.replace("0.06", "0.2")}, rgba(129,140,248,0.15))`,
            }}
          >
            <IconComp
              size={15}
              style={{ color: accent.from }}
            />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
              رتبه‌بندی مراحل
            </h3>
            <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">
              برترین مراحل بر اساس{" "}
              {tab === "sold" ? "فروش" : "لغو"}
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-1 rounded-xl p-1"
          style={{
            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}`,
          }}
        >
          {(["sold", "cancelled"] as TabKey[]).map((t) => {
            const isActive = tab === t;
            const colors =
              t === "sold"
                ? { from: "#2dd4bf", to: "#0ea5e9" }
                : { from: "#fb7185", to: "#c084fc" };
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="relative rounded-lg px-3 py-1 text-[11px] font-semibold transition-colors"
                style={{
                  color: isActive
                    ? "#fff"
                    : isDark
                      ? "rgba(255,255,255,0.45)"
                      : "rgba(0,0,0,0.45)",
                }}
              >
                {isActive && (
                  <motion.span
                    layoutId="stage-tab-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                    }}
                    transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  />
                )}
                <span className="relative">
                  {t === "sold" ? "فروش" : "لغو"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: tab === "sold" ? -8 : 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: tab === "sold" ? 8 : -8 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {activeData.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-xs text-gray-400">
              داده‌ای در این بازه وجود ندارد
            </div>
          ) : (
            <>
              <div className="h-[220px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activeData}
                    layout="vertical"
                    margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                    barCategoryGap="22%"
                  >
                    <XAxis
                      type="number"
                      tick={{
                        fill: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
                        fontSize: 10,
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickCount={4}
                    />
                    <YAxis
                      type="category"
                      dataKey="stage_name"
                      width={80}
                      tick={{
                        fill: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
                        fontSize: 10,
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: string) =>
                        v.length > 9 ? v.slice(0, 9) + "…" : v
                      }
                    />
                    <Tooltip
                      content={
                        <CustomTooltip tab={tab} isDark={isDark} />
                      }
                      cursor={{
                        fill: isDark
                          ? "rgba(255,255,255,0.03)"
                          : "rgba(0,0,0,0.03)",
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {activeData.map((entry, i) => (
                        <Cell key={entry.key} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div
                className="mt-3 space-y-1.5 border-t pt-3"
                dir="rtl"
                style={{
                  borderColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.05)",
                }}
              >
                {activeData.slice(0, 3).map((item, i) => {
                  const rankIcons = [Award, Award, Award];
                  const rankColors = ["#fbbf24", "#94a3b8", "#d97706"];
                  const RankIcon = rankIcons[i];
                  const total = item.total || 1;
                  const pct = Math.round((item.value / total) * 100);

                  return (
                    <div
                      key={item.key}
                      className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                    >
                      <RankIcon
                        size={12}
                        style={{ color: rankColors[i], flexShrink: 0 }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="truncate text-[11.5px] font-semibold text-gray-800 dark:text-gray-200">
                            {item.stage_name}
                          </span>
                          <span
                            className="shrink-0 text-[11px] font-bold tabular-nums"
                            style={{ color: item.fill }}
                          >
                            {item.value.toLocaleString("fa-IR")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="relative mt-1 h-1 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                            <motion.div
                              className="absolute inset-y-0 right-0 rounded-full"
                              style={{ background: item.fill }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{
                                duration: 0.5,
                                delay: i * 0.07,
                                ease: [0.25, 0.46, 0.45, 0.94],
                              }}
                            />
                          </div>
                          <span className="shrink-0 text-[10px] text-gray-400 dark:text-gray-500">
                            {pct}٪
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                          {item.department_name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
