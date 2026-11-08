"use client";

import { memo } from "react";
import { SalesSelect } from "../shared/SalesSelect";
import { FilterChips, FilterPanel } from "../shared/kit";
import {
    MIN_SCORE_OPTIONS,
    ORDERING_OPTIONS,
    RATED_OPTIONS,
    STATUS_OPTIONS,
    orderingId,
    orderingValue,
    type RankingFilters,
} from "./rankingOptions";

interface ChipsProps {
    filters: RankingFilters;
    onFilters: (patch: Partial<RankingFilters>) => void;
}

function RankingStatusChipsBase({ filters, onFilters }: ChipsProps) {
    return (
        <FilterChips
            label="وضعیت مشتری"
            items={STATUS_OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
            value={filters.status ?? 0}
            onChange={(id) => onFilters({ status: id === 1 || id === 2 ? id : undefined })}
        />
    );
}

export const RankingStatusChips = memo(RankingStatusChipsBase);

interface PanelProps extends ChipsProps {
    open: boolean;
}

function RankingFilterPanelBase({ open, filters, onFilters }: PanelProps) {
    return (
        <FilterPanel open={open} className="lg:grid-cols-3">
            <SalesSelect
                dense
                avatar={false}
                searchable={false}
                label="مرتب‌سازی"
                options={ORDERING_OPTIONS}
                value={orderingId(filters.ordering)}
                onChange={(id) => onFilters({ ordering: orderingValue(id) })}
            />
            <SalesSelect
                dense
                avatar={false}
                searchable={false}
                label="حداقل امتیاز"
                options={MIN_SCORE_OPTIONS}
                value={filters.min_score ?? 0}
                onChange={(id) => onFilters({ min_score: id || undefined })}
            />
            <SalesSelect
                dense
                avatar={false}
                searchable={false}
                label="فقط دارای امتیاز"
                options={RATED_OPTIONS}
                value={filters.rated ? 1 : 0}
                onChange={(id) => onFilters({ rated: id === 1 ? true : undefined })}
            />
        </FilterPanel>
    );
}

export const RankingFilterPanel = memo(RankingFilterPanelBase);
