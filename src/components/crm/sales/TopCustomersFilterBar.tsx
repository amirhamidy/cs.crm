"use client";

import { useMemo } from "react";
import type { FeedProduct } from "@/types/crm";
import JalaliDateField from "../shared/JalaliDateField";
import { SalesSelect } from "../shared/SalesSelect";
import { CARD } from "../shared/ui";
import type { TopCustomersBy, TopCustomersQuery } from "./useTopCustomers";

const SORT_OPTIONS = [
    { id: 1, label: "بر اساس مبلغ فروش" },
    { id: 2, label: "بر اساس مقدار (کیلوگرم)" },
];

const LIMIT_OPTIONS = [10, 20, 50, 100].map((n) => ({
    id: n,
    label: `${n.toLocaleString("fa-IR")} مشتری برتر`,
}));

interface Props {
    query: TopCustomersQuery;
    products: FeedProduct[];
    onChange: (patch: Partial<TopCustomersQuery>) => void;
}

export function TopCustomersFilterBar({ query, products, onChange }: Props) {
    const productOptions = useMemo(
        () => [
            { id: 0, label: "همه کالاها" },
            ...products.map((p) => ({ id: p.id, label: p.name })),
        ],
        [products],
    );

    return (
        <div className={`${CARD} grid grid-cols-1 gap-3 p-3.5 sm:grid-cols-2 sm:p-4 xl:grid-cols-5`}>
            <SalesSelect
                label="مرتب‌سازی بر اساس"
                options={SORT_OPTIONS}
                value={query.by === "amount" ? 1 : 2}
                onChange={(id) =>
                    onChange({ by: (id === 1 ? "amount" : "quantity") satisfies TopCustomersBy })
                }
            />
            <SalesSelect
                label="کالا"
                options={productOptions}
                value={query.product ?? 0}
                onChange={(id) => onChange({ product: id || undefined })}
            />
            <JalaliDateField
                label="از تاریخ"
                clearable
                value={query.dateFrom}
                onChange={(v) => onChange({ dateFrom: v })}
            />
            <JalaliDateField
                label="تا تاریخ"
                clearable
                value={query.dateTo}
                onChange={(v) => onChange({ dateTo: v })}
            />
            <SalesSelect
                label="تعداد نمایش"
                options={LIMIT_OPTIONS}
                value={query.limit}
                onChange={(limit) => onChange({ limit })}
            />
        </div>
    );
}
