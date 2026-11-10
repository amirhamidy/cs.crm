"use client";

import { useCallback, useEffect, useState } from "react";
import { salesApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import type { TopCustomerRow } from "@/types/crm";

export type TopCustomersBy = "amount" | "quantity";

export interface TopCustomersQuery {
    by: TopCustomersBy;
    limit: number;
    product: number | undefined;
    dateFrom: string;
    dateTo: string;
}

/** گزارش مشتریان برتر؛ پاسخ‌های قدیمی (وقتی فیلتر سریع عوض می‌شود) نادیده گرفته می‌شوند. */
export function useTopCustomers({ by, limit, product, dateFrom, dateTo }: TopCustomersQuery) {
    const [rows, setRows] = useState<TopCustomerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError("");

        salesApi
            .topCustomers({
                by,
                limit,
                product,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            })
            .then((r) => alive && setRows(r.results))
            .catch((e) => alive && setError(apiMessage(e, "دریافت گزارش ناموفق بود")))
            .finally(() => alive && setLoading(false));

        return () => {
            alive = false;
        };
    }, [by, limit, product, dateFrom, dateTo, attempt]);

    const retry = useCallback(() => setAttempt((n) => n + 1), []);

    return { rows, loading, error, retry };
}
