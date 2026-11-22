"use client";

import { toPersianDigits } from "@/lib/jalali";

export type PriorityLevel = "high" | "mid" | "low";
export interface PriorityInfo {
    rank: number;
    level: PriorityLevel;
}

/**
 * اولویت رسیدگی به دستگاه‌ها: دستگاهی که بیشترین توقف را داشته اولویت ۱ است.
 * یک‌سوم اول «بالا»، یک‌سوم میانی «متوسط» و بقیه «پایین».
 * دستگاهِ بدون توقف اولویت ندارد.
 */
export function priorityMap<T extends { machine_id: number }>(
    items: T[],
    minutes: (item: T) => number,
): Map<number, PriorityInfo> {
    const active = items.filter((i) => minutes(i) > 0).sort((a, b) => minutes(b) - minutes(a));
    const third = Math.max(1, Math.ceil(active.length / 3));
    const map = new Map<number, PriorityInfo>();
    active.forEach((item, i) => {
        map.set(item.machine_id, {
            rank: i + 1,
            level: i < third ? "high" : i < third * 2 ? "mid" : "low",
        });
    });
    return map;
}

const STYLE: Record<PriorityLevel, { label: string; cls: string }> = {
    high: { label: "بالا", cls: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400" },
    mid: { label: "متوسط", cls: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    low: { label: "پایین", cls: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
};

export function PriorityBadge({ info }: { info?: PriorityInfo }) {
    if (!info) return <span className="text-gray-400">—</span>;
    const s = STYLE[info.level];
    return (
        <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-2 py-0.5 text-[10.5px] font-bold ${s.cls}`}>
            اولویت {toPersianDigits(info.rank)}
            <span className="font-medium opacity-80">· {s.label}</span>
        </span>
    );
}
