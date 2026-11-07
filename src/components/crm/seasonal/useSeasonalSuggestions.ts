"use client";

import { useCallback, useEffect, useState } from "react";
import { seasonalApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import type { SeasonalSuggestions } from "@/types/crm";

/** پیشنهادهای فصلیِ یک ماه (بدون ماه = ماه جاری). با عوض شدن ماه درخواست قبلی لغو می‌شود. */
export function useSeasonalSuggestions(month: number | undefined) {
    const [data, setData] = useState<SeasonalSuggestions | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError("");

        seasonalApi
            .suggestions(month, controller.signal)
            .then(setData)
            .catch((e) => {
                if (!controller.signal.aborted)
                    setError(apiMessage(e, "دریافت پیشنهادها ناموفق بود"));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [month, attempt]);

    const retry = useCallback(() => setAttempt((n) => n + 1), []);

    return { data, loading, error, retry };
}
