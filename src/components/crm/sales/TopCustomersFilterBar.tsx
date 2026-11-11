"use client";

import { useMemo } from "react";
import type { FeedProduct } from "@/types/crm";
import JalaliDateField from "../shared/JalaliDateField";
import { SalesSelect } from "../shared/SalesSelect";
import { FilterChips, FilterPanel } from "../shared/kit";
import type { TopCustomersBy, TopCustomersQuery } from "./useTopCustomers";

const SORT_ITEMS: { value: TopCustomersBy; label: string }[] = [
    { value: "amount", label: "بر اساس مبلغ فروش" },
    { value: "quantity", label: "بر اساس مقدار" },
];

const LIMIT_OPTIONS = [10, 20, 50, 100].map((n) => ({
    id: n,
    label: `${n.toLocaleString("fa-IR")} مشتری برتر`,
}));

interface Props {
    open: boolean;
    query: TopCustomersQuery;
    products: FeedProduct[];
    onChange: (patch: Partial<TopCustomersQuery>) => void;
}

export function TopCustomersFilterBar({ open, query, products, onChange }: Props) {
    const productOptions = useMemo(
        () => [{ id: 0, label: "همه کالاها" }, ...products.map((p) => ({ id: p.id, label: p.name }))],
        [products],
    );

    return (
        <>
            <FilterChips
                label="مرتب‌سازی"
                items={SORT_ITEMS}
                value={query.by}
                onChange={(by) => onChange({ by })}
            />
            <FilterPanel open={open}>
                {products.length > 0 && (
<SalesSelect
                    dense
                    avatar={false}
                    label="کالا"
                    options={productOptions}
                    value={query.product ?? 0}
                    onChange={(id) => onChange({ product: id || undefined })}
                />
)}
                <SalesSelect
                    dense
                    avatar={false}
                    searchable={false}
                    label="تعداد نمایش"
                    options={LIMIT_OPTIONS}
                    value={query.limit}
                    onChange={(limit) => onChange({ limit })}
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
            </FilterPanel>
        </>
    );
}
