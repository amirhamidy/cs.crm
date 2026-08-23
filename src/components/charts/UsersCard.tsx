"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crown, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useTopUsers, type TimeRange } from "@/hooks/useTopUsers";
import axiosInstance from "@/lib/axiosInstance";

interface EmployeeInfo {
  id: number;
  full_name: string;
  username: string;
}

const RANK_META = [
  { bg: "rgba(250,204,21,0.15)", border: "rgba(250,204,21,0.4)", text: "#facc15", glow: "rgba(250,204,21,0.55)" },
  { bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.35)", text: "#94a3b8", glow: "rgba(148,163,184,0.45)" },
  { bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.35)", text: "#fb923c", glow: "rgba(251,146,60,0.45)" },
];

const AVATAR_META = [
  { bg: "rgba(56,189,248,0.15)", border: "rgba(56,189,248,0.3)", text: "#38bdf8" },
  { bg: "rgba(244,114,182,0.15)", border: "rgba(244,114,182,0.3)", text: "#f472b6" },
  { bg: "rgba(74,222,128,0.15)", border: "rgba(74,222,128,0.3)", text: "#4ade80" },
];

const RANGE_LABELS: Record<TimeRange, string> = {
  weekly: "هفتگی",
  monthly: "ماهانه",
  yearly: "سالانه",
};

export default function TopUsersCard() {
  const { data: rangeData, loading, error } = useTopUsers();
  const [range, setRange] = useState<TimeRange>("monthly");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [employees, setEmployees] = useState<EmployeeInfo[]>([]);

  useEffect(() => {
    axiosInstance
      .get<EmployeeInfo[] | { results: EmployeeInfo[] }>("/accounts/api/v1/employee/list/")
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : (res.data as { results: EmployeeInfo[] }).results ?? [];
        setEmployees(list);
      })
      .catch(() => { });
  }, []);

  const resolveFullName = (username: string): string => {
    if (username === "admin") return "مدیر سیستم";
    const match = employees.find((e) => e.username === username);
    return match?.full_name ?? username;
  };

  if (loading) return <div className="h-[300px] animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-900" />;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  const users = rangeData[range] ?? [];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-slate-950">
      <div className="mb-4 flex items-start justify-between gap-3" dir="rtl">
        <div>
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">برترین کارشناسان</h3>
          <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">بر اساس جذب مشتری بالفعل</p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-gray-100 bg-gray-50/80 p-1 dark:border-white/5 dark:bg-slate-900/50">
          {(["weekly", "monthly", "yearly"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`relative rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${range === r ? "text-gray-900 dark:text-white" : "text-gray-500"
                }`}
            >
              {range === r && (
                <motion.span layoutId="activeTab" className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-slate-800" />
              )}
              <span className="relative z-10">{RANGE_LABELS[r]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1" dir="rtl">
        <AnimatePresence mode="wait">
          {users.map((user, index) => {
            const rankMeta = index < 3 ? RANK_META[index] : null;

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onMouseEnter={() => setHoveredId(user.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <div className="relative flex-shrink-0">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full border text-[14px] font-bold"
                    style={{ backgroundColor: AVATAR_META[index % 3].bg, color: AVATAR_META[index % 3].text }}
                  >
                    {user.avatar}
                  </div>
                  {rankMeta && (
                    <div
                      className="absolute -bottom-1 -left-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border text-[9px]"
                      style={{ backgroundColor: rankMeta.bg, color: rankMeta.text, borderColor: rankMeta.border }}
                    >
                      {index === 0 ? <Crown size={10} /> : index + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-white">
                    {resolveFullName(user.username)}
                  </p>
                  <p className="text-[11px] text-gray-500">{user.role}</p>
                </div>

                <div className="text-left">
                  <p className="text-[14px] font-bold text-gray-900 dark:text-white">
                    {user.count.toLocaleString("fa-IR")}
                    <span className="mr-1 text-[10px] font-normal text-gray-400">مشتری</span>
                  </p>
                  {user.trend !== "same" && (
                    <div className={`flex items-center justify-end gap-0.5 text-[10px] ${user.trend === "up" ? "text-emerald-500" : "text-rose-500"}`}>
                      {user.trend === "up" ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {user.trendPct}٪
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-3 border-t border-gray-100 pt-3 dark:border-white/5" dir="rtl">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-gray-500">مجموع جذب {RANGE_LABELS[range]}</span>
          <span className="font-bold text-gray-900 dark:text-white">
            {users.reduce((acc, u) => acc + u.count, 0).toLocaleString("fa-IR")} نفر
          </span>
        </div>
      </div>
    </div>
  );
}
