"use client";

import { useEffect, useState } from "react";
import { listAll } from "@/lib/api";

// کمی تأخیر بعد از تایپ، تا برای هر حرف درخواست جدا فرستاده نشود
export function useDebounced<T>(value: T, delay = 350): T {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return v;
}

// جستجو روی سرور با ?search= ؛ وقتی متن خالی است، همان فهرست اصلی برگردانده می‌شود.
export function useServerSearch<T>(url: string, term: string, fallback: T[], extra?: Record<string, unknown>) {
    const [rows, setRows] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const q = term.trim();
    const extraKey = JSON.stringify(extra ?? {});

    useEffect(() => {
        if (!q) return;
        let cancelled = false;
        setLoading(true);
        setError("");
        listAll<T>(url, { ...(extra ?? {}), search: q })
            .then((a) => !cancelled && setRows(a))
            .catch(() => !cancelled && setError("جستجو با خطا مواجه شد"))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, q, extraKey]);

    return { items: q ? rows : fallback, loading, error, searching: Boolean(q) };
}
