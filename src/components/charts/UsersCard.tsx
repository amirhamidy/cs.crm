"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crown, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";

type TimeRange = "weekly" | "monthly" | "yearly";
type Trend = "up" | "down" | "same";

interface User {
  id: number;
  name: string;
  role: string;
  avatar: string;
  sales: number;
  deals: number;
  trend: Trend;
  trendPct: number;
}

const dataByRange: Record<TimeRange, User[]> = {
  weekly: [
    { id: 1, name: "علی رضایی", role: "مدیر فروش", avatar: "ع", sales: 124000000, deals: 8, trend: "up", trendPct: 12 },
    { id: 2, name: "سارا محمدی", role: "کارشناس فروش", avatar: "س", sales: 98000000, deals: 6, trend: "up", trendPct: 5 },
    { id: 3, name: "مهدی کریمی", role: "کارشناس فروش", avatar: "م", sales: 87500000, deals: 5, trend: "down", trendPct: 3 },
  ],
  monthly: [
    { id: 1, name: "سارا محمدی", role: "کارشناس فروش", avatar: "س", sales: 412000000, deals: 28, trend: "up", trendPct: 18 },
    { id: 2, name: "علی رضایی", role: "مدیر فروش", avatar: "ع", sales: 387000000, deals: 24, trend: "up", trendPct: 9 },
    { id: 3, name: "فاطمه احمدی", role: "سرپرست فروش", avatar: "ف", sales: 334000000, deals: 21, trend: "up", trendPct: 14 },
  ],
  yearly: [
    { id: 1, name: "علی رضایی", role: "مدیر فروش", avatar: "ع", sales: 4820000000, deals: 287, trend: "up", trendPct: 23 },
    { id: 2, name: "فاطمه احمدی", role: "سرپرست فروش", avatar: "ف", sales: 4210000000, deals: 251, trend: "up", trendPct: 31 },
    { id: 3, name: "سارا محمدی", role: "کارشناس فروش", avatar: "س", sales: 3760000000, deals: 219, trend: "up", trendPct: 17 },
  ],
};

const RANK_META = [
  { bg: "rgba(250,204,21,0.15)", border: "rgba(250,204,21,0.4)", text: "#facc15", glow: "rgba(250,204,21,0.55)" },
  { bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.35)", text: "#94a3b8", glow: "rgba(148,163,184,0.45)" },
  { bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.35)", text: "#fb923c", glow: "rgba(251,146,60,0.45)" },
];

const AVATAR_META = [
  { bg: "rgba(56,189,248,0.15)", border: "rgba(56,189,248,0.3)", text: "#38bdf8" },
  { bg: "rgba(244,114,182,0.15)", border: "rgba(244,114,182,0.3)", text: "#f472b6" },
  { bg: "rgba(74,222,128,0.15)", border: "rgba(74,222,128,0.3)", text: "#4ade80" },
  { bg: "rgba(192,132,252,0.15)", border: "rgba(192,132,252,0.3)", text: "#c084fc" },
  { bg: "rgba(251,146,60,0.15)", border: "rgba(251,146,60,0.3)", text: "#fb923c" },
];

const RANGE_LABELS: Record<TimeRange, string> = {
  weekly: "هفتگی",
  monthly: "ماهانه",
  yearly: "سالانه",
};

function formatSales(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} میلیارد`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)} میلیون`;
  return value.toLocaleString("fa-IR");
}

export default function TopUsersCard() {
  const [range, setRange] = useState<TimeRange>("monthly");
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const users = dataByRange[range];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-slate-950">
      <div className="mb-4 flex items-start justify-between gap-3" dir="rtl">
        <div>
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
            برترین فروشندگان
          </h3>
          <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">
            رتبه‌بندی {RANGE_LABELS[range]}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-gray-100 bg-gray-50/80 p-1 dark:border-white/5 dark:bg-slate-900/50">
          {(["weekly", "monthly", "yearly"] as TimeRange[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className="relative rounded-lg px-2.5 py-1 text-[11px] font-medium"
            >
              {range === r && (
                <motion.span
                  layoutId="topUsersRangeIndicator"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-slate-800"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span
                className={`relative z-10 transition-colors ${range === r
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                  }`}
              >
                {RANGE_LABELS[r]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={range}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="space-y-1"
        >
          {users.map((user, index) => {
            const rankMeta = index < 3 ? RANK_META[index] : null;
            const avatarMeta = AVATAR_META[index % AVATAR_META.length];
            const isHovered = hoveredId === user.id;

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04, duration: 0.16 }}
                onMouseEnter={() => setHoveredId(user.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative flex cursor-default items-center gap-3 rounded-xl px-2.5 py-2 transition-colors duration-150"
                style={{
                  backgroundColor: isHovered ? "rgba(99,102,241,0.06)" : "transparent",
                }}
                dir="rtl"
              >
                {/* avatar */}
                <div className="relative z-10 flex-shrink-0">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full border text-[14px] font-bold"
                    style={{
                      backgroundColor: avatarMeta.bg,
                      borderColor: avatarMeta.border,
                      color: avatarMeta.text,
                      boxShadow: isHovered ? `0 0 12px ${avatarMeta.bg}` : "none",
                      transition: "box-shadow 0.2s ease",
                    }}
                  >
                    {user.avatar}
                  </div>

                  {rankMeta ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.04 + 0.1, type: "spring", stiffness: 420 }}
                      className="absolute -bottom-1 -left-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border text-[8px] font-bold"
                      style={{
                        backgroundColor: rankMeta.bg,
                        borderColor: rankMeta.border,
                        color: rankMeta.text,
                        boxShadow: isHovered ? `0 0 8px ${rankMeta.glow}` : "none",
                        transition: "box-shadow 0.2s ease",
                      }}
                    >
                      {index === 0 ? <Crown size={9} strokeWidth={2.5} /> : index + 1}
                    </motion.div>
                  ) : (
                    <div className="absolute -bottom-1 -left-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-gray-200/60 bg-gray-50 text-[8px] font-bold text-gray-400 dark:border-white/10 dark:bg-slate-800 dark:text-gray-500">
                      {index + 1}
                    </div>
                  )}
                </div>

                {/* name + role */}
                <div className="relative z-10 min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">
                    {user.role}
                  </p>
                </div>

                {/* sales + trend */}
                <div className="relative z-10 flex-shrink-0 text-left">
                  <p className="text-[13px] font-bold tabular-nums text-gray-900 dark:text-white">
                    {formatSales(user.sales)}
                    <span className="mr-0.5 text-[10px] font-normal text-gray-400 dark:text-gray-500">
                      ت
                    </span>
                  </p>
                  <div className="mt-0.5 flex items-center justify-end gap-1">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {user.deals.toLocaleString("fa-IR")} معامله
                    </span>
                    {user.trend !== "same" && (
                      <span
                        className={`flex items-center gap-0.5 text-[10px] font-medium ${user.trend === "up"
                            ? "text-emerald-500 dark:text-emerald-400"
                            : "text-rose-500 dark:text-rose-400"
                          }`}
                      >
                        {user.trend === "up" ? (
                          <TrendingUp size={10} strokeWidth={2.5} />
                        ) : (
                          <TrendingDown size={10} strokeWidth={2.5} />
                        )}
                        {user.trendPct}٪
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* footer */}
      <div className="mt-3 border-t border-gray-100 pt-3 dark:border-white/5" dir="rtl">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            مجموع فروش {RANGE_LABELS[range]}
          </p>
          <p className="text-[13px] font-bold tabular-nums text-gray-900 dark:text-white">
            {formatSales(users.reduce((acc, u) => acc + u.sales, 0))}
            <span className="mr-0.5 text-[10px] font-normal text-gray-400 dark:text-gray-500">
              تومان
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
