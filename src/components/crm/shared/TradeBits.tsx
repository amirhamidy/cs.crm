"use client";

import { formatWeight, toNumber } from "@/lib/crm/format";
import { cn } from "@/lib/utils";
import type { Sale, TradeType } from "@/types/crm";

export const TRADE_LABEL: Record<TradeType, string> = {
    sale: "فروش",
    purchase: "خرید",
    brokerage: "بین مشتری‌ها",
};

const TRADE_TONE: Record<TradeType, string> = {
    sale: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    purchase: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    brokerage: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
};

export function TradeBadge({ type }: { type: TradeType }) {
    return (
        <span
            className={cn(
                "inline-flex shrink-0 items-center rounded-lg px-2 py-0.5 text-[10.5px] font-extrabold",
                TRADE_TONE[type],
            )}
        >
            {TRADE_LABEL[type]}
        </span>
    );
}

export function PartiesLine({ sale }: { sale: Sale }) {
    return (
        <div className="mt-1 flex flex-col gap-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
            <div>
                فروشنده:{" "}
                <b className="font-extrabold text-gray-800 dark:text-gray-100">
                    {sale.seller_name}
                </b>
                {sale.seller_company && (
                    <span className="text-[10.5px] text-gray-400"> ({sale.seller_company})</span>
                )}
            </div>
            <div>
                خریدار:{" "}
                <b className="font-extrabold text-gray-800 dark:text-gray-100">{sale.buyer_name}</b>
                {sale.buyer_company && (
                    <span className="text-[10.5px] text-gray-400"> ({sale.buyer_company})</span>
                )}
            </div>
        </div>
    );
}

export function IssueChips({ sale }: { sale: Sale }) {
    const chips = [
        { label: "کسری", value: sale.shortage_kg },
        { label: "سرک", value: sale.spillage_kg },
        { label: "برگشتی", value: sale.returned_kg },
    ].filter((c) => toNumber(c.value) > 0);

    if (chips.length === 0 && sale.open_issues_count === 0) return null;

    return (
        <div className="mt-1 flex flex-wrap gap-1">
            {chips.map((c) => (
                <span
                    key={c.label}
                    className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400"
                >
                    {c.label} {formatWeight(c.value)}
                </span>
            ))}
            {sale.open_issues_count > 0 && (
                <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    {sale.open_issues_count} پیگیری باز
                </span>
            )}
        </div>
    );
}
