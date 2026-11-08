"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Phone, Sprout } from "lucide-react";
import { formatJalaliDate, formatNumber, formatWeight } from "@/lib/crm/format";
import { cn } from "@/lib/utils";
import type { SuggestedCustomer, SuggestionGroup } from "@/types/crm";
import { CARD_HOVER, Chip, Divider, GRID, IconTile, INSET, SURFACE, Stagger, gradientOf } from "../shared/kit";
import type { BasePath } from "../shared/types";
import { monthRange } from "./months";

interface Props {
    groups: SuggestionGroup[];
    basePath: BasePath;
    history?: boolean;
}

const VISIBLE = 4;

function CustomerDetails({ customer, history }: { customer: SuggestedCustomer; history: boolean }) {
    if (history) {
        return (
            <>
                آخرین خرید {formatJalaliDate(customer.last_purchase_date)} · {formatNumber(customer.purchases_count)} بار ·{" "}
                {formatWeight(customer.total_quantity_kg)}
            </>
        );
    }

    return (
        <>
            {monthRange(customer.start_month ?? 1, customer.end_month ?? 1)}
            {customer.expected_quantity_kg ? ` · حدود ${formatWeight(customer.expected_quantity_kg)}` : ""}
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
        <div className={cn(INSET, "flex items-center gap-2.5")}>
            <div className="min-w-0 flex-1">
                <Link
                    href={`${basePath}/customer/${customer.id}/`}
                    className="block truncate text-[11.5px] font-extrabold text-gray-700 transition hover:text-indigo-500 dark:text-gray-200"
                >
                    {customer.full_name}
                    {customer.company_name && (
                        <span className="ms-1 text-[10px] font-semibold text-gray-400">{customer.company_name}</span>
                    )}
                </Link>
                <p className="mt-0.5 break-words text-[10px] font-semibold leading-4 text-gray-400">
                    <CustomerDetails customer={customer} history={history} />
                </p>
            </div>
            {customer.phone_number && (
                <a
                    href={`tel:${customer.phone_number}`}
                    aria-label={`تماس با ${customer.full_name}`}
                    title={customer.phone_number}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-500 shadow-sm transition hover:bg-emerald-50 dark:bg-white/[0.06] dark:hover:bg-emerald-500/10"
                >
                    <Phone size={13} />
                </a>
            )}
        </div>
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
    const [expanded, setExpanded] = useState(false);
    const total = group.customers.length;
    const shown = expanded ? group.customers : group.customers.slice(0, VISIBLE);

    return (
        <div className={cn(SURFACE, CARD_HOVER, "flex h-full min-w-0 flex-col p-3")}>
            <div className="flex items-start gap-3">
                <IconTile gradient={gradientOf(group.product.id)}>
                    <Sprout size={18} />
                </IconTile>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">{group.product.name}</h3>
                    <div className="mt-1.5">
                        <Chip tone="emerald">{formatNumber(total)} مشتری</Chip>
                    </div>
                </div>
            </div>

            <div className="mt-3"><Divider /></div>

            <div className="mt-3 space-y-1.5">
                {shown.map((customer) => (
                    <CustomerRow key={customer.id} customer={customer} basePath={basePath} history={history} />
                ))}
            </div>

            {total > VISIBLE && (
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-2 flex h-8 items-center justify-center gap-1.5 rounded-full text-[10.5px] font-extrabold text-indigo-500 transition hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                >
                    {expanded ? "نمایش کمتر" : `نمایش همه (${formatNumber(total)})`}
                    <ChevronDown size={12} className={cn("transition-transform", expanded && "rotate-180")} />
                </button>
            )}
        </div>
    );
}

function SuggestionGroupListBase({ groups, basePath, history = false }: Props) {
    return (
        <div className={GRID}>
            {groups.map((group, i) => (
                <Stagger key={group.product.id} index={i}>
                    <GroupCard group={group} basePath={basePath} history={history} />
                </Stagger>
            ))}
        </div>
    );
}

export const SuggestionGroupList = memo(SuggestionGroupListBase);
