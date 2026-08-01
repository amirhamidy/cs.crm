"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  gradient: string;
  index?: number;
}

const gradientMap: Record<
  string,
  { bg: string; iconBg: string; accent: string }
> = {
  "from-blue-500 to-blue-600": {
    bg: "from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950",
    iconBg: "bg-blue-500/15 dark:bg-blue-400/20",
    accent: "text-blue-600 dark:text-blue-400",
  },
  "from-purple-500 to-purple-600": {
    bg: "from-purple-50 to-fuchsia-50 dark:from-purple-950 dark:to-fuchsia-950",
    iconBg: "bg-purple-500/15 dark:bg-purple-400/20",
    accent: "text-purple-600 dark:text-purple-400",
  },
  "from-green-500 to-green-600": {
    bg: "from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950",
    iconBg: "bg-emerald-500/15 dark:bg-emerald-400/20",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  "from-orange-500 to-orange-600": {
    bg: "from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950",
    iconBg: "bg-orange-500/15 dark:bg-orange-400/20",
    accent: "text-orange-600 dark:text-orange-400",
  },
};

function StatsCardSkeleton({ gradient }: { gradient: string }) {
  const g = gradientMap[gradient] ?? gradientMap["from-blue-500 to-blue-600"];

  return (
    <div
      className={`rounded-2xl p-5 bg-gradient-to-br ${g.bg} border-black/5 dark:border-white/5`}
    >
      <div className="flex items-start justify-between" dir="rtl">
        <div className="flex-1 space-y-3">
          <div className="h-3 w-24 rounded-full bg-black/8 dark:bg-white/8 animate-pulse" />
          <div className="h-7 w-32 rounded-full bg-black/8 dark:bg-white/8 animate-pulse" />
          <div className="h-5 w-20 rounded-full bg-black/8 dark:bg-white/8 animate-pulse" />
        </div>
        <div className="w-10 h-10 rounded-xl bg-black/8 dark:bg-white/8 animate-pulse" />
      </div>
    </div>
  );
}

export default function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  gradient,
  index = 0,
}: StatsCardProps) {
  const [loading, setLoading] = useState(true);
  const isPositive = Number(change) >= 0;
  const g = gradientMap[gradient] ?? gradientMap["from-blue-500 to-blue-600"];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <StatsCardSkeleton gradient={gradient} />;

  return (
    <div
      className={`rounded-2xl p-5 bg-gradient-to-br ${g.bg}
        border-black/5 dark:border-white/5
        hover:shadow-md transition-shadow duration-200`}
    >
      <div className="flex items-start justify-between" dir="rtl">
        <div className="flex-1">
          <p className="text-xs font-medium text-black/50 dark:text-white/50">
            {title}
          </p>
          <p className="text-2xl font-semibold text-black/90 dark:text-white/90 mt-1.5 tabular-nums">
            {value}
          </p>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                isPositive
                  ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-600 dark:bg-red-400/15 dark:text-red-400"
              }`}
            >
              {isPositive ? (
                <TrendingUp size={11} strokeWidth={2.5} />
              ) : (
                <TrendingDown size={11} strokeWidth={2.5} />
              )}
              {Math.abs(Number(change))}%
            </span>
            <span className="text-[11px] text-black/40 dark:text-white/40">
              نسبت به ماه قبل
            </span>
          </div>
        </div>

        <div
          className={`w-10 h-10 rounded-xl ${g.iconBg} flex items-center justify-center flex-shrink-0`}
        >
          <Icon size={18} strokeWidth={2} className={g.accent} />
        </div>
      </div>
    </div>
  );
}
