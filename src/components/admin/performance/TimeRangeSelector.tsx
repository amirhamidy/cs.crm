// src/components/admin/performance/TimeRangeSelector.tsx
"use client";
import { motion } from "framer-motion";
import type { TimeRange } from "@/hooks/useAnalytics";

const OPTIONS: { label: string; value: TimeRange }[] = [
    { label: "هفتگی", value: "weekly" },
    { label: "ماهانه", value: "monthly" },
    { label: "سالانه", value: "yearly" },
];

export default function TimeRangeSelector({
    value,
    onChange,
}: {
    value: TimeRange;
    onChange: (v: TimeRange) => void;
}) {
    return (
        <div className="inline-flex rounded-xl bg-white/5 p-1 gap-1" dir="rtl">
            {OPTIONS.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className="relative px-4 py-1.5 text-sm font-medium rounded-lg transition-colors"
                >
                    {value === opt.value && (
                        <motion.span
                            layoutId="range-pill"
                            className="absolute inset-0 rounded-lg bg-indigo-500/20 border border-indigo-500/40"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                    )}
                    <span
                        className={`relative z-10 ${value === opt.value ? "text-indigo-300" : "text-zinc-400"
                            }`}
                    >
                        {opt.label}
                    </span>
                </button>
            ))}
        </div>
    );
}
