"use client";

import type { ReactNode } from "react";
import { useTheme } from "next-themes";
import { ChartTooltip } from "@/components/charts/ChartTooltip";

export const COLORS = {
    purple: "#a78bfa",
    green: "#4ade80",
    red: "#fb7185",
    blue: "#60a5fa",
};

export const fa = (n: number | string) => Number(n).toLocaleString("fa-IR");

export function useDark() {
    const { resolvedTheme } = useTheme();
    return resolvedTheme === "dark";
}

/** کارت یکنواخت برای همه نمودارها */
export function ChartCard({
    title,
    hint,
    loading,
    empty,
    height = 280,
    children,
}: {
    title: string;
    hint: string;
    loading: boolean;
    empty: boolean;
    height?: number;
    children: ReactNode;
}) {
    return (
        <section
            dir="rtl"
            className="rounded-[1.5rem] border border-black/5 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
        >
            <h2 className="text-[13px] font-extrabold text-gray-900 dark:text-white">{title}</h2>
            <p className="mb-3 mt-0.5 text-[10.5px] text-gray-400">{hint}</p>
            <div style={{ height }} dir="ltr">
                {loading ? (
                    <div className="h-full animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
                ) : empty ? (
                    <div className="flex h-full items-center justify-center text-[11px] font-semibold text-gray-400">
                        داده‌ای برای نمایش وجود ندارد
                    </div>
                ) : (
                    children
                )}
            </div>
        </section>
    );
}

type Payload = { name?: string; dataKey?: string; value?: number; color?: string; fill?: string; payload?: any };

/** تولتیپ مشترک (همان تولتیپ داشبورد ادمین) */
export function Tip({
    active,
    payload,
    label,
    dark,
    names,
    unit = "",
}: {
    active?: boolean;
    payload?: Payload[];
    label?: string;
    dark: boolean;
    names?: Record<string, string>;
    unit?: string;
}) {
    if (!active || !payload?.length) return null;
    const first = payload[0];
    const title = label ?? first.payload?.name ?? first.name ?? "";
    return (
        <ChartTooltip
            dark={dark}
            title={String(title)}
            colorKey={first.dataKey ?? "k"}
            glowColor={`${first.color ?? first.fill ?? COLORS.purple}33`}
            rows={payload.map((p) => ({
                dotStyle: "circle" as const,
                label: names?.[p.dataKey ?? ""] ?? p.name ?? String(p.dataKey),
                value: fa(p.value ?? 0) + unit,
                color: p.color ?? p.fill ?? COLORS.purple,
            }))}
        />
    );
}

export const axisProps = {
    tick: { fill: "#9ca3af", fontSize: 10 },
    axisLine: false,
    tickLine: false,
} as const;
