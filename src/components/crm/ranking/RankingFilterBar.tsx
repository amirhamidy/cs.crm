"use client";

import { memo } from "react";
import { SearchInput } from "@/components/ui/Feedback";
import { NiceSelect } from "@/components/ui/NiceSelect";
import { cn } from "@/lib/utils";
import {
    MIN_SCORE_OPTIONS,
    ORDERING_OPTIONS,
    RATED_OPTIONS,
    STATUS_OPTIONS,
    orderingId,
    orderingValue,
    type RankingFilters,
} from "./rankingOptions";

const SELECTS_CLASS = cn(
    "grid grid-cols-1 gap-2 sm:grid-cols-2 [&>div]:min-w-0",
    "[&_label]:text-center [&_label]:text-[13px] [&_label]:font-bold",
    "[&>div>button]:h-12 [&>div>button]:py-0 [&>div>button]:text-center",
    "[&>div>button>span:first-child]:text-center [&>div>button>span:first-child]:text-[13px] [&>div>button>span:first-child]:font-bold",
    "[&>div>div_button>div>span:first-child]:text-[13px] [&>div>div_button>div>span:first-child]:font-bold",
    "[&>div>div_button>span]:text-[13px]",
);

interface Props {
    search: string;
    filters: RankingFilters;
    onSearch: (value: string) => void;
    onFilters: (patch: Partial<RankingFilters>) => void;
}

function RankingFilterBarBase({ search, filters, onSearch, onFilters }: Props) {
    return (
        <div className="flex flex-col gap-2">
            <SearchInput
                className="[&_input]:h-12 [&_input]:rounded-[2rem] [&_input]:px-5 [&_input]:text-[13px]"
                value={search}
                onChange={onSearch}
                placeholder="نام، شرکت یا موبایل..."
                hideIcon
            />
            <div className={SELECTS_CLASS}>
            <NiceSelect
                label="مرتب‌سازی"
                options={ORDERING_OPTIONS}
                value={orderingId(filters.ordering)}
                onChange={(id) => onFilters({ ordering: orderingValue(id) })}
            />
            <NiceSelect
                label="حداقل امتیاز"
                options={MIN_SCORE_OPTIONS}
                value={filters.min_score ?? 0}
                onChange={(id) => onFilters({ min_score: id || undefined })}
            />
            <NiceSelect
                label="وضعیت مشتری"
                options={STATUS_OPTIONS}
                value={filters.status ?? 0}
                onChange={(id) => onFilters({ status: id === 1 || id === 2 ? id : undefined })}
            />
            <NiceSelect
                label="فقط دارای امتیاز"
                options={RATED_OPTIONS}
                value={filters.rated ? 1 : 0}
                onChange={(id) => onFilters({ rated: id === 1 ? true : undefined })}
            />
            </div>
        </div>
    );
}

export const RankingFilterBar = memo(RankingFilterBarBase);
