"use client";

import { memo, useMemo } from "react";
import { SearchInput } from "@/components/ui/Feedback";
import type { FeedProduct } from "@/types/crm";
import JalaliDateField from "../shared/JalaliDateField";
import { SalesSelect } from "../shared/SalesSelect";
import { CARD } from "../shared/ui";
import { TRADE_FILTERS, tradeFilterId, tradeFilterPatch, type SaleFilters } from "./saleFilters";

interface Props {
    search: string;
    filters: SaleFilters;
    products: FeedProduct[];
    onSearch: (value: string) => void;
    onFilters: (patch: Partial<SaleFilters>) => void;
}

function SalesFilterBarBase({ search, filters, products, onSearch, onFilters }: Props) {
    const productOptions = useMemo(
        () => [
            { id: 0, label: "همه کالاها" },
            ...products.map((p) => ({ id: p.id, label: p.name })),
        ],
        [products],
    );

    return (
        <div className={`${CARD} grid grid-cols-1 gap-3 p-3.5 sm:grid-cols-2 sm:p-4 xl:grid-cols-5`}>
            <SearchInput
                value={search}
                onChange={onSearch}
                placeholder="فروشنده، خریدار، کالا..."
                className="sm:col-span-2 xl:col-span-1"
                hideIcon
            />
            <SalesSelect
                label="نوع معامله"
                avatar={false}
                searchable={false}
                options={TRADE_FILTERS}
                value={tradeFilterId(filters)}
                onChange={(id) => onFilters(tradeFilterPatch(id))}
            />
            <SalesSelect
                label="کالا"
                options={productOptions}
                value={filters.product ?? 0}
                onChange={(id) => onFilters({ product: id || undefined })}
            />
            <JalaliDateField
                label="از تاریخ"
                clearable
                value={filters.date_from ?? ""}
                onChange={(v) => onFilters({ date_from: v || undefined })}
            />
            <JalaliDateField
                label="تا تاریخ"
                clearable
                value={filters.date_to ?? ""}
                onChange={(v) => onFilters({ date_to: v || undefined })}
            />
        </div>
    );
}

export const SalesFilterBar = memo(SalesFilterBarBase);
