import type { TradeType } from "@/types/crm";

export type SaleFilters = {
    trade_type: TradeType | undefined;
    has_open_issues: 1 | undefined;
    product: number | undefined;
    date_from: string | undefined;
    date_to: string | undefined;
};

export const SALE_FILTER_DEFAULTS: SaleFilters = {
    trade_type: undefined,
    has_open_issues: undefined,
    product: undefined,
    date_from: undefined,
    date_to: undefined,
};

type TradeFilterPatch = Pick<SaleFilters, "trade_type" | "has_open_issues">;

/** گزینه‌های فیلتر «نوع معامله»؛ هر گزینه مشخص می‌کند کدام فیلترها تنظیم شوند. */
export const TRADE_FILTERS: { id: number; label: string; patch: TradeFilterPatch }[] = [
    { id: 0, label: "همه معامله‌ها", patch: { trade_type: undefined, has_open_issues: undefined } },
    { id: 1, label: "فروش ما به مشتری", patch: { trade_type: "sale", has_open_issues: undefined } },
    {
        id: 2,
        label: "خرید ما از مشتری",
        patch: { trade_type: "purchase", has_open_issues: undefined },
    },
    {
        id: 3,
        label: "معامله بین دو مشتری",
        patch: { trade_type: "brokerage", has_open_issues: undefined },
    },
    { id: 4, label: "دارای پیگیری باز", patch: { trade_type: undefined, has_open_issues: 1 } },
];

export function tradeFilterId(filters: SaleFilters): number {
    if (filters.has_open_issues) return 4;
    return TRADE_FILTERS.find((f) => f.patch.trade_type === filters.trade_type)?.id ?? 0;
}

export function tradeFilterPatch(id: number): TradeFilterPatch {
    return TRADE_FILTERS.find((f) => f.id === id)?.patch ?? TRADE_FILTERS[0].patch;
}
