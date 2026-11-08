"use client";

import { memo, useMemo } from "react";
import type { FeedProduct } from "@/types/crm";
import { DateRangeField } from "./DateRangeField";
import { SalesSelect } from "../shared/SalesSelect";
import { FilterChips, FilterPanel } from "../shared/kit";
import { TRADE_FILTERS, tradeFilterId, tradeFilterPatch, type SaleFilters } from "./saleFilters";

interface Props {
    open: boolean;
    filters: SaleFilters;
    products: FeedProduct[];
    onFilters: (patch: Partial<SaleFilters>) => void;
}

function SalesFilterBarBase({ open, filters, products, onFilters }: Props) {
    const productOptions = useMemo(
        () => [{ id: 0, label: "همه کالاها" }, ...products.map((p) => ({ id: p.id, label: p.name }))],
        [products],
    );

    return (
        <>
            <FilterChips
                label="نوع معامله"
                items={TRADE_FILTERS.map((f) => ({ value: f.id, label: f.label }))}
                value={tradeFilterId(filters)}
                onChange={(id) => onFilters(tradeFilterPatch(id))}
            />
            <FilterPanel open={open} className="lg:grid-cols-2">
                <SalesSelect
                    dense
                    avatar={false}
                    label="کالا"
                    options={productOptions}
                    value={filters.product ?? 0}
                    onChange={(id) => onFilters({ product: id || undefined })}
                />
                <DateRangeField
                    from={filters.date_from}
                    to={filters.date_to}
                    onChange={(date_from, date_to) => onFilters({ date_from, date_to })}
                />
            </FilterPanel>
        </>
    );
}

export const SalesFilterBar = memo(SalesFilterBarBase);
