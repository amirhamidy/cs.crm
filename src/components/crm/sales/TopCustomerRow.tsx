import { memo } from "react";
import { Package } from "lucide-react";
import { formatJalaliDate, formatMoney, formatNumber, formatWeight } from "@/lib/crm/format";
import { cn } from "@/lib/utils";
import type { TopCustomerRow as Row } from "@/types/crm";
import { CARD_HOVER, Chip, Divider, INSET, Meter, SURFACE, gradientOf, initialOf } from "../shared/kit";
import type { TopCustomersBy } from "./useTopCustomers";

interface Props {
    row: Row;
    by: TopCustomersBy;
    percent: number;
    onOpen: (customerId: number) => void;
}

const MEDAL: Record<number, string> = {
    1: "bg-amber-400 text-white",
    2: "bg-slate-400 text-white",
    3: "bg-orange-400 text-white",
};

function TopCustomerRowBase({ row, by, percent, onOpen }: Props) {
    const amount = formatMoney(row.total_amount);
    const weight = formatWeight(row.total_quantity_kg);

    return (
        <button
            type="button"
            onClick={() => onOpen(row.customer_id)}
            className={cn(SURFACE, CARD_HOVER, "flex h-full w-full min-w-0 flex-col p-3 text-right")}
        >
            <div className="flex w-full items-start gap-3">
                <div className="relative shrink-0">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientOf(row.customer_id)} text-[14px] font-extrabold text-white shadow-sm`}>
                        {initialOf(row.full_name)}
                    </div>
                    <span
                        className={cn(
                            "absolute -bottom-1.5 -left-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white px-1 text-[9px] font-extrabold dark:border-[#111827]",
                            MEDAL[row.rank] ?? "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-200",
                        )}
                    >
                        {row.rank.toLocaleString("fa-IR")}
                    </span>
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">{row.full_name}</h3>
                    <p className="mt-1 truncate text-[10.5px] font-semibold text-gray-400">
                        {row.company_name || "شرکت ندارد"}
                    </p>
                </div>
            </div>

            <div className="mt-3 w-full"><Divider /></div>

            <div className="mt-3 w-full space-y-2">
                <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-[9.5px] font-semibold text-gray-400">{by === "amount" ? "مبلغ فروش" : "مقدار فروش"}</p>
                        <p className="mt-0.5 truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                            {by === "amount" ? amount : weight}
                        </p>
                    </div>
                    <p className="shrink-0 text-[10.5px] font-semibold text-gray-400">{by === "amount" ? weight : amount}</p>
                </div>
                <Meter value={percent} max={100} tone="emerald" />
            </div>

            <div className="mt-3 flex w-full flex-wrap items-center gap-1.5">
                <Chip tone="indigo">{formatNumber(row.sales_count)} فروش</Chip>
                <Chip tone="gray">آخرین خرید {formatJalaliDate(row.last_sale_date)}</Chip>
            </div>

            {row.top_product && (
                <div className="mt-auto w-full pt-3">
                    <div className={cn(INSET, "flex w-full items-center gap-2")}>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-white/[0.06]">
                            <Package size={12} className="text-emerald-500" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-gray-600 dark:text-gray-300">
                            {row.top_product.name}
                        </span>
                        <span className="shrink-0 text-[10px] font-semibold text-gray-400">
                            {formatWeight(row.top_product.quantity_kg)}
                        </span>
                    </div>
                </div>
            )}
        </button>
    );
}

export const TopCustomerRowItem = memo(TopCustomerRowBase);
