import type { RankingOrdering } from "@/types/crm";

export type RankingFilters = {
    ordering: RankingOrdering;
    status: 1 | 2 | undefined;
    min_score: number | undefined;
    rated: boolean | undefined;
};

export const RANKING_DEFAULT_FILTERS: RankingFilters = {
    ordering: "-avg_score",
    status: undefined,
    min_score: undefined,
    rated: undefined,
};

export const RANKING_PAGE_SIZE = 20;

/** هر گزینه‌ی انتخاب‌گر یک id عددی دارد؛ id صفر یعنی «بدون فیلتر». */
export const ORDERING_OPTIONS: { id: number; value: RankingOrdering; label: string }[] = [
    { id: 1, value: "-avg_score", label: "بیشترین امتیاز" },
    { id: 2, value: "avg_score", label: "کمترین امتیاز" },
    { id: 3, value: "-scores_count", label: "بیشترین تعداد امتیاز" },
    { id: 4, value: "-total_sales", label: "بیشترین فروش" },
    { id: 5, value: "-comments_count", label: "بیشترین نظر" },
    { id: 6, value: "-last_sale_date", label: "آخرین خرید" },
    { id: 7, value: "full_name", label: "نام (الف تا ی)" },
];

export const STATUS_OPTIONS = [
    { id: 0, label: "همه مشتریان" },
    { id: 2, label: "مشتری بالفعل" },
    { id: 1, label: "مشتری بالقوه" },
];

export const MIN_SCORE_OPTIONS = [
    { id: 0, label: "هر امتیازی" },
    { id: 3, label: "۳ به بالا" },
    { id: 4, label: "۴ به بالا" },
    { id: 4.5, label: "۴٫۵ به بالا" },
];

export const RATED_OPTIONS = [
    { id: 0, label: "همه (حتی بدون امتیاز)" },
    { id: 1, label: "فقط دارای امتیاز" },
];

export const orderingId = (ordering: RankingOrdering) =>
    ORDERING_OPTIONS.find((o) => o.value === ordering)?.id ?? 1;

export const orderingValue = (id: number): RankingOrdering =>
    ORDERING_OPTIONS.find((o) => o.id === id)?.value ?? RANKING_DEFAULT_FILTERS.ordering;
