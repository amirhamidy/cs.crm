"use client";

import { memo, useMemo } from "react";
import { SearchInput } from "@/components/ui/Feedback";
import type { FeedProduct } from "@/types/crm";
import { DateRangeField } from "./DateRangeField";
import { SalesSelect } from "../shared/SalesSelect";
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
        <div className="flex flex-col gap-2">
            <SearchInput
                value={search}
                onChange={onSearch}
                placeholder="فروشنده، خریدار، کالا..."
                className="[&_input]:h-12 [&_input]:rounded-[2rem] [&_input]:px-5 [&_input]:text-[13px]"
                hideIcon
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 [&>div]:min-w-0">
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
            <div className="sm:col-span-2">
                <DateRangeField
                    from={filters.date_from}
                    to={filters.date_to}
                    onChange={(date_from, date_to) => onFilters({ date_from, date_to })}
                />
            </div>
            </div>
        </div>
    );
}

export const SalesFilterBar = memo(SalesFilterBarBase);
