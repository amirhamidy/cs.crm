import { memo } from "react";
import Link from "next/link";
import { Phone, Sprout } from "lucide-react";
import { formatJalaliDate, formatNumber, formatWeight } from "@/lib/crm/format";
import type { SuggestedCustomer, SuggestionGroup } from "@/types/crm";
import type { BasePath } from "../shared/types";
import { monthRange } from "./months";

interface Props {
    groups: SuggestionGroup[];
    basePath: BasePath;
    /** پیشنهادهایی که از روی سابقه‌ی خرید ساخته شده‌اند (نه از فهرست فصلی) */
    history?: boolean;
}

function CustomerDetails({ customer, history }: { customer: SuggestedCustomer; history: boolean }) {
    if (history) {
        return (
            <>
                آخرین خرید: {formatJalaliDate(customer.last_purchase_date)} ·{" "}
                {customer.purchases_count} بار · {formatWeight(customer.total_quantity_kg)}
            </>
        );
    }

    return (
        <>
            {monthRange(customer.start_month ?? 1, customer.end_month ?? 1)}
            {customer.expected_quantity_kg
                ? ` · حدود ${formatWeight(customer.expected_quantity_kg)}`
                : ""}
            {customer.notes ? ` · ${customer.notes}` : ""}
        </>
    );
}

function CustomerRow({
    customer,
    basePath,
    history,
}: {
    customer: SuggestedCustomer;
    basePath: BasePath;
    history: boolean;
}) {
    return (
        <li className="rounded-2xl bg-white px-3.5 py-2.5 shadow-sm dark:bg-white/[0.05]">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <Link
                    href={`${basePath}/customer/${customer.id}/`}
                    className="min-w-0 truncate text-[12.5px] font-extrabold text-gray-800 hover:text-brand dark:text-gray-100"
                >
                    {customer.full_name}
                    {customer.company_name && (
                        <span className="ms-1 text-[10.5px] font-normal text-gray-400">
                            {customer.company_name}
                        </span>
                    )}
                </Link>
                {customer.phone_number && (
                    <a
                        href={`tel:${customer.phone_number}`}
                        dir="ltr"
                        className="flex shrink-0 items-center gap-1 text-[11.5px] text-gray-500 hover:text-brand"
                    >
                        <Phone size={11} /> {customer.phone_number}
                    </a>
                )}
            </div>
            <div className="mt-0.5 break-words text-[10.5px] leading-5 text-gray-400">
                <CustomerDetails customer={customer} history={history} />
            </div>
        </li>
    );
}

function GroupCard({
    group,
    basePath,
    history,
}: {
    group: SuggestionGroup;
    basePath: BasePath;
    history: boolean;
}) {
    return (
        <div className="rounded-3xl bg-gray-50 p-3 sm:p-3.5 dark:bg-gray-800/40">
            <div className="mb-2 flex items-center gap-1.5 text-[14px] font-bold text-gray-900 dark:text-white">
                <Sprout size={14} className="text-emerald-500" />
                {group.product.name}
                <span className="text-[11px] font-bold text-gray-400">
                    ({formatNumber(group.customers.length)} مشتری)
                </span>
            </div>
            <ul className="flex flex-col gap-1.5">
                {group.customers.map((customer) => (
                    <CustomerRow
                        key={customer.id}
                        customer={customer}
                        basePath={basePath}
                        history={history}
                    />
                ))}
            </ul>
        </div>
    );
}

function SuggestionGroupListBase({ groups, basePath, history = false }: Props) {
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {groups.map((group) => (
                <GroupCard
                    key={group.product.id}
                    group={group}
                    basePath={basePath}
                    history={history}
                />
            ))}
        </div>
    );
}

export const SuggestionGroupList = memo(SuggestionGroupListBase);
