"use client";

import { useTheme } from "next-themes";
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
            className="flex items-center gap-1 rounded-2xl p-1"
            style={{
                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
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
                        className="rounded-xl px-3.5 py-1.5 text-[12px] font-bold transition-colors disabled:opacity-40"
                        style={
                            active
                                ? {
                                    background: isDark
                                        ? "rgba(99,102,241,0.18)"
                                        : "rgba(99,102,241,0.1)",
                                    color: isDark ? "#c7d2fe" : "#6366f1",
                                }
                                : { color: isDark ? "#94a3b8" : "#64748b" }
                        }
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}
