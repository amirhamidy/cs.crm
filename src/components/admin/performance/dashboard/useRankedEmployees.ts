"use client";

import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import type { EmployeeStat } from "@/hooks/useAnalytics";

interface ScoreInfo {
    score: number;
    total_deducted: number;
}

export interface RankedEmployee extends EmployeeStat {
    score: number | null;
    total_deducted: number | null;
}

const done = (e: EmployeeStat) => (e.sold ?? 0) + (e.completed ?? 0);
const successRate = (e: EmployeeStat) => (e.total > 0 ? done(e) / e.total : 0);
const cancelRate = (e: EmployeeStat) => (e.total > 0 ? e.cancelled / e.total : 1);

/** ترتیب «بهترین» — همان منطق قبلی: نرخ موفقیت، نرخ لغو، امتیاز، ... */
export function rankBest(items: RankedEmployee[]) {
    return [...items].sort((a, b) => {
        const aw = a.total > 0;
        const bw = b.total > 0;
        if (aw !== bw) return Number(bw) - Number(aw);
        if (!aw) return a.full_name.localeCompare(b.full_name, "fa");
        return (
            successRate(b) - successRate(a) ||
            cancelRate(a) - cancelRate(b) ||
            (b.score ?? -1) - (a.score ?? -1) ||
            done(b) - done(a) ||
            b.total - a.total ||
            (b.sold ?? 0) - (a.sold ?? 0) ||
            (b.completed ?? 0) - (a.completed ?? 0) ||
            a.full_name.localeCompare(b.full_name, "fa")
        );
    });
}

/** ترتیب «ضعیف‌ترین» — لغو بیشتر، امتیاز کمتر، ... (۶ نفر اول) */
export function rankWeakest(items: RankedEmployee[]) {
    return [...items]
        .sort((a, b) => {
            const aw = a.total > 0;
            const bw = b.total > 0;
            if (aw !== bw) return Number(bw) - Number(aw);
            if (!aw) return a.full_name.localeCompare(b.full_name, "fa");
            return (
                b.cancelled - a.cancelled ||
                (a.score ?? Infinity) - (b.score ?? Infinity) ||
                done(a) - done(b) ||
                a.total - b.total ||
                a.full_name.localeCompare(b.full_name, "fa")
            );
        })
        .slice(0, 6);
}

/** امتیاز هر کارمند را از API می‌گیرد و به آمار تحلیلی اضافه می‌کند */
export function useEmployeeScores<T extends EmployeeStat>(items: T[]) {
    const [scores, setScores] = useState<Record<string, ScoreInfo>>({});
    const safe = useMemo(() => (Array.isArray(items) ? items : []), [items]);

    useEffect(() => {
        const targets = safe
            .map((i) => ({ key: i.key, id: Number(i.key) }))
            .filter((t) => Number.isFinite(t.id));
        if (!targets.length) {
            setScores({});
            return;
        }
        let cancelled = false;
        Promise.allSettled(
            targets.map((t) =>
                axiosInstance
                    .get<ScoreInfo>(`/score/api/v1/employees/${t.id}/`)
                    .then((r) => ({ key: t.key, data: r.data })),
            ),
        ).then((results) => {
            if (cancelled) return;
            const map: Record<string, ScoreInfo> = {};
            results.forEach((r) => {
                if (r.status === "fulfilled") map[r.value.key] = r.value.data;
            });
            setScores(map);
        });
        return () => {
            cancelled = true;
        };
    }, [safe]);

    return useMemo<RankedEmployee[]>(
        () =>
            safe.map((i) => ({
                ...i,
                score: (i as { score?: number | null }).score ?? scores[i.key]?.score ?? null,
                total_deducted: scores[i.key]?.total_deducted ?? null,
            })),
        [safe, scores],
    );
}
