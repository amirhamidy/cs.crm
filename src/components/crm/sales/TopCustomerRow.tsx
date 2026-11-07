import { memo } from "react";
import { Package } from "lucide-react";
import { formatJalaliDate, formatMoney, formatNumber, formatWeight } from "@/lib/crm/format";
import type { TopCustomerRow as Row } from "@/types/crm";
import type { TopCustomersBy } from "./useTopCustomers";

interface Props {
    row: Row;
    by: TopCustomersBy;
    /** درصد پر بودن نوار نسبت به نفر اول (۳ تا ۱۰۰) */
    percent: number;
    onOpen: (customerId: number) => void;
}

function TopCustomerRowBase({ row, by, percent, onOpen }: Props) {
    const amount = formatMoney(row.total_amount);
    const weight = formatWeight(row.total_quantity_kg);

    return (
        <li>
            <button
                type="button"
                onClick={() => onOpen(row.customer_id)}
                className="group block w-full rounded-2xl p-2.5 text-right transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]"
            >
                <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-[12px] font-black text-gray-600 dark:bg-white/10 dark:text-gray-300">
                            {row.rank.toLocaleString("fa-IR")}
                        </span>
                        <div className="min-w-0">
                            <div className="truncate text-[13px] font-extrabold text-gray-900 group-hover:text-brand dark:text-white">
                                {row.full_name}
                            </div>
                            <div className="truncate text-[10.5px] text-gray-400">
                                {row.company_name || "—"} • آخرین خرید{" "}
                                {formatJalaliDate(row.last_sale_date)}
                            </div>
                        </div>
                    </div>
                    <div className="shrink-0 text-left">
                        <div className="text-[13px] font-black text-gray-900 dark:text-white">
                            {by === "amount" ? amount : weight}
                        </div>
                        <div className="text-[10.5px] text-gray-400">
                            {by === "amount" ? weight : amount}
                        </div>
                    </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                    <div
                        className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-teal-500"
                        style={{ width: `${percent}%` }}
                    />
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 text-[10.5px] text-gray-400">
                    <span>{formatNumber(row.sales_count)} فروش</span>
                    {row.top_product && (
                        <span className="flex items-center gap-1">
                            <Package size={10} /> پرفروش‌ترین کالا: {row.top_product.name} (
                            {formatWeight(row.top_product.quantity_kg)})
                        </span>
                    )}
                </div>
            </button>
        </li>
    );
}

export const TopCustomerRowItem = memo(TopCustomerRowBase);
