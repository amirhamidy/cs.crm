"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import type { TimeRange } from "@/hooks/useAnalytics";

const OPTIONS: { value: TimeRange; label: string }[] = [
    { value: "weekly", label: "هفتگی" },
    { value: "monthly", label: "ماهانه" },
    { value: "yearly", label: "سالانه" },
];

interface Props {
    value: TimeRange;
    onChange: (value: TimeRange) => void;
    loading?: boolean;
}

export default function TimeRangeSelector({ value, onChange, loading = false }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    return (
        <div
            className="relative flex items-center gap-1 rounded-2xl p-1"
            style={{
                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(99,102,241,0.05)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(99,102,241,0.08)"}`,
            }}
        >
            {OPTIONS.map((opt) => {
                const active = value === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        disabled={loading}
                        className="relative rounded-xl px-3.5 py-1.5 text-[12px] font-bold transition-colors disabled:opacity-40"
                        style={{ color: active ? "#ffffff" : isDark ? "#94a3b8" : "#64748b" }}
                    >
                        {active && (
                            <motion.span
                                layoutId="range-pill"
                                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                                className="absolute inset-0 rounded-xl"
                                style={{
                                    background: "linear-gradient(135deg, #60a5fa, #818cf8)",
                                    boxShadow: "0 4px 14px rgba(96,165,250,0.35)",
                                }}
                            />
                        )}
                        <span className="relative">{opt.label}</span>
                    </button>
                );
            })}
        </div>
    );
}