"use client";

import { memo, useState } from "react";
import { BarChart3, Building2, MessageCircle, MoreVertical, Phone, Route, ShoppingBag } from "lucide-react";
import { ActionSheet, type ActionSheetItem } from "@/components/ui/ActionSheet";
import { formatMoney } from "@/lib/crm/format";
import { cn } from "@/lib/utils";
import type { RankedCustomer } from "@/types/crm";
import StarRating from "../shared/StarRating";

export type RankingView = "overview" | "comments" | "sales" | "path";

const ACTIONS: { key: RankingView; label: string; icon: typeof BarChart3; tone: string }[] = [
    { key: "overview", label: "خلاصه", icon: BarChart3, tone: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/15 dark:text-indigo-300" },
    { key: "comments", label: "نظرات", icon: MessageCircle, tone: "text-sky-600 bg-sky-50 dark:bg-sky-500/15 dark:text-sky-300" },
    { key: "sales", label: "فروش‌ها", icon: ShoppingBag, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300" },
    { key: "path", label: "مسیر پرونده", icon: Route, tone: "text-amber-600 bg-amber-50 dark:bg-amber-500/15 dark:text-amber-300" },
];

interface Props {
    customer: RankedCustomer;
    highlight: boolean;
    onOpen: (customerId: number, view: RankingView) => void;
}

function RankingCardBase({ customer, highlight, onOpen }: Props) {
    const isActive = customer.status === 2;
    const [sheetOpen, setSheetOpen] = useState(false);
    const sheetItems: ActionSheetItem[] = ACTIONS.map(({ key, label, icon: Icon }) => ({
        key,
        label,
        icon: <Icon size={16} />,
        onSelect: () => onOpen(customer.id, key),
    }));

    return (
        <div
            className={cn(
                "group relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-3xl border p-4 text-[13px] transition-shadow hover:shadow-md",
                highlight
                    ? "border-emerald-400 bg-emerald-400 text-white dark:border-emerald-500 dark:bg-emerald-600"
                    : "border-gray-100 bg-white text-gray-900 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white",
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="flex justify-center items-center">
                    <button
                        type="button"
                        onClick={() => setSheetOpen(true)}
                        aria-label="گزینه‌ها"
                        className={cn(
                            "-m-1 flex h-8 w-8 items-center justify-center rounded-full transition-colors md:hidden",
                            highlight ? "text-white/90 hover:bg-white/20" : "text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10",
                        )}
                    >
                        <MoreVertical size={16} />
                    </button>
                    <span
                        className={cn(
                            "flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-[13px] font-extrabold",
                            highlight
                                ? "bg-white/25 text-white"
                                : "bg-gray-50 text-gray-500 dark:bg-white/[0.06] dark:text-gray-300",
                        )}
                    >
                        {customer.rank.toLocaleString("fa-IR")}
                    </span>
                </span>
                <span
                    className={cn(
                        "shrink-0 rounded-full px-3 py-1 text-[12px]",
                        highlight
                            ? "bg-white/25 text-white"
                            : isActive
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                                : "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
                    )}
                >
                    {customer.status_display}
                </span>
            </div>

            <div className="min-w-0">
                <div className="truncate text-[14px] font-bold">{customer.full_name}</div>
                <div
                    className={cn(
                        "mt-2 flex flex-col gap-1.5",
                        highlight ? "text-white/90" : "text-gray-500 dark:text-gray-400",
                    )}
                >
                    <span className="flex items-center gap-1.5 truncate">
                        <Building2 size={13} className="shrink-0" />
                        <span className="truncate">{customer.company_name || "شرکت ندارد"}</span>
                    </span>
                    {customer.phone_number && (
                        <span className="flex items-center gap-1.5" dir="ltr">
                            <Phone size={13} className="shrink-0" /> {customer.phone_number}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between gap-2">
                <div className={cn(highlight && "[&_*]:!text-white")}>
                    <StarRating value={customer.avg_score} count={customer.scores_count || undefined} />
                </div>
                <span className={cn("truncate text-[12px]", highlight ? "text-white/90" : "text-gray-500")}>
                    {customer.total_sales ? formatMoney(customer.total_sales) : ""}
                </span>
            </div>

            <div className="hidden absolute inset-x-0 bottom-0 items-center justify-center gap-2 bg-white/95 p-2.5 backdrop-blur transition-all translate-y-full opacity-0 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 md:flex dark:bg-[#1b1b24]/95">
                {ACTIONS.map(({ key, label, icon: Icon, tone }) => (
                    <button
                        key={key}
                        type="button"
                        title={label}
                        aria-label={label}
                        onClick={() => onOpen(customer.id, key)}
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-xl transition-transform hover:scale-110",
                            tone,
                        )}
                    >
                        <Icon size={16} />
                    </button>
                ))}
            </div>
            <ActionSheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                title={customer.full_name}
                items={sheetItems}
            />
        </div>
    );
}

export const RankingCard = memo(RankingCardBase);
